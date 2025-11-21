/* ============================================================
   player.js — Spotify Neon Premium Player (VERSÃO CORRIGIDA)
   ============================================================ */

/* ELEMENTOS DOM */
const audio      = document.getElementById("player");
const eqCanvas   = document.getElementById("eqCanvas");
const ctx        = eqCanvas.getContext("2d");

const spCover    = document.getElementById("sp-cover");
const spTitle    = document.getElementById("sp-title");
const spArtist   = document.getElementById("sp-artist");

const spPlayBtn  = document.getElementById("sp-play");

const spBar      = document.getElementById("sp-bar");
const spCurrent  = document.getElementById("sp-current");
const spDuration = document.getElementById("sp-duration");

const volIcon    = document.getElementById("volIcon");
const spVolume   = document.getElementById("sp-volume");

/* ============================================================
   VARIÁVEIS DO PLAYER
   ============================================================ */

let queue = [];      // lista de músicas
let index = 0;       // índice atual
let isPlaying = false;

/* Equalizador */
let audioCtx    = null;
let analyser    = null;
let dataArray   = null;
let sourceNode  = null;
let eqStarted   = false;

/* ============================================================
   HELPERS
   ============================================================ */

function formatTime(sec) {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    let s = Math.floor(sec % 60);
    if (s < 10) s = "0" + s;
    return `${m}:${s}`;
}

function getBestDownloadUrl(s) {
    const arr = s.downloadUrl || s.download_url || [];
    if (!arr || !arr.length) return "";

    const last  = arr[arr.length - 1];
    const first = arr[0];

    return  (last && (last.url || last.link)) ||
            (first && (first.url || first.link)) ||
            "";
}

function getBestImage(images, fallback) {
    if (!images || !images.length) return fallback;
    const last  = images[images.length - 1];
    const first = images[0];
    return (last && last.url) || (first && first.url) || fallback;
}

/* ============================================================
   CARREGAR ÁLBUM / PLAYLIST
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    if (typeof API_URL === "undefined") return;

    fetch(API_URL)
        .then(r => r.json())
        .then(data => {
            const info = data.data;

            const cover =
                getBestImage(info.image, "/static/default.png");

            const pageCoverEl = document.getElementById("page-cover");
            const pageTitleEl = document.getElementById("page-title");

            if (pageCoverEl) pageCoverEl.src = cover;
            if (pageTitleEl) pageTitleEl.textContent = info.name || "Sem título";

            queue = (info.songs || []).map(s => ({
                id:     s.id,
                title:  s.name,
                artist: s.primaryArtists,
                url:    getBestDownloadUrl(s),
                cover:  getBestImage(s.image, cover)
            }));

            renderTracks(queue);
        })
        .catch(err => {
            console.error("Erro ao carregar dados:", err);
        });
});

/* ============================================================
   DESENHAR LISTA DE FAIXAS
   ============================================================ */

function renderTracks(list) {
    const ul = document.getElementById("tracks");
    if (!ul) return;

    ul.innerHTML = "";

    list.forEach((song, i) => {
        const li = document.createElement("li");
        li.className = "track";

        li.innerHTML = `
            <img src="${song.cover}" class="track-cover">
            <div>
                <strong>${song.title}</strong><br>
                <span>${song.artist}</span>
            </div>
            <button style="margin-left:auto" onclick="playSingle(${i})">
                ▶
            </button>
        `;

        ul.appendChild(li);
    });
}

/* ============================================================
   CONTROLO DE REPRODUÇÃO
   ============================================================ */

function loadSong(i) {
    if (!queue.length) return;

    index = i;
    const song = queue[index];

    if (!song.url) {
        alert("Esta faixa não tem URL de áudio disponível.");
        console.warn("Sem downloadUrl para:", song);
        return;
    }

    audio.src = song.url;

    spCover.src       = song.cover;
    spTitle.textContent  = song.title;
    spArtist.textContent = song.artist;

    audio.play()
        .then(() => {
            isPlaying = true;
            spPlayBtn.textContent = "⏸";
            startEqualizer();
        })
        .catch(err => {
            console.error("Erro ao iniciar áudio:", err);
        });
}

function playSingle(i) {
    loadSong(i);
}

function playAll() {
    if (queue.length) loadSong(0);
}

function togglePlay() {
    if (!audio.src) return;

    if (isPlaying) {
        audio.pause();
        spPlayBtn.textContent = "▶";
    } else {
        audio.play().catch(console.error);
        spPlayBtn.textContent = "⏸";
    }
    isPlaying = !isPlaying;
}

function nextSong() {
    if (index < queue.length - 1) {
        loadSong(index + 1);
    }
}

function prevSong() {
    if (index > 0) {
        loadSong(index - 1);
    }
}

/* Torna acessível no global para os botões HTML */
window.playAll    = playAll;
window.playSingle = playSingle;
window.togglePlay = togglePlay;
window.nextSong   = nextSong;
window.prevSong   = prevSong;

/* ============================================================
   PROGRESSO + TEMPO
   ============================================================ */

audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;

    const ratio = audio.currentTime / audio.duration;
    spBar.value = ratio * 100;

    spCurrent.textContent  = formatTime(audio.currentTime);
    spDuration.textContent = formatTime(audio.duration);
});

spBar.addEventListener("input", () => {
    if (!audio.duration) return;
    audio.currentTime = (spBar.value / 100) * audio.duration;
});

audio.addEventListener("ended", () => {
    if (index < queue.length - 1) {
        nextSong();
    } else {
        isPlaying = false;
        spPlayBtn.textContent = "▶";
    }
});

/* ============================================================
   VOLUME + ÍCONE
   ============================================================ */

audio.volume = spVolume.value; // inicial

spVolume.addEventListener("input", () => {
    const v = Number(spVolume.value);
    audio.volume = v;

    if (v === 0) volIcon.textContent = "🔇";
    else if (v < 0.5) volIcon.textContent = "🔈";
    else volIcon.textContent = "🔊";
});

volIcon.addEventListener("click", () => {
    if (audio.volume > 0) {
        audio._lastVolume = audio.volume;
        audio.volume = 0;
        spVolume.value = 0;
        volIcon.textContent = "🔇";
    } else {
        const v = audio._lastVolume || 1;
        audio.volume = v;
        spVolume.value = v;
        if (v < 0.5) volIcon.textContent = "🔈";
        else volIcon.textContent = "🔊";
    }
});

/* ============================================================
   EQUALIZADOR NEON — APENAS 1 AudioContext!
   ============================================================ */

function startEqualizer() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            dataArray = new Uint8Array(analyser.frequencyBinCount);

            sourceNode = audioCtx.createMediaElementSource(audio);
            sourceNode.connect(analyser);
            analyser.connect(audioCtx.destination);
        }

        if (!eqStarted) {
            eqStarted = true;
            audioCtx.resume();
            drawEq();
        }
    } catch (e) {
        console.warn("Falha ao iniciar equalizador:", e);
    }
}

function drawEq() {
    if (!analyser) return;

    requestAnimationFrame(drawEq);

    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, eqCanvas.width, eqCanvas.height);

    const barWidth = (eqCanvas.width / dataArray.length) * 1.4;

    for (let i = 0; i < dataArray.length; i++) {
        const value = dataArray[i] / 255;
        const barHeight = value * eqCanvas.height;

        ctx.fillStyle = "#00e5ff";
        ctx.fillRect(
            i * barWidth,
            eqCanvas.height - barHeight,
            barWidth - 2,
            barHeight
        );
    }
}



