/* =========================
   ADMIN DASHBOARD
========================= */
const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    window.location.href = "/login.html";
}

async function loadAdminStats() {
    try {
        const res = await fetch("/admin-stats");
        if (!res.ok) {
            throw new Error("Failed to load admin stats");
        }
        const data = await res.json();

        document.getElementById("users").innerHTML = data.totalUsers || 0;
        document.getElementById("files").innerHTML = data.totalFiles || 0;
        document.getElementById("folders").innerHTML = data.totalFolders || 0;
        document.getElementById("storage").innerHTML = (data.totalStorage / 1024 / 1024).toFixed(2) + " MB";
    } catch (err) {
        console.error("Error loading admin stats:", err);
    }
}

loadAdminStats();