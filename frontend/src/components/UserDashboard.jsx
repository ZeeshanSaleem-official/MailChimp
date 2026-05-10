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
  History,
  Menu,
} from "lucide-react";
import apiClient from "../api/axios";

// Engine Components
import UploadContacts from "./UploadContacts";
import QuickComposeCampaign from "./QuickEmailComposer";

export default function UserDashboard() {
  const navigate = useNavigate();

  // Navigation State
  const [activeTab, setActiveTab] = useState("contacts");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true); // New state for Desktop!

  // Modal & Notification States
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Live Database State
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  // Action States
  const [resendingId, setResendingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
      } else {
        setError(
          "Cannot connect to Go Backend. Ensure your server is running!",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipients();
    const interval = setInterval(fetchRecipients, 3000);
    return () => clearInterval(interval);
  }, [filter]);

  const handleResend = async (userEmail, userId) => {
    setResendingId(userId);
    try {
      await apiClient.post("/api/recipients/resend", { email: userEmail });
      fetchRecipients();
      setSuccessMessage("Retry attempt successful!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Resend failed:", err);
    } finally {
      setResendingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setDeletingId(userToDelete.id);
    try {
      await apiClient.delete("/api/recipients/delete", {
        data: { id: userToDelete.id },
      });
      fetchRecipients();
      setSuccessMessage("Recipient removed from database.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete user.");
    } finally {
      setDeletingId(null);
      setUserToDelete(null);
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
    total: recipients.length,
    sent: recipients.filter((r) => r.status === "sent").length,
    pending: recipients.filter((r) => r.status === "pending").length,
    failed: recipients.filter((r) => r.status === "failed").length,
  };

  const handleTabSwitch = (tabName) => {
    setActiveTab(tabName);
    setIsMobileMenuOpen(false);
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

      {/* RESPONSIVE SIDEBAR (Now handles both Mobile translate AND Desktop negative margin) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col shadow-2xl md:shadow-sm transform transition-all duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} ${isDesktopSidebarOpen ? "md:ml-0" : "md:-ml-64"}`}
      >
        {/* Mobile Close Button */}
        <button
          className="absolute top-6 right-4 text-slate-400 hover:bg-slate-100 p-2 rounded-lg md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X size={20} />
        </button>

        <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-100 bg-slate-50/30 mt-2 md:mt-0 whitespace-nowrap">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
            <Mail className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 leading-none">
              Tech Bird
            </h1>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
              Dispatcher
            </span>
          </div>
        </div>

        <div className="flex-1 py-8 px-4 space-y-2 overflow-y-auto whitespace-nowrap">
          <NavItem
            icon={<Contact size={20} />}
            label="Contacts List"
            isActive={activeTab === "contacts"}
            onClick={() => handleTabSwitch("contacts")}
          />
          <NavItem
            icon={<Send size={20} />}
            label="Campaigns"
            isActive={activeTab === "campaigns"}
            onClick={() => handleTabSwitch("campaigns")}
          />
          <NavItem
            icon={<PieChart size={20} />}
            label="Stats & Analytics"
            isActive={activeTab === "analytics"}
            onClick={() => handleTabSwitch("analytics")}
          />
        </div>

        <div className="p-4 border-t border-slate-100 whitespace-nowrap">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-3 text-sm font-bold text-slate-500 hover:text-rose-600 transition-colors w-full p-3 rounded-xl hover:bg-rose-50"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full transition-all duration-300">
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0 z-10 w-full">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger */}
            <button
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={22} />
            </button>

            {/* Desktop Hamburger (Toggles the negative margin sidebar) */}
            <button
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg hidden md:block transition-colors"
              onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
            >
              <Menu size={22} />
            </button>

            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest hidden sm:block">
              {activeTab}
            </h2>
            {loading && (
              <RefreshCw size={14} className="animate-spin text-indigo-500" />
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="text-slate-400 hover:text-indigo-600 transition-colors p-2 hidden sm:block">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <User size={16} className="text-slate-500 shrink-0" />
              <span className="text-xs font-bold text-slate-600 hidden sm:block">
                Active Session
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
          {error && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 text-rose-700 mb-6">
              <AlertCircle size={20} className="shrink-0" />
              <p className="font-medium text-sm md:text-base">{error}</p>
            </div>
          )}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3 text-emerald-700 mb-6 animate-in fade-in slide-in-from-top-2">
              <CheckCircle size={20} className="shrink-0" />
              <p className="font-medium text-sm md:text-base">
                {successMessage}
              </p>
            </div>
          )}

          {/* VIEW: CONTACTS */}
          {activeTab === "contacts" && (
            <div className="space-y-6 animate-in fade-in">
              <UploadContacts onUploadSuccess={fetchRecipients} />

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="font-bold text-slate-800">
                  Recipients Master List
                </h3>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full sm:w-auto p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm font-medium text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                >
                  <option value="all">All Contacts</option>
                  <option value="premium">Premium Only</option>
                  <option value="general">General Only</option>
                </select>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-400 text-[11px] font-black uppercase tracking-widest border-b border-slate-100">
                        <th className="p-4 w-12 md:w-16">#</th>
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4 hidden sm:table-cell">Segment</th>
                        <th className="p-4 text-center">Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipients.length === 0 && !loading && !error && (
                        <tr>
                          <td
                            colSpan="5"
                            className="p-8 md:p-12 text-center text-slate-500"
                          >
                            <div className="flex flex-col items-center justify-center gap-3">
                              <Users size={32} className="text-slate-300" />
                              <p className="font-medium text-sm md:text-base">
                                No contacts found.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}

                      {recipients.map((user, index) => (
                        <tr
                          key={user.id}
                          className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="p-4 text-slate-300 font-mono text-xs">
                            {index + 1}
                          </td>
                          <td className="p-4 font-bold text-slate-700 text-sm md:text-base">
                            {user.name}
                          </td>
                          <td className="p-4 text-slate-500 text-xs md:text-sm">
                            {user.email}
                          </td>
                          <td className="p-4 hidden sm:table-cell">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-black uppercase border border-slate-200">
                              {user.segment}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => setUserToDelete(user)}
                              className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
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

          {/* VIEW: CAMPAIGNS */}
          {activeTab === "campaigns" && (
            <div className="animate-in fade-in max-w-4xl mx-auto w-full">
              <QuickComposeCampaign />
            </div>
          )}

          {/* VIEW: ANALYTICS */}
          {activeTab === "analytics" && (
            <div className="space-y-6 md:space-y-8 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={<Users className="text-blue-500" />}
                  title="All-Time Audience"
                  value={stats.total}
                />
                <StatCard
                  icon={<CheckCircle className="text-emerald-500" />}
                  title="Successful Deliveries"
                  value={stats.sent}
                />
                <StatCard
                  icon={<XCircle className="text-rose-500" />}
                  title="System Failures"
                  value={stats.failed}
                />
                <StatCard
                  icon={<Clock className="text-amber-500" />}
                  title="Pending Queue"
                  value={stats.pending}
                />
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-slate-100 flex items-center gap-2">
                  <History className="text-indigo-500 shrink-0" size={18} />
                  <h3 className="font-bold text-slate-800 text-sm md:text-base">
                    Delivery Status Log
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-400 text-[10px] md:text-[11px] font-black uppercase tracking-widest border-b border-slate-100">
                        <th className="p-4">Recipient</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Manual Retry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipients.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-slate-50 transition-colors"
                        >
                          <td className="p-4">
                            <p className="font-bold text-slate-700 text-sm">
                              {user.name}
                            </p>
                            <p className="text-slate-400 text-xs">
                              {user.email}
                            </p>
                          </td>
                          <td className="p-4">
                            <StatusBadge status={user.status} />
                          </td>
                          <td className="p-4 text-center">
                            {user.status === "failed" && (
                              <button
                                onClick={() =>
                                  handleResend(user.email, user.id)
                                }
                                disabled={resendingId === user.id}
                                className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                              >
                                {resendingId === user.id ? (
                                  <RefreshCw
                                    size={14}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <RefreshCcw size={14} />
                                )}
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
          )}
        </main>
      </div>

      {/* DELETE MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm md:max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8 text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-rose-600 w-8 h-8" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-2">
                Delete Contact?
              </h3>
              <p className="text-slate-500 text-xs md:text-sm break-all">
                Remove{" "}
                <span className="font-bold text-slate-700">
                  {userToDelete.email}
                </span>
                ? This cannot be undone.
              </p>
            </div>
            <div className="p-4 md:p-6 bg-slate-50 flex flex-col-reverse md:flex-row gap-3 justify-center">
              <button
                onClick={() => setUserToDelete(null)}
                className="w-full md:w-auto px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingId === userToDelete.id}
                className="w-full md:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-100 flex items-center justify-center gap-2"
              >
                {deletingId === userToDelete.id ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  "Delete Forever"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm md:max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-amber-600 w-8 h-8" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-2">
                End Session?
              </h3>
              <p className="text-slate-500 text-xs md:text-sm">
                Are you sure you want to log out of Tech Bird?
              </p>
            </div>
            <div className="p-4 md:p-6 bg-slate-50 flex flex-col-reverse md:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-full md:w-auto px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 bg-slate-100 rounded-xl transition-all"
              >
                Stay
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

// Sub-components
function NavItem({ icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-black text-sm transition-all duration-200 ${isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 md:translate-x-2" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}
    >
      {icon} {label}
    </button>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 flex items-center gap-4 w-full">
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

function StatusBadge({ status }) {
  const styles = {
    sent: "bg-emerald-100 text-emerald-700 border-emerald-200",
    failed: "bg-rose-100 text-rose-700 border-rose-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter border ${styles[status] || styles.pending}`}
    >
      {status || "pending"}
    </span>
  );
}
