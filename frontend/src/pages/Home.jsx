import React, { useEffect, useState, useRef } from "react";
import { getYears, billRecordsApi } from "../services/api";
import QuickEntryForm from "../components/QuickEntryForm";
import ExcelEntryGrid from "../components/ExcelEntryGrid";
import RecordFormModal from "../components/RecordFormModal";
import { FaEdit, FaTrashAlt, FaSave, FaTimes } from "react-icons/fa";
import { formatDateDisplay } from '../utils/formatters';

const Home = () => {
  const [years, setYears] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFlower, setFilterFlower] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineForm, setInlineForm] = useState({ date: '', van: '', weight: '', rate: '', laggage: '', collie: '', flower_id: null });

  const [entryMode, setEntryMode] = useState('quick'); // 'quick' or 'excel'

  const [selectedRecords, setSelectedRecords] = useState([]);
  const [bulkLaggage, setBulkLaggage] = useState('');
  const [bulkCollie, setBulkCollie] = useState('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const inlineDateRef = useRef(null);
  const inlineVanRef = useRef(null);
  const inlineWeightRef = useRef(null);
  const inlineRateRef = useRef(null);
  const inlineLaggageRef = useRef(null);
  const inlineCollieRef = useRef(null);
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

  const fetchYears = async () => {
    try {
      const data = await getYears();
      setYears(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load years");
    }
  };

  const fetchTransactions = async (query = "") => {
    try {
      const transactions = await billRecordsApi.getTransactions(query);
      setAllTransactions(transactions);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTransactions(searchTerm);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const refreshTransactions = () => fetchTransactions(searchTerm);




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
      refreshTransactions();
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
      refreshTransactions();
    } catch (err) {
      alert("Failed to delete record");
      console.error(err);
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedRecords.length === 0) return;
    if (bulkLaggage === '' && bulkCollie === '') {
      alert("Please enter a value for Laggage or Collie to update.");
      return;
    }
    
    if (!await window.confirmAsync(`Update ${selectedRecords.length} selected record(s)?`)) return;
    
    setIsBulkUpdating(true);
    try {
      const updates = selectedRecords.map(id => {
        const record = allTransactions.find(t => t.id === id);
        if (!record) return null;
        
        const payload = {
          date: record.date || null,
          van: record.van || null,
          weight: record.weight || 0,
          rate: record.rate || 0,
          flower_id: record.flower_id,
          laggage: bulkLaggage !== '' ? parseFloat(bulkLaggage) : record.laggage,
          collie: bulkCollie !== '' ? parseFloat(bulkCollie) : record.collie,
        };
        return billRecordsApi.updateRecord(id, payload);
      }).filter(Boolean);
      
      await Promise.all(updates);
      setSelectedRecords([]);
      setBulkLaggage('');
      setBulkCollie('');
      refreshTransactions();
    } catch (err) {
      console.error(err);
      alert("Failed to update some records.");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRecords.length === 0) return;
    if (!await window.confirmAsync(`Are you sure you want to delete ${selectedRecords.length} selected record(s)?`)) return;
    
    setIsBulkUpdating(true);
    try {
      await Promise.all(selectedRecords.map(id => billRecordsApi.deleteRecord(id)));
      setSelectedRecords([]);
      refreshTransactions();
    } catch (err) {
      console.error(err);
      alert("Failed to delete some records.");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Filter logic
  let filteredTransactions = allTransactions.filter(t => {
    let matches = true;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = 
        (t.place_name && t.place_name.toLowerCase().includes(searchLower)) ||
        (t.client_name && t.client_name.toLowerCase().includes(searchLower)) ||
        (t.flower_name && t.flower_name.toLowerCase().includes(searchLower));
      if (!matchSearch) matches = false;
    }

    if (filterFlower && t.flower_name !== filterFlower) {
      matches = false;
    }
    if (filterDateFrom && (!t.date || t.date < filterDateFrom)) {
      matches = false;
    }
    if (filterDateTo && (!t.date || t.date > filterDateTo)) {
      matches = false;
    }
    if (filterMonth) {
      if (!t.date || !t.date.startsWith(filterMonth)) {
        matches = false;
      }
    }

    return matches;
  });

  const isDefaultView = !searchTerm && !filterDateFrom && !filterDateTo && !filterMonth && !filterFlower;
  if (isDefaultView) {
    filteredTransactions = filteredTransactions.slice(0, 20);
  }

  if (loading) return <div className="page-title">Loading years...</div>;
  if (error) return <div className="page-title error">{error}</div>;

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button 
          className={`btn ${entryMode === 'quick' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setEntryMode('quick')}
        >
          Quick Manual Entry
        </button>
        <button 
          className={`btn ${entryMode === 'excel' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setEntryMode('excel')}
        >
          Excel Grid Entry
        </button>
      </div>

      {entryMode === 'quick' ? (
        <QuickEntryForm onRecordAdded={refreshTransactions} />
      ) : (
        <ExcelEntryGrid onRecordsSaved={refreshTransactions} />
      )}

      {/* Recent Entries */}
      {allTransactions.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
            <h2 className="card-title" style={{ fontSize: '1.25rem', margin: 0 }}>
              {(searchTerm || filterFlower || filterDateFrom || filterDateTo || filterMonth) ? "Search/Filter Results" : "Recent Entries (Latest 20)"}
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input"
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', minWidth: '150px' }}
              />
              <select 
                value={filterFlower} 
                onChange={(e) => setFilterFlower(e.target.value)}
                className="select-input"
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'white', color: 'black' }}
              >
                <option value="">All Flowers</option>
                {[...new Set(allTransactions.map(t => t.flower_name).filter(Boolean))].sort().map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <input 
                type="month" 
                value={filterMonth}
                onChange={(e) => {
                   setFilterMonth(e.target.value);
                   if (e.target.value) {
                     setFilterDateFrom('');
                     setFilterDateTo('');
                   }
                }}
                className="input black-icon"
                title="Filter by Month"
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'white', color: 'black' }}
              />
              <input 
                type="date" 
                value={filterDateFrom}
                onChange={(e) => {
                   setFilterDateFrom(e.target.value);
                   if (e.target.value) setFilterMonth('');
                }}
                className="input black-icon"
                title="From Date"
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'white', color: 'black' }}
              />
              <input 
                type="date" 
                value={filterDateTo}
                onChange={(e) => {
                   setFilterDateTo(e.target.value);
                   if (e.target.value) setFilterMonth('');
                }}
                className="input black-icon"
                title="To Date"
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'white', color: 'black' }}
              />
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setFilterFlower('');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                  setFilterMonth('');
                }}
                style={{ padding: '0.5rem 1rem' }}
              >
                Clear
              </button>
            </div>
          </div>
          {selectedRecords.length > 0 && (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--primary)' }}>
              <span style={{ fontWeight: 'bold' }}>{selectedRecords.length} selected</span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginLeft: 'auto' }}>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="Laggage ()" 
                  value={bulkLaggage}
                  onChange={(e) => setBulkLaggage(e.target.value)}
                  className="input"
                  style={{ width: '100px', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                />
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="Collie ()" 
                  value={bulkCollie}
                  onChange={(e) => setBulkCollie(e.target.value)}
                  className="input"
                  style={{ width: '100px', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                />
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={handleBulkUpdate} 
                  disabled={isBulkUpdating}
                >
                  {isBulkUpdating ? 'Updating...' : 'Update Selected'}
                </button>
                <div style={{ borderLeft: '1px solid var(--border)', height: '24px', margin: '0 0.5rem' }}></div>
                <button 
                  className="btn btn-danger btn-sm" 
                  onClick={handleBulkDelete}
                  disabled={isBulkUpdating}
                >
                  {isBulkUpdating ? 'Deleting...' : 'Delete Selected'}
                </button>
              </div>
            </div>
          )}
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'center', width: '40px' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedRecords.length > 0 && selectedRecords.length === filteredTransactions.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedRecords(filteredTransactions.map(t => t.id));
                        else setSelectedRecords([]);
                      }}
                    />
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Van</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Group</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Party</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Flower</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Weight</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Rate</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Laggage</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Collie</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(entry => {
                  const isEditing = inlineEditId === entry.id;
                  const isSelected = selectedRecords.includes(entry.id);
                  return (
                    <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)', background: isEditing || isSelected ? 'var(--bg-secondary)' : 'transparent' }}>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) setSelectedRecords(selectedRecords.filter(id => id !== entry.id));
                            else setSelectedRecords([...selectedRecords, entry.id]);
                          }}
                        />
                      </td>
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
                            <input type="number" step="0.01" value={inlineForm.rate} onChange={e => setInlineForm({...inlineForm, rate: e.target.value})} onKeyDown={(e) => handleInlineEnterKey(e, inlineLaggageRef)} ref={inlineRateRef} style={{ width: '60px', padding: '0.25rem', textAlign: 'right' }} />
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <input type="number" step="0.01" value={inlineForm.laggage} onChange={e => setInlineForm({...inlineForm, laggage: e.target.value})} onKeyDown={(e) => handleInlineEnterKey(e, inlineCollieRef)} ref={inlineLaggageRef} style={{ width: '60px', padding: '0.25rem', textAlign: 'right' }} />
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <input type="number" step="0.01" value={inlineForm.collie} onChange={e => setInlineForm({...inlineForm, collie: e.target.value})} onKeyDown={(e) => handleInlineEnterKey(e, inlineSaveRef)} ref={inlineCollieRef} style={{ width: '60px', padding: '0.25rem', textAlign: 'right' }} />
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
                          <td style={{ padding: '0.75rem', textAlign: 'left' }}>{formatDateDisplay(entry.date)}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{entry.van}</td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>{entry.place_name}</td>
                          <td style={{ padding: '0.75rem', fontWeight: 500, textAlign: 'right' }}>{entry.client_name}</td>
                          <td style={{ padding: '0.75rem', color: 'var(--primary)', textAlign: 'right' }}>{entry.flower_name}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{entry.weight !== null && entry.weight !== undefined ? parseFloat(entry.weight).toFixed(3) : '-'} kg</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{entry.rate}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{entry.laggage}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{entry.collie}</td>
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
