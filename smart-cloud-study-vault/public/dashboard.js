/* =========================
   CHECK LOGIN
========================= */

const user =
JSON.parse(
    localStorage.getItem("user")
);

if(user){

    document.getElementById(
        "profileName"
    ).innerHTML =
    user.name;

    document.getElementById(
        "welcomeUser"
    ).innerHTML =
    "Welcome Back, " +
    user.name;

}

let allFiles = [];
const savedName =
localStorage.getItem(
    "profileName"
);

if(savedName){

    document.getElementById(
        "profileName"
    ).innerHTML = savedName;

}

if(!user){

    window.location.href =
    "/login.html";

}

/* =========================
   USER INFO
========================= */

document.getElementById(
    "profileName"
).innerHTML =
user.name;

document.getElementById(
    "welcomeUser"
).innerHTML =
"Welcome Back, " + user.name ;

/* =========================
   RENDER FILES
========================= */

function renderFiles(files) {

    const container = document.getElementById("fileContainer");
    container.innerHTML = "";

    let totalSize = 0;

    files.forEach((file) => {

        totalSize += file.size || 0;

        const card = document.createElement("div");
        card.className = "file-card";

        let preview = "";

        const name = file.originalname.toLowerCase();

        if (name.endsWith(".png") ||
            name.endsWith(".jpg") ||
            name.endsWith(".jpeg") ||
            name.endsWith(".webp")) {

            preview = `
                <img src="${file.filename}" class="file-image">
            `;

        } else if (name.endsWith(".pdf")) {

            preview = `<div class="file-icon">📕</div>`;

        } else if (name.endsWith(".doc") || name.endsWith(".docx")) {

            preview = `<div class="file-icon">📘</div>`;

        } else if (name.endsWith(".zip")) {

            preview = `<div class="file-icon">📦</div>`;

        } else {

            preview = `<div class="file-icon">📄</div>`;
        }

        const fileSize = ((file.size || 0) / 1024 / 1024).toFixed(2);

        card.innerHTML = `
            ${preview}

            <h4>${file.originalname}</h4>

            <p>${fileSize} MB</p>

            <div class="file-actions">

                <a href="${file.filename}" target="_blank">
                    Open
                </a>

                <button onclick="window.open('${file.filename}','_blank')">
                    👁 Preview
                </button>

                <a href="${file.filename}" download>
                    Download
                </a>

                <button
                    onclick="favoriteFile('${file._id}')"
                    class="favorite-btn">
                    ⭐ Favorite
                </button>

                <button
                    onclick="deleteFile('${file._id}')"
                    class="delete-btn">
                    🗑 Delete
                </button>

            </div>
        `;

        container.appendChild(card);

    });

    updateStorage(totalSize);
}
/* =========================
   RECENT ACTIVITY
========================= */

function renderRecentActivity(files){

    const activity =
    document.getElementById(
        "recentActivity"
    );

    activity.innerHTML = "";

    const recentFiles =
    files.slice(0,5);

    recentFiles.forEach((file)=>{

        const item =
        document.createElement("p");

        const date =
new Date(
    file.uploadedAt
).toLocaleString();

        item.innerHTML =

        "📁 " +

        file.originalname +

        " uploaded • " +

        date;

        activity.appendChild(item);

    });

}

/* =========================
   LOAD FILES
========================= */

async function loadFiles(){

    try{

        const res =
        await fetch(

            "/files/" + user.id

        );

        const files =
        await res.json();
        

        allFiles = files;

const folderRes =
await fetch(

    "/folder-count/" +
    user.id

);

const folderData =
await folderRes.json();

document.getElementById(
    "totalFolders"
).innerHTML =
folderData.count || 0;

        renderFiles(files);

        renderRecentActivity(files);

    }

    catch(err){

        console.log(err);

    }

}

/* =========================
   SEARCH FILES
========================= */

function searchFiles(){

    const search =
    document.getElementById(
        "searchInput"
    ).value.toLowerCase();

    const filteredFiles =
    allFiles.filter((file)=>{

        return file.originalname
        .toLowerCase()
        .includes(search);

    });

    renderFiles(filteredFiles);
    
}

