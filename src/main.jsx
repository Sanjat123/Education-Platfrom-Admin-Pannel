// src/main.jsx
import { Buffer } from 'buffer';
window.Buffer = Buffer;
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { FacultyProvider } from "./context/FacultyContext";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FacultyProvider>
          <App />
        </FacultyProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);