// public/js/player.js
// Reproductor flotante persistente de Orbit API.
// Se incluye con una sola línea: <script src="/js/player.js"></script>
// No necesita nada más en el HTML de la página — se construye solo.
//
// Limitación real (honesta): este es un sitio multi-página, no una SPA.
// Al navegar entre páginas el navegador recarga todo, así que el audio
// se corta una fracción de segundo. Lo que este script sí hace es
// recordar exactamente la canción/segundo/volumen y retomarlos solos
// en la siguiente página, para que se sienta lo más continuo posible.

(() => {
  const STORAGE_KEY = "orbit_player_state_v1";

  const PLAYLIST = [
    { title: "Nena Maldición (ft. Emmy Bovarez)", artist: "Paulo Londra", url: "https://files.catbox.moe/8a9l6h.mp3" },
    { title: "Party (ft. A Boogie Wit Da Hoodie)", artist: "Paulo Londra", url: "https://files.catbox.moe/63rzew.mp3" },
    { title: "Solo Pienso En Ti (ft. De La Ghetto)", artist: "Paulo Londra", url: "https://files.catbox.moe/sws9uw.mp3" },
    { title: "Tal Vez (Cantoyo)", artist: "Paulo Londra", url: "https://files.catbox.moe/9lu8gc.mp3" },
    { title: "Tal Vez", artist: "Paulo Londra", url: "https://files.catbox.moe/strs0a.mp3" },
    { title: "Me Tiene Mal", artist: "Paulo Londra", url: "https://files.catbox.moe/2tc0fa.mp3" },
    { title: "Chica Paranormal", artist: "Paulo Londra", url: "https://files.catbox.moe/kkzep8.mp3" },
    { title: "Ojitos Lindos (ft. Bomba Estéreo)", artist: "Bad Bunny", url: "https://files.catbox.moe/xekon6.mp4" },
    { title: "EoO", artist: "Bad Bunny", url: "https://files.catbox.moe/kop6iw.mp3" },
    { title: "DtMF", artist: "Bad Bunny", url: "https://files.catbox.moe/6h8rtw.mp3" },
    { title: "Mood Brazil", artist: "Lil Naay", url: "https://files.catbox.moe/dwzx7m.mp3" },
    { title: "Excesos", artist: "Fuerza Regida", url: "https://files.catbox.moe/6ap9h5.mp3" },
    { title: "Perreo Porky", artist: "Yng Lucas", url: "https://files.catbox.moe/qatwr.mp3" },
    { title: "Ñañieto", artist: "Yng Lucas", url: "https://files.catbox.moe/wrq4sp.mp3" },
    { title: "Moly & Perignon", artist: "Yng Lucas", url: "https://files.catbox.moe/ff1wdr.mp3" },
    { title: "Mucho Para Mí (ft. Franco Escamilla)", artist: "Santa RM", url: "https://files.catbox.moe/ps5236.mp3" },
    { title: "Deja Vu (ft. Franco Escamilla, Ekarn6)", artist: "Santa RM", url: "https://files.catbox.moe/888g9n.mp3" },
    { title: "Life Goes On", artist: "Oliver Tree", url: "https://files.catbox.moe/o0kfn6.mp3" },
    { title: "Gatita", artist: "Bellakath", url: "https://files.catbox.moe/7fn035.mp3" },
    { title: "Delincuente", artist: "Tokischa, Anuel AA & Ñengo Flow", url: "https://files.catbox.moe/hwl9er.mp3" },
    { title: "Dardos (ft. Prince Royce)", artist: "Romeo Santos", url: "https://files.catbox.moe/ay0s00.mp3" },
    { title: "Hilito", artist: "Romeo Santos", url: "https://files.catbox.moe/akwuj1.mp3" },
    { title: "Loco", artist: "Neon Vggs", url: "https://files.catbox.moe/pyvz0c.mp3" },
    { title: "Netflix and Chill", artist: "Luis Carrillo, Omar Camacho y Oscar Maydon", url: "https://files.catbox.moe/tqfzyt.mp3" },
    { title: "La Cumbia De La Alfrediza", artist: "Yahir Saldívar", url: "https://files.catbox.moe/7i1903.mp3" },
    { title: "La Chona", artist: "Los Tucanes De Tijuana", url: "https://files.catbox.moe/vgvoji.mp3" },
    { title: "Squeeze", artist: "Ghostemane", url: "https://files.catbox.moe/90ge2e.mp3" },
    { title: "Gala Only (Cris MJ ft. FloyyMenor)", artist: "Gala Only", url: "https://files.catbox.moe/db0q1j.mp3" },
    { title: "Oye! (ft. Anuel AA)", artist: "Bebe", url: "https://files.catbox.moe/5p3rv3.mp3" },
    { title: "Amor De Madre", artist: "Aventura", url: "https://files.catbox.moe/b4eyrg.mp3" },
    { title: "China", artist: "Anuel AA, Daddy Yankee, Karol G, Ozuna & J Balvin", url: "https://files.catbox.moe/cb8qwj.mp3" },
    { title: "Amor", artist: "Emanuel Cortez", url: "https://files.catbox.moe/v40x3g.mp3" },
    { title: "Acento", artist: "Quinto Real", url: "https://files.catbox.moe/fcy08n.mp3" },
    { title: "Guapa", artist: "Quinto Real", url: "https://files.catbox.moe/jtfjql.mp3" },
    { title: "Roi", artist: "Videoclub", url: "https://files.catbox.moe/clp3sf.mp3" }
  ];

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        index: Number.isInteger(raw.index) && raw.index >= 0 && raw.index < PLAYLIST.length ? raw.index : 0,
        time: typeof raw.time === "number" ? raw.time : 0,
        playing: !!raw.playing,
        volume: typeof raw.volume === "number" ? raw.volume : 0.8,
        minimized: raw.minimized !== false,
        closed: !!raw.closed,
        right: typeof raw.right === "number" ? raw.right : 18,
        bottom: typeof raw.bottom === "number" ? raw.bottom : 18
      };
    } catch {
      return { index: 0, time: 0, playing: false, volume: 0.8, minimized: true, closed: false, right: 18, bottom: 18 };
    }
  }

  let state = loadState();

  function saveState(patch) {
    state = { ...state, ...patch };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }

  if (state.closed) {
    buildReopenTab();
    return;
  }

  buildPlayer();

  function buildPlayer() {
    const root = document.createElement("div");
    root.id = "orbitPlayerRoot";
    document.body.appendChild(root);

    const styleEl = document.createElement("style");
    styleEl.textContent = `
      #orbitPlayerRoot{position:fixed;z-index:9999;right:${state.right}px;bottom:${state.bottom}px;font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;user-select:none;}
      #orbitPlayerRoot *{box-sizing:border-box;}
      .op-mini{width:52px;height:52px;border-radius:50%;background:#121826;border:1px solid #232c40;display:grid;place-items:center;cursor:grab;box-shadow:0 8px 22px rgba(0,0,0,.4);position:relative;touch-action:none;}
      .op-mini:active{cursor:grabbing;}
      .op-mini svg{width:20px;height:20px;color:#6c8cff;}
      .op-mini .op-ring{position:absolute;inset:-3px;border-radius:50%;border:2px solid #6c8cff;opacity:0;animation:op-spin 3.2s linear infinite;}
      .op-mini.op-playing .op-ring{opacity:.55;}
      @keyframes op-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
      .op-card{width:260px;background:#121826;border:1px solid #232c40;border-radius:16px;box-shadow:0 12px 30px rgba(0,0,0,.45);overflow:hidden;}
      .op-head{display:flex;align-items:center;gap:8px;padding:10px 8px 10px 12px;cursor:grab;touch-action:none;border-bottom:1px solid #232c40;}
      .op-head:active{cursor:grabbing;}
      .op-head-text{flex:1;min-width:0;}
      .op-head-text strong{display:block;font-size:12.5px;color:#e7ecf6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .op-head-text span{display:block;font-size:11px;color:#8a93a8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px;}
      .op-icon-btn{width:26px;height:26px;border-radius:8px;border:none;background:transparent;color:#8a93a8;display:grid;place-items:center;cursor:pointer;flex:0 0 auto;}
      .op-icon-btn:hover{background:#1a2233;color:#e7ecf6;}
      .op-icon-btn svg{width:14px;height:14px;}
      .op-body{padding:10px 14px 14px;}
      .op-progress{height:5px;border-radius:999px;background:#1a2233;cursor:pointer;position:relative;margin-bottom:10px;}
      .op-progress-fill{height:100%;border-radius:999px;background:#6c8cff;width:0%;pointer-events:none;}
      .op-times{display:flex;justify-content:space-between;font-size:10px;color:#8a93a8;margin:-6px 0 10px;}
      .op-controls{display:flex;align-items:center;justify-content:center;gap:14px;}
      .op-ctrl-btn{background:transparent;border:none;color:#e7ecf6;cursor:pointer;display:grid;place-items:center;padding:4px;}
      .op-ctrl-btn svg{width:18px;height:18px;}
      .op-play-btn{width:38px;height:38px;border-radius:50%;background:#6c8cff;color:#0b1020;display:grid;place-items:center;cursor:pointer;border:none;flex:0 0 auto;}
      .op-play-btn svg{width:16px;height:16px;}
      .op-vol-row{display:flex;align-items:center;gap:8px;margin-top:10px;}
      .op-vol-row svg{width:13px;height:13px;color:#8a93a8;flex:0 0 auto;}
      .op-vol-row input[type=range]{flex:1;accent-color:#6c8cff;height:3px;}
      .op-resume-hint{font-size:10px;color:#f5c451;text-align:center;margin-top:8px;cursor:pointer;}
    `;
    document.head.appendChild(styleEl);

    const audio = new Audio();
    audio.preload = "auto";
    audio.volume = state.volume;

    let track = PLAYLIST[state.index];

    function icon(name) {
      const icons = {
        note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
        play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
        pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
        prev: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5v14l-11-7z"/></svg>',
        next: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 5v14l11-7z"/></svg>',
        chevronDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
        close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
        volume: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 5V4L8 9H4Z"/><path d="M17 8a5 5 0 0 1 0 8"/></svg>'
      };
      return icons[name] || "";
    }

    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }

    function formatTime(s) {
      if (!isFinite(s) || s < 0) return "0:00";
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60).toString().padStart(2, "0");
      return `${m}:${sec}`;
    }

    function render() {
      root.innerHTML = "";
      root.style.right = state.right + "px";
      root.style.bottom = state.bottom + "px";
      root.appendChild(state.minimized ? buildMini() : buildCard());
    }

    function buildMini() {
      const el = document.createElement("div");
      el.className = "op-mini" + (state.playing ? " op-playing" : "");
      el.innerHTML = `<div class="op-ring"></div>${icon("note")}`;
      makeDraggable(el, root, (wasClick) => {
        if (wasClick) {
          saveState({ minimized: false });
          render();
        }
      });
      return el;
    }

    function buildCard() {
      const el = document.createElement("div");
      el.className = "op-card";
      el.innerHTML = `
        <div class="op-head" data-drag>
          <div class="op-head-text">
            <strong>${escapeHtml(track.title)}</strong>
            <span>${escapeHtml(track.artist)}</span>
          </div>
          <button class="op-icon-btn" data-action="minimize" title="Minimizar">${icon("chevronDown")}</button>
          <button class="op-icon-btn" data-action="close" title="Quitar reproductor">${icon("close")}</button>
        </div>
        <div class="op-body">
          <div class="op-progress" data-progress>
            <div class="op-progress-fill" data-fill></div>
          </div>
          <div class="op-times"><span data-current>0:00</span><span data-duration>0:00</span></div>
          <div class="op-controls">
            <button class="op-ctrl-btn" data-action="prev" title="Anterior">${icon("prev")}</button>
            <button class="op-play-btn" data-action="toggle" title="Reproducir/Pausar">${icon(state.playing ? "pause" : "play")}</button>
            <button class="op-ctrl-btn" data-action="next" title="Siguiente">${icon("next")}</button>
          </div>
          <div class="op-vol-row">
            ${icon("volume")}
            <input type="range" min="0" max="1" step="0.01" value="${state.volume}" data-volume>
          </div>
          <div class="op-resume-hint" data-resume-hint style="display:none">Toca play para reanudar la música</div>
        </div>
      `;

      makeDraggable(el.querySelector("[data-drag]"), root, () => {});

      el.querySelector('[data-action="minimize"]').addEventListener("click", () => {
        saveState({ minimized: true });
        render();
      });
      el.querySelector('[data-action="close"]').addEventListener("click", () => {
        audio.pause();
        saveState({ closed: true, playing: false });
        root.remove();
        buildReopenTab();
      });
      el.querySelector('[data-action="toggle"]').addEventListener("click", togglePlay);
      el.querySelector('[data-action="prev"]').addEventListener("click", () => changeTrack(-1));
      el.querySelector('[data-action="next"]').addEventListener("click", () => changeTrack(1));

      const volInput = el.querySelector("[data-volume]");
      volInput.addEventListener("input", () => {
        audio.volume = Number(volInput.value);
        saveState({ volume: audio.volume });
      });

      const progress = el.querySelector("[data-progress]");
      progress.addEventListener("click", (e) => {
        if (!audio.duration) return;
        const rect = progress.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        audio.currentTime = ratio * audio.duration;
      });

      updateCardProgress(el);
      return el;
    }

    function updateCardProgress(cardEl) {
      const card = cardEl || root.querySelector(".op-card");
      if (!card) return;
      const fill = card.querySelector("[data-fill]");
      const cur = card.querySelector("[data-current]");
      const dur = card.querySelector("[data-duration]");
      if (!fill) return;
      const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      fill.style.width = pct + "%";
      if (cur) cur.textContent = formatTime(audio.currentTime);
      if (dur) dur.textContent = formatTime(audio.duration);
    }

    function loadTrack(index, autoplay) {
      state.index = index;
      track = PLAYLIST[index];
      audio.src = track.url;
      if (autoplay) attemptPlay();
      saveState({ index, time: 0 });
      render();
    }

    function changeTrack(delta) {
      const next = (state.index + delta + PLAYLIST.length) % PLAYLIST.length;
      loadTrack(next, true);
    }

    function attemptPlay() {
      const p = audio.play();
      if (p && p.catch) {
        p.then(() => {
          saveState({ playing: true });
          syncMiniPlayingClass();
        }).catch(() => {
          saveState({ playing: false });
          syncMiniPlayingClass();
          const hint = root.querySelector("[data-resume-hint]");
          if (hint) hint.style.display = "block";
        });
      }
    }

    function togglePlay() {
      if (audio.paused) {
        attemptPlay();
      } else {
        audio.pause();
        saveState({ playing: false });
      }
      syncPlayButtonIcon();
      syncMiniPlayingClass();
    }

    function syncPlayButtonIcon() {
      const btn = root.querySelector('[data-action="toggle"]');
      if (btn) btn.innerHTML = icon(audio.paused ? "play" : "pause");
      const hint = root.querySelector("[data-resume-hint]");
      if (hint && !audio.paused) hint.style.display = "none";
    }

    function syncMiniPlayingClass() {
      const mini = root.querySelector(".op-mini");
      if (mini) mini.classList.toggle("op-playing", !audio.paused);
    }

    audio.addEventListener("play", () => {
      saveState({ playing: true });
      syncPlayButtonIcon();
      syncMiniPlayingClass();
    });
    audio.addEventListener("pause", () => {
      saveState({ playing: false });
      syncPlayButtonIcon();
      syncMiniPlayingClass();
    });
    audio.addEventListener("ended", () => changeTrack(1));

    let lastSave = 0;
    audio.addEventListener("timeupdate", () => {
      updateCardProgress();
      const now = Date.now();
      if (now - lastSave > 3000) {
        lastSave = now;
        saveState({ time: audio.currentTime });
      }
    });

    window.addEventListener("pagehide", () => saveState({ time: audio.currentTime }));
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") saveState({ time: audio.currentTime });
    });

    function makeDraggable(handleEl, containerEl, onClick) {
      let startX, startY, startRight, startBottom, moved, pointerId;

      handleEl.addEventListener("pointerdown", (e) => {
        pointerId = e.pointerId;
        handleEl.setPointerCapture(pointerId);
        startX = e.clientX;
        startY = e.clientY;
        startRight = state.right;
        startBottom = state.bottom;
        moved = false;

        function onMove(ev) {
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;
          if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;

          let newRight = startRight - dx;
          let newBottom = startBottom - dy;

          const w = containerEl.offsetWidth || 60;
          const h = containerEl.offsetHeight || 60;
          newRight = Math.min(Math.max(newRight, 4), window.innerWidth - w - 4);
          newBottom = Math.min(Math.max(newBottom, 4), window.innerHeight - h - 4);

          containerEl.style.right = newRight + "px";
          containerEl.style.bottom = newBottom + "px";
          state.right = newRight;
          state.bottom = newBottom;
        }

        function onUp() {
          handleEl.releasePointerCapture(pointerId);
          handleEl.removeEventListener("pointermove", onMove);
          handleEl.removeEventListener("pointerup", onUp);
          saveState({ right: state.right, bottom: state.bottom });
          if (onClick) onClick(!moved);
        }

        handleEl.addEventListener("pointermove", onMove);
        handleEl.addEventListener("pointerup", onUp);
      });
    }

    audio.src = track.url;
    if (state.time) {
      audio.addEventListener(
        "loadedmetadata",
        () => {
          audio.currentTime = state.time;
        },
        { once: true }
      );
    }
    render();
    if (state.playing) attemptPlay();
  }

  function buildReopenTab() {
    const tab = document.createElement("div");
    tab.id = "orbitPlayerReopenTab";
    tab.innerHTML = `
      <style>
        #orbitPlayerReopenTab{position:fixed;z-index:9999;right:0;bottom:18px;width:22px;height:42px;background:#121826;border:1px solid #232c40;border-right:none;border-radius:10px 0 0 10px;display:grid;place-items:center;cursor:pointer;opacity:.55;transition:opacity .15s;}
        #orbitPlayerReopenTab:hover{opacity:1;}
        #orbitPlayerReopenTab svg{width:12px;height:12px;color:#6c8cff;}
      </style>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
    `;
    tab.addEventListener("click", () => {
      saveState({ closed: false, minimized: true });
      tab.remove();
      buildPlayer();
    });
    document.body.appendChild(tab);
  }
})();