/* =========================
   UPLOAD FILE
========================= */

async function uploadFile(){

    const file =
    document.getElementById(
        "fileInput"
    ).files[0];

    if(!file){

        return alert(
            "Select File"
        );

    }

    const formData =
    new FormData();

    formData.append(
        "file",
        file
    );

    formData.append(
        "userId",
        user.id
    );

    try{

        const res =
        await fetch(

            "/upload",

            {

                method:"POST",

                body:formData

            }

        );

        const data =
        await res.json();

        alert(data.message);

        loadFiles();

    }

    catch(err){

        console.log(err);

    }

}

/* =========================
   DELETE FILE
========================= */

async function deleteFile(id){

    try{

        const res =
        await fetch(

            "/delete/" + id,

            {

                method:"DELETE"

            }

        );

        const data =
        await res.json();

        alert(data.message);

        loadFiles();

    }

    catch(err){

        console.log(err);

    }

}

/* =========================
   SIDEBAR TOGGLE
========================= */

function toggleSidebar(){

    const sidebar =
    document.getElementById(
        "sidebar"
    );

    sidebar.classList.toggle(
        "active"
    );

}

/* =========================
   LOGOUT
========================= */

function logout(){

    localStorage.removeItem(
        "user"
    );

    window.location.href =
    "/login.html";

}

/* =========================
   INITIAL LOAD
========================= */

loadFiles();
/* =========================
   DRAG & DROP UPLOAD
========================= */

const uploadBox = document.getElementById("uploadBox");

if (uploadBox) {

    uploadBox.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadBox.classList.add("dragover");
    });

    uploadBox.addEventListener("dragleave", () => {
        uploadBox.classList.remove("dragover");
    });

    uploadBox.addEventListener("drop", async (e) => {
        e.preventDefault();
        uploadBox.classList.remove("dragover");

        const files = e.dataTransfer.files;

        if (!files || files.length === 0) {
            alert("Please drop a file.");
            return;
        }

        const file = files[0];

        // Check if user is logged in
        if (!user || !user.id) {
            alert("User not found. Please log in again.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", user.id);

        try {
            const response = await fetch("/upload", {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error("Upload failed");
            }

            const data = await response.json();

            alert(data.message || "File uploaded successfully.");

            if (typeof loadFiles === "function") {
                loadFiles();
            }

        } catch (error) {
            console.error(error);
            alert("Error uploading file.");
        }
    });

}
/* =========================
   FILTER FILES
========================= */

function filterFiles(type){

    if(type === "all"){

        renderFiles(allFiles);

        return;

    }

    const filtered =
    allFiles.filter((file)=>{

        const name =
        file.originalname.toLowerCase();

        if(

            type === "image"

        ){

            return (

                name.endsWith(".png") ||
                name.endsWith(".jpg") ||
                name.endsWith(".jpeg") ||
                name.endsWith(".webp")

            );

        }

        if(

            type === "pdf"

        ){

            return name.endsWith(".pdf");

        }

        if(

            type === "doc"

        ){

            return (

                name.endsWith(".doc") ||
                name.endsWith(".docx")

            );

        }

        if(

            type === "zip"

        ){

            return name.endsWith(".zip");

        }

    });

    renderFiles(filtered);

}

/* =========================
   SHARE FILE
========================= */

function shareFile(url){

    navigator.clipboard.writeText(
        url
    );

    alert(
        "AWS S3 share link copied successfully!"
    );

}
async function renameFile(id){

    const name =
    prompt(
        "Enter New File Name"
    );

    if(!name){

        return;

    }

    try{

        const res =
        await fetch(

            "/rename-file/" + id,

            {

                method:"PUT",

                headers:{

                    "Content-Type":
                    "application/json"

                },

                body:JSON.stringify({

                    name:name

                })

            }

        );

        const data =
        await res.json();

        alert(data.message);

        loadFiles();

    }

    catch(err){

        console.log(err);

    }

}
const image =
localStorage.getItem("profileImage");

if(image){

    document.querySelector(".profile img").src =
    image;

}

const role =
localStorage.getItem("role");

if(role){

    document.getElementById("profileRole").innerHTML =
    role;

}
