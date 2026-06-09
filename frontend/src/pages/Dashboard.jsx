import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../services/api';
import { Link } from 'react-router-dom';
import { FileUp, FileCheck, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await dashboardApi.getStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (!stats) return <div>Failed to load dashboard</div>;

    return (
        <div>
            <h1 className="page-title">Dashboard</h1>
            
            <div className="metrics-grid">
                <div className="card">
                    <div style={{color: 'var(--accent)'}}><FileUp size={32}/></div>
                    <div className="metric-value">{stats.total_uploads}</div>
                    <div className="metric-label">Total Files Uploaded</div>
                </div>
                <div className="card">
                    <div style={{color: 'var(--success)'}}><FileCheck size={32}/></div>
                    <div className="metric-value">{stats.processed_files}</div>
                    <div className="metric-label">Processed Files</div>
                </div>
                <div className="card">
                    <div style={{color: 'var(--error)'}}><AlertTriangle size={32}/></div>
                    <div className="metric-value">{stats.total_errors}</div>
                    <div className="metric-label">Validation Errors</div>
                </div>
            </div>

            <h2 style={{marginBottom: '1rem'}}>Recent Uploads</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>File Name</th>
                            <th>Status</th>
                            <th>Errors</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.recent_uploads.map(file => (
                            <tr key={file.id}>
                                <td>{file.original_file_name}</td>
                                <td>
                                    <span className={`status-badge status-${file.status.toLowerCase()}`}>
                                        {file.status}
                                    </span>
                                </td>
                                <td>{file.error_count}</td>
                                <td>{new Date(file.upload_date).toLocaleDateString()}</td>
                                <td>
                                    <Link to={`/results/${file.id}`} className="btn" style={{padding: '0.25rem 0.75rem', fontSize: '0.875rem'}}>View</Link>
                                </td>
                            </tr>
                        ))}
                        {stats.recent_uploads.length === 0 && (
                            <tr><td colSpan="5" style={{textAlign: 'center'}}>No recent uploads</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
