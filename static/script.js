/* ============================================================
   script.js — Pesquisa Álbuns / Playlists + Renderização
   ============================================================ */

let CURRENT_TYPE = "albums";

/* === Escolher se procura Álbums ou Playlists === */
function searchType(type) {
    CURRENT_TYPE = type;
    search();
}

/* === Pressionar Enter no campo de pesquisa === */
document.addEventListener("DOMContentLoaded", () => {
    const q = document.getElementById("query");
    if (q) {
        q.addEventListener("keypress", (e) => {
            if (e.key === "Enter") search();
        });
    }
});

/* === Fazer a pesquisa === */
function search() {
    const q = document.getElementById("query").value.trim();
    if (!q) {
        document.getElementById("results").innerHTML =
            "<p>Digite algo para pesquisar…</p>";
        return;
    }

    const endpoint =
        CURRENT_TYPE === "albums"
            ? `/search/albums?query=${q}`
            : `/search/playlists?query=${q}`;

    fetch(endpoint)
        .then((r) => r.json())
        .then((data) => {
            const results = data.data?.results || [];
            renderResults(results);
        })
        .catch(() => {
            document.getElementById("results").innerHTML =
                "<p>Erro ao obter resultados.</p>";
        });
}

/* === Desenhar os resultados === */
function renderResults(items) {
    const container = document.getElementById("results");
    container.innerHTML = "";

    if (!items.length) {
        container.innerHTML = "<p>Nenhum resultado encontrado.</p>";
        return;
    }

    items.forEach((item) => {
        const id = item.id;
        const title = item.name;
        const img =
            item.image?.find((i) => i.quality === "150x150")?.url ||
            item.image?.[0]?.url ||
            "/static/default.png";

        const url =
            CURRENT_TYPE === "albums"
                ? `/album/${id}`
                : `/playlist/${id}`;

        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <img src="${img}" class="cover">
            <h3>${title}</h3>
            <button onclick="location.href='${url}'">
                Abrir
            </button>
        `;

        container.appendChild(card);
    });
}


