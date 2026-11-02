/* ===================================================================
   portfolio.js — one script shared by index, about, work, skills and contact.
   Every feature checks that its elements exist, so it is safe on any page,
   and everything is wired up exactly once (no duplicate listeners).
   Each <body> has data-page="home|about|work|skills|contact".
   =================================================================== */
(() => {
  "use strict";
  if (window.__portfolioReady) return;
  window.__portfolioReady = true;

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // ---------------------------------------------------------------
  // SCROLL-TRIGGERED ANIMATION: elements with class "reveal" fade in once
  // ---------------------------------------------------------------
  const revealObserver = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        revealObserver.unobserve(e.target);
      }
    }),
    { threshold: 0.1 }
  );
  const observeReveals = (scope) => (scope || document).querySelectorAll(".reveal:not(.visible)").forEach((el) => revealObserver.observe(el));
  observeReveals();

  // Footer Year
  document.querySelectorAll("#year").forEach((el) => { el.textContent = new Date().getFullYear(); });

  // ---------------------------------------------------------------
  // SIDEBAR: the icon for the page you're on is highlighted (also hard-coded in each
  // page's HTML so there's no flash). Scrolling never changes it and never touches the URL,
  // so refresh / back / forward always land on the page you were on.
  // ---------------------------------------------------------------
  const page = document.body.dataset.page || "home";
  document.querySelectorAll(".side-nav a").forEach((a) => {
    const on = a.dataset.section === page;
    a.classList.toggle("active", on);
    if (on) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });

  // ---------------------------------------------------------------
  // LINK HANDLING (one listener for the whole site)
  //  - the link to the page you're already on, and "Back to top", scroll smoothly to the top
  //  - links to other pages navigate normally; the cross-fade comes from CSS (view transitions).
  //    Browsers without that feature (class "no-vt", set in <head>) get a short fade-out first.
  // ---------------------------------------------------------------
  const normPath = (p) => p.replace(/\/index\.html?$/i, "/").replace(/\.html?$/i, "");
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
  let leaving = false;
  const leaveTo = (href, delay, fade) => {
    if (leaving) return;
    leaving = true;
    const c = document.querySelector(".content");
    if (c && fade) c.classList.add("is-leaving");
    setTimeout(() => { location.href = href; }, delay);
  };
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest("a[href]");
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (url.protocol !== location.protocol || url.origin !== location.origin) return; // mailto:, external sites
    const samePage = normPath(url.pathname) === normPath(location.pathname);
    // Sidebar icons / logo: play the star shimmer sound + sparkle on every click (as before)
    const isNavIcon = !!a.closest(".side-nav") || a.classList.contains("logo");
    if (isNavIcon) { playShimmer(); twinkleStar(); }
    if (samePage) {
      if (!url.hash || url.hash === "#top") { e.preventDefault(); scrollToTop(); }
      return; // other #anchors: native smooth scroll
    }
    const fade = root.classList.contains("no-vt") && !reduceMotion.matches;
    if (isNavIcon) {
      // short pause so the shimmer is heard before the next page loads
      e.preventDefault();
      leaveTo(url.href, 300, fade);
    } else if (fade) {
      e.preventDefault();
      leaveTo(url.href, 220, true);
    }
  });
  // Coming back with the Back button can restore the page from the browser cache: undo the fade-out
  window.addEventListener("pageshow", () => {
    leaving = false;
    const c = document.querySelector(".content");
    if (c) c.classList.remove("is-leaving");
  });

  // Star button shimmer animation & sound effect
    const starBtn = document.getElementById("starBtn");
    let starTimer;
    let audioCtx;

    const playShimmer = () => {
      try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === "suspended") audioCtx.resume();
        const now = audioCtx.currentTime;
        [1568, 2093, 2637, 3136, 3951].forEach((freq, i) => {
          [0, 5].forEach((detune) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const t = now + i * 0.07;
            osc.type = "sine";
            osc.frequency.value = freq;
            osc.detune.value = detune;
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t + 0.75);
          });
        });
      } catch (err) {}
    };

    const twinkleStar = () => {
      if (!starBtn) return;
      clearTimeout(starTimer);
      starBtn.classList.remove("is-sparkling");
      void starBtn.offsetWidth;
      starBtn.classList.add("is-sparkling");
      starTimer = setTimeout(() => { starBtn.classList.remove("is-sparkling"); }, 1000);
    };

    if (starBtn) {
      starBtn.addEventListener("click", () => {
        playShimmer();
        twinkleStar();
      });
    }

    // Creative Space Shuffle Logic
    const creativePlayground = document.getElementById("creativePlayground");
    const shuffleCreative = document.getElementById("shuffleCreative");
    const creativeIdea = document.getElementById("creativeIdea");
    const creativeSubtitle = document.getElementById("creativeSubtitle");
    const vibeNumber = document.getElementById("vibeNumber");
    const creativeSwatches = document.querySelectorAll(".creative-swatch");
    const creativeIcons = [document.getElementById("creativeStar"), document.getElementById("creativeHeart"), document.getElementById("creativeFlower")];

    const creativeVibes = [
      { name: "01 / 03", title: "Dream it.<br />Design it.", subtitle: "A little corner for playful ideas, pretty pixels, and happy accidents.", className: "", colors: ["#f7a9bd", "#c8a6e8", "#fff0d8"], icons: ["✦", "♡", "✿"] },
      { name: "02 / 03", title: "A sprinkle<br />of sunshine.", subtitle: "Trying bright ideas, mixing colors, and seeing where curiosity goes.", className: "vibe-two", colors: ["#f5bd75", "#f08da5", "#d6baf1"], icons: ["☀", "♥", "✺"] },
      { name: "03 / 03", title: "Make room<br />for wonder.", subtitle: "Tiny experiments today can become thoughtful experiences tomorrow.", className: "vibe-three", colors: ["#a9d9b8", "#9fcce8", "#e7b7df"], icons: ["✧", "☁", "❀"] }
    ];

    let currentVibe = 0;
    if (shuffleCreative && creativePlayground) {
      shuffleCreative.addEventListener("click", () => {
        currentVibe = (currentVibe + 1) % creativeVibes.length;
        const vibe = creativeVibes[currentVibe];
        creativePlayground.classList.remove("vibe-two", "vibe-three");
        if (vibe.className) creativePlayground.classList.add(vibe.className);
        creativeIdea.innerHTML = vibe.title;
        creativeSubtitle.textContent = vibe.subtitle;
        vibeNumber.textContent = vibe.name;
        creativeSwatches.forEach((swatch, index) => { swatch.style.background = vibe.colors[index]; });
        creativeIcons.forEach((icon, index) => {
          if (!icon) return;
          icon.textContent = vibe.icons[index];
        });
      });
    }

  // CERTIFICATE LOOP: i-clone ang mga card para seamless ang auto-scroll.
  // Usba ra ang unang set sa cards sa HTML; ang copies automatic na.
  (() => {
    const track = document.querySelector(".cert-marquee-track");
    if (!track) return;
    const originals = [...track.children];
    if (!originals.length) return;
    const setWidth = track.scrollWidth;
    if (!setWidth) return; // not laid out yet (e.g. hidden): avoid dividing by 0
    const screenW = Math.max(window.innerWidth, window.screen ? window.screen.width : 0);
    const k = Math.max(1, Math.ceil(screenW / setWidth)); // enough cards para walay blank sa wide screens
    for (let i = 1; i < 2 * k; i++) {
      originals.forEach((card) => {
        const copy = card.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        copy.dataset.clone = "1";
        track.appendChild(copy);
      });
    }
  })();

  // CERTIFICATE POP-UP
  (() => {
    const modal = document.getElementById("certModal");
    if (!modal) return;
    const mImg = document.getElementById("certModalImg");
    const mTitle = document.getElementById("certModalTitle");
    const mMeta = document.getElementById("certModalMeta");
    const mDesc = document.getElementById("certModalDesc");
    const closeBtn = document.getElementById("certModalClose");
    let lastFocus = null;

    const cards = document.querySelectorAll(".cert-card-item");
    cards.forEach((card) => {
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", card.dataset.clone ? "-1" : "0");
      card.setAttribute("aria-haspopup", "dialog");
    });

    const openModal = (card) => {
      const img = card.querySelector("img");
      const title = card.querySelector("h3");
      const paras = card.querySelectorAll("p");
      mImg.src = img ? img.src : "";
      mImg.alt = img ? img.alt : "";
      mTitle.textContent = title ? title.textContent : "";
      mMeta.textContent = paras[0] ? paras[0].textContent : "";
      mDesc.textContent = paras[1] ? paras[1].textContent : "";
      lastFocus = document.activeElement;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("cert-open");
      closeBtn.focus();
    };

    const closeModal = () => {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("cert-open");
      if (lastFocus) lastFocus.focus();
    };

    document.addEventListener("click", (e) => {
      const card = e.target.closest(".cert-card-item");
      if (card) openModal(card);
    });
    document.addEventListener("keydown", (e) => {
      if (modal.classList.contains("open")) {
        if (e.key === "Escape") closeModal();
        return;
      }
      if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("cert-card-item")) {
        e.preventDefault();
        openModal(e.target);
      }
    });
    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  })();

  // ---------------------------------------------------------------
  // WORK LOADER (home page only): kuhaon ang #work section gikan sa work.html ug ibutang diri sa home page.
  // Gamit gihapon ang scroll animation (reveal); usba ra ang work.html ug mo-update sad ang home page.
  // ---------------------------------------------------------------
  const workLoaded = (() => {
    const host = document.getElementById("work-content");
    if (!host) return Promise.resolve();
    return fetch(host.dataset.src || "work.html")
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const src = doc.getElementById("work");
        if (!src) return;
        // Dili na kinahanglan diri ang description sa heading (gikuha nimo na sa home)
        src.querySelectorAll(".section-description").forEach((el) => el.remove());
        host.innerHTML = src.innerHTML;
        observeReveals(host);
        // kon gi-open ang index.html#work, i-scroll balik kay mitaas na ang section
        if (location.hash === "#work") {
          document.getElementById("work").scrollIntoView();
        }
      })
      .catch(() => {
        /* kon dili ma-load (pananglitan gi-open ang file direkta, dili pinaagi sa server),
           magpabilin ang "View my work" link */
      });
  })();

  // Home page: the Work section grows after it loads, so put the scroll position back once it has
  // (otherwise a refresh in the lower half of the page lands a few hundred px too high).
  (() => {
    if (!document.getElementById("work-content")) return;
    const key = "portfolio:scroll:" + location.pathname;
    window.addEventListener("pagehide", () => {
      try { sessionStorage.setItem(key, String(Math.round(window.scrollY))); } catch (_) {}
    });
    const nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
    if (!nav || (nav.type !== "reload" && nav.type !== "back_forward") || location.hash) return;
    let y = 0;
    try { y = Number(sessionStorage.getItem(key)) || 0; } catch (_) {}
    if (!y) return;
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    workLoaded.then(() => requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "instant" })));
  })();

  // SAY HELLO POP-UP
  // 1) Ilisi ang HELLO_EMAIL sa imong email.
  // 2) (Optional) Kung gusto nimo nga diretso na ma-send (dili na mo-open ang email app),
  //    butangi og endpoint ang HELLO_ENDPOINT, pananglitan Formspree: "https://formspree.io/f/xxxxxxxx".
  (() => {
    const HELLO_EMAIL = "your.email@example.com";
    const HELLO_ENDPOINT = "";

    const btn = document.getElementById("emailButton");
    const modal = document.getElementById("helloModal");
    if (!btn || !modal) return;
    const box = document.getElementById("helloBox");
    const form = document.getElementById("helloForm");
    const msg = document.getElementById("helloMsg");
    const nameEl = document.getElementById("helloName");
    const count = document.getElementById("helloCount");
    const err = document.getElementById("helloError");
    const sendBtn = document.getElementById("helloSend");
    const thanksText = document.getElementById("helloThanksText");
    let lastFocus = null;

    const open = (e) => {
      if (e) e.preventDefault();
      lastFocus = document.activeElement;
      box.classList.remove("sent");
      err.textContent = "";
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("hello-open");
      setTimeout(() => msg.focus(), 120);
    };
    const close = () => {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("hello-open");
      if (lastFocus) lastFocus.focus();
    };

    btn.addEventListener("click", open);
    document.getElementById("helloClose").addEventListener("click", close);
    document.getElementById("helloCancel").addEventListener("click", close);
    document.getElementById("helloDone").addEventListener("click", close);
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("open")) close();
    });
    msg.addEventListener("input", () => { count.textContent = msg.value.length; err.textContent = ""; });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = msg.value.trim();
      if (!text) { err.textContent = "Please write a message first ♡"; msg.focus(); return; }
      const kind = form.querySelector('input[name="kind"]:checked').value;
      const from = nameEl.value.trim() || "Anonymous";
      const subject = `${kind} for Kate from ${from}`;
      const body = `${text}\n\n— ${from}`;

      const finish = (note) => {
        thanksText.textContent = note;
        box.classList.add("sent");
        form.reset();
        count.textContent = "0";
      };

      if (HELLO_ENDPOINT) {
        sendBtn.disabled = true;
        sendBtn.textContent = "Sending…";
        try {
          const res = await fetch(HELLO_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ kind, name: from, message: text, _subject: subject }),
          });
          if (!res.ok) throw new Error(res.status);
          finish("Your note was sent. It means a lot ♡");
        } catch (_) {
          err.textContent = "Couldn't send it right now. Please try again in a bit.";
        } finally {
          sendBtn.disabled = false;
          sendBtn.textContent = "Send with love ♡";
        }
      } else {
        location.href = `mailto:${HELLO_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        finish("Your email app should open with your note ready — just press send ♡");
      }
    });
  })();

  // PROJECT IMAGE POP-UP: i-click ang image sa project card para mo-popup. Ang link naa sa ↗ button ra.
  (() => {
    const modal = document.getElementById("pvModal");
    if (!modal) return;
    const mImg = document.getElementById("pvImg");
    const mTitle = document.getElementById("pvTitle");
    const mDesc = document.getElementById("pvDesc");
    let lastFocus = null;

    const open = (visual) => {
      const img = visual.querySelector(".project-img");
      if (!img) return;
      const card = visual.closest(".project-card");
      const title = card && card.querySelector("h3");
      const desc = card && card.querySelector(".project-top p");
      mImg.src = img.currentSrc || img.src;
      mImg.alt = img.alt || "";
      mTitle.textContent = title ? title.textContent : "";
      mDesc.textContent = desc ? desc.textContent.trim().replace(/\s+/g, " ") : "";
      lastFocus = document.activeElement;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("pv-open");
      document.getElementById("pvClose").focus();
    };
    const close = () => {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("pv-open");
      if (lastFocus) lastFocus.focus();
    };

    // delegation: mogana bisan ang cards gi-load pa gikan sa work.html
    document.addEventListener("click", (e) => {
      const visual = e.target.closest(".project-visual");
      if (visual) open(visual);
    });
    document.addEventListener("keydown", (e) => {
      if (modal.classList.contains("open")) { if (e.key === "Escape") close(); return; }
      if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("project-visual") && e.target.querySelector(".project-img")) {
        e.preventDefault();
        open(e.target);
      }
    });
    document.getElementById("pvClose").addEventListener("click", close);
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  })();
})();