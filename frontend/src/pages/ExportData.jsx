import React, { useState, useEffect } from 'react';
import { getYears, getPlaces, getUsers, exportsApi } from '../services/api';
import { Download, History, Calendar, FileText } from 'lucide-react';

const ExportData = () => {
    const [years, setYears] = useState([]);
    const [places, setPlaces] = useState([]);
    const [users, setUsers] = useState([]);

    const [selectedYear, setSelectedYear] = useState('');
    const [selectedPlace, setSelectedPlace] = useState('');
    const [selectedUser, setSelectedUser] = useState('');

    const [filterType, setFilterType] = useState('dateRange'); // 'dateRange' or 'month'
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [month, setMonth] = useState('');

    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchYears();
        fetchHistory();
    }, []);

    useEffect(() => {
        if (selectedYear) fetchPlaces(selectedYear);
        else setPlaces([]);
        setSelectedPlace('');
    }, [selectedYear]);

    useEffect(() => {
        if (selectedPlace) fetchUsers(selectedPlace);
        else setUsers([]);
        setSelectedUser('');
    }, [selectedPlace]);

    async function fetchYears() {
        try {
            const data = await getYears();
            setYears(data);
            // Default to current year if available
            const currentYearStr = new Date().getFullYear().toString();
            const curr = data.find(y => y.year.toString() === currentYearStr);
            if (curr) setSelectedYear(curr.id);
        } catch (error) {
            console.error(error);
        }
    }

    async function fetchPlaces(yearId) {
        try {
            const data = await getPlaces(yearId);
            setPlaces(data);
        } catch (error) {
            console.error(error);
        }
    }

    async function fetchUsers(placeId) {
        try {
            const data = await getUsers(placeId);
            setUsers(data);
        } catch (error) {
            console.error(error);
        }
    }

    async function fetchHistory() {
        try {
            const data = await exportsApi.getHistory();
            setHistory(data);
        } catch (error) {
            console.error(error);
        }
    }

    const handleExport = async (e) => {
        e.preventDefault();
        if (!selectedYear) {
            alert("Year is required");
            return;
        }

        const payload = {
            year_id: parseInt(selectedYear),
            place_id: selectedPlace ? parseInt(selectedPlace) : null,
            user_id: selectedUser ? parseInt(selectedUser) : null,
        };

        if (filterType === 'dateRange') {
            payload.date_from = dateFrom || null;
            payload.date_to = dateTo || null;
        } else {
            payload.month = month || null;
        }

        setLoading(true);
        try {
            await exportsApi.generateExport(payload);
            fetchHistory();
            alert("Export generated successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to generate export. " + (error.response?.data?.detail || ""));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Download className="icon" /> Export Data
            </h1>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div className="card-header">
                    <h2 className="card-title">Generate New Export</h2>
                </div>
                <form onSubmit={handleExport} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: '1', minWidth: '150px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Year *</label>
                            <select className="select-input" value={selectedYear} onChange={e => setSelectedYear(e.target.value)} required style={{ width: '100%', padding: '0.5rem', fontSize: '1.05rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                                <option value="">-- Select Year --</option>
                                {years.map(y => <option key={y.id} value={y.id}>{y.year}</option>)}
                            </select>
                        </div>
                        <div style={{ flex: '1.5', minWidth: '200px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Group (Optional)</label>
                            <select className="select-input" value={selectedPlace} onChange={e => setSelectedPlace(e.target.value)} style={{ width: '100%', padding: '0.5rem', fontSize: '1.05rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                                <option value="">-- All Groups (Bulk) --</option>
                                {places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div style={{ flex: '1.5', minWidth: '200px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Party (Optional)</label>
                            <select className="select-input" value={selectedUser} onChange={e => setSelectedUser(e.target.value)} disabled={!selectedPlace} style={{ width: '100%', padding: '0.5rem', fontSize: '1.05rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                                <option value="">-- All Parties --</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', gap: '1.5rem', borderRight: '1px solid var(--border-color)', paddingRight: '2rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                                <input type="radio" id="dateRange" name="filterType" checked={filterType === 'dateRange'} onChange={() => setFilterType('dateRange')} />
                                Date Range
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                                <input type="radio" id="monthWise" name="filterType" checked={filterType === 'month'} onChange={() => setFilterType('month')} />
                                Month Wise
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', flex: '1', alignItems: 'center' }}>
                            {filterType === 'dateRange' ? (
                                <>
                                    <div style={{ flex: '1' }}>
                                        <input type="date" className="input" placeholder="From" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%', padding: '0.5rem', fontSize: '1.05rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                                    </div>
                                    <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>to</span>
                                    <div style={{ flex: '1' }}>
                                        <input type="date" className="input" placeholder="To" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '100%', padding: '0.5rem', fontSize: '1.05rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                                    </div>
                                </>
                            ) : (
                                <div style={{ flex: '1' }}>
                                    <input type="month" className="input" value={month} onChange={e => setMonth(e.target.value)} style={{ width: '100%', maxWidth: '250px', padding: '0.5rem', fontSize: '1.05rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                                </div>
                            )}
                        </div>

                        <div>
                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.6rem 2rem', fontSize: '1.1rem', whiteSpace: 'nowrap' }}>
                                {loading ? "Generating..." : "Generate Export"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <div className="card">
                <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <History className="icon" style={{ color: 'var(--primary)' }} />
                    <h2 className="card-title">Export History</h2>
                </div>
                <div className="table-container" style={{ padding: '1rem' }}>
                    {history.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '2rem' }}>No export history found.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Export Date</th>
                                    <th>Filename</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(item => (
                                    <tr key={item.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Calendar size={16} />
                                                {new Date(item.export_date).toLocaleString()}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                                <FileText size={16} />
                                                {item.filename}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="status-badge status-success">Completed</span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <a href={exportsApi.getDownloadUrl(item.id)} className="btn btn-primary" download style={{ padding: '0.5rem 1rem', textDecoration: 'none', display: 'inline-block' }}>
                                                Download
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExportData;
