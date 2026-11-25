/* SK airplus homepage interactions. Vanilla JS, no network requests (works from file://). */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- header: solid after hero, hide on scroll down ---------- */
  var hd = $("[data-header]");
  var hasHero = !!$(".hero");  /* sub pages: subhero sits below a solid header (SKMR) */
  if (!hasHero) document.body.classList.add("no-hero");
  var lastY = 0;
  var bar = document.createElement("div");
  bar.className = "progress-bar";
  document.body.appendChild(bar);
  var top = document.createElement("button");
  top.className = "to-top"; top.type = "button"; top.setAttribute("aria-label", "맨 위로");
  top.textContent = "↑";
  top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });
  document.body.appendChild(top);

  function onScroll() {
    var y = window.scrollY;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    if (hd) {
      hd.classList.toggle("is-solid", y > 40);
      var menuOpen = document.body.classList.contains("menu-open");
      hd.classList.toggle("is-hidden", !menuOpen && y > 400 && y > lastY + 4);
      if (y < lastY - 4) hd.classList.remove("is-hidden");
    }
    top.classList.toggle("is-on", y > 800);
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- desktop menu: a mouse click must not leave a panel pinned open ---------- */
  $$(".gnb a").forEach(function (a) {
    a.addEventListener("click", function () { a.blur(); });
  });
  document.addEventListener("keydown", function (e) {
    var el = document.activeElement;
    if (e.key === "Escape" && el && el.closest && el.closest(".gnb__panel")) el.closest(".gnb__item").querySelector(".gnb__link").focus();
  });

  /* ---------- mobile menu ---------- */
  var burger = $(".burger"), mnav = $("#mnav");
  if (burger && mnav) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") !== "true";
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "전체 메뉴 닫기" : "전체 메뉴 열기");
      mnav.hidden = !open;
      document.body.classList.toggle("menu-open", open);
      if (hd) hd.classList.add("is-solid");
      /* desktop: the burger opens a full sitemap with every group expanded */
      if (open && window.innerWidth > 1200) $$("details", mnav).forEach(function (d) { d.open = true; });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") { burger.click(); burger.focus(); }
    });
  }

  /* ---------- reveal on scroll (+ stagger groups) ---------- */
  $$("[data-stagger]").forEach(function (g) {
    var step = parseFloat(g.getAttribute("data-stagger")) || 0.08;
    $$("[data-reveal]", g).forEach(function (el, i) { el.style.setProperty("--d", (i * step).toFixed(2) + "s"); });
  });
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      if (e.target.hasAttribute("data-count")) countUp(e.target);
      if (e.target.hasAttribute("data-bar")) fillBar(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }) : null;
  $$("[data-reveal], .mask-reveal, .split-line, [data-count], [data-bar], .is-split").forEach(function (el) {
    if (io && !reduce) io.observe(el); else { el.classList.add("is-in"); if (el.hasAttribute("data-count")) el.textContent = fmt(el); if (el.hasAttribute("data-bar")) fillBar(el); }
  });

  /* ---------- counters ---------- */
  function fmt(el, v) {
    var target = parseFloat(el.getAttribute("data-count"));
    var dec = parseInt(el.getAttribute("data-dec") || "0", 10);
    var val = v === undefined ? target : v;
    return (el.getAttribute("data-prefix") || "") + val.toFixed(dec);
  }
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var from = parseFloat(el.getAttribute("data-from") || "0");
    var dur = 1600, t0 = null;
    function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(el, from + (target - from) * e);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- air composition bar ---------- */
  function fillBar(el) {
    $$("[data-w]", el).forEach(function (seg, i) {
      setTimeout(function () { seg.style.width = seg.getAttribute("data-w"); }, reduce ? 0 : i * 220);
    });
  }

  /* ---------- tabs ---------- */
  $$("[data-tabs]").forEach(function (root) {
    var btns = $$('[role="tab"]', root);
    function select(btn, focus) {
      btns.forEach(function (b) {
        var on = b === btn;
        b.setAttribute("aria-selected", String(on));
        b.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(b.getAttribute("aria-controls"));
        if (!panel) return;
        panel.hidden = !on;
        if (on) { panel.classList.remove("is-enter"); void panel.offsetWidth; panel.classList.add("is-enter"); }
      });
      if (focus) btn.focus();
    }
    btns.forEach(function (b, i) {
      b.addEventListener("click", function () { select(b); });
      b.addEventListener("keydown", function (e) {
        var k = e.key, n = null;
        if (k === "ArrowRight") n = btns[(i + 1) % btns.length];
        if (k === "ArrowLeft") n = btns[(i - 1 + btns.length) % btns.length];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  });

  /* ---------- horizontal drag scroller ---------- */
  $$("[data-hscroll]").forEach(function (sc) {
    var down = false, sx = 0, sl = 0, moved = false;
    sc.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") return;
      down = true; moved = false; sx = e.clientX; sl = sc.scrollLeft;
    });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 4) { moved = true; sc.classList.add("is-drag"); }
      sc.scrollLeft = sl - dx;
    });
    window.addEventListener("pointerup", function () { down = false; sc.classList.remove("is-drag"); });
    sc.addEventListener("click", function (e) { if (moved) { e.preventDefault(); moved = false; } }, true);
    var id = sc.id;
    $$('[data-hs-target="' + id + '"]').forEach(function (btn) {
      btn.addEventListener("click", function () {
        var dir = btn.getAttribute("data-dir") === "prev" ? -1 : 1;
        sc.scrollBy({ left: dir * sc.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
      });
    });
  });

  /* ---------- tilt cards ---------- */
  if (!reduce && window.matchMedia("(hover: hover)").matches) {
    $$("[data-tilt]").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(900px) rotateX(" + (-y * 7).toFixed(2) + "deg) rotateY(" + (x * 9).toFixed(2) + "deg) translateY(-6px)";
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
  }

  /* ---------- parallax ---------- */
  var px = $$("[data-parallax]");
  function parallax() {
    var vh = window.innerHeight;
    px.forEach(function (el) {
      // measure the frame, not the moving image, and never move further than the image's overscan
      var box = el.parentElement, r = box.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var speed = parseFloat(el.getAttribute("data-parallax")) || 0.15;
      var room = Math.max(0, (el.offsetHeight - box.clientHeight) / 2);
      var mid = r.top + r.height / 2 - vh / 2;
      var y = Math.max(-room, Math.min(room, -mid * speed));
      el.style.transform = "translate3d(0," + y.toFixed(1) + "px,0)";
    });
  }
  if (px.length && !reduce) { window.addEventListener("scroll", function () { requestAnimationFrame(parallax); }, { passive: true }); parallax(); }

  /* ---------- sticky process steps ---------- */
  $$("[data-process]").forEach(function (root) {
    var steps = $$(".step", root);
    var img = $(".process__visual img", root);
    var no = $("[data-process-no]", root);
    var label = $("[data-process-label]", root);
    var prog = $(".process__progress", root);
    var cur = -1;
    function set(i) {
      if (i === cur) return;
      cur = i;
      steps.forEach(function (s, k) { s.classList.toggle("is-current", k === i); });
      var s = steps[i];
      if (no) no.textContent = String(i + 1).padStart(2, "0");
      if (label) label.textContent = s.getAttribute("data-label");
      if (prog) prog.style.width = ((i + 1) / steps.length) * 100 + "%";
      if (img) {
        var z = s.getAttribute("data-zoom") || "1";
        var o = s.getAttribute("data-origin") || "50% 50%";
        img.style.transformOrigin = o;
        img.style.transform = "scale(" + z + ")";
      }
    }
    function check() {
      var mid = window.innerHeight * 0.5, best = 0, bestD = Infinity;
      steps.forEach(function (s, k) {
        var r = s.getBoundingClientRect();
        var d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestD) { bestD = d; best = k; }
      });
      set(best);
    }
    window.addEventListener("scroll", function () { requestAnimationFrame(check); }, { passive: true });
    check();
  });

  /* ---------- timeline fill ---------- */
  $$(".timeline").forEach(function (tl) {
    var fill = $(".timeline__fill", tl);
    if (!fill) return;
    function upd() {
      var r = tl.getBoundingClientRect();
      var p = Math.min(Math.max((window.innerHeight * 0.6 - r.top) / r.height, 0), 1);
      fill.style.height = (p * (r.height - 16)) + "px";
    }
    window.addEventListener("scroll", function () { requestAnimationFrame(upd); }, { passive: true });
    upd();
  });

  /* ---------- hero split text ---------- */
  var hero = $(".hero");
  if (hero) requestAnimationFrame(function () { setTimeout(function () { hero.classList.add("is-in"); }, 120); });

  /* ---------- hero air particles (N2 78 : O2 21 : Ar 1) ---------- */
  var cv = $(".hero__canvas");
  if (cv && cv.getContext) {
    var ctx = cv.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, parts = [], mx = 0, my = 0, tmx = 0, tmy = 0, running = true;
    var GAS = [
      { n: 78, c: ["#2B3440", "#0E1217"], rim: "rgba(160,190,230,.55)", r: [10, 18] },
      { n: 21, c: ["#FFFFFF", "#AEB6C0"], rim: "rgba(255,255,255,.8)", r: [11, 19] },
      { n: 1, c: ["#3DB17A", "#155238"], rim: "rgba(150,255,200,.7)", r: [12, 20] }
    ];
    function resize() {
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed() {
      parts = [];
      var total = W < 700 ? 60 : 110;
      GAS.forEach(function (g, gi) {
        var count = Math.max(gi === 2 ? 2 : 1, Math.round(total * g.n / 100));
        for (var i = 0; i < count; i++) {
          var z = Math.random();
          parts.push({
            g: g, x: Math.random() * W, y: Math.random() * H, z: z,
            r: (g.r[0] + Math.random() * (g.r[1] - g.r[0])) * (0.35 + z * 0.9),
            vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.2 - 0.05,
            a: Math.random() * Math.PI * 2, va: (Math.random() - 0.5) * 0.01,
            pair: gi < 2
          });
        }
      });
      parts.sort(function (a, b) { return a.z - b.z; });
    }
    function sphere(x, y, r, p) {
      var g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
      g.addColorStop(0, p.g.c[0]); g.addColorStop(1, p.g.c[1]);
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = Math.max(0.6, r * 0.06); ctx.strokeStyle = p.g.rim; ctx.stroke();
    }
    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (!reduce) { p.x += p.vx * (0.4 + p.z); p.y += p.vy * (0.4 + p.z); p.a += p.va; }
        var m = 40 * p.z;
        if (p.x < -60) p.x = W + 60; if (p.x > W + 60) p.x = -60;
        if (p.y < -60) p.y = H + 60; if (p.y > H + 60) p.y = -60;
        var x = p.x + mx * m, y = p.y + my * m;
        ctx.globalAlpha = 0.25 + p.z * 0.75;
        if (p.pair) {
          var dx = Math.cos(p.a) * p.r * 0.62, dy = Math.sin(p.a) * p.r * 0.62;
          sphere(x - dx, y - dy, p.r * 0.78, p);
          sphere(x + dx, y + dy, p.r * 0.78, p);
        } else {
          sphere(x, y, p.r, p);
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }
    resize(); seed();
    window.addEventListener("resize", function () { resize(); seed(); });
    window.addEventListener("pointermove", function (e) { tmx = e.clientX / window.innerWidth - 0.5; tmy = e.clientY / window.innerHeight - 0.5; });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        var vis = es[0].isIntersecting;
        if (vis && !running) { running = true; requestAnimationFrame(frame); }
        if (!vis) running = false;
      }).observe(cv);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- contact form (no server: compose mail draft) ---------- */
  var form = $("[data-contact]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = $(".form__msg", form);
      if (!form.checkValidity()) { form.reportValidity(); return; }
      msg.hidden = false;
      msg.textContent = "문의 내용이 확인되었습니다. 실제 접수 창구(메일 주소)는 운영 시 연결됩니다.";
    });
  }

  /* ---------- dropdowns (location bar, family site): one open at a time, close on outside click ---------- */
  var dds = $$(".loc__dd, .family");
  dds.forEach(function (d) {
    d.addEventListener("toggle", function () { if (d.open) dds.forEach(function (o) { if (o !== d) o.open = false; }); });
  });
  document.addEventListener("click", function (e) {
    dds.forEach(function (d) { if (d.open && !d.contains(e.target)) d.open = false; });
  });

  /* ---------- pinned section progress (supply on home) ---------- */
  $$("[data-pin]").forEach(function (root) {
    var bar = $(".pin__bar i", root);
    if (!bar) return;
    function upd() {
      var r = root.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / (r.height - vh * 0.4)));
      bar.style.width = (p * 100).toFixed(1) + "%";
    }
    window.addEventListener("scroll", function () { requestAnimationFrame(upd); }, { passive: true });
    upd();
  });
})();
