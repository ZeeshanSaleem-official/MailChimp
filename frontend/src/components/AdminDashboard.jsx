import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Users,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Power,
  Menu,
  X,
  LayoutDashboard
} from "lucide-react";
import apiClient from "../api/axios";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get("/api/admin/users");
      setUsers(response.data || []);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Admin session expired or unauthorized. Please log in again.");
      } else {
        setError("Cannot connect to server. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      await apiClient.put("/api/admin/users/status", {
        user_id: userId,
        status: newStatus,
      });
      fetchUsers();
      setSuccessMessage(`User status changed to ${newStatus}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to update status:", err);
      setError("Failed to update user status.");
    }
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await apiClient.post("/api/logout");
      localStorage.removeItem("userRole");
      navigate("/login");
    } catch (error) {
      localStorage.removeItem("userRole");
      navigate("/login");
    }
  };

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active" || !u.status).length,
    suspended: users.filter((u) => u.status === "suspended").length,
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <LayoutDashboard className="text-white" size={18} />
            </div>
            <span className="text-lg font-semibold tracking-tight">Admin</span>
          </div>
          <button
            className="text-gray-400 hover:text-gray-600 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium bg-gray-100 text-gray-900">
            <Users size={18} className="text-gray-500" /> Users
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
          >
            <LogOut size={18} className="text-gray-400" /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 px-4 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              className="text-gray-500 hover:text-gray-700 md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-medium text-gray-800 hidden sm:block">
              Users Management
            </h2>
            {loading && (
              <RefreshCw size={16} className="animate-spin text-gray-400" />
            )}
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-md">
              Admin Session
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* ALERTS */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md flex items-center gap-3 text-red-700">
                <AlertCircle size={20} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
            {successMessage && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-md flex items-center gap-3 text-green-700">
                <CheckCircle size={20} />
                <p className="text-sm font-medium">{successMessage}</p>
              </div>
            )}

            {/* STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Total Users" value={stats.total} />
              <StatCard title="Active Accounts" value={stats.active} />
              <StatCard title="Suspended" value={stats.suspended} />
            </div>

            {/* USERS TABLE */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-base font-medium text-gray-900">
                  Users
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {users.length === 0 && !loading && !error && (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-6 py-8 text-center text-gray-500 text-sm"
                        >
                          No users found in database.
                        </td>
                      </tr>
                    )}

                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {user.id}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.user === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {user.user || "user"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.status === "active" || !user.status
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.status || "active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {user.user !== "admin" && (
                            <button
                              onClick={() =>
                                toggleUserStatus(user.id, user.status || "active")
                              }
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-colors ${
                                user.status === "active" || !user.status
                                  ? "border-gray-300 text-red-600 hover:bg-red-50"
                                  : "border-gray-300 text-green-600 hover:bg-green-50"
                              }`}
                            >
                              <Power size={14} />
                              {user.status === "active" || !user.status
                                ? "Suspend"
                                : "Activate"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-5">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sign Out
              </h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to sign out of the admin panel?
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {isLoggingOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white px-6 py-5 rounded-lg border border-gray-200 shadow-sm">
      <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}
