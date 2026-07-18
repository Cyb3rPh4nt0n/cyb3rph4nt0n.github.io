async function generateSidebar() {

  const sidebar =
    document.getElementById("notes-sidebar");

  if (!sidebar) return;

  const response =
    await fetch("../data/web-notes.json");

  const data =
    await response.json();

  for (const category in data) {

    const title =
      document.createElement("h2");

    title.textContent = category;

    sidebar.appendChild(title);

    data[category].forEach(note => {

      const link =
        document.createElement("a");
      
      link.classList.add("note-link");        

      link.href =
        `?note=${note.path}`;
      
      const params = new URLSearchParams(window.location.search);

      const currentNote = params.get("note") || "xss/basics";

      if (note.path === currentNote) {

        link.classList.add("active-note");
      }

      link.textContent =
        note.title;

      sidebar.appendChild(link);
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
    params.get("note") || "xss/basics";

  try {

    const response =
      await fetch(`../notes/web/${note}.md`);

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
    params.get("note") || "xss/basics";

  const parts =
    note.split("/");

  const category =
    parts[0].toUpperCase();

  const page =
    parts[1]
      .replace("-", " ");

  breadcrumbs.innerHTML = `
    <span>Web Security</span>
    / ${category}
    / ${page}
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
    params.get("note") || "xss/basics";

  const response =
    await fetch("../data/web-notes.json");

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

function createHTBChart() {

  const canvas =
    document.getElementById("htbChart");

  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  new Chart(ctx, {

    type: "doughnut",

    data: {

      labels: [
        "Easy",
        "Medium",
        "Hard",
        "Insane"
      ],

      datasets: [{

        label: "Máquinas resueltas",

        data: [22, 4, 0, 0],

        backgroundColor: [

          "#57ba54", // Easy - verde
          "#ff7c00", // Medium - amarillo
          "#ff0000", // Hard - naranja
          "#a00000", // Insane - rojo
        ],

        borderColor: "#0b0f17",

        borderWidth: 3.5,

        hoverOffset: 10
      }]
    },

    options: {

      responsive: true,

      maintainAspectRatio: true,

      cutout: "60%",

      layout: {
        padding: 10
      },

      plugins: {

        legend: {
          position: "right",
          labels: {
            color: "#ffffff",
            font: {
              size: 16,
              weight: "bold"
            },

            padding: 35
          }
        }
      }
    }
  });
}

window.addEventListener("load", () => {
  createHTBChart();
});

generateBreadcrumbs();
generateTags();
generateSidebar();
loadMarkdown();
setupSearch();
setupMobileMenu();
