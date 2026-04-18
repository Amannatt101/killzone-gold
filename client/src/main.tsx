import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/killzone-v2.css";

if (!window.location.hash) {
  window.location.hash = "#/";
}

createRoot(document.getElementById("root")!).render(<App />);
