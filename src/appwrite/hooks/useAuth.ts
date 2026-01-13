import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Account, Models } from "appwrite";
import { useNavigate } from "react-router-dom";
import { ID } from "../index";

type AuthMode = "login" | "register";

type UseAuthOptions = {
  account: Account;
  appwriteConfigured: boolean;
};

function getErrorMessage(err: unknown) {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message?: unknown }).message ?? "Unknown error");
  }
  return "Unknown error";
}

export function useAuth({ account, appwriteConfigured }: UseAuthOptions) {
  const navigate = useNavigate();
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!appwriteConfigured) {
      setAuthReady(true);
      return;
    }
    let alive = true;
    account
      .get()
      .then((current) => {
        if (alive) setUser(current);
      })
      .catch(() => {
      })
      .finally(() => {
        if (alive) setAuthReady(true);
      });
    return () => {
      alive = false;
    };
  }, [account, appwriteConfigured]);

  async function handleAuthSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!appwriteConfigured) return;
    setAuthError(null);
    setAuthBusy(true);
    try {
      if (authMode === "register") { // “Регистрация через account.create, вход через createEmailSession, потом беру текущего пользователя
        await account.create(ID.unique(), email, password, name.trim() || undefined);
      }
      await account.createEmailSession(email, password);
      const current = await account.get();
      setUser(current);
      navigate("/dashboard");
    } catch (err) {
      setAuthError(getErrorMessage(err));
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    setAuthError(null);
    setAuthBusy(true);
    try {
      await account.deleteSession("current");
      setUser(null);
      navigate("/login");
    } catch (err) {
      setAuthError(getErrorMessage(err));
    } finally {
      setAuthBusy(false);
    }
  }

  return {
    user,
    setUser,
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
    handleLogout,
  };
}
