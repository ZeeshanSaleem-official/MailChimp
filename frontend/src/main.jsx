import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Route, BrowserRouter, Routes, Navigate } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import Login from "./components/Login.jsx";
import SignUp from "./components/SignUp.jsx";
import Protectedroute from "./components/ProtectedRoute.jsx";
import UserDashboard from "./components/UserDashboard.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* If someone goes to localhost:5173, send them straight to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public Routes any one can see this */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* 🚨 Admin Only Route */}
        <Route
          path="/admin"
          element={
            <Protectedroute requiredRole="admin">
              <App />
            </Protectedroute>
          }
        />

        {/* 👤 Regular User Route */}
        <Route
          path="/dashboard"
          element={
            <Protectedroute requiredRole="user">
              <UserDashboard />
            </Protectedroute>
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
