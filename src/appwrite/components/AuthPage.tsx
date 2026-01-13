import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { appwriteConfigured } from "../index";
import { useAuthContext } from "../auth/AuthContext";
import { useI18n } from "../../translations";
import "../styles/auth.css";

type AuthPageProps = {
  mode: "login" | "register";
};

export default function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const {
    authReady,
    authMode,
    setAuthMode,
    authBusy,
    authError,
    setAuthError,
    showPassword,
    setShowPassword,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    handleAuthSubmit,
  } = useAuthContext();

  useEffect(() => {
    setAuthMode(mode);
  }, [mode, setAuthMode]);

  if (!appwriteConfigured) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">{t("auth.notConfigured.title")}</h1>
          <p className="auth-note">
            {t("auth.notConfigured.note")}
          </p>
        </div>
      </div>
    );
  }

  if (!authReady) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">{t("auth.loadingSession")}</h1>
        </div>
      </div>
    );
  }

  const canSubmit = Boolean(email && password && (authMode === "login" || name.trim()));
  const switchRoute = authMode === "login" ? "/register" : "/login";

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleAuthSubmit}>
        <h1 className="auth-title">
          {authMode === "login" ? t("auth.signIn") : t("auth.createAccount")}
        </h1>
        {authMode === "register" ? (
          <label className="auth-row">
            <span>{t("auth.name")}</span>
            <input
              className="auth-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </label>
        ) : null}
        <label className="auth-row">
          <span>{t("auth.email")}</span>
          <input
            className="auth-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
        <label className="auth-row">
          <span>{t("auth.password")}</span>
          <div className="auth-password">
            <input
              className="auth-input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={authMode === "login" ? "current-password" : "new-password"}
            />
            <button
              className="auth-eye"
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
            >
              <svg className="auth-eye-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 5c-5.5 0-9.5 4.2-10.8 6.2a1.5 1.5 0 0 0 0 1.6C2.5 14.8 6.5 19 12 19s9.5-4.2 10.8-6.2a1.5 1.5 0 0 0 0-1.6C21.5 9.2 17.5 5 12 5zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"
                  fill="currentColor"
                />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
                {!showPassword ? (
                  <path d="M4 4l16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                ) : null}
              </svg>
            </button>
          </div>
        </label>
        {authError ? <div className="auth-error">{authError}</div> : null}
        <button className="auth-btn" type="submit" disabled={!canSubmit || authBusy}>
          {authBusy
            ? t("auth.pleaseWait")
            : authMode === "login"
            ? t("auth.signIn")
            : t("auth.register")}
        </button>
        <button
          className="auth-link"
          type="button"
          onClick={() => {
            setAuthError(null);
            navigate(switchRoute);
          }}
          disabled={authBusy}
        >
          {authMode === "login" ? t("auth.needAccount") : t("auth.haveAccount")}
        </button>
      </form>
    </div>
  );
}


