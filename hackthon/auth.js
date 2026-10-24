/* =========================================================
   SkillBridge AI — Sakura Neon Auth UI
   Real API calls to /api/login and /api/signup + canvas petals
   ========================================================= */
"use strict";

(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Tabs
  const tabs = Array.from(document.querySelectorAll(".form-tab"));
  const forms = Array.from(document.querySelectorAll(".auth-form"));
  const heading = document.getElementById("formHeading");
  const subheading = document.getElementById("formSubheading");
  const statusEl = document.getElementById("formStatus");

  const copy = {
    login: {
      heading: "Welcome back",
      subheading: "Enter your credentials to pick up your Sakura roadmap."
    },
    signup: {
      heading: "Begin your bloom",
      subheading: "Create an account to save your roadmap and track every milestone."
    }
  };

  function setMode(mode) {
    tabs.forEach((tab) => {
      const active = tab.dataset.tab === mode;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    forms.forEach((form) => form.classList.toggle("is-active", form.dataset.mode === mode));
    if (heading && copy[mode]) heading.textContent = copy[mode].heading;
    if (subheading && copy[mode]) subheading.textContent = copy[mode].subheading;
    if (statusEl) {
      statusEl.textContent = "";
      statusEl.className = "form-status";
    }
    clearErrors();
  }

  tabs.forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.tab)));

  // URL mode
  const params = new URLSearchParams(location.search);
  const mode = params.get("mode");
  if (mode === "signup" || mode === "login") setMode(mode);

  // Demo login
  const demoBtn = document.getElementById("demoLoginBtn");
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  const loginRemember = document.querySelector('#loginForm [name="remember"]');
  if (demoBtn) {
    demoBtn.addEventListener("click", () => {
      if (loginEmail) loginEmail.value = "demo@skillbridge.ai";
      if (loginPassword) loginPassword.value = "Sakura2026!";
      if (loginRemember) loginRemember.checked = true;
      setMode("login");
      if (statusEl) {
        statusEl.textContent = "Demo credentials filled. Press Sign in to continue.";
        statusEl.className = "form-status";
      }
      window.scrollTo({ top: 0, behavior: prefersReduced.matches ? "auto" : "smooth" });
    });
  }

  // Errors
  function clearErrors() {
    document.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
    document.querySelectorAll(".input-shell input").forEach((input) => {
      input.classList.remove("is-invalid", "is-valid");
    });
  }

  function setError(id, message) {
    const error = document.querySelector(`[data-error-for="${id}"]`);
    if (error) error.textContent = message;
    const input = document.getElementById(id);
    if (input) {
      input.classList.add("is-invalid");
      input.classList.remove("is-valid");
    }
  }

  function setValid(id) {
    const input = document.getElementById(id);
    if (input) {
      input.classList.add("is-valid");
      input.classList.remove("is-invalid");
    }
  }

  function setStatus(message, type = "") {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `form-status${type ? ` is-${type}` : ""}`;
  }

  async function postJSON(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin"
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { res, data };
  }

  // Login
  const loginForm = document.getElementById("loginForm");
  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();
    setStatus("");

    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    const remember = loginRemember?.checked ?? true;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) setError("loginEmail", "Enter a valid email address.");
    if (password.length < 1) setError("loginPassword", "Enter your password.");
    if (document.querySelector("#loginForm .is-invalid")) return;

    const btn = loginForm.querySelector(".submit-btn");
    btn?.classList.add("is-loading");
    btn?.setAttribute("disabled", "true");

    try {
      const { res, data } = await postJSON("/api/login", { email, password, remember });
      if (!res.ok || !data?.ok) {
        setStatus(data?.message || "Sign in failed. Try again.", "error");
        if (data?.code === "INVALID_CREDENTIALS") {
          setError("loginPassword", "Email or password is incorrect.");
        }
        return;
      }
      setStatus(data.message || "Signed in successfully.", "success");
      setTimeout(() => {
        window.location.href = "index.html#dashboard";
      }, 650);
    } catch {
      setStatus("Network error. Check the server and try again.", "error");
    } finally {
      btn?.classList.remove("is-loading");
      btn?.removeAttribute("disabled");
    }
  });

  // Signup
  const signupForm = document.getElementById("signupForm");
  const signupName = document.getElementById("signupName");
  const signupEmail = document.getElementById("signupEmail");
  const signupPassword = document.getElementById("signupPassword");
  const signupTerms = document.querySelector('#signupForm [name="terms"]');

  signupForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();
    setStatus("");

    const name = signupName.value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value;
    const terms = signupTerms?.checked;

    if (name.length < 2) setError("signupName", "Use at least 2 characters.");
    else setValid("signupName");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) setError("signupEmail", "Enter a valid email address.");
    else setValid("signupEmail");

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError("signupPassword", "Use at least 8 characters, including a letter and a number.");
    } else setValid("signupPassword");

    if (!terms) setError("terms", "Please accept the demo terms to continue.");
    if (document.querySelector("#signupForm .is-invalid")) return;

    const btn = signupForm.querySelector(".submit-btn");
    btn?.classList.add("is-loading");
    btn?.setAttribute("disabled", "true");

    try {
      const { res, data } = await postJSON("/api/signup", { name, email, password, acceptTerms: true });
      if (!res.ok || !data?.ok) {
        setStatus(data?.message || "Sign up failed. Try again.", "error");
        if (data?.field) setError(data.field === "terms" ? "terms" : `signup${data.field[0].toUpperCase()}${data.field.slice(1)}`, data.message);
        return;
      }
      setStatus(data.message || "Account created. Welcome aboard.", "success");
      setTimeout(() => {
        window.location.href = "index.html#dashboard";
      }, 700);
    } catch {
      setStatus("Network error. Check the server and try again.", "error");
    } finally {
      btn?.classList.remove("is-loading");
      btn?.removeAttribute("disabled");
    }
  });

  // Real-time validation hints
  signupPassword?.addEventListener("input", () => {
    const value = signupPassword.value;
    if (value.length === 0) {
      signupPassword.classList.remove("is-invalid", "is-valid");
      return;
    }
    if (value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value)) {
      setValid("signupPassword");
      const err = document.querySelector('[data-error-for="signupPassword"]');
      if (err) err.textContent = "";
    }
  });

  // Sakura petal canvas - gentle, curved drift behind form
  const canvas = document.getElementById("sakura-canvas");
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx || prefersReduced.matches) return;

  const petals = [];
  const petalCount = window.innerWidth < 720 ? 28 : 42;

  function resize() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  class Petal {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * window.innerWidth;
      this.y = initial ? Math.random() * window.innerHeight : -30 - Math.random() * 120;
      this.w = 8 + Math.random() * 10;
      this.h = 5 + Math.random() * 7;
      this.vxBase = -0.4 + Math.random() * 0.8;
      this.vy = 0.35 + Math.random() * 0.7;
      this.va = -0.008 + Math.random() * 0.016;
      this.angle = Math.random() * Math.PI * 2;
      this.opacity = 0.16 + Math.random() * 0.22;
      this.t = Math.random() * Math.PI * 2;
      this.tSpeed = 0.008 + Math.random() * 0.012;
      this.drift = 10 + Math.random() * 16;
    }

    update() {
      this.t += this.tSpeed;
      this.x += this.vxBase + Math.sin(this.t) * (this.drift / 120);
      this.y += this.vy + Math.cos(this.t * 0.7) * 0.12;
      this.angle += this.va;
      if (this.y > window.innerHeight + 40 || this.x < -60 || this.x > window.innerWidth + 60) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.globalAlpha = this.opacity;
      const gradient = ctx.createLinearGradient(-this.w / 2, 0, this.w / 2, this.h);
      gradient.addColorStop(0, "rgba(249, 168, 212, 0.95)");
      gradient.addColorStop(1, "rgba(192, 132, 252, 0.75)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(this.w / 2, -this.h / 2, 0, -this.h);
      ctx.quadraticCurveTo(-this.w / 2, -this.h / 2, 0, 0);
      ctx.fill();
      ctx.restore();
    }
  }

  function init() {
    resize();
    petals.length = 0;
    for (let i = 0; i < petalCount; i++) petals.push(new Petal());
    requestAnimationFrame(loop);
  }

  function loop() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (let i = 0; i < petals.length; i++) {
      const petal = petals[i];
      petal.update();
      petal.draw();
    }
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize, { passive: true });
  init();
})();
