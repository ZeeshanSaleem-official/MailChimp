import { useState } from "react"


function App() {
  const [recipients,setRecipients] = useState([])
  const [loading,setLoading] =  useState(true)
  const [error,setError] = useState(null)
  
  //Fetch recipients from the DB
  const fetchRecipients = async ()=>{
    try {
      const response = await fetch('http://localhost:8080/api/recipients') 
      if (!response.ok){
        throw new Error('Failed to fetch data from the server');    
      }
      const data = await response.json();

      // IF DB is empty, Go backend might send null, so we default to an empty array
      setRecipients(data || [])
      setError(null)
    } catch (err) {
      console.error("Fetch error:", err)
      setError("Cannot connect to Go Backend. Make sure your Go server is running on port 8080!");
    } finally{  
      setLoading(false)
    }
  }
}

export default App
