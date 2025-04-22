import "./App.css";
import React from "react";
import { AuthContextProvider } from "./context/AuthContext";
import { Dashboard } from "./pages/Dashboard";
import Login from "./pages/Login";
import { Routes } from "./routes";

export const App: React.FC = () => {
  return (
    <AuthContextProvider>
      <Routes />
    </AuthContextProvider>
  );
};
