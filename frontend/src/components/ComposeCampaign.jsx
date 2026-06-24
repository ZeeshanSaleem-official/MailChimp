import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";
import apiClient from "../api/axios"; // Import your custom client

export default function ComposeCampaign() {
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    segment: "premium",
  });

  const [statusMsg, setStatusMsg] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setStatusMsg(null);
    console.log("Sending payload to Go:", formData);

    try {
      // Use apiClient.post and pass the formData directly
      const response = await apiClient.post("/api/campaign/run", formData);

      //  Axios automatically puts the JSON response inside .data
      setStatusMsg(response.data.message || "Campaign launched successfully!");
    } catch (error) {
      console.error("Transmission failed:", error);
      let errMsg = "Error: Could not reach the backend.";
      if (typeof error.response?.data === 'string') {
        errMsg = error.response.data;
      } else if (error.response?.data?.message) {
        errMsg = error.response.data.message;
      }
      setStatusMsg(errMsg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-2xl mx-auto mt-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Compose Campaign</h2>
        <p className="text-gray-500 text-sm mt-1">
          Deploy your next email blast to your database.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Campaign Name
          </label>
          <input
            type="text"
            name="name"
            placeholder="e.g., Spring Sale 2026"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Email Subject Line
          </label>
          <input
            type="text"
            name="subject"
            placeholder="Exclusive 50% off inside!"
            value={formData.subject}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Target Segment
          </label>
          <select
            name="segment"
            value={formData.segment}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
          >
            <option value="premium">Premium Members</option>
            <option value="general">General Audience</option>
            <option value="all">All Subscribers</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isSending}
          className={`w-full mt-6 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md ${
            isSending
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
          }`}
        >
          <Send size={18} />
          {isSending ? "Launching..." : "Launch Campaign"}
        </button>
      </form>

      {statusMsg && (
        <div
          className={`mt-6 p-4 border rounded-lg flex items-start gap-3 ${
            statusMsg.includes("Error")
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-green-50 border-green-200 text-green-700"
          }`}
        >
          <CheckCircle className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-medium">{statusMsg}</p>
        </div>
      )}
    </div>
  );
}
