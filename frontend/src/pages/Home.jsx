import React, { useEffect, useState } from "react";
import { getYears, createYear, updateYear, deleteYear, billRecordsApi } from "../services/api";
import YearCard from "../components/YearCard";
import QuickEntryForm from "../components/QuickEntryForm";
import RecordFormModal from "../components/RecordFormModal";
import { FaEdit, FaTrashAlt, FaSave, FaTimes } from "react-icons/fa";

const Home = () => {
  const [years, setYears] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newYear, setNewYear] = useState("");
  const [creating, setCreating] = useState(false);
  const [allTransactions, setAllTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineForm, setInlineForm] = useState({ date: '', van: '', weight: '', rate: '', laggage: '', collie: '', flower_id: null });

  const fetchYearsAndRecent = async () => {
    try {
      const data = await getYears();
      setYears(data);
      
      const transactions = await billRecordsApi.getTransactions();
      setAllTransactions(transactions);

    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYearsAndRecent();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newYear) return;
    setCreating(true);
    try {
      const created = await createYear(parseInt(newYear, 10));
      setYears([created, ...years]);
      setNewYear("");
    } catch (err) {
      console.error(err);
      setError("Failed to create year");
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async (id, currentYear) => {
    const newVal = window.prompt("Enter new year value:", currentYear);
    if (!newVal) return;
    const parsed = parseInt(newVal, 10);
    if (isNaN(parsed)) {
      alert("Invalid year");
      return;
    }
    if (!window.confirm(`Update year ${currentYear} to ${parsed}?`)) return;
    try {
      const updated = await updateYear(id, parsed);
      setYears(years.map((y) => (y.id === id ? updated : y)));
    } catch (err) {
      console.error(err);
      alert("Failed to update year");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this year?")) return;
    try {
      await deleteYear(id);
      setYears(years.filter((y) => y.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete year");
    }
  };

  const handleEditRecord = (record) => {
    setInlineEditId(record.id);
    setInlineForm({
      date: record.date || '',
      van: record.van || '',
      weight: record.weight || '',
      rate: record.rate || '',
      laggage: record.laggage || 0,
      collie: record.collie || 0,
      flower_id: record.flower_id
    });
  };

  const handleUpdateRecord = async () => {
    if (!inlineEditId) return;
    const entry = allTransactions.find(t => t.id === inlineEditId);
    const f_id = inlineForm.flower_id || (entry ? entry.flower_id : null);

    if (!f_id) {
      alert("Validation Error: Missing flower ID. Please refresh the page and try again.");
      return;
    }

    const payload = {
      date: inlineForm.date || null,
      van: inlineForm.van || null,
      weight: parseFloat(inlineForm.weight) || 0,
      rate: parseFloat(inlineForm.rate) || 0,
      laggage: parseFloat(inlineForm.laggage) || 0,
      collie: parseFloat(inlineForm.collie) || 0,
      flower_id: f_id
    };
    try {
      await billRecordsApi.updateRecord(inlineEditId, payload);
      setInlineEditId(null);
      fetchYearsAndRecent();
    } catch (err) {
      alert("Failed to update record");
      console.error(err);
    }
  };

  const handleCancelEdit = () => {
    setInlineEditId(null);
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await billRecordsApi.deleteRecord(recordId);
      fetchYearsAndRecent();
    } catch (err) {
      alert("Failed to delete record");
      console.error(err);
    }
  };

  // Filter logic
  const filteredTransactions = allTransactions.filter(t => {
    if (!searchTerm) {
      // If no search, show last 24 hrs
      const now = new Date();
      now.setHours(0,0,0,0);
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const tDate = new Date(t.date);
      return tDate >= yesterday;
    }
    const term = searchTerm.toLowerCase();
    return (t.client_name || "").toLowerCase().includes(term) ||
           (t.place_name || "").toLowerCase().includes(term) ||
           (t.flower_name || "").toLowerCase().includes(term);
  });

  if (loading) return <div className="page-title">Loading years...</div>;
  if (error) return <div className="page-title error">{error}</div>;

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      
      {/* Quick Manual Entry */}
      <QuickEntryForm onRecordAdded={fetchYearsAndRecent} />

      {/* Recent Entries */}
      {allTransactions.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 className="card-title" style={{ fontSize: '1.25rem', margin: 0 }}>
              {searchTerm ? "Search Results" : "Recent Entries (Last 24 Hrs)"}
            </h2>
            <input 
              type="text" 
              placeholder="Search by Place, User, or Flower..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', minWidth: '250px' }}
            />
          </div>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th style={{ padding: '0.75rem' }}>Date</th>
                  <th style={{ padding: '0.75rem' }}>Van</th>
                  <th style={{ padding: '0.75rem' }}>Place</th>
                  <th style={{ padding: '0.75rem' }}>Client</th>
                  <th style={{ padding: '0.75rem' }}>Flower</th>
                  <th style={{ padding: '0.75rem' }}>Weight</th>
                  <th style={{ padding: '0.75rem' }}>Rate</th>
                  <th style={{ padding: '0.75rem' }}>Total</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(entry => {
                  const isEditing = inlineEditId === entry.id;
                  return (
                    <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)', background: isEditing ? 'var(--bg-secondary)' : 'transparent' }}>
                      {isEditing ? (
                        <>
                          <td style={{ padding: '0.75rem' }}>
                            <input type="date" value={inlineForm.date} onChange={e => setInlineForm({...inlineForm, date: e.target.value})} style={{ width: '100%', padding: '0.25rem' }} />
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <input type="text" value={inlineForm.van} onChange={e => setInlineForm({...inlineForm, van: e.target.value})} style={{ width: '100%', padding: '0.25rem' }} />
                          </td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{entry.place_name}</td>
                          <td style={{ padding: '0.75rem', fontWeight: 500 }}>{entry.client_name}</td>
                          <td style={{ padding: '0.75rem', color: 'var(--primary)' }}>{entry.flower_name}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <input type="number" step="0.001" value={inlineForm.weight} onChange={e => setInlineForm({...inlineForm, weight: e.target.value})} style={{ width: '60px', padding: '0.25rem' }} /> kg
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            ₹<input type="number" step="0.01" value={inlineForm.rate} onChange={e => setInlineForm({...inlineForm, rate: e.target.value})} style={{ width: '60px', padding: '0.25rem' }} />
                          </td>
                          <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>
                            ₹{((parseFloat(inlineForm.weight) || 0) * (parseFloat(inlineForm.rate) || 0)).toFixed(2)}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button onClick={handleUpdateRecord} className="icon-btn icon-btn-sm" title="Save" style={{ marginRight: '4px', color: 'var(--success)' }}>
                              <FaSave />
                            </button>
                            <button onClick={handleCancelEdit} className="icon-btn icon-btn-sm icon-btn-danger" title="Cancel">
                              <FaTimes />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '0.75rem' }}>{entry.date}</td>
                          <td style={{ padding: '0.75rem' }}>{entry.van}</td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{entry.place_name}</td>
                          <td style={{ padding: '0.75rem', fontWeight: 500 }}>{entry.client_name}</td>
                          <td style={{ padding: '0.75rem', color: 'var(--primary)' }}>{entry.flower_name}</td>
                          <td style={{ padding: '0.75rem' }}>{entry.weight} kg</td>
                          <td style={{ padding: '0.75rem' }}>₹{entry.rate}</td>
                          <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>₹{(entry.weight * entry.rate).toFixed(2)}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button onClick={() => handleEditRecord(entry)} className="icon-btn icon-btn-sm" title="Edit" style={{ marginRight: '4px' }}>
                              <FaEdit />
                            </button>
                            <button onClick={() => handleDeleteRecord(entry.id)} className="icon-btn icon-btn-sm icon-btn-danger" title="Delete">
                              <FaTrashAlt />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <h2 className="page-title" style={{ marginTop: '2rem', fontSize: '1.5rem' }}>Year Management</h2>
      <form onSubmit={handleCreate} className="mb-4" style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          type="number"
          placeholder="Enter year"
          value={newYear}
          onChange={(e) => setNewYear(e.target.value)}
          className="input"
          style={{ padding: "0.5rem", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}
          required
        />
        <button type="submit" className="btn" disabled={creating}>
          {creating ? "Creating…" : "Add Year"}
        </button>
      </form>
      {years.length === 0 ? (
        <p>No years found. Create some using the form above.</p>
      ) : (
        <div className="metrics-grid">
          {years.map((yr) => (
            <YearCard key={yr.id} year={yr.year} id={yr.id} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

    </div>
  );
};

export default Home;
