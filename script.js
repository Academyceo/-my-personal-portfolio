const form = document.querySelector("#github-form");
const usernameInput = document.querySelector("#github-username");
const statusMessage = document.querySelector("#github-status");
const projectCount = document.querySelector("#project-count");
const projectGrid = document.querySelector("#project-grid");
const projectFilters = document.querySelector("#project-filters");
const loadButton = form.querySelector("button[type='submit']");

let repositories = [];
let activeLanguage = "All";
let activeController;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = usernameInput.value.trim().replace(/^@/, "");

  if (!username) {
    usernameInput.focus();
    return;
  }

  activeController?.abort();
  const controller = new AbortController();
  activeController = controller;
  loadButton.disabled = true;
  loadButton.innerHTML = "Loading…";
  statusMessage.dataset.state = "";
  statusMessage.textContent = `Looking for @${username} on GitHub…`;
  projectGrid.replaceChildren();
  projectFilters.replaceChildren();
  projectCount.textContent = "Loading repositories…";

  try {
    const profile = await fetchGitHubJson(
      `https://api.github.com/users/${encodeURIComponent(username)}`,
      controller.signal,
    );
    const allRepositories = await fetchRepositories(username, controller.signal);
    repositories = allRepositories
      .sort((first, second) => new Date(second.pushed_at) - new Date(first.pushed_at));
    activeLanguage = "All";

    renderFilters();
    renderRepositories();
    projectCount.textContent = `${repositories.length} public ${
      repositories.length === 1 ? "repository" : "repositories"
    }`;
    statusMessage.dataset.state = "success";
    statusMessage.textContent = repositories.length
      ? `Showing projects from ${profile.name || `@${profile.login}`}.`
      : `@${profile.login} doesn’t have any public repositories yet.`;
  } catch (error) {
    if (error.name === "AbortError") return;
    repositories = [];
    projectFilters.replaceChildren();
    projectGrid.replaceChildren();
    projectCount.textContent = "Projects couldn’t be loaded.";
    statusMessage.dataset.state = "error";
    statusMessage.textContent = error.message;
  } finally {
    if (activeController === controller) {
      loadButton.disabled = false;
      loadButton.innerHTML = 'Load projects <span aria-hidden="true">↗</span>';
    }
  }
});

async function fetchRepositories(username, signal) {
  const allRepositories = [];
  let page = 1;

  while (true) {
    const pageRepositories = await fetchGitHubJson(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?type=owner&sort=updated&per_page=100&page=${page}`,
      signal,
    );
    allRepositories.push(...pageRepositories);
    if (pageRepositories.length < 100) return allRepositories;
    page += 1;
  }
}

async function fetchGitHubJson(url, signal) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    signal,
  });

  if (response.ok) return response.json();
  if (response.status === 404) {
    throw new Error("We couldn’t find that GitHub profile. Check the username and try again.");
  }
  if (response.status === 403 || response.status === 429) {
    throw new Error("GitHub’s public API limit has been reached. Please wait a little and try again.");
  }
  throw new Error(`GitHub returned an error (${response.status}). Please try again.`);
}

function renderFilters() {
  const languages = [
    "All",
    ...new Set(
      repositories
        .map((repository) => repository.language)
        .filter(Boolean)
        .sort((first, second) => first.localeCompare(second)),
    ),
  ];

  projectFilters.replaceChildren(
    ...languages.map((language) => {
      const button = document.createElement("button");
      button.className = "filter-button";
      button.type = "button";
      button.textContent = language;
      button.setAttribute("aria-pressed", String(language === activeLanguage));
      button.addEventListener("click", () => {
        activeLanguage = language;
        renderFilters();
        renderRepositories();
      });
      return button;
    }),
  );
}

function renderRepositories() {
  const visibleRepositories = repositories.filter(
    (repository) => activeLanguage === "All" || repository.language === activeLanguage,
  );

  if (!visibleRepositories.length) {
    projectGrid.replaceChildren();
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "project-empty";
    emptyMessage.textContent = repositories.length
      ? `No projects use ${activeLanguage} yet.`
      : "When you publish public repositories on GitHub, they’ll appear here.";
    projectGrid.append(emptyMessage);
    return;
  }

  projectGrid.replaceChildren(...visibleRepositories.map(createRepositoryCard));
}

function createRepositoryCard(repository) {
  const card = document.createElement("article");
  card.className = "project-card";

  const top = document.createElement("div");
  top.className = "project-card-top";

  const icon = document.createElement("span");
  icon.className = "project-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "</>";

  const links = document.createElement("div");
  links.className = "project-links";
  links.append(
    createExternalLink(repository.html_url, "Code"),
  );
  const liveUrl = repository.homepage || (
    repository.has_pages
      ? `https://${repository.owner.login}.github.io/${encodeURIComponent(repository.name)}/`
      : ""
  );
  if (liveUrl) {
    links.append(createExternalLink(liveUrl, "View site ↗"));
  }
  top.append(icon, links);

  const title = document.createElement("h3");
  title.textContent = repository.name;

  const description = document.createElement("p");
  description.textContent = repository.description || "A project in the works — more details coming soon.";

  const metadata = document.createElement("div");
  metadata.className = "project-meta";

  if (repository.language) {
    const language = document.createElement("span");
    language.className = "project-language";
    const dot = document.createElement("span");
    dot.className = "language-dot";
    dot.setAttribute("aria-hidden", "true");
    language.append(dot, document.createTextNode(repository.language));
    metadata.append(language);
  }

  if (repository.stargazers_count > 0) {
    const stars = document.createElement("span");
    stars.className = "project-stars";
    stars.textContent = `★ ${repository.stargazers_count}`;
    metadata.append(stars);
  }

  const updated = document.createElement("span");
  updated.textContent = `Updated ${formatDate(repository.pushed_at || repository.updated_at)}`;
  metadata.append(updated);
  card.append(top, title, description, metadata);
  return card;
}

function createExternalLink(url, label) {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = label;
  return link;
}

function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

form.requestSubmit();
