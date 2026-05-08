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
} from "lucide-react";
import apiClient from "../api/axios";

// Import your powerful engine components!
import ComposeCampaign from "./ComposeCampaign";
import UploadContacts from "./UploadContacts";
import QuickComposeCampaign from "./QuickEmailComposer";

export default function UserDashboard() {
  const navigate = useNavigate();

  // Logout Modal State
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Live Database State
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

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

  // Calculating the dynamic live stats from database data
  const stats = {
    total: recipients.length,
    sent: recipients.filter((r) => r.status === "sent").length,
    pending: recipients.filter((r) => r.status === "pending").length,
    failed: recipients.filter((r) => r.status === "failed").length,
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* TOP NAVIGATION */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
            <User className="text-white" size={18} />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Tech Bird Portal</h1>
          {loading && (
            <RefreshCw
              size={14}
              className="animate-spin text-indigo-500 ml-2"
            />
          )}
        </div>

        <div className="flex items-center gap-4">
          <button className="text-slate-400 hover:text-indigo-600 transition-colors">
            <Bell size={20} />
          </button>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-rose-500 transition-colors bg-slate-100 hover:bg-rose-50 px-4 py-2 rounded-lg"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-6xl mx-auto mt-8 p-4 space-y-8">
        {/* Error Banner */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 text-rose-700 shadow-sm">
            <AlertCircle size={20} />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Dynamic Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="text-blue-500" />}
            title="Total Recipients"
            value={stats.total}
          />
          <StatCard
            icon={<CheckCircle className="text-emerald-500" />}
            title="Emails Sent"
            value={stats.sent}
          />
          <StatCard
            icon={<XCircle className="text-rose-500" />}
            title="Failed"
            value={stats.failed}
          />
          <StatCard
            icon={<Clock className="text-amber-500" />}
            title="Pending"
            value={stats.pending}
          />
        </div>

        {/* Action Grid: Compose & Upload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ComposeCampaign />
          <QuickComposeCampaign />
          <UploadContacts onUploadSuccess={fetchRecipients} />
        </div>

        {/* Filter Dropdown */}
        <div className="flex justify-end">
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
                </tr>
              </thead>
              <tbody>
                {recipients.length === 0 && !loading && !error && (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-slate-500">
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
                {recipients.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="p-4 text-slate-400 font-mono text-sm">
                      #{user.id}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

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

// Helper Components
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
