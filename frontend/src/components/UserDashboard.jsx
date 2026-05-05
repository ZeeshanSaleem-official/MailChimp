import { useNavigate } from "react-router-dom";
import { LogOut, User, Bell } from "lucide-react";

export default function UserDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* 👆 TOP NAVIGATION */}
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
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-rose-500 transition-colors bg-slate-100 hover:bg-rose-50 px-4 py-2 rounded-lg"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      {/* 👇 MAIN CONTENT */}
      <main className="max-w-5xl mx-auto mt-8 p-4">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800">Welcome back!</h2>
          <p className="text-slate-500 mt-2">Here is your account overview.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Stat Cards */}
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
    </div>
  );
}
