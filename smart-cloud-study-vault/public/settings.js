/* =========================
   SETTINGS
========================= */
const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    window.location.href = "/login.html";
}

/* Load saved values */
const nameInput = document.getElementById("nameInput");
if (nameInput && user) {
    nameInput.value = user.name || "";
}

document.getElementById("role").value = localStorage.getItem("role") || "Cloud Storage User";
document.getElementById("image").value = localStorage.getItem("profileImage") || "";

function saveProfile() {
    const name = document.getElementById("nameInput").value.trim();
    const role = document.getElementById("role").value.trim();
    const image = document.getElementById("image").value.trim();

    if (name && user) {
        user.name = name;
        localStorage.setItem("user", JSON.stringify(user));
    }

    localStorage.setItem("role", role);
    localStorage.setItem("profileImage", image);

    alert("Profile Updated! Changes will appear on dashboard.");
}