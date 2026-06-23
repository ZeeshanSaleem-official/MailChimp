import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Users,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Power,
  Menu,
  X,
  LayoutDashboard,
  Activity,
  Server,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";
import apiClient from "../api/axios";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("users"); // "users" or "health"

  const [users, setUsers] = useState([]);
  const [globalStats, setGlobalStats] = useState({
    total_users: 0,
    global_queue: 0,
    total_sent: 0,
    total_failures: 0
  });
  const [globalLogs, setGlobalLogs] = useState([]);

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
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalStats = async () => {
    try {
      const [statsRes, logsRes] = await Promise.all([
        apiClient.get("/api/admin/stats"),
        apiClient.get("/api/admin/logs")
      ]);
      setGlobalStats(statsRes.data || { total_users: 0, global_queue: 0, total_sent: 0, total_failures: 0 });
      setGlobalLogs(logsRes.data || []);
      setError(null);
    } catch (err) {
      console.error("Fetch stats error:", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      setError("Admin session expired or unauthorized. Please log in again.");
    } else {
      setError("Cannot connect to server. Please check your connection.");
    }
  };

  const fetchData = () => {
    setLoading(true);
    if (activeTab === "users") {
      fetchUsers();
    } else {
      fetchGlobalStats();
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (activeTab === "users") fetchUsers();
      else fetchGlobalStats();
    }, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

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

  const toggleUserRole = async (userId, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await apiClient.put("/api/admin/users/role", {
        user_id: userId,
        role: newRole,
      });
      fetchUsers();
      setSuccessMessage(`User promoted to ${newRole}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to update role:", err);
      setError("Failed to update user role.");
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

  const localStats = {
    total: users.length,
    active: users.filter((u) => u.status === "active" || !u.status).length,
    suspended: users.filter((u) => u.status === "suspended").length,
  };

  // Group globalLogs by sender
  const [expandedSenders, setExpandedSenders] = useState({});

  const toggleSender = (senderEmail) => {
    setExpandedSenders((prev) => ({
      ...prev,
      [senderEmail]: !prev[senderEmail]
    }));
  };

  const groupedLogs = globalLogs.reduce((acc, log) => {
    if (!acc[log.sender_email]) {
      acc[log.sender_email] = [];
    }
    acc[log.sender_email].push(log);
    return acc;
  }, {});

  const senders = Object.keys(groupedLogs);

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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
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

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <button
            onClick={() => { setActiveTab("users"); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === "users" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
          >
            <Users size={18} className={activeTab === "users" ? "text-gray-500" : "text-gray-400"} /> Users
          </button>
          <button
            onClick={() => { setActiveTab("health"); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === "health" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
          >
            <Activity size={18} className={activeTab === "health" ? "text-blue-500" : "text-gray-400"} /> System Health
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
              {activeTab === "users" ? "Users Management" : "Global Platform Health"}
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

            {/* USERS TAB CONTENT */}
            {activeTab === "users" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard title="Total Users" value={localStats.total} />
                  <StatCard title="Active Accounts" value={localStats.active} />
                  <StatCard title="Suspended" value={localStats.suspended} />
                </div>

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
                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500 text-sm">
                              No users found in database.
                            </td>
                          </tr>
                        )}
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{user.id}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.user === "admin" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}`}>
                                {user.user || "user"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === "active" || !user.status ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                {user.status || "active"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                              {user.user !== "admin" && (
                                <>
                                  <button
                                    onClick={() => toggleUserRole(user.id, user.user || "user")}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-blue-600 hover:bg-blue-50 transition-colors"
                                  >
                                    <ShieldCheck size={14} />
                                    Make Admin
                                  </button>
                                  <button
                                    onClick={() => toggleUserStatus(user.id, user.status || "active")}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-colors ${user.status === "active" || !user.status ? "border-gray-300 text-red-600 hover:bg-red-50" : "border-gray-300 text-green-600 hover:bg-green-50"}`}
                                  >
                                    <Power size={14} />
                                    {user.status === "active" || !user.status ? "Suspend" : "Activate"}
                                  </button>
                                </>
                              )}
                              {user.user === "admin" && (
                                <button
                                  onClick={() => toggleUserRole(user.id, "admin")}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-orange-600 hover:bg-orange-50 transition-colors"
                                >
                                  <ShieldAlert size={14} />
                                  Revoke Admin
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* SYSTEM HEALTH TAB CONTENT */}
            {activeTab === "health" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Total Platform Users" value={globalStats.total_users} icon={<Users size={20} className="text-blue-500" />} />
                  <StatCard title="Emails Globally Sent" value={globalStats.total_sent} icon={<CheckCircle size={20} className="text-green-500" />} />
                  <StatCard title="Global Queue Size" value={globalStats.global_queue} icon={<Server size={20} className="text-purple-500" />} />
                  <StatCard title="System Failures" value={globalStats.total_failures} icon={<AlertCircle size={20} className="text-red-500" />} />
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                    <div>
                      <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
                        <Activity className="text-blue-600" size={18} />
                        Live Global Activity Stream
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">Showing the last 100 platform dispatches in real-time.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
                        <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          <th className="px-6 py-3 w-8"></th>
                          <th className="px-6 py-3">Sender (Tenant)</th>
                          <th className="px-6 py-3">Recent Activity</th>
                          <th className="px-6 py-3 text-right">Last Active</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {senders.length === 0 && !loading && !error && (
                          <tr>
                            <td colSpan="4" className="px-6 py-8 text-center text-gray-500 text-sm">
                              No recent activity found.
                            </td>
                          </tr>
                        )}
                        {senders.map((sender) => {
                          const isExpanded = expandedSenders[sender];
                          const logs = groupedLogs[sender];
                          const lastActive = new Date(Math.max(...logs.map(l => new Date(l.sent_at).getTime())));

                          return (
                            <React.Fragment key={sender}>
                              <tr
                                onClick={() => toggleSender(sender)}
                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                              >
                                <td className="px-6 py-4 text-gray-400">
                                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                                  {sender}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {logs.length} emails logged
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap text-right">
                                  {lastActive.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </td>
                              </tr>

                              {/* EXPANDED DETAILS */}
                              {isExpanded && (
                                <tr className="bg-gray-50/50">
                                  <td colSpan="4" className="px-6 py-4 border-b border-gray-100">
                                    <div className="rounded-md border border-gray-200 overflow-hidden bg-white">
                                      <table className="w-full text-left border-collapse text-xs">
                                        <thead className="bg-gray-100 border-b border-gray-200 text-gray-500 uppercase tracking-wider">
                                          <tr>
                                            <th className="px-4 py-2">Time</th>
                                            <th className="px-4 py-2">Campaign</th>
                                            <th className="px-4 py-2">Recipient</th>
                                            <th className="px-4 py-2 text-right">Status</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                          {logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                              <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                                {new Date(log.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                              </td>
                                              <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                                {log.campaign_name}
                                              </td>
                                              <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                                {log.recipient_email}
                                              </td>
                                              <td className="px-4 py-2 whitespace-nowrap text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${log.status === "sent" ? "bg-green-100 text-green-700" :
                                                    log.status === "failed" || log.status === "bounced" ? "bg-red-100 text-red-700" :
                                                      "bg-gray-100 text-gray-700"
                                                  }`}>
                                                  {log.status}
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-5">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sign Out</h3>
              <p className="text-sm text-gray-500">Are you sure you want to sign out of the admin panel?</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
              <button onClick={confirmLogout} disabled={isLoggingOut} className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700">
                {isLoggingOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white px-6 py-5 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        {icon && (
          <div className="p-2 bg-gray-50 rounded-md border border-gray-100">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
