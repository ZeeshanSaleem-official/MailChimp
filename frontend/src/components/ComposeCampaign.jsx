import { useState } from "react";
import { Send, AlertCircle, CheckCircle } from "lucide-react";
import axios from "axios";

export default function ComposeCampaign() {
  //  State to track the form inputs
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    segment: "premium",
  });

  // State for showing the success/error message from the Go backend
  const [statusMsg, setStatusMsg] = useState(null);

  //  Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  //  The trigger function TO Post the manual email campaign directly from the UI
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Sending payload to Go:", formData);
    const response = await axios.get("/api/campaign/run", formData);
    if (!response.ok) {
      throw new Error(`Backend Reject the request: ${response.statusText}`);
    }
    try {
      const data = await response.json();
      setStatusMsg(data.message);
    } catch (error) {
      console.error("Transmission failed:", err);
      setStatusMsg("Error: Could not reach the backend.");
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
        {/* Campaign Name Field */}
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

        {/* Subject Line Field */}
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

        {/* Target Segment Dropdown */}
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

        {/* The Massive Send Button */}
        <button
          type="submit"
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg"
        >
          <Send size={18} />
          Launch Campaign
        </button>
      </form>

      {/* Placeholder for the Go Backend Receipt */}
      {statusMsg && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 text-green-700">
          <CheckCircle className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-medium">{statusMsg}</p>
        </div>
      )}
    </div>
  );
}
