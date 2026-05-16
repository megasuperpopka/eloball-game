import { AccountAuth } from "../systems/AccountAuth.js";
import { setOrientationLandscape, setOrientationPortrait } from "../core/AppOrientation.js";

/**
 * Привязка DOM-формы авторизации (#auth-overlay в index.html).
 * @param {{ onSuccess: () => void }} callbacks
 */
export function setupAuthOverlay({ onSuccess }) {
  const root = document.getElementById("auth-overlay");
  if (!root) return { show() {}, hide() {} };

  const tabLogin = root.querySelector('[data-auth-tab="login"]');
  const tabRegister = root.querySelector('[data-auth-tab="register"]');
  const panelLogin = root.querySelector('[data-auth-panel="login"]');
  const panelRegister = root.querySelector('[data-auth-panel="register"]');
  const errLogin = root.querySelector("[data-auth-error-login]");
  const errRegister = root.querySelector("[data-auth-error-register]");
  const formLogin = root.querySelector('[data-auth-form="login"]');
  const formRegister = root.querySelector('[data-auth-form="register"]');
  const loginChangeToggle = root.querySelector("[data-auth-change-toggle]");
  const loginChangeField = root.querySelector("[data-auth-change-field]");

  function clearErrors() {
    if (errLogin) errLogin.textContent = "";
    if (errRegister) errRegister.textContent = "";
  }

  function setTab(tab) {
    clearErrors();
    const isLogin = tab === "login";
    if (tabLogin) tabLogin.classList.toggle("auth-tab--active", isLogin);
    if (tabRegister) tabRegister.classList.toggle("auth-tab--active", !isLogin);
    if (panelLogin) panelLogin.hidden = !isLogin;
    if (panelRegister) panelRegister.hidden = isLogin;
  }

  if (tabLogin) tabLogin.addEventListener("click", () => setTab("login"));
  if (tabRegister) tabRegister.addEventListener("click", () => setTab("register"));

  function syncRenameVisibility() {
    if (!loginChangeField) return;
    const on = Boolean(loginChangeToggle?.checked);
    loginChangeField.hidden = !on;
  }

  if (loginChangeToggle) {
    loginChangeToggle.addEventListener("change", syncRenameVisibility);
  }

  if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearErrors();
      const fd = new FormData(formLogin);
      const login = String(fd.get("login") || "");
      const password = String(fd.get("password") || "");
      const changeNickname = fd.get("changeNickname") === "on";
      const newNickname = String(fd.get("newNickname") || "");
      const result = await AccountAuth.login(login, password, { changeNickname, newNickname });
      if (!result.ok) {
        if (errLogin) errLogin.textContent = result.message || "Ошибка входа.";
        return;
      }
      hide();
      await setOrientationLandscape();
      onSuccess();
    });
  }

  if (formRegister) {
    formRegister.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearErrors();
      const fd = new FormData(formRegister);
      const username = String(fd.get("username") || "");
      const password = String(fd.get("password") || "");
      const password2 = String(fd.get("password2") || "");
      const email = String(fd.get("email") || "");
      if (password !== password2) {
        if (errRegister) errRegister.textContent = "Пароли не совпадают.";
        return;
      }
      const result = await AccountAuth.register(username, password, email);
      if (!result.ok) {
        if (errRegister) errRegister.textContent = result.message || "Не удалось зарегистрироваться.";
        return;
      }
      hide();
      await setOrientationLandscape();
      onSuccess();
    });
  }

  function show() {
    void setOrientationPortrait();
    clearErrors();
    setTab("login");
    if (formLogin) formLogin.reset();
    syncRenameVisibility();
    root.classList.add("auth-overlay--visible");
    root.setAttribute("aria-hidden", "false");
    document.body.classList.add("auth-locked");
    const first = panelLogin && !panelLogin.hidden ? formLogin?.querySelector("input") : formRegister?.querySelector("input");
    if (first && typeof first.focus === "function") first.focus();
  }

  function hide() {
    root.classList.remove("auth-overlay--visible");
    root.setAttribute("aria-hidden", "true");
    document.body.classList.remove("auth-locked");
  }

  if (AccountAuth.isLoggedIn()) {
    hide();
  } else {
    show();
  }

  return { show, hide };
}
