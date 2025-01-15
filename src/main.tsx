import { ensureProcessExists } from './lib/polyfills'
// Ensure polyfill is loaded and not tree-shaken
ensureProcessExists();

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "@/components/ThemeProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="study-room-theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
