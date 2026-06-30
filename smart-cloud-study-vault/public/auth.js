/* =========================
   SIGNUP
========================= */
async function signup() {
    const name = document.getElementById("name");
    const email = document.getElementById("email");
    const password = document.getElementById("password");

    if (!name || !email || !password) return;

    const nameVal = name.value.trim();
    const emailVal = email.value.trim();
    const passVal = password.value;

    if (!nameVal || !emailVal || !passVal) {
        return alert("Please fill all fields");
    }

    if (passVal.length < 6) {
        return alert("Password must be at least 6 characters");
    }

    try {
        const res = await fetch("/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: nameVal, email: emailVal, password: passVal })
        });
        const data = await res.json();
        alert(data.message);
        if (data.message === "Signup Successful") {
            window.location.href = "/login.html";
        }
    } catch (err) {
        console.error("Signup error:", err);
        alert("Signup failed. Please try again.");
    }
}

/* =========================
   LOGIN
========================= */
async function login() {
    const email = document.getElementById("email");
    const password = document.getElementById("password");

    if (!email || !password) return;

    const emailVal = email.value.trim();
    const passVal = password.value;

    if (!emailVal || !passVal) {
        return alert("Please fill all fields");
    }

    try {
        const res = await fetch("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailVal, password: passVal })
        });
        const data = await res.json();

        if (data.message === "Login Successful") {
            localStorage.setItem("user", JSON.stringify({
                id: data.user._id,
                name: data.user.name,
                email: data.user.email
            }));
            window.location.href = "/dashboard.html";
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error("Login error:", err);
        alert("Login failed. Please try again.");
    }
}