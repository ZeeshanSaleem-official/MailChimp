import { Navigate } from "react-router-dom";
export default function Protectedroute({ children, allowedRoles }) {
  const role = localStorage.getItem("userRole");
  if (!role || !allowedRoles.include(role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
