import React, { useState, useEffect } from 'react';
import { uploadsApi } from '../services/api';
import { Link } from 'react-router-dom';
import { Trash2, Download } from 'lucide-react';

export default function FilesList() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchFiles = async () => {
        try {
            const data = await uploadsApi.getUploads();
            setFiles(data);
        } catch (error) {
            console.error("Failed to fetch files", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    const handleDelete = async (id) => {
        if (await window.confirmAsync("Are you sure you want to delete this file?")) {
            try {
                await uploadsApi.deleteUpload(id);
                fetchFiles();
            } catch (error) {
                console.error("Delete failed", error);
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1 className="page-title">Processed Files</h1>
            
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>File Name</th>
                            <th>Status</th>
                            <th>Errors Found</th>
                            <th>Upload Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {files.map(file => (
                            <tr key={file.id}>
                                <td>{file.original_file_name}</td>
                                <td>
                                    <span className={`status-badge status-${file.status.toLowerCase()}`}>
                                        {file.status}
                                    </span>
                                </td>
                                <td>{file.error_count}</td>
                                <td>{new Date(file.upload_date).toLocaleString()}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Link to={`/results/${file.id}`} className="btn" style={{padding: '0.25rem 0.5rem'}}>View</Link>
                                        {file.error_count > 0 && (
                                            <a href={uploadsApi.downloadReportUrl(file.id)} className="btn" style={{padding: '0.25rem 0.5rem'}} download>
                                                <Download size={16} />
                                            </a>
                                        )}
                                        <button className="btn btn-danger" style={{padding: '0.25rem 0.5rem'}} onClick={() => handleDelete(file.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {files.length === 0 && (
                            <tr><td colSpan="5" style={{textAlign: 'center'}}>No files uploaded yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
