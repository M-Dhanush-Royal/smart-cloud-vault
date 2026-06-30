/* =========================
   FOLDER VIEW
========================= */
const params = new URLSearchParams(window.location.search);
const folderId = params.get("id");

if (!folderId) {
    alert("No folder selected");
    window.location.href = "files.html";
}

/* =========================
   LOAD FOLDER
========================= */
async function loadFolder() {
    try {
        const res = await fetch("/folder/" + folderId);
        const folder = await res.json();
        if (folder && folder.name) {
            document.getElementById("folderName").innerHTML = "📁 " + folder.name;
        }
    } catch (err) {
        console.error("Error loading folder:", err);
    }
}

/* =========================
   UPLOAD FILE TO FOLDER
========================= */
async function uploadFolderFile() {
    const file = document.getElementById("folderFile").files[0];
    if (!file) return alert("Select File");

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        window.location.href = "/login.html";
        return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", user.id);
    formData.append("folder", folderId);

    try {
        const res = await fetch("/upload", { method: "POST", body: formData });
        const data = await res.json();
        alert(data.message);
        document.getElementById("folderFile").value = "";
        loadFolderFiles();
    } catch (err) {
        console.error("Upload error:", err);
    }
}

/* =========================
   LOAD FOLDER FILES
========================= */
async function loadFolderFiles() {
    try {
        const res = await fetch("/folder-files/" + folderId);
        const files = await res.json();
        let totalSize = 0;

        files.forEach(file => {
            totalSize += file.size || 0;
        });

        const mb = (totalSize / 1024 / 1024).toFixed(2);
        document.getElementById("fileCount").innerText = files.length + " Files • " + mb + " MB";

        const container = document.getElementById("folderFiles");
        container.innerHTML = "";

        files.forEach(file => {
            const card = document.createElement("div");
            card.className = "file-card";
            const name = file.originalname.toLowerCase();
            let preview = "";

            if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".webp")) {
                preview = `<img src="${file.filename}" class="file-image" />`;
            } else {
                preview = `<div class="file-icon">📄</div>`;
            }

            card.innerHTML = `
                ${preview}
                <h4>${file.originalname}</h4>
                <div class="file-actions">
                    <a href="${file.filename}" target="_blank">Open</a>
                    <a href="${file.filename}" download>Download</a>
                </div>
                <button onclick="deleteFolderFile('${file._id}')" class="delete-btn">🗑 Delete</button>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error("Error loading folder files:", err);
    }
}

/* =========================
   DELETE FILE FROM FOLDER
========================= */
async function deleteFolderFile(id) {
    if (!confirm("Delete this file?")) return;
    try {
        const res = await fetch("/delete/" + id, { method: "DELETE" });
        const data = await res.json();
        alert(data.message);
        loadFolderFiles();
    } catch (err) {
        console.error("Delete error:", err);
    }
}

/* =========================
   DOWNLOAD FILE
========================= */
function downloadFile(url) {
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/* =========================
   INITIAL LOAD
========================= */
loadFolder();
loadFolderFiles();