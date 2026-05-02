import { useState } from "react";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/axios";

export default function Login() {
  const [formData, setFormData] = useState({
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
      const response = await apiClient.post("/api/login", formData);
      console.log("System Authorized:", response.data);
      navigate("/");
    } catch (err) {
      console.error("Login Failed", err);
      setErr(
        err.response?.data?.message || "Invalid credentials. Access denied.",
      );
    } finally {
      setLoading(false);
    }
    console.log("Login submitted:", formData);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Tech Bird
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Sign in to the Dispatcher Engine
          </p>
        </div>
        {err && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-sm font-medium text-center">
            {err}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
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
              Password
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
            disabled={loading}
            className={`w-full text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md
              ${loading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"}`}
          >
            {loading ? (
              <>
                Authenticating...
                <Loader2 size={18} className="animate-spin" />
              </>
            ) : (
              <>
                Access Dashboard
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <span className="text-indigo-600 font-semibold cursor-pointer hover:underline">
            <Link to="/signup">Request Access</Link>
          </span>
        </p>
      </div>
    </div>
  );
}
