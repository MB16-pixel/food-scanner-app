import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState("");
  const [loading, setLoading] = useState(false);

  // Define your production backend URL
  const API_URL = "https://food-scanner-backend.onrender.com";

  // Optional: Keeps health check running in the background to wake up Render's free tier server
  useEffect(() => {
    fetch(`${API_URL}/api/health`).catch(() => {});
  }, [API_URL]);

  // Handle file selection (works with phone camera capture or photo library)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult("");
    }
  };

  // Send image to backend
  const handleScan = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setAnalysisResult("");

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await fetch(`${API_URL}/api/scan-ingredients`, {
        method: "POST",
        body: formData,
      });

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
      <p style={{ fontSize: "12px", color: "#666", marginBottom: "20px" }}>
        The result provided is AI generated, use with caution.
      </p>

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
          <div className="report-text">
            <ReactMarkdown>{analysisResult}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
