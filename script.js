// ============================
// CURRENT YEAR
// ============================

const themeToggle = document.getElementById("theme-toggle");
const themePreference = localStorage.getItem("portfolio-theme");
let isLightTheme = themePreference === "light";

function updateTheme() {
    document.body.classList.toggle("light-mode", isLightTheme);

    if (themeToggle) {
        const label = isLightTheme ? "Dark mode" : "Light mode";
        themeToggle.setAttribute("aria-label", `Switch to ${label.toLowerCase()}`);
        themeToggle.setAttribute("aria-pressed", String(isLightTheme));
        themeToggle.querySelector(".theme-toggle-label").textContent = label;
        themeToggle.querySelector(".theme-toggle-icon").textContent = isLightTheme ? "☾" : "☼";
    }
}

updateTheme();

if (themeToggle) {
    themeToggle.addEventListener("click", function () {
        isLightTheme = !isLightTheme;
        localStorage.setItem("portfolio-theme", isLightTheme ? "light" : "dark");
        updateTheme();
    });
}

const year = document.getElementById("year");

if (year) {
    year.textContent = new Date().getFullYear();
}


// ============================
// SMOOTH SCROLL
// ============================

const links = document.querySelectorAll('a[href^="#"]');

links.forEach(function (link) {

    link.addEventListener("click", function (event) {

        const targetId = this.getAttribute("href");

        const target = document.querySelector(targetId);

        if (target) {

            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth"
            });

        }

    });

});