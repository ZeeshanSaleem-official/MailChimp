import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  User,
  Bell,
  AlertTriangle,
  X,
  Mail,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  RefreshCcw,
  Trash2,
  PieChart,
  Send,
  Contact,
} from "lucide-react";
import apiClient from "../api/axios";

// Engine Components
// Notice we removed the redundant ComposeCampaign! We only use the Rich Text one now.
import UploadContacts from "./UploadContacts";
import QuickComposeCampaign from "./QuickEmailComposer";

export default function UserDashboard() {
  const navigate = useNavigate();

  // Navigation State
  const [activeTab, setActiveTab] = useState("contacts"); // 'contacts', 'campaigns', 'analytics'

  // Logout Modal State
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Live Database State
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  // Action States
  const [resendingId, setResendingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null); // New state for delete spinner

  // Fetch recipients from the DB
  const fetchRecipients = async () => {
    let url = "/api/recipients";
    try {
      if (filter !== "all") {
        url = `/api/recipients?segment=${filter}`;
      }
      const response = await apiClient.get(url);
      setRecipients(response.data || []);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      if (err.response && err.response.status === 401) {
        setError("Session expired. Please log in again.");
      } else {
        setError(
          "Cannot connect to Go Backend. Make sure your Go server is running!",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Run immediately on load, and then every 3 seconds to get live updates
  useEffect(() => {
    fetchRecipients();
    const interval = setInterval(fetchRecipients, 3000);
    return () => clearInterval(interval);
  }, [filter]);

  // Resend Logic
  const handleResend = async (userEmail, userId) => {
    setResendingId(userId);
    try {
      await apiClient.post("/api/recipients/resend", { email: userEmail });
      fetchRecipients();
    } catch (err) {
      console.error("Resend failed:", err);
    } finally {
      setResendingId(null);
    }
  };

  // Delete Logic
  const handleDelete = async (userId) => {
    // Built-in browser confirmation dialog
    if (
      !window.confirm(
        "Are you sure you want to delete this contact? This cannot be undone.",
      )
    ) {
      return;
    }

    setDeletingId(userId);
    try {
      // Send the ID to your Go backend to be deleted
      await apiClient.delete("/api/recipients/delete", {
        data: { id: userId },
      });
      fetchRecipients(); // Refresh the table so they disappear instantly!
    } catch (err) {
      console.error("Delete failed:", err);
      alert(
        "Failed to delete user. Make sure your Go backend handler is ready!",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Logout Logic
  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await apiClient.post("/api/logout");
      localStorage.removeItem("userRole");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      localStorage.removeItem("userRole");
      navigate("/login");
    }
  };

  // Calculating the dynamic live stats
  const stats = {
    total: recipients.length,
    sent: recipients.filter((r) => r.status === "sent").length,
    pending: recipients.filter((r) => r.status === "pending").length,
    failed: recipients.filter((r) => r.status === "failed").length,
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-20 shadow-sm shrink-0">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
            <Mail className="text-white" size={18} />
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">
            Tech Bird
          </h1>
        </div>

        <div className="flex-1 py-6 px-4 space-y-2">
          <NavItem
            icon={<Contact size={20} />}
            label="Contacts Database"
            isActive={activeTab === "contacts"}
            onClick={() => setActiveTab("contacts")}
          />
          <NavItem
            icon={<Send size={20} />}
            label="Send Campaign"
            isActive={activeTab === "campaigns"}
            onClick={() => setActiveTab("campaigns")}
          />
          <NavItem
            icon={<PieChart size={20} />}
            label="Analytics & Stats"
            isActive={activeTab === "analytics"}
            onClick={() => setActiveTab("analytics")}
          />
        </div>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-3 text-sm font-bold text-slate-600 hover:text-rose-600 transition-colors w-full p-3 rounded-xl hover:bg-rose-50"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* TOP HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800 capitalize">
              {activeTab} Overview
            </h2>
            {loading && (
              <RefreshCw size={14} className="animate-spin text-indigo-500" />
            )}
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-indigo-600 transition-colors">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <User size={16} className="text-slate-500" />
              <span className="text-xs font-bold text-slate-600">
                Active Session
              </span>
            </div>
          </div>
        </header>

        {/* SCROLLABLE VIEW AREA */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* Global Error Banner */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 text-rose-700 shadow-sm mb-6">
              <AlertCircle size={20} />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* ========================================= */}
          {/* VIEW 1: ANALYTICS */}
          {/* ========================================= */}
          {activeTab === "analytics" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-800">
                  Campaign Performance
                </h3>
                <p className="text-slate-500 text-sm">
                  Real-time statistics of your email dispatcher engine.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                  icon={<Users className="text-blue-500" />}
                  title="Total Database"
                  value={stats.total}
                />
                <StatCard
                  icon={<CheckCircle className="text-emerald-500" />}
                  title="Emails Sent"
                  value={stats.sent}
                />
                <StatCard
                  icon={<XCircle className="text-rose-500" />}
                  title="Failed/Bounced"
                  value={stats.failed}
                />
                <StatCard
                  icon={<Clock className="text-amber-500" />}
                  title="Pending Dispatch"
                  value={stats.pending}
                />
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* VIEW 2: CAMPAIGNS */}
          {/* ========================================= */}
          {activeTab === "campaigns" && (
            <div className="animate-in fade-in duration-500 max-w-4xl">
              {/* Only the Rich Text Composer is rendered here now! */}
              <QuickComposeCampaign />
            </div>
          )}

          {/* ========================================= */}
          {/* VIEW 3: CONTACTS */}
          {/* ========================================= */}
          {activeTab === "contacts" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upload takes up 1/3 width, or you can adjust */}
                <div className="lg:col-span-1">
                  <UploadContacts onUploadSuccess={fetchRecipients} />
                </div>

                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center p-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
                    <Users size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    Manage Your Audience
                  </h3>
                  <p className="text-slate-500">
                    Upload a CSV to add to your database. You can filter, review
                    statuses, and delete contacts from the table below.
                  </p>
                </div>
              </div>

              {/* Filter Dropdown */}
              <div className="flex justify-end pt-4">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                >
                  <option value="all">All Contacts</option>
                  <option value="premium">Premium Only</option>
                  <option value="general">General Only</option>
                </select>
              </div>

              {/* Live Database Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                      <Mail className="text-indigo-500" size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">
                      Your Contacts Database
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    LIVE
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white text-slate-500 text-sm border-b border-slate-200">
                        <th className="p-4 font-semibold w-16">ID</th>
                        <th className="p-4 font-semibold">Name</th>
                        <th className="p-4 font-semibold">Email Address</th>
                        <th className="p-4 font-semibold">Segment</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold w-32 text-center">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipients.length === 0 && !loading && !error && (
                        <tr>
                          <td
                            colSpan="6"
                            className="p-12 text-center text-slate-500"
                          >
                            <div className="flex flex-col items-center justify-center gap-3">
                              <Users size={32} className="text-slate-300" />
                              <p className="font-medium">
                                No contacts found in your database.
                              </p>
                              <p className="text-sm">
                                Upload a CSV above to get started!
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}

                      {recipients.map((user, index) => (
                        <tr
                          key={user.id}
                          className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="p-4 text-slate-400 font-mono text-sm">
                            {/* Display visual order number instead of raw DB ID */}
                            #{index + 1}
                          </td>
                          <td className="p-4 font-bold text-slate-700">
                            {user.name}
                          </td>
                          <td className="p-4 text-slate-500">{user.email}</td>
                          <td className="p-4">
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-200">
                              {user.segment}
                            </span>
                          </td>
                          <td className="p-4">
                            <StatusBadge status={user.status} />
                          </td>

                          {/* ACTION BUTTONS (Resend & Delete) */}
                          <td className="p-4 flex justify-center gap-2">
                            {/* Resend Button (Only if failed) */}
                            {user.status === "failed" && (
                              <button
                                onClick={() =>
                                  handleResend(user.email, user.id)
                                }
                                disabled={resendingId === user.id}
                                title="Retry sending email"
                                className="flex items-center justify-center p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-100 disabled:opacity-50"
                              >
                                {resendingId === user.id ? (
                                  <RefreshCw
                                    size={16}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <RefreshCcw size={16} />
                                )}
                              </button>
                            )}

                            {/* New Delete Button (Always visible) */}
                            <button
                              onClick={() => handleDelete(user.id)}
                              disabled={deletingId === user.id}
                              title="Delete User"
                              className="flex items-center justify-center p-2 bg-slate-50 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg transition-colors border border-slate-200 hover:border-red-200 disabled:opacity-50"
                            >
                              {deletingId === user.id ? (
                                <RefreshCw size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* THE LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-rose-600 w-6 h-6" />
              </div>
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                Ready to sign out?
              </h3>
              <p className="text-slate-500">
                You will be securely disconnected from the Tech Bird Dispatcher.
                Any active sessions will be terminated.
              </p>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                disabled={isLoggingOut}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl shadow-sm shadow-rose-200 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <LogOut size={18} />
                {isLoggingOut ? "Signing out..." : "Yes, Sign me out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// Helper Components
// ==========================================

// New Sidebar Tab Helper
function NavItem({ icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 ${
        isActive
          ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
        {icon}
      </div>
      <div>
        <p className="text-slate-500 text-sm font-semibold">{title}</p>
        <p className="text-2xl font-black text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    sent: "bg-emerald-100 text-emerald-700 border-emerald-200",
    failed: "bg-rose-100 text-rose-700 border-rose-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
  };

  const appliedStyle = styles[status] || styles.pending;

  return (
    <span
      className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${appliedStyle}`}
    >
      {status || "pending"}
    </span>
  );
}
