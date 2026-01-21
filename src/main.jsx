
import { Buffer } from 'buffer';
window.Buffer = Buffer;
import React from "react";
import ReactDOM from "react-dom/client"; // Ensure ye line aisi hi ho
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext"; // Auth system ke liye zaroori
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);