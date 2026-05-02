import { useState } from "react";
import { Send, AlertCircle, CheckCircle } from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import axios from "axios";

export default function QuickComposeCampaign() {
  //  State to track the form inputs
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [segment, setSegment] = useState("all");
  const [status, setStatus] = useState("");

  const handleSendCampaign = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const response = await axios.get("/api/campaign/send", {
        subject: subject,
        body: body,
        segment: segment,
      });
      if (!response.ok) {
        throw new Error("Failed to Send Campagin");
      }
      setStatus("success");
      // Just Clean up the form for next iteration
      setSubject("");
      setBody("");
    } catch (error) {
      console.error("Campaign dispatch error:", error);
      setStatus("error");
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

      <form onSubmit={handleSendCampaign} className="space-y-5">
        {/* Subject Line Field */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Email Subject Line
          </label>
          <input
            type="text"
            placeholder="Exclusive 50% off inside!"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            required
          />
        </div>

        {/* Rich Text Editor */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Email Body (Rich Text)
          </label>
          <div className="bg-white rounded-lg">
            <ReactQuill
              theme="snow"
              value={body}
              onChange={setBody}
              className="h-64 mb-12"
            />
          </div>
        </div>

        {/* Target Segment Dropdown */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Target Segment
          </label>
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
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
          disabled={status === "loading"}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg"
        >
          <Send size={18} />
          {status === "loading" ? "Firing Engine..." : "Launch Campaign"}
        </button>
      </form>

      {/* Success Receipt */}
      {status === "success" && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 text-green-700">
          <CheckCircle className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-medium">
            Campaign dispatched successfully!
          </p>
        </div>
      )}

      {/* Error Receipt */}
      {status === "error" && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-medium">
            Error sending campaign. Is the Go server running?
          </p>
        </div>
      )}
    </div>
  );
}
