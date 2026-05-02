import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import Login from "./components/Login.jsx";
import SignUp from "./components/SignUp.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </BrowserRouter>
    <App />
  </StrictMode>,
);
