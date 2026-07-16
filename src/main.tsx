// The audio engine (AudioWorklet) only exists in secure contexts; upgrade
// plain-http visits (e.g. a typed URL on a phone) before rendering anything.
if (
  location.protocol === "http:" &&
  !["localhost", "127.0.0.1"].includes(location.hostname)
) {
  location.replace(`https://${location.host}${location.pathname}${location.search}`);
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
