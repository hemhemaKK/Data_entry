import React, { useEffect, useState, useRef } from "react";
import { getYears, billRecordsApi } from "../services/api";
import QuickEntryForm from "../components/QuickEntryForm";
import RecordFormModal from "../components/RecordFormModal";
import { FaEdit, FaTrashAlt, FaSave, FaTimes } from "react-icons/fa";

const Home = () => {
  const [years, setYears] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineForm, setInlineForm] = useState({ date: '', van: '', weight: '', rate: '', laggage: '', collie: '', flower_id: null });

  const inlineDateRef = useRef(null);
  const inlineVanRef = useRef(null);
  const inlineWeightRef = useRef(null);
  const inlineRateRef = useRef(null);
  const inlineSaveRef = useRef(null);

  const handleInlineEnterKey = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
      } else if (nextRef === 'submit') {
        handleUpdateRecord();
      }
    }
  };

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
    setTimeout(() => {
      if (inlineDateRef.current) inlineDateRef.current.focus();
    }, 50);
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
    if (!await window.confirmAsync("Are you sure you want to delete this record?")) return;
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
        <div className="card" style={{ marginBottom: '1rem', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 className="card-title" style={{ fontSize: '1.25rem', margin: 0 }}>
              {searchTerm ? "Search Results" : "Recent Entries (Last 24 Hrs)"}
            </h2>
            <input 
              type="text" 
              placeholder="Search by Group, Party, or Flower..." 
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
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Van</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Group</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Party</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Flower</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Weight</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Rate</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total</th>
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
                          <td style={{ padding: '0.75rem', textAlign: 'left' }}>
                            <input type="date" value={inlineForm.date} onChange={e => setInlineForm({...inlineForm, date: e.target.value})} onKeyDown={(e) => handleInlineEnterKey(e, inlineVanRef)} ref={inlineDateRef} style={{ width: '100%', padding: '0.25rem' }} />
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <input type="text" value={inlineForm.van} onChange={e => setInlineForm({...inlineForm, van: e.target.value})} onKeyDown={(e) => handleInlineEnterKey(e, inlineWeightRef)} ref={inlineVanRef} style={{ width: '100%', padding: '0.25rem', textAlign: 'right' }} />
                          </td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>{entry.place_name}</td>
                          <td style={{ padding: '0.75rem', fontWeight: 500, textAlign: 'right' }}>{entry.client_name}</td>
                          <td style={{ padding: '0.75rem', color: 'var(--primary)', textAlign: 'right' }}>{entry.flower_name}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <input type="number" step="0.001" value={inlineForm.weight} onChange={e => setInlineForm({...inlineForm, weight: e.target.value})} onKeyDown={(e) => handleInlineEnterKey(e, inlineRateRef)} ref={inlineWeightRef} style={{ width: '60px', padding: '0.25rem', textAlign: 'right' }} /> kg
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <input type="number" step="0.01" value={inlineForm.rate} onChange={e => setInlineForm({...inlineForm, rate: e.target.value})} onKeyDown={(e) => handleInlineEnterKey(e, inlineSaveRef)} ref={inlineRateRef} style={{ width: '60px', padding: '0.25rem', textAlign: 'right' }} />
                          </td>
                          <td style={{ padding: '0.75rem', fontWeight: 'bold', textAlign: 'right' }}>
                            {((parseFloat(inlineForm.weight) || 0) * (parseFloat(inlineForm.rate) || 0)).toFixed(2)}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button onClick={handleUpdateRecord} ref={inlineSaveRef} onKeyDown={(e) => handleInlineEnterKey(e, 'submit')} className="icon-btn icon-btn-sm" title="Save" style={{ marginRight: '4px', color: 'var(--success)' }}>
                              <FaSave />
                            </button>
                            <button onClick={handleCancelEdit} className="icon-btn icon-btn-sm icon-btn-danger" title="Cancel">
                              <FaTimes />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '0.75rem', textAlign: 'left' }}>{entry.date}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{entry.van}</td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>{entry.place_name}</td>
                          <td style={{ padding: '0.75rem', fontWeight: 500, textAlign: 'right' }}>{entry.client_name}</td>
                          <td style={{ padding: '0.75rem', color: 'var(--primary)', textAlign: 'right' }}>{entry.flower_name}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{entry.weight !== null && entry.weight !== undefined ? parseFloat(entry.weight).toFixed(3) : '-'} kg</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{entry.rate}</td>
                          <td style={{ padding: '0.75rem', fontWeight: 'bold', textAlign: 'right' }}>{(entry.weight * entry.rate).toFixed(2)}</td>
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



    </div>
  );
};

export default Home;
