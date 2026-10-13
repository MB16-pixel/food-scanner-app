import { useState, useEffect } from "react";

function App() {
  const [backendStatus, setBackendStatus] = useState("Connecting...");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState("");
  const [loading, setLoading] = useState(false);

  // Check backend health on load
  useEffect(() => {
    fetch("http://localhost:5000/api/health")
      .then((res) => res.json())
      .then((data) => setBackendStatus(data.message))
      .catch(() => setBackendStatus("Failed to connect to backend"));
  }, []);

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
    <div
      style={{
        maxWidth: "500px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <h2>Food Ingredient Scanner</h2>
      <p style={{ fontSize: "14px", color: "#666" }}>
        Backend status: {backendStatus}
      </p>

      <div
        style={{
          margin: "20px 0",
          padding: "20px",
          border: "2px dashed #ccc",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <input
          type="file"
          accept="image/*"
          capture="environment" // Triggers phone camera directly on mobile browsers!
          onChange={handleFileChange}
          style={{ display: "block", margin: "10px auto" }}
        />

        {previewUrl && (
          <div style={{ marginTop: "15px" }}>
            <img
              src={previewUrl}
              alt="Ingredient Preview"
              style={{
                maxWidth: "100%",
                maxHeight: "250px",
                borderRadius: "4px",
              }}
            />
          </div>
        )}
      </div>

      {selectedFile && (
        <button
          onClick={handleScan}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: "#007bff",
            color: "#white",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          {loading ? "Analyzing with Gemini..." : "Scan Ingredients"}
        </button>
      )}

      {analysisResult && (
        <div
          style={{
            marginTop: "25px",
            padding: "15px",
            background: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #ddd",
          }}
        >
          <h3>Analysis Report:</h3>
          <p style={{ whiteSpace: "pre-line", lineHeight: "1.5" }}>
            {analysisResult}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
