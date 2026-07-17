async function generateSidebar() {

  const sidebar =
    document.getElementById("notes-sidebar");

  if (!sidebar) return;

  const response =
    await fetch("../data/scripts-notes.json");

  const data =
    await response.json();

  for (const category in data) {

    const categoryContainer =
      document.createElement("div");

    categoryContainer.classList.add("category-container");

    const title =
      document.createElement("h2");

    title.textContent = `▶ ${category}`;

    title.classList.add("category-title");

    const notesContainer =
      document.createElement("div");

    notesContainer.classList.add("category-notes");

    title.addEventListener("click", () => {

      notesContainer.classList.toggle("open");

      title.textContent =
        notesContainer.classList.contains("open")
          ? `▼ ${category}`
          : `▶ ${category}`;
    });

    categoryContainer.appendChild(title);
    categoryContainer.appendChild(notesContainer);

    sidebar.appendChild(categoryContainer);

    data[category].forEach(note => {

      const link =
        document.createElement("a");

      link.classList.add("note-link");

      link.href =
        `?note=${note.path}`;

      const params =
        new URLSearchParams(window.location.search);

      const currentNote =
        params.get("note");

      if (note.path === currentNote) {

        link.classList.add("active-note");

        // abre automáticamente la categoría
        notesContainer.classList.add("open");
        title.textContent = `▼ ${category}`;
      }

      link.textContent =
        note.title;

      notesContainer.appendChild(link);
    });
  }
}

async function loadMarkdown() {

  const markdownContainer =
    document.getElementById("markdown-content");

  if (!markdownContainer) return;

  const params =
    new URLSearchParams(window.location.search);

  const note =
    params.get("note");

  if (!note) {

    markdownContainer.innerHTML = `
      <div class="welcome-screen">
        <h1>⚡ Scritps Security</h1>

        <p>
          Selecciona una nota desde el panel lateral.
        </p>
      </div>
    `;

    return;
  }

  try {

    const response =
      await fetch(`../notes/scripts/${note}.md`);

    if (!response.ok) {
      throw new Error("Nota no encontrada");
    }

    const text =
      await response.text();

    markdownContainer.innerHTML =
      marked.parse(text);

    hljs.highlightAll();

  } catch (error) {

    markdownContainer.innerHTML = `
      <h1>404</h1>
      <p>Nota no encontrada.</p>
    `;
  }
}

function setupSearch() {

  const search =
    document.getElementById("search-notes");

  if (!search) return;

  search.addEventListener("input", () => {

    const value =
      search.value.toLowerCase();

    const links =
      document.querySelectorAll(".note-link");

    links.forEach(link => {

      const text =
        link.textContent.toLowerCase();

      if (text.includes(value)) {

        link.style.display = "block";

      } else {

        link.style.display = "none";
      }
    });
  });
}

function setupMobileMenu() {

  const button =
    document.getElementById("mobile-toggle");

  const sidebar =
    document.querySelector(".sidebar");

  if (!button || !sidebar) return;

  button.addEventListener("click", () => {

    sidebar.classList.toggle("active");
  });
}

function generateBreadcrumbs() {

  const breadcrumbs =
    document.getElementById("breadcrumbs");

  if (!breadcrumbs) return;

  const params =
    new URLSearchParams(window.location.search);

  const note =
    params.get("note");

  if (!note) {

    breadcrumbs.innerHTML =
      "Hardware Security";

    return;
  }

  const parts =
    note.split("/");

  const category =
    parts[0].toUpperCase();

  const page =
    parts[1]
      .replace("-", " ");

  breadcrumbs.innerHTML = `
    <span class="crumb-home">Scripts</span>
    <span class="crumb-separator">›</span>
    <span>${category}</span>
    <span class="crumb-separator">›</span>
    <span class="crumb-page">${page}</span>
  `;
}

async function generateTags() {

  const tagsContainer =
    document.getElementById("tags-container");

  if (!tagsContainer) return;
  
  tagsContainer.innerHTML = "";

  const params =
    new URLSearchParams(window.location.search);

  const currentNote =
    params.get("note");

  const response =
    await fetch("../data/scripts-notes.json");

  const data =
    await response.json();

  for (const category in data) {

    data[category].forEach(note => {

      if (note.path === currentNote) {

        note.tags.forEach(tag => {

          const tagElement =
            document.createElement("div");

          tagElement.classList.add("tag");

          tagElement.textContent =
            tag;

          tagsContainer.appendChild(tagElement);
        });
      }
    });
  }
}

generateBreadcrumbs();
generateTags();
generateSidebar();
loadMarkdown();
setupSearch();
setupMobileMenu();