import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { GlobalStateProvider } from "./fetchs/GlobalStateContext.tsx";
import { TextSizeProvider } from "./contexts/TextSizeContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GlobalStateProvider>
      <TextSizeProvider>
        <App />
      </TextSizeProvider>
    </GlobalStateProvider>
  </StrictMode>,
);
