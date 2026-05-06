import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Bell, AlertTriangle, X } from "lucide-react";
import apiClient from "../api/axios";

export default function UserDashboard() {
  const navigate = useNavigate();
  // State to control the visibility of the logout modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      //Tell Go to destroy the HttpOnly cookie
      await apiClient.post("/api/logout");

      // Destroy the React localStorage badge
      localStorage.removeItem("userRole");

      // Kick them back to the login screen
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if the server fails kick them out locally for safety
      localStorage.removeItem("userRole");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* TOP NAVIGATION */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <User className="text-white" size={18} />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Tech Bird Portal</h1>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-slate-400 hover:text-indigo-600 transition-colors">
            <Bell size={20} />
          </button>
          {/* TRIGGER BUTTON FOR MODAL */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-rose-500 transition-colors bg-slate-100 hover:bg-rose-50 px-4 py-2 rounded-lg"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-5xl mx-auto mt-8 p-4">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800">Welcome back!</h2>
          <p className="text-slate-500 mt-2">Here is your account overview.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 mb-1">
              Account Status
            </h3>
            <p className="text-2xl font-bold text-emerald-600">Active</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 mb-1">
              Subscription
            </h3>
            <p className="text-2xl font-bold text-slate-800">Free Tier</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 mb-1">
              Messages Sent
            </h3>
            <p className="text-2xl font-bold text-slate-800">0</p>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4">
            Recent Activity
          </h3>
          <p className="text-slate-500 text-sm">
            No recent activity to display.
          </p>
        </div>
      </main>

      {/* THE LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
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

            {/* Modal Body */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                Ready to sign out?
              </h3>
              <p className="text-slate-500">
                You will be securely disconnected from the Tech Bird Dispatcher.
                Any active sessions will be terminated.
              </p>
            </div>

            {/* Modal Footer */}
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
