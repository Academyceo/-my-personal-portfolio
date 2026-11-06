// ============================
// CURRENT YEAR
// ============================

const githubUsername = "Academyceo";
const portfolioRepository = `${githubUsername.toLowerCase()}/-my-personal-portfolio`;
const projectCount = document.getElementById("project-count");
const projectFilters = document.getElementById("project-filters");
const projectGrid = document.getElementById("project-grid");
const githubStatus = document.getElementById("github-status");
const refreshProjectsButton = document.getElementById("refresh-projects");
const projectPreviews = {
    "student-registerr": "image/projects/student-register.svg",
    "simple-calculatorr": "image/projects/calculator.svg",
    "big-joke": "image/projects/joke-generator.svg",
    "eengeryexpenditure": "image/projects/energy-expenditure.svg",
    "job-form": "image/projects/job-application.svg",
    "country-info-api": "image/projects/country-information.svg",
    "movie-search": "image/projects/movie-search.svg"
};
let repositories = [];
let activeLanguage = "All";

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

if (refreshProjectsButton) {
    refreshProjectsButton.addEventListener("click", loadProjects);
    loadProjects();
}

async function loadProjects() {
    refreshProjectsButton.disabled = true;
    projectCount.textContent = "Fetching public repositories…";
    githubStatus.dataset.state = "";
    githubStatus.textContent = `Loading public repositories from @${githubUsername}…`;
    projectFilters.replaceChildren();

    try {
        const allRepositories = [];
        let page = 1;

        while (true) {
            const response = await fetch(
                `https://api.github.com/users/${encodeURIComponent(githubUsername)}/repos?type=owner&sort=updated&per_page=100&page=${page}`,
                {
                    headers: {
                        Accept: "application/vnd.github+json",
                        "X-GitHub-Api-Version": "2022-11-28"
                    }
                }
            );

            if (!response.ok) {
                if (response.status === 403 || response.status === 429) {
                    throw new Error("GitHub's public API limit was reached. Please try again later.");
                }
                throw new Error(`GitHub returned an error (${response.status}). Please try again later.`);
            }

            const pageRepositories = await response.json();
            allRepositories.push(...pageRepositories);
            if (pageRepositories.length < 100) {
                break;
            }
            page += 1;
        }

        repositories = allRepositories
            .filter((repository) =>
                repository.full_name.toLowerCase() !== portfolioRepository
            )
            .sort((first, second) =>
                new Date(second.pushed_at || second.updated_at) -
                new Date(first.pushed_at || first.updated_at)
            );

        activeLanguage = "All";
        renderProjectFilters();
        renderProjects();
        githubStatus.dataset.state = "success";
        githubStatus.textContent = repositories.length
            ? `Showing public projects from @${githubUsername}.`
            : `No public projects found for @${githubUsername}.`;
    } catch (error) {
        projectGrid.replaceChildren();
        projectCount.textContent = "Projects could not be loaded.";
        githubStatus.dataset.state = "error";
        githubStatus.textContent = error instanceof TypeError
            ? "Could not connect to GitHub. Check your internet connection and try again."
            : error.message;
    } finally {
        refreshProjectsButton.disabled = false;
    }
}

function renderProjectFilters() {
    const languages = [
        "All",
        ...new Set(
            repositories
                .map((repository) => repository.language)
                .filter(Boolean)
                .sort((first, second) => first.localeCompare(second))
        )
    ];

    projectFilters.replaceChildren(...languages.map((language) => {
        const button = document.createElement("button");
        button.className = "filter-button";
        button.type = "button";
        button.textContent = language;
        button.setAttribute("aria-pressed", String(language === activeLanguage));
        button.addEventListener("click", () => {
            activeLanguage = language;
            renderProjectFilters();
            renderProjects();
        });
        return button;
    }));
}

function renderProjects() {
    const visibleRepositories = repositories.filter((repository) =>
        activeLanguage === "All" || repository.language === activeLanguage
    );

    projectCount.textContent = `${visibleRepositories.length} of ${repositories.length} public ${
        repositories.length === 1 ? "project" : "projects"
    }`;

    if (!visibleRepositories.length) {
        projectGrid.replaceChildren();
        return;
    }

    projectGrid.replaceChildren(...visibleRepositories.map(createProjectCard));
}

function createProjectCard(repository) {
    const card = document.createElement("article");
    card.className = "project-card";

    const preview = document.createElement("img");
    preview.className = "project-preview";
    preview.alt = `${repository.name} project preview`;
    preview.loading = "lazy";
    preview.src = projectPreviews[repository.name.toLowerCase()] ||
        `https://opengraph.githubassets.com/${repository.id}/${repository.full_name}`;
    preview.addEventListener("error", () => {
        preview.src = createFallbackPreview(repository);
    }, { once: true });

    const content = document.createElement("div");
    content.className = "project-card-content";

    const links = document.createElement("div");
    links.className = "project-links";
    links.append(createExternalLink(repository.html_url, "View source ↗"));

    const liveUrl = repository.homepage?.trim() ||
        (repository.has_pages && repository.language !== "PHP"
            ? `https://${repository.owner.login}.github.io/${encodeURIComponent(repository.name)}/`
            : "");
    if (liveUrl) {
        const liveLink = createExternalLink(liveUrl, "Live demo ↗");
        if (liveLink) {
            links.append(liveLink);
        }
    }

    const title = document.createElement("h3");
    title.textContent = formatRepositoryName(repository.name);

    const description = document.createElement("p");
    description.textContent = repository.description ||
        `${repository.language || "Web"} project from my GitHub profile.`;

    const metadata = document.createElement("div");
    metadata.className = "project-meta";
    if (repository.language) {
        const language = document.createElement("span");
        language.textContent = repository.language;
        metadata.append(language);
    }
    if (repository.stargazers_count > 0) {
        const stars = document.createElement("span");
        stars.textContent = `★ ${repository.stargazers_count}`;
        metadata.append(stars);
    }

    content.append(links, title, description, metadata);
    card.append(preview, content);
    return card;
}

function createExternalLink(url, label) {
    let parsedUrl;
    try {
        parsedUrl = new URL(url);
    } catch {
        return null;
    }

    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
        return null;
    }

    const link = document.createElement("a");
    link.href = parsedUrl.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;
    return link;
}

function formatRepositoryName(name) {
    return name
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function createFallbackPreview(repository) {
    const title = escapeSvgText(formatRepositoryName(repository.name));
    const language = escapeSvgText(repository.language || "GitHub project");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400"><rect width="800" height="400" fill="#121511"/><circle cx="672" cy="82" r="120" fill="#d4af37" opacity=".12"/><circle cx="100" cy="360" r="150" fill="#d4af37" opacity=".08"/><path d="M56 77h54v54H56z" rx="8" fill="#d4af37"/><text x="83" y="114" text-anchor="middle" fill="#121511" font-family="Arial,sans-serif" font-size="25" font-weight="700">&lt;/&gt;</text><text x="56" y="231" fill="#f5f5f5" font-family="Arial,sans-serif" font-size="39" font-weight="700">${title}</text><text x="58" y="275" fill="#d4af37" font-family="Arial,sans-serif" font-size="18" letter-spacing="3">${language}</text><text x="58" y="337" fill="#999" font-family="Arial,sans-serif" font-size="13">PROJECT FROM @${escapeSvgText(githubUsername)}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeSvgText(text) {
    return String(text).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;"
    })[character]);
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