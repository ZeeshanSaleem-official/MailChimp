import { useState } from "react";


export default function uploadContact({onUploadSuccess}){
    const [csvFile,setCsvFile] = useState(null)

    const handleFileChange = (e)=>{
        const file = e.target.files[0];
        if (file){
            setCsvFile(file)
            console.log("File Loaded into memory : ", file.name,`(${file.size} bytes)`);
            
        }
    }
    const handleUpload =()=>{
        console.log("TODO: fetch() logic using FormData here!");
    }

    return (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 mt-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Import Contacts</h2>
        <p className="text-gray-500 text-sm mt-1">Upload a CSV file to add users to your database.</p>
      </div>
      
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <p className="text-slate-500 font-medium">
            {csvFile ? `Selected: ${csvFile.name}` : "Click to select a .csv file"}
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
          className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg"
        >
          Upload to Database
        </button>
      )}
    </div>
  );
}

