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
  const [engineStatus, setEngineStatus] = useState("running"); // "running", "paused", "stopped"
  const [isUpdatingEngine, setIsUpdatingEngine] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // New state for confirming destructive/important actions
  const [confirmAction, setConfirmAction] = useState(null);
  const [editQuotaUser, setEditQuotaUser] = useState(null);
  const [newQuotaValue, setNewQuotaValue] = useState(500);

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
      const [statsRes, logsRes, engineRes] = await Promise.all([
        apiClient.get("/api/admin/stats"),
        apiClient.get("/api/admin/logs"),
        apiClient.get("/api/admin/engine")
      ]);
      setGlobalStats(statsRes.data || { total_users: 0, global_queue: 0, total_sent: 0, total_failures: 0 });
      setGlobalLogs(logsRes.data || []);
      setEngineStatus(engineRes.data?.status || "running");
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
    } finally {
      setConfirmAction(null);
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
    } finally {
      setConfirmAction(null);
    }
  };

  const updateUserQuota = async () => {
    try {
      await apiClient.put("/api/admin/users/quota", {
        user_id: editQuotaUser.id,
        daily_quota: parseInt(newQuotaValue, 10),
      });
      fetchUsers();
      setSuccessMessage(`User quota updated to ${newQuotaValue}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to update quota:", err);
      setError("Failed to update user quota.");
    } finally {
      setEditQuotaUser(null);
    }
  };

  const toggleEngineStatus = async (newStatus) => {
    setIsUpdatingEngine(true);
    try {
      await apiClient.put("/api/admin/engine", { status: newStatus });
      setEngineStatus(newStatus);
      setSuccessMessage(`Engine status changed to ${newStatus}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to update engine status:", err);
      setError("Failed to update engine status.");
    } finally {
      setIsUpdatingEngine(false);
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
                          <th className="px-6 py-3">Quota</th>
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
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{user.daily_quota || 500}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                              {user.user !== "admin" && (
                                <>
                                  <button
                                    onClick={() => setConfirmAction({ type: 'role', user, actionStr: 'promote' })}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-blue-600 hover:bg-blue-50 transition-colors"
                                  >
                                    <ShieldCheck size={14} />
                                    Make Admin
                                  </button>
                                  <button
                                    onClick={() => setConfirmAction({ type: 'status', user, actionStr: user.status === "active" || !user.status ? "suspend" : "activate" })}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-colors ${user.status === "active" || !user.status ? "border-gray-300 text-red-600 hover:bg-red-50" : "border-gray-300 text-green-600 hover:bg-green-50"}`}
                                  >
                                    <Power size={14} />
                                    {user.status === "active" || !user.status ? "Suspend" : "Activate"}
                                  </button>
                                </>
                              )}
                              {user.user === "admin" && (
                                <button
                                  onClick={() => setConfirmAction({ type: 'role', user, actionStr: 'revoke admin rights for' })}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-orange-600 hover:bg-orange-50 transition-colors"
                                >
                                  <ShieldAlert size={14} />
                                  Revoke Admin
                                </button>
                              )}
                              <button
                                onClick={() => { setEditQuotaUser(user); setNewQuotaValue(user.daily_quota || 500); }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                              >
                                Edit Quota
                              </button>
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
                {/* Global Engine Control (Kill Switch) */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <Power className={engineStatus === "running" ? "text-green-500" : "text-red-500"} size={20} />
                        Global Engine Control
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Use this to pause or stop the email dispatch engine globally. 
                        Currently, the engine is <strong className="uppercase">{engineStatus}</strong>.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleEngineStatus("running")}
                        disabled={isUpdatingEngine || engineStatus === "running"}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${engineStatus === "running" ? "bg-green-100 text-green-800 cursor-not-allowed" : "bg-white border border-gray-300 text-gray-700 hover:bg-green-50 hover:text-green-700"}`}
                      >
                        Run
                      </button>
                      <button
                        onClick={() => toggleEngineStatus("paused")}
                        disabled={isUpdatingEngine || engineStatus === "paused"}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${engineStatus === "paused" ? "bg-yellow-100 text-yellow-800 cursor-not-allowed" : "bg-white border border-gray-300 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700"}`}
                      >
                        Pause
                      </button>
                      <button
                        onClick={() => toggleEngineStatus("stopped")}
                        disabled={isUpdatingEngine || engineStatus === "stopped"}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${engineStatus === "stopped" ? "bg-red-100 text-red-800 cursor-not-allowed" : "bg-white border border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-700"}`}
                      >
                        Stop (Kill)
                      </button>
                    </div>
                  </div>
                </div>

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
                          const senderUser = users.find(u => u.email === sender);
                          const isSuspended = senderUser?.status === "suspended" || senderUser?.status === "banned";

                          return (
                            <React.Fragment key={sender}>
                              <tr
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td 
                                  className="px-6 py-4 text-gray-400 cursor-pointer"
                                  onClick={() => toggleSender(sender)}
                                >
                                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap flex items-center gap-2">
                                  {sender}
                                  {senderUser && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmAction({ type: 'status', user: senderUser, actionStr: isSuspended ? "activate" : "suspend" });
                                      }}
                                      title={isSuspended ? "Activate Sender" : "Suspend Sender"}
                                      className={`p-1 rounded-md transition-colors ${isSuspended ? "text-red-600 bg-red-100 hover:bg-red-200" : "text-gray-400 hover:text-red-600 hover:bg-red-50"}`}
                                    >
                                      <ShieldAlert size={16} />
                                    </button>
                                  )}
                                </td>
                                <td 
                                  className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap cursor-pointer"
                                  onClick={() => toggleSender(sender)}
                                >
                                  {logs.length} emails logged
                                </td>
                                <td 
                                  className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap text-right cursor-pointer"
                                  onClick={() => toggleSender(sender)}
                                >
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

      {/* ACTION CONFIRMATION MODAL */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-5">
              <h3 className="text-lg font-medium text-gray-900 mb-2 capitalize">{confirmAction.actionStr} User?</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to {confirmAction.actionStr} <strong>{confirmAction.user.email}</strong>? 
                {confirmAction.type === 'role' && " This will change their access level on the platform."}
                {confirmAction.type === 'status' && " This will affect their ability to send emails."}
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setConfirmAction(null)} 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (confirmAction.type === 'role') {
                    toggleUserRole(confirmAction.user.id, confirmAction.user.user || "user");
                  } else {
                    toggleUserStatus(confirmAction.user.id, confirmAction.user.status || "active");
                  }
                }} 
                className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md ${
                  confirmAction.actionStr === "suspend" || confirmAction.actionStr === "revoke admin rights for" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT QUOTA MODAL */}
      {editQuotaUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-5">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Update User Quota</h3>
              <p className="text-sm text-gray-500 mb-4">
                Set the daily sending limit for <strong>{editQuotaUser.email}</strong>.
              </p>
              <input
                type="number"
                value={newQuotaValue}
                onChange={(e) => setNewQuotaValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                min="0"
              />
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setEditQuotaUser(null)} 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={updateUserQuota} 
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Save
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
