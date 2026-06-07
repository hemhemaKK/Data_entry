import React, { useState, useRef } from 'react';
import { uploadsApi } from '../services/api';
import { UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UploadPage() {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            const result = await uploadsApi.uploadFile(file);
            navigate(`/results/${result.id}`);
        } catch (err) {
            const detail = err.response?.data?.detail;
            if (detail === "DUPLICATE_EXCEL") {
                alert("Duplicate Excel detected! You have already uploaded this exact file.");
                setError("Duplicate file. Please upload a new or modified Excel file.");
            } else {
                setError(detail || "An error occurred during upload.");
            }
            setUploading(false);
        }
    };

    return (
        <div>
            <h1 className="page-title">Upload Excel File</h1>
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div 
                    className="dropzone" 
                    onDragOver={(e) => e.preventDefault()} 
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current.click()}
                >
                    <UploadCloud size={48} />
                    <h3>{file ? file.name : "Click or drag & drop to upload"}</h3>
                    <p style={{fontSize: '0.875rem'}}>Support for .xlsx and .xls files</p>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                    />
                </div>
                
                {error && <div style={{ color: 'var(--error)', marginTop: '1rem', textAlign: 'center' }}>{error}</div>}
                
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <button 
                        className="btn" 
                        onClick={handleUpload} 
                        disabled={!file || uploading}
                        style={{ opacity: (!file || uploading) ? 0.5 : 1 }}
                    >
                        {uploading ? 'Processing...' : 'Validate File'}
                    </button>
                </div>
            </div>
        </div>
    );
}
