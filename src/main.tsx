import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Import cleanup utilities for development (makes them available in console)
if (import.meta.env.DEV) {
  import('./utils/dataCleanup');
}

createRoot(document.getElementById("root")!).render(<App />);
