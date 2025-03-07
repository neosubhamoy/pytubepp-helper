import React from "react";
import "@/index.css";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "@/App";
import HomePage from "@/pages/home";
import SettingsPage from "@/pages/settings";
import NotificationsPage from "@/pages/notifications";
import ExtensionManagerPage from "@/pages/extension-manager";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/extension-manager" element={<ExtensionManagerPage />} />
        </Routes>
      </BrowserRouter>
    </App>
  </React.StrictMode>,
);
