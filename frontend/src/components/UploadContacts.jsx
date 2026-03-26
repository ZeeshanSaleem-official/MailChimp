import { useState } from "react";

export default function uploadContact({ onUploadSuccess }) {
  const [csvFile, setCsvFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCsvFile(file);
      console.log(
        "File Loaded into memory : ",
        file.name,
        `(${file.size} bytes)`,
      );
    }
  };
  const handleUpload = async () => {
    console.log("TODO: fetch() logic using FormData here!");
    if (!csvFile) {
      return;
    }
    setIsUploading(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append("file", csvFile);

    try {
      const response = await fetch(
        "http://localhost:8080/api/recipients/upload",
        {
          method: "POST",
          body: formData,
        },
      );
      if (!response.ok) {
        throw new Error(`Upload Failed due to ${response.statusText}`);
      }
      const data = await response.json();
      setUploadMessage({
        type: "success",
        text: " File Uploaded Succesfully!",
      });
      setCsvFile(null);

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      console.error("Uploading error :", err);
      setUploadMessage({
        type: "error",
        text: " Failed to Upload the file to backend server!",
      });
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 mt-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Import Contacts</h2>
        <p className="text-gray-500 text-sm mt-1">
          Upload a CSV file to add users to your database.
        </p>
      </div>

      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <p className="text-slate-500 font-medium">
            {csvFile
              ? `Selected: ${csvFile.name}`
              : "Click to select a .csv file"}
          </p>
        </div>
        <input
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>

      {csvFile && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className={`w-full mt-6 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2
            ${isUploading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg'}`}
        >
          {isUploading ? 'Uploading to server': 'Upload to Database'}
          </button>
        )}
        {uploadMessage && (
          <div className={`mt-4 p-3 rounded-lg text-sm font-medium border ${
          uploadMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          {uploadMessage.text}
        </div>
        )}
      
    </div>
  );
}
