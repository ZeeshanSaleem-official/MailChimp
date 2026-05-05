import { Navigate } from "react-router-dom";
export default function Protectedroute({ children, requiredRole }) {
  const role = localStorage.getItem("userRole");
  if (!role || role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
