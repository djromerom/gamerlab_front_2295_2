import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { TextSizeProvider } from "./contexts/TextSizeContext.tsx";
import { GlobalStateProvider } from "./fetchs/grupo 1/GlobalStateContext.tsx";
import "./index.css";
import { initializePwaInstallPrompt, registerServiceWorker } from "./lib/pwa";

initializePwaInstallPrompt();
registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GlobalStateProvider>
      <TextSizeProvider>
        <App />
      </TextSizeProvider>
    </GlobalStateProvider>
  </StrictMode>,
);
