import React from "react";
import "./app.css";
import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./appwrite/auth/AuthContext";
import { I18nProvider } from "./translations";
import AuthPage from "./appwrite/components/AuthPage";
import ProtectedRoutes from "./pages/ProtectedRoutes";

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </AuthProvider>
    </I18nProvider>
  );
}
