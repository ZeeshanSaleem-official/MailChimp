import { useState } from "react";
import { Mail, Lock, User, UserPlus, Loader2 } from "lucide-react";
import apiClient from "../api/axios";
import { Link, useNavigate } from "react-router-dom";

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const response = await apiClient.post("/api/signup", formData);
      console.log("Account Initialized:", response.data);
      navigate("/login");
    } catch (error) {
      console.error("Signup failed:", err);
      setError(
        err.response?.data?.message ||
          "Failed to initialize account. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">
            Create an Account
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            Join the Tech Bird Dispatcher System
          </p>
        </div>
        {err && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-sm font-medium text-center">
            {err}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="System Admin"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="admin@techbird.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Secure Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading} // 🚨 THIS KILLS THE DOUBLE FIRE 🚨
            className={`w-full mt-2 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md
              ${loading ? "bg-slate-400 cursor-not-allowed" : "bg-slate-800 hover:bg-slate-900"}`}
          >
            {loading ? (
              <>
                Initializing...
                <Loader2 size={18} className="animate-spin" />
              </>
            ) : (
              <>
                Initialize Account
                <UserPlus size={18} />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already authorized?{" "}
          <span className="text-indigo-600 font-semibold cursor-pointer hover:underline">
            <Link to="/login">Return to Login</Link>
          </span>
        </p>
      </div>
    </div>
  );
}
