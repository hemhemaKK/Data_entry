import React, { useState, useEffect } from 'react';
import { uploadsApi } from '../services/api';
import { Link } from 'react-router-dom';
import { Trash2, Table2, ArrowLeft } from 'lucide-react';

export default function Transactions() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState('');

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

    if (loading) return <div style={{ fontSize: '1.5rem', fontWeight: 'bold', padding: '2rem' }}>Loading...</div>;

    return (
        <div>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem'}}>
                <Link to="/" className="btn" style={{background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem'}}>
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
              <Table2 size={28} style={{ color: 'var(--primary)' }} />
              <h1 className="page-title" style={{ margin: 0 }}>Transactions</h1>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                A ledger of all uploaded Excel files.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Date Filter:</label>
                <input 
                  type="date" 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
                {dateFilter && (
                  <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => setDateFilter('')}>Clear</button>
                )}
              </div>
            </div>

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
                        {files
                            .filter(f => !dateFilter || f.upload_date.startsWith(dateFilter))
                            .sort((a,b) => new Date(b.upload_date) - new Date(a.upload_date))
                            .map(file => (
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
                                        <Link to={`/results/${file.id}`} className="btn" style={{padding: '0.25rem 0.5rem'}} title="View Data & Results">
                                            View
                                        </Link>

                                        <button className="btn btn-danger" style={{padding: '0.25rem 0.5rem'}} onClick={() => handleDelete(file.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {files.filter(f => !dateFilter || f.upload_date.startsWith(dateFilter)).length === 0 && (
                            <tr><td colSpan="5" style={{textAlign: 'center'}}>No matching files found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
