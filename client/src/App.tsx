import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown"; // 1. Import the parser
import "./App.css";

function App() {
  // ... (keep all your existing state and functions the same)
  const [backendStatus, setBackendStatus] = useState("Connecting...");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/health")
      .then((res) => res.json())
      .then((data) => setBackendStatus(data.message))
      .catch(() => setBackendStatus("Failed to connect to backend"));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult("");
    }
  };

  const handleScan = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setAnalysisResult("");

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await fetch(
        "http://localhost:5000/api/scan-ingredients",
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();
      if (response.ok) {
        setAnalysisResult(data.analysis);
      } else {
        setAnalysisResult(data.error || "Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      setAnalysisResult("Network error while analyzing image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scanner-container">
      <h2>Food Ingredient Scanner</h2>
      {/* <p className="backend-status">Backend status: {backendStatus}</p> */}
      <p>The result provided is AI generated, use with caution.</p>

      <div className="upload-box">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="file-input"
        />

        {previewUrl && (
          <div className="preview-container">
            <img
              src={previewUrl}
              alt="Ingredient Preview"
              className="preview-image"
            />
          </div>
        )}
      </div>

      {selectedFile && (
        <button onClick={handleScan} disabled={loading} className="scan-button">
          {loading ? "Analyzing with Gemini..." : "Scan Ingredients"}
        </button>
      )}

      {analysisResult && (
        <div className="report-box">
          <h3>Analysis Report:</h3>
          {/* 2. Replace <p> with ReactMarkdown for clean formatting */}
          <div className="report-text">
            <ReactMarkdown>{analysisResult}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
