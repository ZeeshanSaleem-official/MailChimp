import {
  Mail,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import "./index.css";
import ComposeCampaign from "./components/ComposeCampaign";
import UploadContacts from "./components/UploadContacts";
import QuickComposeCampaign from "./components/QuickEmailComposer";

function App() {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  //Fetch recipients from the DB
  const fetchRecipients = async () => {
    let url = "http://localhost:8080/api/recipients";
    try {
      // search for filtered users
      if (filter != "all") {
        url = `http://localhost:8080/api/recipients?segment=${filter}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch data from the server");
      }

      const data = await response.json();
      // IF DB is empty, Go backend might send null, so we default to an empty array
      setRecipients(data || []);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(
        "Cannot connect to Go Backend. Make sure your Go server is running on port 8080!",
      );
    } finally {
      setLoading(false);
    }
  };
  // Run immediately on load, and then every 3 seconds to get live updates
  useEffect(() => {
    fetchRecipients();
    const interval = setInterval(fetchRecipients, 3000);
    // cleanup on unmount
    return () => clearInterval(interval);
  }, [filter]);
  // Calculating the dynamic live stats from database data
  const stats = {
    total: recipients.length,
    sent: recipients.filter((r) => r.status === "sent").length,
    pending: recipients.filter((r) => r.status === "pending").length,
    failed: recipients.filter((r) => r.status === "failed").length,
  };
  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              MailChimp Engine
            </h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              GoLang + React Dispatcher System
              {loading && (
                <RefreshCw size={14} className="animate-spin text-blue-500" />
              )}
            </p>
          </div>
          <button
            onClick={fetchRecipients}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-sm shadow-indigo-200"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Sync Database
          </button>
        </div>

        {/* Error Banner (If Go server is down) */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 text-rose-700">
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

        {/* Compose Campaign through the UI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Template Compose Capmaign */}
          <ComposeCampaign />
          {/* Custom Compose Campaign */}
          <QuickComposeCampaign />
          {/* Pass the fetchRecipients function so it refreshes the table instantly when done! */}
          <UploadContacts onUploadSuccess={fetchRecipients} />
        </div>

        {/*Dropdown for the filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="mb-4 p-2 border rounded"
        >
          <option value="all"> All Users</option>
          <option value="premium"> Premium Only</option>
          <option value="general"> General Only</option>
        </select>
        {/* Database Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="text-slate-400" />
              <h2 className="text-xl font-semibold text-slate-800">
                Live Database Status
              </h2>
            </div>
            <span className="text-sm font-medium text-slate-400">
              Updates every 3s
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-sm border-b border-slate-100">
                  <th className="p-4 font-medium w-16">ID</th>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Segment</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recipients.length === 0 && !loading && !error && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400">
                      No recipients found in database.
                    </td>
                  </tr>
                )}
                {recipients.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 text-slate-400 font-mono text-sm">
                      #{user.id}
                    </td>
                    <td className="p-4 font-medium">{user.name}</td>
                    <td className="p-4 text-slate-500">{user.email}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium uppercase tracking-wider">
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
      </div>
    </div>
  );
}

// Helper Component (For stats)
function StatCard({ icon, title, value }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
      <div className="p-4 bg-slate-50 rounded-xl">{icon}</div>
      <div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
// Helper Component (For status badge)
function StatusBadge({ status }) {
  const styles = {
    sent: "bg-emerald-100 text-emerald-700",
    failed: "bg-rose-100 text-rose-700",
    pending: "bg-amber-100 text-amber-700",
  };

  // Default to pending styles if status is weird
  const appliedStyle = styles[status] || styles.pending;

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${appliedStyle}`}
    >
      {status || "pending"}
    </span>
  );
}
export default App;
