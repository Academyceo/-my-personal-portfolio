// ============================
// CURRENT YEAR
// ============================

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