const crypto=require("crypto");
require("dotenv").config();
const express = require("express");
const multer = require("multer");
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");

const User = require("./models/User");
const File = require("./models/File");
const Folder = require("./models/Folder");

const app = express();
const PORT = process.env.PORT || 3000;
const S3_BUCKET = process.env.S3_BUCKET || "smart-cloud-vault";
const AWS_REGION = process.env.AWS_REGION || "ap-south-1";

/* =========================
   MIDDLEWARE
========================= */
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || "fallback-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        sameSite: "lax"
    }
}));

app.use(passport.initialize());
app.use(passport.session());

/* =========================
   STATIC FILES
========================= */
app.use(express.static("public"));

/* =========================
   MONGODB
========================= */
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");
    })
    .catch((err) => {
        console.error("MongoDB Connection Error:");
         console.error(err);
         console.error(err.stack);
    });

/* =========================
   AWS S3 CONFIG
========================= */
const s3 = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
    }
});

/* =========================
   AUTH MIDDLEWARE
========================= */
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: "Unauthorized" });
}

/* =========================
   GOOGLE AUTH
========================= */
passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({
                email: profile.emails[0].value
            });

            if (!user) {
                user = new User({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    password: null,
                    authProvider: "google"
                });
                await user.save();
            }

            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    })
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

/* =========================
   GOOGLE ROUTES
========================= */
app.get("/auth/google",
    passport.authenticate("google", {
        scope: ["profile", "email"]
    })
);

app.get("/auth/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/login.html"
    }),
    (req, res) => {
        /* Safe JSON encoding to prevent XSS */
        const userData = JSON.stringify({
            id: req.user._id.toString(),
            name: req.user.name
        }).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");

        res.send(`
            <script>
                localStorage.setItem("user", '${userData}');
                window.location.href = "/dashboard.html";
            </script>
        `);
    }
);

/* =========================
   LOGOUT
========================= */
app.get("/logout", (req, res) => {
    req.logout(function (err) {
        if (err) {
            console.error("Logout error:", err);
        }
        req.session.destroy(() => {
            res.clearCookie("connect.sid");
            res.redirect("/login.html");
        });
    });
});

/* =========================
   HOME ROUTE
========================= */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

/* =========================
   SIGNUP
========================= */
app.post("/auth/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            authProvider: "local"
        });

        await user.save();

        res.json({ message: "Signup Successful" });
    } catch (err) {
        console.error("Signup error:", err.message);
        res.status(500).json({ message: "Signup Failed" });
    }
});

/* =========================
   LOGIN
========================= */
app.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.authProvider === "google" || !user.password) {
            return res.status(400).json({ message: "Use Google Login" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Wrong password" });
        }

        req.login(user, (err) => {
            if (err) {
                console.error("Login session error:", err);
                return res.status(500).json({ message: "Login failed" });
            }

            return res.json({
                message: "Login Successful",
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email
                }
            });
        });
    } catch (err) {
        console.error("Login error:", err.message);
        res.status(500).json({ message: "Login Failed" });
    }
});

/* =========================
   AWS CLOUD STORAGE
========================= */
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: S3_BUCKET,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
            const safeFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
            cb(null, Date.now() + "-" + safeFilename);
        }
    }),
    limits: {
        fileSize: 50 * 1024 * 1024 /* 50 MB limit */
    }
});

/* =========================
   UPLOAD FILE
========================= */
app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const folder = req.body.folder || "General";

        const newFile = new File({
            filename: req.file.location,
            originalname: req.file.originalname,
            size: req.file.size,
            userId: req.body.userId,
            folder: folder
        });

        await newFile.save();

        res.json({ message: "File Uploaded Successfully" });
    } catch (err) {
        console.error("Upload error:", err.message);
        res.status(500).json({ message: "Upload Failed" });
    }
});

/* =========================
   GET FILES
========================= */
app.get("/files/:userId", async (req, res) => {
    try {
        const files = await File.find({
            userId: req.params.userId
        }).sort({ uploadedAt: -1 });

        res.json(files);
    } catch (err) {
        console.error("Get files error:", err.message);
        res.status(500).json([]);
    }
});

/* =========================
   DELETE FILE
========================= */
app.delete("/delete/:id", async (req, res) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        /* Extract S3 key from URL */
        const fileKey = file.filename.split("/").pop();

        /* Delete from AWS S3 */
        await s3.send(
            new DeleteObjectCommand({
                Bucket: S3_BUCKET,
                Key: fileKey
            })
        );

        /* Delete from MongoDB */
        await File.findByIdAndDelete(req.params.id);

        res.json({ message: "File Deleted" });
    } catch (err) {
        console.error("Delete error:", err.message);
        res.status(500).json({ message: "Delete Failed" });
    }
});

