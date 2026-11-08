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
  // page's HTML so there's no flash). On the home page the bubble below follows your scroll, but it never touches the URL,
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
  // SIDEBAR BUBBLE (nav indicator)
  //  1) Between pages: a pink bubble glides from the previous page's icon to this page's icon.
  //  2) On the home page: while you scroll Home > About > Work > Skills > Contact,
  //     the bubble follows and moves to the icon of the section you're in.
  //  Colors / timing: edit the CSS string below.
  // ---------------------------------------------------------------
  (() => {
    const nav = document.querySelector(".side-nav");
    if (!nav) return;
    let active = nav.querySelector("a.active");
    if (!active) return;

    const style = document.createElement("style");
    style.textContent =
      ".side-nav{position:relative}" +
      ".side-nav a{position:relative;z-index:1}" +
      ".side-nav a.active{background:transparent!important;box-shadow:none!important}" +
      ".nav-bubble{position:absolute;z-index:0;pointer-events:none;border-radius:16px;" +
      "background:var(--blush,#f6c9d8);box-shadow:0 6px 16px rgba(133,14,53,.22);opacity:0;will-change:transform,width,height}" +
      ".nav-bubble.ready{opacity:1}" +
      ".nav-bubble.glide{transition:left .55s cubic-bezier(.5,1.4,.4,1),top .55s cubic-bezier(.5,1.4,.4,1),width .4s ease,height .4s ease}" +
      "@media (prefers-reduced-motion:reduce){.nav-bubble.glide{transition:none}}";
    document.head.appendChild(style);

    const bubble = document.createElement("span");
    bubble.className = "nav-bubble";
    bubble.setAttribute("aria-hidden", "true");
    nav.insertBefore(bubble, nav.firstChild);

    const place = (link) => {
      bubble.style.left = link.offsetLeft + "px";
      bubble.style.top = link.offsetTop + "px";
      bubble.style.width = link.offsetWidth + "px";
      bubble.style.height = link.offsetHeight + "px";
    };

    const KEY = "kateNavPrev";
    const remember = (section) => { try { sessionStorage.setItem(KEY, section); } catch (_) {} };

    let current = active.dataset.section;
    let prev = null;
    try { prev = sessionStorage.getItem(KEY); } catch (_) {}
    remember(current);

    // a refresh keeps you on the same page, so don't glide then
    const navEntry = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
    const isReload = !!navEntry && navEntry.type === "reload";
    const from = !isReload && prev && prev !== current ? nav.querySelector('a[data-section="' + prev + '"]') : null;

    if (from) {
      place(from); // start on the icon you came from
      bubble.classList.add("ready");
      void bubble.offsetWidth;
      setTimeout(() => { bubble.classList.add("glide"); place(active); }, 120); // then glide to this page's icon
    } else {
      place(active);
      bubble.classList.add("ready");
    }

    // icons may finish loading after this runs: re-measure once everything is in
    window.addEventListener("load", () => place(active));

    // move the bubble (and the active state) to another section's icon
    const setSection = (section) => {
      const link = nav.querySelector('a[data-section="' + section + '"]');
      if (!link || link === active) return;
      active.classList.remove("active");
      active.removeAttribute("aria-current");
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
      active = link;
      current = section;
      remember(section);
      bubble.classList.add("glide");
      place(link);
    };

    // scroll-spy: only on the one-page home
    const map = [
      ["home", ["home"]],
      ["about", ["about", "certificates"]],
      ["work", ["work"]],
      ["skills", ["skills"]],
      ["contact", ["contact"]],
    ]
      .map(([key, ids]) => ({ key, els: ids.map((id) => document.getElementById(id)).filter(Boolean) }))
      .filter((m) => m.els.length);

    if (page === "home" && map.length > 1) {
      let ticking = false;
      const spy = () => {
        ticking = false;
        const probe = window.innerHeight * 0.35; // the "reading line" (raise/lower to change when icons switch)
        let found = map[0].key;
        map.forEach((m) => { if (m.els[0].getBoundingClientRect().top <= probe) found = m.key; });
        const lastGroup = map[map.length - 1];
        const lastEl = lastGroup.els[lastGroup.els.length - 1];
        if (lastEl.getBoundingClientRect().bottom <= window.innerHeight + 4) found = lastGroup.key; // very bottom = Contact
        if (found !== current) setSection(found);
      };
      const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(spy); } };
      document.addEventListener("scroll", onScroll, true);
      window.addEventListener("resize", onScroll);
      setTimeout(spy, 400); // after the page has settled / restored its scroll
    }

    window.addEventListener("resize", () => { bubble.classList.remove("glide"); place(active); });
  })();

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
  // Auto-scroll ug manual side-scroll (swipe / drag / trackpad / Shift+wheel) walay scrollbar.
  (() => {
    const track = document.querySelector(".cert-marquee-track");
    if (!track) return;
    const box = track.closest(".cert-marquee-container");
    const originals = [...track.children];
    if (!originals.length) return;
    const setWidth = track.scrollWidth;
    if (!setWidth) return; // not laid out yet (e.g. hidden): avoid dividing by 0
    const screenW = Math.max(window.innerWidth, window.screen ? window.screen.width : 0);
    const k = Math.max(1, Math.ceil(screenW / setWidth)); // enough cards para walay blank sa wide screens
    const addSet = () => {
      originals.forEach((card) => {
        const copy = card.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        copy.dataset.clone = "1";
        track.appendChild(copy);
      });
    };
    for (let i = 1; i < 2 * k; i++) addSet();
    if (!box) return;

    // ---- auto-scroll + manual scroll (transform based; no scrollbar, no scrollLeft) ----
    let sets = 2 * k;
    const setW = () => track.offsetWidth / sets;
    let guard = 0;
    while (track.offsetWidth < box.clientWidth + 2 * setW() && guard++ < 6) { addSet(); sets++; }
    box.classList.add("cert-js");

    const SPEED = reduceMotionPref() ? 30 : 44; // auto-scroll, pixels per second
    const RESUME_DELAY = 1500;                  // ms after the last touch / wheel before auto-scroll resumes
    let W = setW();                             // width of ONE set = loop length
    let x = 0;                                  // how far the strip is scrolled
    let vel = 0;                                // momentum after a flick (px/s)
    let last = performance.now();
    let hovering = false, holdUntil = 0;
    let pid = null, startX = 0, startPos = 0, moved = false, samples = [];

    function reduceMotionPref() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
    const apply = () => {
      x = ((x % W) + W) % W;
      track.style.setProperty("transform", "translate3d(" + -x + "px,0,0)", "important");
    };
    const hold = () => { holdUntil = performance.now() + RESUME_DELAY; };

    const frame = (now) => {
      const dt = Math.min(now - last, 100) / 1000;
      last = now;
      if (pid === null) {
        if (Math.abs(vel) > 8) {                // momentum after a flick
          x += vel * dt;
          vel *= Math.exp(-dt * 3.2);
          hold();
        } else {
          vel = 0;
          const paused = hovering || now < holdUntil ||
            document.body.classList.contains("cert-open") || document.hidden;
          if (!paused) x += SPEED * dt;
        }
        apply();
      }
      requestAnimationFrame(frame);
    };

    // touch / mouse / pen drag
    box.addEventListener("pointerdown", (e) => {
      if (pid !== null || (e.pointerType === "mouse" && e.button !== 0)) return;
      pid = e.pointerId; moved = false; vel = 0;
      startX = e.clientX; startPos = x;
      samples = [{ t: performance.now(), x: e.clientX }];
    });
    box.addEventListener("pointermove", (e) => {
      if (e.pointerId !== pid) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) {
        moved = true;
        box.classList.add("is-dragging");
        try { box.setPointerCapture(pid); } catch (_) {}
      }
      if (!moved) return;
      x = startPos - dx; apply();
      const t = performance.now();
      samples.push({ t, x: e.clientX });
      while (samples.length > 2 && t - samples[0].t > 100) samples.shift();
    });
    const endDrag = (e) => {
      if (e.pointerId !== pid) return;
      if (moved && e.type === "pointerup" && samples.length > 1) {
        const a = samples[0], b = samples[samples.length - 1];
        const dt = (b.t - a.t) / 1000;
        if (dt > 0 && performance.now() - b.t < 80) vel = -(b.x - a.x) / dt;
        vel = Math.max(-2500, Math.min(2500, vel));
      }
      try { box.releasePointerCapture(pid); } catch (_) {}
      pid = null;
      box.classList.remove("is-dragging");
      hold();
    };
    box.addEventListener("pointerup", endDrag);
    box.addEventListener("pointercancel", endDrag);
    box.addEventListener("dragstart", (e) => e.preventDefault());

    // a drag must not count as a click (so it doesn't open the certificate pop-up)
    box.addEventListener("click", (e) => {
      if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; }
    }, true);

    // trackpad / horizontal wheel / Shift + wheel (plain vertical wheel still scrolls the page)
    box.addEventListener("wheel", (e) => {
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (!horizontal && !e.shiftKey) return;
      e.preventDefault();
      x += horizontal ? e.deltaX : e.deltaY;
      vel = 0; apply(); hold();
    }, { passive: false });

    // pause while a real mouse hovers the strip
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      box.addEventListener("mouseenter", () => { hovering = true; });
      box.addEventListener("mouseleave", () => { hovering = false; });
    }

    // keyboard focus on a card must not shift the box natively
    box.addEventListener("scroll", () => { if (box.scrollLeft) box.scrollLeft = 0; }, { passive: true });
    box.addEventListener("focusin", hold);

    window.addEventListener("resize", () => { W = setW(); apply(); });
    apply();
    requestAnimationFrame((t) => { last = t; frame(t); });
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
