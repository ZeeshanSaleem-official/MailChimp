import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Users,
  ShieldAlert,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Power,
  Shield,
  Menu,
  X,
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
        setError("Cannot connect to Backend. Ensure your server is running!");
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
      setSuccessMessage(`User status updated to ${newStatus}`);
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
    active: users.filter((u) => u.status === "active").length,
    suspended: users.filter((u) => u.status === "suspended").length,
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl transform transition-all duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <button
          className="absolute top-6 right-4 text-slate-400 hover:bg-slate-800 p-2 rounded-lg md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X size={20} />
        </button>

        <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-800 mt-2 md:mt-0">
          <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-900/50 shrink-0">
            <Shield className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black text-white leading-none">
              Super Admin
            </h1>
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
              Platform Control
            </span>
          </div>
        </div>

        <div className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
          <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-black text-sm bg-rose-600 text-white shadow-lg shadow-rose-900/20 md:translate-x-2 transition-all">
            <Users size={20} /> Tenants & Users
          </button>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-3 text-sm font-bold text-slate-400 hover:text-rose-500 transition-colors w-full p-3 rounded-xl hover:bg-slate-800"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full transition-all duration-300">
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0 z-10 w-full">
          <div className="flex items-center gap-3">
            <button
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={22} />
            </button>

            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest hidden sm:block">
              Tenants & Users
            </h2>
            {loading && (
              <RefreshCw size={14} className="animate-spin text-rose-500" />
            )}
          </div>
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            <ShieldAlert size={16} className="text-rose-600 shrink-0" />
            <span className="text-xs font-bold text-slate-600 hidden sm:block">
              Admin Session
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full bg-slate-50">
          {error && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 text-rose-700 mb-6">
              <AlertCircle size={20} className="shrink-0" />
              <p className="font-medium text-sm md:text-base">{error}</p>
            </div>
          )}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3 text-emerald-700 mb-6">
              <CheckCircle size={20} className="shrink-0" />
              <p className="font-medium text-sm md:text-base">
                {successMessage}
              </p>
            </div>
          )}

          <div className="space-y-6 md:space-y-8 animate-in fade-in">
            {/* STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                icon={<Users className="text-blue-500" />}
                title="Total Users"
                value={stats.total}
              />
              <StatCard
                icon={<CheckCircle className="text-emerald-500" />}
                title="Active Accounts"
                value={stats.active}
              />
              <StatCard
                icon={<XCircle className="text-rose-500" />}
                title="Suspended"
                value={stats.suspended}
              />
            </div>

            {/* USERS TABLE */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="text-rose-600 shrink-0" size={18} />
                  <h3 className="font-bold text-slate-800 text-sm md:text-base">
                    Platform Tenants
                  </h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] md:text-[11px] font-black uppercase tracking-widest border-b border-slate-100">
                      <th className="p-4">ID</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 && !loading && !error && (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-8 text-center text-slate-500 text-sm"
                        >
                          No users found in database.
                        </td>
                      </tr>
                    )}

                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-slate-50 transition-colors hover:bg-slate-50/50"
                      >
                        <td className="p-4 text-slate-400 font-mono text-xs">
                          #{user.id}
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-700 text-sm">
                            {user.email}
                          </p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter border ${user.user === 'admin' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                            {user.user || 'user'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter border ${user.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>
                            {user.status || 'active'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {user.user !== 'admin' && (
                            <button
                              onClick={() => toggleUserStatus(user.id, user.status || "active")}
                              className={`p-2 rounded-lg transition-all text-sm font-bold flex items-center justify-end gap-2 ml-auto ${
                                user.status === "active" || !user.status
                                  ? "text-rose-600 hover:bg-rose-50"
                                  : "text-emerald-600 hover:bg-emerald-50"
                              }`}
                            >
                              <Power size={16} />
                              {user.status === "active" || !user.status ? "Suspend" : "Activate"}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm md:max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8 text-center">
              <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-2">
                End Admin Session?
              </h3>
            </div>
            <div className="p-4 md:p-6 bg-slate-50 flex flex-col-reverse md:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-full md:w-auto px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                disabled={isLoggingOut}
                className="w-full md:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <LogOut size={16} />{" "}
                {isLoggingOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 flex items-center gap-4 w-full shadow-sm">
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest truncate">
          {title}
        </p>
        <p className="text-xl md:text-2xl font-black text-slate-800">{value}</p>
      </div>
    </div>
  );
}
