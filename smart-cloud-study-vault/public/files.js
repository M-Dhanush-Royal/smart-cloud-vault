/* =========================
   CHECK LOGIN
========================= */
const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    window.location.href = "/login.html";
}

const userId = user?.id || user?._id;
let allFiles = [];

/* Load profile data */
if (user) {
    document.getElementById("profileName").innerHTML = user.name;
}
const savedImage = localStorage.getItem("profileImage");
if (savedImage) {
    document.querySelector(".profile img").src = savedImage;
}
const savedRole = localStorage.getItem("role");
if (savedRole) {
    document.getElementById("profileRole").innerHTML = savedRole;
}

/* =========================
   LOAD FOLDERS
========================= */
async function loadFolders() {
    try {
        const res = await fetch("/folders/" + userId);
        const folders = await res.json();
        const container = document.getElementById("folderContainer");
        container.innerHTML = "";

        folders.forEach((folder) => {
            const card = document.createElement("div");
            card.className = "file-card";
            card.innerHTML = `
                <div class="file-icon">📁</div>
                <h4>${folder.name}</h4>
                <button onclick="event.stopPropagation();renameFolder('${folder._id}')">✏ Rename</button>
                <button onclick="event.stopPropagation();deleteFolder('${folder._id}')">🗑 Delete</button>
            `;
            card.onclick = () => {
                window.location.href = "folder.html?id=" + folder._id;
            };
            container.appendChild(card);
        });
    } catch (err) {
        console.error("Error loading folders:", err);
    }
}

/* =========================
   LOAD FILES
========================= */
async function loadFiles() {
    try {
        const res = await fetch("/files/" + userId);
        const files = await res.json();
        allFiles = files;
        renderFiles(files);
    } catch (err) {
        console.error("Error loading files:", err);
    }
}

/* =========================
   RENDER FILES
========================= */
function renderFiles(files) {
    const container = document.getElementById("fileContainer");
    container.innerHTML = "";

    files.forEach((file) => {
        const card = document.createElement("div");
        card.className = "file-card";
        const name = file.originalname.toLowerCase();
        let preview = "";

        if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".webp")) {
            preview = `<img src="${file.filename}" class="file-image" />`;
        } else if (name.endsWith(".pdf")) {
            preview = `<div class="file-icon">📕</div>`;
        } else if (name.endsWith(".doc") || name.endsWith(".docx")) {
            preview = `<div class="file-icon">📘</div>`;
        } else if (name.endsWith(".zip") || name.endsWith(".rar")) {
            preview = `<div class="file-icon">📦</div>`;
        } else {
            preview = `<div class="file-icon">📄</div>`;
        }

        const fileSize = (file.size / 1024 / 1024).toFixed(2);

        card.innerHTML = `
            ${preview}
            <h4>${file.originalname}</h4>
            <p>${fileSize} MB</p>
            <div class="file-actions">
                <a href="${file.filename}" target="_blank">Open</a>
                <a href="${file.filename}" download>Download</a>
            </div>
            <button onclick="deleteFileFromList('${file._id}')" class="delete-btn">🗑 Delete</button>
        `;
        container.appendChild(card);
    });
}

/* =========================
   CREATE FOLDER
========================= */
async function createFolder() {
    const name = prompt("Enter Folder Name");
    if (!name) return;

    try {
        const res = await fetch("/create-folder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name, userId: userId })
        });
        const data = await res.json();
        alert(data.message);
        loadFolders();
    } catch (err) {
        console.error("Create folder error:", err);
    }
}

/* =========================
   RENAME FOLDER
========================= */
async function renameFolder(id) {
    const name = prompt("New Folder Name");
    if (!name) return;

    try {
        const res = await fetch("/rename-folder/" + id, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name })
        });
        const data = await res.json();
        alert(data.message);
        loadFolders();
    } catch (err) {
        console.error("Rename folder error:", err);
    }
}

/* =========================
   DELETE FOLDER
========================= */
async function deleteFolder(id) {
    if (!confirm("Delete this folder and all files inside it?")) return;

    try {
        const res = await fetch("/delete-folder/" + id, { method: "DELETE" });
        const data = await res.json();
        alert(data.message);
        loadFolders();
    } catch (err) {
        console.error("Delete folder error:", err);
    }
}

/* =========================
   DELETE FILE
========================= */
async function deleteFileFromList(id) {
    if (!confirm("Delete this file?")) return;
    try {
        const res = await fetch("/delete/" + id, { method: "DELETE" });
        const data = await res.json();
        alert(data.message);
        loadFiles();
    } catch (err) {
        console.error("Delete error:", err);
    }
}

/* =========================
   FILTER FILES
========================= */
function filterFiles(type) {
    if (type === "all") {
        renderFiles(allFiles);
        return;
    }
    const filtered = allFiles.filter((file) => {
        const name = file.originalname.toLowerCase();
        if (type === "image") return name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".webp");
        if (type === "pdf") return name.endsWith(".pdf");
        if (type === "doc") return name.endsWith(".doc") || name.endsWith(".docx");
        if (type === "zip") return name.endsWith(".zip") || name.endsWith(".rar");
        return true;
    });
    renderFiles(filtered);
}

/* =========================
   SEARCH FILES
========================= */
function searchFiles() {
    const search = document.getElementById("searchInput").value.toLowerCase();
    const filtered = allFiles.filter((file) => file.originalname.toLowerCase().includes(search));
    renderFiles(filtered);
}

/* =========================
   LOGOUT
========================= */
function logout() {
    localStorage.removeItem("user");
    window.location.href = "/login.html";
}

/* =========================
   INITIAL LOAD
========================= */
document.getElementById("createFolderBtn").addEventListener("click", createFolder);
loadFolders();
loadFiles();