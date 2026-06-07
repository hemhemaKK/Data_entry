import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { uploadsApi } from '../services/api';
import { Download, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import SearchBar from '../components/SearchBar';

export default function ValidationResults() {
    const { id } = useParams();
    const [upload, setUpload] = useState(null);
    const [excelData, setExcelData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchFilter, setSearchFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [expandedSheets, setExpandedSheets] = useState({});

    const toggleSheet = (sheetName) => {
        setExpandedSheets(prev => ({ ...prev, [sheetName]: !prev[sheetName] }));
    };

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await uploadsApi.getUploadDetails(id);
                setUpload(data);
                
                // Try to fetch excel data
                try {
                    const parsedData = await uploadsApi.getExcelData(id);
                    setExcelData(parsedData);
                } catch (e) {
                    console.log("Could not fetch excel data", e);
                }
            } catch (error) {
                console.error("Failed to fetch details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    if (loading) return <div>Loading...</div>;
    if (!upload) return <div>File not found</div>;

    return (
        <div>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem'}}>
                <Link to="/transactions" className="btn" style={{background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)'}}>
                    <ArrowLeft size={16} /> Back
                </Link>
                <h1 className="page-title" style={{margin: 0}}>Validation Results</h1>
            </div>
            
            <div className="card" style={{marginBottom: '2rem'}}>
                <h2>{upload.original_file_name}</h2>
                <div style={{display: 'flex', gap: '2rem', marginTop: '1rem'}}>
                    <div>
                        <span className="metric-label">Status</span>
                        <div style={{marginTop: '0.5rem'}}>
                            <span className={`status-badge status-${upload.status.toLowerCase()}`}>
                                {upload.status}
                            </span>
                        </div>
                    </div>
                    <div>
                        <span className="metric-label">Errors Found</span>
                        <div style={{marginTop: '0.5rem', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--error)'}}>
                            {upload.error_count}
                        </div>
                    </div>
                    {upload.error_count > 0 && (
                        <div style={{ marginLeft: 'auto' }}>
                            <a href={uploadsApi.downloadReportUrl(upload.id)} className="btn" download>
                                <Download size={20} /> Download Error Report
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {upload.errors && upload.errors.length > 0 && (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Sheet</th>
                                <th>Row</th>
                                <th>Column</th>
                                <th>Error Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {upload.errors.map(err => (
                                <tr key={err.id}>
                                    <td>{err.sheet_name || 'N/A'}</td>
                                    <td>{err.row_number || 'N/A'}</td>
                                    <td>{err.column_name || 'N/A'}</td>
                                    <td style={{color: 'var(--error)'}}>{err.error_message}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {upload.errors && upload.errors.length === 0 && upload.status === 'SUCCESS' && (
                <div className="card" style={{textAlign: 'center', color: 'var(--success)', marginBottom: '2rem'}}>
                    <h3>Success! No errors found. The file is perfectly valid.</h3>
                </div>
            )}

            {/* Display parsed excel data */}
            {excelData && Object.keys(excelData).length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h2 style={{ margin: 0 }}>Excel Data Overview</h2>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ width: '250px' }}>
                                <SearchBar 
                                    value={searchFilter} 
                                    onChange={setSearchFilter} 
                                    placeholder="Search any text..." 
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>From:</label>
                                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>To:</label>
                                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                            </div>
                            {(fromDate || toDate) && (
                                <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => { setFromDate(''); setToDate(''); }}>Clear Dates</button>
                            )}
                        </div>
                    </div>
                    {Object.entries(excelData).map(([sheetName, rows]) => {
                        const filteredRows = rows
                            .filter(row => {
                                // Text search
                                if (searchFilter) {
                                    const term = searchFilter.toLowerCase();
                                    const matchesText = Object.values(row).some(val => 
                                        val !== null && val !== undefined && String(val).toLowerCase().includes(term)
                                    );
                                    if (!matchesText) return false;
                                }

                                // Date range
                                const d = row['date'] || row['Date'] || row['DATE'];
                                const rowDateStr = d ? String(d).substring(0, 10) : null;

                                if (fromDate && rowDateStr && rowDateStr < fromDate) return false;
                                if (toDate && rowDateStr && rowDateStr > toDate) return false;

                                return true;
                            })
                            .sort((a, b) => {
                                const da = a['date'] || a['Date'] || a['DATE'] || '';
                                const db = b['date'] || b['Date'] || b['DATE'] || '';
                                if (!da && !db) return 0;
                                if (!da) return 1;
                                if (!db) return -1;
                                return new Date(db) - new Date(da);
                            });

                        return (
                            <div key={sheetName} className="card" style={{ marginBottom: '1rem', overflowX: 'auto', padding: '0' }}>
                                <div 
                                    onClick={() => toggleSheet(sheetName)}
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', cursor: 'pointer', background: expandedSheets[sheetName] ? 'var(--surface)' : 'transparent' }}
                                >
                                    <h3 style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {expandedSheets[sheetName] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        Sheet: {sheetName}
                                    </h3>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {filteredRows.length} record(s)
                                    </span>
                                </div>
                                {expandedSheets[sheetName] && (
                                    <div style={{ padding: '0 1rem 1rem 1rem' }}>
                                        {filteredRows.length > 0 ? (
                                            <table className="results-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                                        {Object.keys(rows[0]).map(key => (
                                                            <th key={key} style={{ padding: '8px' }}>{key.toUpperCase()}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredRows.map((row, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                                            {Object.entries(row).map(([key, val], j) => (
                                                                <td key={j} style={{ padding: '8px' }}>
                                                                    {val !== null && val !== undefined 
                                                                        ? (key.toLowerCase() === 'weight' ? parseFloat(val).toFixed(3) : String(val)) 
                                                                        : '-'}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <p style={{ color: 'var(--text-secondary)' }}>No matching data in this sheet.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
