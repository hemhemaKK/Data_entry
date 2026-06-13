import React, { useState, useRef } from 'react';
import { uploadsApi } from '../services/api';
import { UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UploadPage() {
    const [file1, setFile1] = useState(null);
    const [file2, setFile2] = useState(null);
    const [uploading1, setUploading1] = useState(false);
    const [uploading2, setUploading2] = useState(false);
    const [error1, setError1] = useState(null);
    const [error2, setError2] = useState(null);
    const fileInputRef1 = useRef(null);
    const fileInputRef2 = useRef(null);
    const navigate = useNavigate();

    const handleFileChange = (e, templateType) => {
        if (e.target.files && e.target.files[0]) {
            if (templateType === 'template1') {
                setFile1(e.target.files[0]);
                setError1(null);
            } else {
                setFile2(e.target.files[0]);
                setError2(null);
            }
        }
    };

    const handleDrop = (e, templateType) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            if (templateType === 'template1') {
                setFile1(e.dataTransfer.files[0]);
                setError1(null);
            } else {
                setFile2(e.dataTransfer.files[0]);
                setError2(null);
            }
        }
    };

    const handleUpload = async (templateType) => {
        const file = templateType === 'template1' ? file1 : file2;
        const setUploading = templateType === 'template1' ? setUploading1 : setUploading2;
        const setError = templateType === 'template1' ? setError1 : setError2;

        if (!file) return;
        setUploading(true);
        try {
            const result = await uploadsApi.uploadFile(file, templateType);
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
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {/* Template 1 */}
                <div className="card" style={{ flex: '1 1 400px', maxWidth: '600px' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.25rem' }}>Upload (Template 1)</h2>
                    <p style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Place = Filename, Party = Sheet Name
                    </p>
                    <div 
                        className="dropzone" 
                        onDragOver={(e) => e.preventDefault()} 
                        onDrop={(e) => handleDrop(e, 'template1')}
                        onClick={() => fileInputRef1.current.click()}
                    >
                        <UploadCloud size={48} />
                        <h3>{file1 ? file1.name : "Click or drag & drop to upload"}</h3>
                        <p style={{fontSize: '0.875rem'}}>Support for .xlsx and .xls files</p>
                        <input 
                            type="file" 
                            ref={fileInputRef1} 
                            style={{ display: 'none' }} 
                            accept=".xlsx, .xls"
                            onChange={(e) => handleFileChange(e, 'template1')}
                        />
                    </div>
                    
                    {error1 && <div style={{ color: 'var(--error)', marginTop: '1rem', textAlign: 'center' }}>{error1}</div>}
                    
                    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <button 
                            className="btn" 
                            onClick={() => handleUpload('template1')} 
                            disabled={!file1 || uploading1}
                            style={{ opacity: (!file1 || uploading1) ? 0.5 : 1 }}
                        >
                            {uploading1 ? 'Processing...' : 'Validate File'}
                        </button>
                    </div>
                </div>

                {/* Template 2 */}
                <div className="card" style={{ flex: '1 1 400px', maxWidth: '600px' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.25rem' }}>Upload (Template 2)</h2>
                    <p style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Place = Sheet Name, Party = Column "Party Name"
                    </p>
                    <div 
                        className="dropzone" 
                        onDragOver={(e) => e.preventDefault()} 
                        onDrop={(e) => handleDrop(e, 'template2')}
                        onClick={() => fileInputRef2.current.click()}
                    >
                        <UploadCloud size={48} />
                        <h3>{file2 ? file2.name : "Click or drag & drop to upload"}</h3>
                        <p style={{fontSize: '0.875rem'}}>Support for .xlsx and .xls files</p>
                        <input 
                            type="file" 
                            ref={fileInputRef2} 
                            style={{ display: 'none' }} 
                            accept=".xlsx, .xls"
                            onChange={(e) => handleFileChange(e, 'template2')}
                        />
                    </div>
                    
                    {error2 && <div style={{ color: 'var(--error)', marginTop: '1rem', textAlign: 'center' }}>{error2}</div>}
                    
                    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <button 
                            className="btn btn-secondary" 
                            onClick={() => handleUpload('template2')} 
                            disabled={!file2 || uploading2}
                            style={{ opacity: (!file2 || uploading2) ? 0.5 : 1 }}
                        >
                            {uploading2 ? 'Processing...' : 'Validate File'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
