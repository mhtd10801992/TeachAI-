import { useState } from "react";
import API from "../api/api";

export default function FileUploader() {
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const uploadFile = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await API.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setResponse(res.data);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Upload Document</h2>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        disabled={loading}
      />

      <button 
        onClick={uploadFile} 
        disabled={!file || loading}
        style={{ marginLeft: 10 }}
      >
        {loading ? 'Uploading...' : 'Upload'}
      </button>

      {error && (
        <div style={{ marginTop: 20, color: 'red' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {response && (
        <pre style={{ marginTop: 20, color: 'green' }}>
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  );
}