/* =========================
   FAVORITE FILE
========================= */
app.put("/favorite/:id", async (req, res) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        file.favorite = !file.favorite;
        await file.save();

        res.json({ message: file.favorite ? "Added to Favorites" : "Removed from Favorites" });
    } catch (err) {
        console.error("Favorite error:", err.message);
        res.status(500).json({ message: "Favorite Failed" });
    }
});

/* =========================
   RENAME FILE
========================= */
app.put("/rename-file/:id", async (req, res) => {
    try {
        if (!req.body.name) {
            return res.status(400).json({ message: "Name is required" });
        }

        await File.findByIdAndUpdate(req.params.id, {
            originalname: req.body.name
        });

        res.json({ message: "File Renamed" });
    } catch (err) {
        console.error("Rename file error:", err.message);
        res.status(500).json({ message: "Rename Failed" });
    }
});

/* =========================
   CREATE FOLDER
========================= */
app.post("/create-folder", async (req, res) => {
    try {
        if (!req.body.name || !req.body.userId) {
            return res.status(400).json({ message: "Folder name and userId are required" });
        }

        const folder = new Folder({
            name: req.body.name,
            userId: req.body.userId
        });

        await folder.save();

        res.json({ message: "Folder Created" });
    } catch (err) {
        console.error("Create folder error:", err.message);
        res.status(500).json({ message: "Folder creation failed" });
    }
});

/* =========================
   GET FOLDERS
========================= */
app.get("/folders/:userId", async (req, res) => {
    try {
        const folders = await Folder.find({
            userId: req.params.userId
        }).sort({ createdAt: -1 });

        res.json(folders);
    } catch (err) {
        console.error("Get folders error:", err.message);
        res.status(500).json([]);
    }
});

/* =========================
   GET SINGLE FOLDER
========================= */
app.get("/folder/:id", async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);

        if (!folder) {
            return res.status(404).json({ message: "Folder Not Found" });
        }

        res.json(folder);
    } catch (err) {
        console.error("Get folder error:", err.message);
        res.status(500).json({ message: "Folder Not Found" });
    }
});

/* =========================
   GET FILES INSIDE FOLDER
========================= */
app.get("/folder-files/:folderId", async (req, res) => {
    try {
        const files = await File.find({
            folder: req.params.folderId
        }).sort({ uploadedAt: -1 });

        res.json(files);
    } catch (err) {
        console.error("Get folder files error:", err.message);
        res.status(500).json([]);
    }
});

/* =========================
   RENAME FOLDER
========================= */
app.put("/rename-folder/:id", async (req, res) => {
    try {
        if (!req.body.name) {
            return res.status(400).json({ message: "Name is required" });
        }

        await Folder.findByIdAndUpdate(req.params.id, {
            name: req.body.name
        });

        res.json({ message: "Folder Renamed" });
    } catch (err) {
        console.error("Rename folder error:", err.message);
        res.status(500).json({ message: "Rename Failed" });
    }
});

/* =========================
   DELETE FOLDER (CASCADE)
========================= */
app.delete("/delete-folder/:id", async (req, res) => {
    try {
        /* Find all files in this folder */
        const files = await File.find({ folder: req.params.id });

        /* Delete each file from S3 */
        for (const file of files) {
            try {
                const fileKey = file.filename.split("/").pop();
                await s3.send(
                    new DeleteObjectCommand({
                        Bucket: S3_BUCKET,
                        Key: fileKey
                    })
                );
            } catch (s3Err) {
                console.error("S3 delete error for file:", file.originalname, s3Err.message);
            }
        }

        /* Delete all files from MongoDB */
        await File.deleteMany({ folder: req.params.id });

        /* Delete the folder */
        await Folder.findByIdAndDelete(req.params.id);

        res.json({ message: "Folder and all files deleted" });
    } catch (err) {
        console.error("Delete folder error:", err.message);
        res.status(500).json({ message: "Delete Failed" });
    }
});

/* =========================
   FOLDER COUNT
========================= */
app.get("/folder-count/:userId", async (req, res) => {
    try {
        const count = await Folder.countDocuments({
            userId: req.params.userId
        });

        res.json({ count });
    } catch (err) {
        console.error("Folder count error:", err.message);
        res.status(500).json({ count: 0 });
    }
});

/* =========================
   ADMIN STATS (Aggregation)
========================= */
app.get("/admin-stats", async (req, res) => {
    try {
        const [totalUsers, totalFiles, totalFolders, storageResult] = await Promise.all([
            User.countDocuments(),
            File.countDocuments(),
            Folder.countDocuments(),
            File.aggregate([
                { $group: { _id: null, totalStorage: { $sum: "$size" } } }
            ])
        ]);

        const totalStorage = storageResult.length > 0 ? storageResult[0].totalStorage : 0;

        res.json({
            totalUsers,
            totalFiles,
            totalFolders,
            totalStorage
        });
    } catch (err) {
        console.error("Admin stats error:", err.message);
        res.status(500).json({ message: "Admin Error" });
    }
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
