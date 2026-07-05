import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getYears, getPlaces, getUsers, advancesApi } from '../services/api';
import { Wallet, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { formatDateDisplay } from '../utils/formatters';

const Ledger = () => {
  const [years, setYears] = useState([]);
  const [places, setPlaces] = useState([]);
  const [users, setUsers] = useState([]);
  const [entries, setEntries] = useState([]);
  
  const [editingRowId, setEditingRowId] = useState(null);
  const [editFormData, setEditFormData] = useState({ date: '', advance_amount: '', deduction_amount: '', notes: '' });

  const [selectedRows, setSelectedRows] = useState(new Set());
  const [bulkDate, setBulkDate] = useState('');

  const [selectedYear, setSelectedYear] = useState('');
  const [selectedPlace, setSelectedPlace] = useState('');
  const [selectedUser, setSelectedUser] = useState('');

  const [date, setDate] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [deductionAmount, setDeductionAmount] = useState('');
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [allUsersForYear, setAllUsersForYear] = useState([]);

  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const dateRef = useRef(null);
  const advRef = useRef(null);
  const dedRef = useRef(null);
  const notesRef = useRef(null);
  const saveBtnRef = useRef(null);

  const handleEnterKey = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
      }
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    fetchYears();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchYears = async () => {
    try {
      const data = await getYears();
      const yearsData = data || [];
      setYears(yearsData);
      
      if (yearsData.length > 0) {
        const currentYearStr = new Date().getFullYear().toString();
        const currentYearObj = yearsData.find(y => y.year === currentYearStr);
        if (currentYearObj) {
            handleYearChange({ target: { value: currentYearObj.id } });
        } else {
            handleYearChange({ target: { value: yearsData[0].id } });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleYearChange = async (e) => {
    const yId = e.target.value;
    setSelectedYear(yId);
    setSelectedPlace('');
    setSelectedUser('');
    setUsers([]);
    setEntries([]);
    if (yId) {
      try {
        const p = await getPlaces(yId);
        const placesData = p || [];
        setPlaces(placesData);
        
        // Fetch all users to allow global search by name or place
        const allU = await getUsers();
        const validPlaceIds = new Set(placesData.map(pl => pl.id));
        const usersInYear = (allU || []).filter(u => validPlaceIds.has(u.place_id)).map(u => ({
           ...u,
           placeName: placesData.find(pl => pl.id === u.place_id)?.name || 'Unknown'
        }));
        setAllUsersForYear(usersInYear);
        setUsers(usersInYear); // By default show all users for the year if no place selected
      } catch (err) { console.error(err); }
    } else {
      setPlaces([]);
      setAllUsersForYear([]);
      setUsers([]);
    }
  };

  const handlePlaceChange = async (e) => {
    const pId = e.target.value;
    setSelectedPlace(pId);
    setSelectedUser('');
    setEntries([]);
    if (pId) {
      const filtered = allUsersForYear.filter(u => u.place_id === parseInt(pId));
      setUsers(filtered);
    } else {
      setUsers(allUsersForYear);
    }
  };

  const handleUserChange = async (e) => {
    setSelectedUser(e.target.value);
  };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      if (selectedUser) {
        const data = await advancesApi.getUserAdvances(selectedUser);
        setEntries(data || []);
      } else if (selectedYear) {
        const data = await advancesApi.getYearAdvances(selectedYear);
        setEntries(data || []);
      } else {
        setEntries([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [selectedUser, selectedYear]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedPlace, selectedUser, filterDateFrom, filterDateTo, searchQuery]);

  const handleEditClick = (e) => {
    setEditingRowId(e.id);
    setEditFormData({
      date: e.date || '',
      advance_amount: e.advance_amount || '',
      deduction_amount: e.deduction_amount || '',
      notes: e.notes || ''
    });
  };

  const handleEditSave = async (id) => {
    try {
      const payload = {
        date: editFormData.date,
        advance_amount: parseFloat(editFormData.advance_amount) || 0,
        deduction_amount: parseFloat(editFormData.deduction_amount) || 0,
        notes: editFormData.notes || '',
        user_id: entries.find(e => e.id === id)?.user_id
      };
      await advancesApi.updateAdvance(id, payload);
      setEditingRowId(null);
      fetchEntries();
    } catch (err) {
      alert("Failed to update entry.");
      console.error(err);
    }
  };

  const handleRowSelect = (id) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRows(newSet);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(new Set(entries.map(ent => ent.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleBulkDateUpdate = async () => {
    if (selectedRows.size === 0) return;
    if (!bulkDate) {
      alert("Please select a date first.");
      return;
    }
    try {
      setLoading(true);
      await advancesApi.bulkUpdateAdvanceDate({
        entry_ids: Array.from(selectedRows),
        date: bulkDate
      });
      setSelectedRows(new Set());
      setBulkDate('');
      fetchEntries();
    } catch (err) {
      console.error(err);
      alert("Failed to update dates");
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!selectedUser) return alert("Please select a Party first.");
    if (!date) return;
    
    const adv = parseFloat(advanceAmount) || 0;
    const ded = parseFloat(deductionAmount) || 0;
    
    if (adv === 0 && ded === 0) return alert("Enter either an Advance or Deduction amount.");

    setLoading(true);
    try {
      const payload = {
        date: date,
        advance_amount: adv,
        deduction_amount: ded,
        notes: notes,
        user_id: parseInt(selectedUser)
      };

      await advancesApi.createAdvance(payload);
      setAdvanceAmount('');
      setDeductionAmount('');
      setNotes('');
      fetchEntries(selectedUser);
      
      // Auto-focus date field for rapid sequential entry
      setTimeout(() => {
        if (dateRef.current) dateRef.current.focus();
      }, 50);
    } catch (err) {
      alert("Failed to add entry.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!await window.confirmAsync("Are you sure you want to delete this entry?")) return;
    try {
      await advancesApi.deleteAdvance(id);
      fetchEntries(selectedUser);
    } catch (err) {
      alert("Failed to delete.");
      console.error(err);
    }
  };

  // --- DATA PROCESSING LOGIC ---
  const entriesWithBalance = useMemo(() => {
      let baseEntries = [...entries];
      if (!selectedUser && selectedPlace) {
         const pId = parseInt(selectedPlace);
         const userMap = new Map();
         allUsersForYear.forEach(u => userMap.set(u.id, u.place_id));
         
         baseEntries = baseEntries.filter(e => {
             return userMap.get(e.user_id) === pId;
         });
      }

      // Optimization: Skip expensive sorting and balancing if we are not viewing a specific party's ledger
      if (!selectedUser) {
          return baseEntries;
      }

      // Sort ascending to calculate running balance accurately
      const sortedEntries = baseEntries.sort((a, b) => {
          if (a.date !== b.date) return a.date < b.date ? -1 : 1;
          return a.id - b.id;
      });
      
      let runningBalance = 0;
      return sortedEntries.map(e => {
          const prev = runningBalance;
          runningBalance += (e.advance_amount || 0) - (e.deduction_amount || 0);
          return { ...e, previousBalance: prev, newBalance: runningBalance };
      });
  }, [entries, selectedUser, selectedPlace, allUsersForYear]);

  const finalDisplayEntries = useMemo(() => {
      let displayEntries = [...entriesWithBalance];
      if (filterDateFrom) {
         displayEntries = displayEntries.filter(e => e.date >= filterDateFrom);
      }
      if (filterDateTo) {
         displayEntries = displayEntries.filter(e => e.date <= filterDateTo);
      }
      if (debouncedSearchQuery.trim() !== '') {
         const sq = debouncedSearchQuery.toLowerCase();
         displayEntries = displayEntries.filter(e => {
             const u = e.user_name;
             const p = e.place_name;
             return (u && u.toLowerCase().includes(sq)) ||
                    (p && p.toLowerCase().includes(sq));
         });
      }
      
      if (selectedUser) {
          // Reverse back to descending (newest first) for display
          return displayEntries.reverse();
      }
      return displayEntries;
  }, [entriesWithBalance, filterDateFrom, filterDateTo, debouncedSearchQuery, selectedUser]);

  const totalAdvance = useMemo(() => finalDisplayEntries.reduce((sum, e) => sum + (e.advance_amount || 0), 0), [finalDisplayEntries]);
  const totalDeduction = useMemo(() => finalDisplayEntries.reduce((sum, e) => sum + (e.deduction_amount || 0), 0), [finalDisplayEntries]);

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title"><Wallet className="icon" /> Ledger: Advances & Deductions</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>Add Entry</h2>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <select className="select-input" value={selectedYear} onChange={handleYearChange} style={{ padding: '0.5rem', fontSize: '1.2rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'white', color: 'black', minWidth: '120px' }}>
                <option value="" style={{ color: 'black' }}>-- Select Year --</option>
                {years.map(y => <option key={y.id} value={y.id} style={{ color: 'black' }}>{y.year}</option>)}
              </select>
              
              <select className="select-input" value={selectedPlace} onChange={handlePlaceChange} disabled={!selectedYear} style={{ padding: '0.5rem', fontSize: '1.2rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'white', color: 'black', minWidth: '150px' }}>
                <option value="" style={{ color: 'black' }}>-- All Groups --</option>
                {places.map(p => <option key={p.id} value={p.id} style={{ color: 'black' }}>{p.name}</option>)}
              </select>

              <select className="select-input" value={selectedUser} onChange={handleUserChange} disabled={!selectedYear} style={{ padding: '0.5rem', fontSize: '1.2rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'white', color: 'black', minWidth: '150px' }}>
                <option value="" style={{ color: 'black' }}>-- Select Party --</option>
                {users.map(u => <option key={u.id} value={u.id} style={{ color: 'black' }}>{u.name} ({u.placeName})</option>)}
              </select>
            </div>
            <form onSubmit={handleAddEntry} style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 150px' }}>
                <label style={{ display: 'block', fontSize: '1.2rem', marginBottom: '4px' }}>Date</label>
                <input type="date" ref={dateRef} onKeyDown={(e) => handleEnterKey(e, advRef)} required value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '100%', padding: '0.5rem', fontSize: '1.2rem', borderRadius: '4px', border: '1px solid var(--border)', color: '#000', backgroundColor: '#fff', colorScheme: 'light' }} />
              </div>
              <div style={{ flex: '1 1 150px' }}>
                <label style={{ display: 'block', fontSize: '1.2rem', marginBottom: '4px', color: 'lightgreen' }}>Advance Amount (₹)</label>
                <input type="number" step="0.01" ref={advRef} onKeyDown={(e) => handleEnterKey(e, dedRef)} value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} style={{ width: '100%', padding: '0.5rem', fontSize: '1.2rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
              </div>
              <div style={{ flex: '1 1 150px' }}>
                <label style={{ display: 'block', fontSize: '1.2rem', marginBottom: '4px', color: 'red' }}>Deduction Amount (₹)</label>
                <input type="number" step="0.01" ref={dedRef} onKeyDown={(e) => handleEnterKey(e, notesRef)} value={deductionAmount} onChange={(e) => setDeductionAmount(e.target.value)} style={{ width: '100%', padding: '0.5rem', fontSize: '1.2rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
              </div>
              <div style={{ flex: '2 1 200px' }}>
                <label style={{ display: 'block', fontSize: '1.2rem', marginBottom: '4px' }}>Notes (Optional)</label>
                <input type="text" ref={notesRef} onKeyDown={(e) => handleEnterKey(e, saveBtnRef)} value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: '100%', padding: '0.5rem', fontSize: '1.2rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
              </div>
              <button type="submit" ref={saveBtnRef} className="btn btn-primary focus-ring" disabled={loading} style={{ flex: '0 0 auto', padding: '0.65rem 1.5rem', fontSize: '1.2rem' }}>
                <Plus size={16} style={{ marginRight: '8px' }} /> Add to Ledger
              </button>
            </form>
          </div>

          <div className="card">
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <h2 className="card-title" style={{ margin: 0 }}>History {selectedUser ? `for ${users.find(u => u.id.toString() === selectedUser)?.name}` : (selectedYear ? 'for All Parties' : '')}</h2>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} title="Date From" className="select-input black-icon" style={{ padding: '0.5rem', fontSize: '1.2rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'white', color: '#000', colorScheme: 'light' }} />
                <span style={{ fontWeight: 'bold' }}>To</span>
                <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} title="Date To" className="select-input black-icon" style={{ padding: '0.5rem', fontSize: '1.2rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'white', color: '#000', colorScheme: 'light', marginRight: '1rem' }} />
                
                <input 
                  type="text" 
                  placeholder="Search group or party..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="select-input"
                  style={{ padding: '0.5rem', fontSize: '1.2rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'white', color: '#000', minWidth: '220px' }}
                />
              </div>

              {selectedUser && (
                <div style={{ display: 'flex', gap: '1rem', fontSize: '1.15rem', fontWeight: 'bold' }}>
                  <span style={{ color: 'green' }}>Total Advances: {totalAdvance.toFixed(2)}</span>
                  <span style={{ color: 'red' }}>Total Deductions: {totalDeduction.toFixed(2)}</span>
                </div>
              )}
            </div>

            {selectedRows.size > 0 && (
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 'bold' }}>{selectedRows.size} row(s) selected</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label>Set Date:</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input type="text" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} placeholder="YYYY-MM-DD" style={{ width: '120px', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', color: '#000', backgroundColor: '#fff' }} />
                    <div style={{ position: 'relative', width: '24px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '4px' }}>
                      <span style={{ cursor: 'pointer', fontSize: '1rem' }}>📅</span>
                      <input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', colorScheme: 'light' }} />
                    </div>
                  </div>
                  <button className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }} onClick={handleBulkDateUpdate} disabled={loading}>Apply to Selected</button>
                </div>
              </div>
            )}

            {selectedYear ? (
              entries.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No entries found.</p>
              ) : (
              <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '1.15rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '8px', width: '40px' }}>
                      <input type="checkbox" onChange={handleSelectAll} checked={entries.length > 0 && selectedRows.size === entries.length} />
                    </th>
                    <th style={{ padding: '8px' }}>Date</th>
                    {!selectedUser && <th style={{ padding: '8px' }}>Group</th>}
                    {!selectedUser && <th style={{ padding: '8px' }}>Party</th>}
                    {selectedUser && <th style={{ padding: '8px' }}>Previous Balance</th>}
                    <th style={{ padding: '8px', color: 'green' }}>Advance Added</th>
                    <th style={{ padding: '8px', color: 'red' }}>Amount Deducted</th>
                    {selectedUser && <th style={{ padding: '8px', color: 'var(--primary)' }}>New Balance</th>}
                    <th style={{ padding: '8px' }}>Notes</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let paginatedEntries;
                    if (!selectedUser) {
                        paginatedEntries = finalDisplayEntries.slice(0, 10);
                    } else {
                        paginatedEntries = finalDisplayEntries.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
                    }

                    return paginatedEntries.map(e => {
                      const isEditing = editingRowId === e.id;
                      return (
                      <tr key={e.id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: selectedRows.has(e.id) ? 'var(--bg-secondary)' : 'transparent' }}>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <input type="checkbox" checked={selectedRows.has(e.id)} onChange={() => handleRowSelect(e.id)} />
                        </td>
                        <td style={{ padding: '8px' }}>
                          {isEditing ? (
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                              <input type="text" value={editFormData.date} onChange={(ev) => setEditFormData({...editFormData, date: ev.target.value})} style={{ width: '100px', padding: '4px', color: '#000', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid var(--border)' }} />
                              <div style={{ position: 'relative', width: '24px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '4px' }}>
                                <span style={{ cursor: 'pointer', fontSize: '1rem' }}>📅</span>
                                <input type="date" value={editFormData.date} onChange={(ev) => setEditFormData({...editFormData, date: ev.target.value})} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', colorScheme: 'light' }} />
                              </div>
                            </div>
                          ) : formatDateDisplay(e.date)}
                        </td>
                        {!selectedUser && <td style={{ padding: '8px' }}>{e.place_name || '-'}</td>}
                        {!selectedUser && <td style={{ padding: '8px' }}>{e.user_name || '-'}</td>}
                        
                        {selectedUser && <td style={{ padding: '8px', fontWeight: 'bold' }}>{e.previousBalance.toFixed(2)}</td>}
                        <td style={{ padding: '8px', color: '#00E676' }}>
                          {isEditing ? <input type="number" step="0.01" value={editFormData.advance_amount} onChange={(ev) => setEditFormData({...editFormData, advance_amount: ev.target.value})} style={{ width: '80px', padding: '4px', color: '#000', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid var(--border)' }} /> : (e.advance_amount > 0 ? `${e.advance_amount.toFixed(2)}` : '-')}
                        </td>
                        <td style={{ padding: '8px', color: 'red' }}>
                          {isEditing ? <input type="number" step="0.01" value={editFormData.deduction_amount} onChange={(ev) => setEditFormData({...editFormData, deduction_amount: ev.target.value})} style={{ width: '80px', padding: '4px', color: '#000', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid var(--border)' }} /> : (e.deduction_amount > 0 ? `${e.deduction_amount.toFixed(2)}` : '-')}
                        </td>
                        {selectedUser && <td style={{ padding: '8px', color: 'var(--primary)', fontWeight: 'bold' }}>{e.newBalance.toFixed(2)}</td>}
                        <td style={{ padding: '8px' }}>
                          {isEditing ? <input type="text" value={editFormData.notes} onChange={(ev) => setEditFormData({...editFormData, notes: ev.target.value})} style={{ width: '100%', padding: '4px', color: '#000', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid var(--border)' }} /> : (e.notes || '-')}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                              <button onClick={() => handleEditSave(e.id)} className="icon-btn icon-btn-sm" style={{ color: '#00E676' }} title="Save">
                                <Save size={14} />
                              </button>
                              <button onClick={() => setEditingRowId(null)} className="icon-btn icon-btn-sm" style={{ color: 'var(--text-secondary)' }} title="Cancel">
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                              <button onClick={() => handleEditClick(e)} className="icon-btn icon-btn-sm" style={{ color: 'var(--primary)' }} title="Edit">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => handleDelete(e.id)} className="icon-btn icon-btn-sm icon-btn-danger" title="Delete">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
              
              {/* Pagination Controls */}
              {selectedUser && (() => {
                const totalPages = Math.ceil(finalDisplayEntries.length / ITEMS_PER_PAGE) || 1;
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '1rem', borderTop: '1px solid var(--border)' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ fontSize: '1.15rem' }}
                      disabled={currentPage === 1} 
                      onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                      Previous
                    </button>
                    <span style={{ fontSize: '1.15rem', fontWeight: 'bold' }}>Page {currentPage} of {totalPages}</span>
                    <button 
                      className="btn btn-secondary" 
                      style={{ fontSize: '1.15rem' }}
                      disabled={currentPage === totalPages} 
                      onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                      Next
                    </button>
                  </div>
                );
              })()}
              
              </div>
            )
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>Please select a year from the dropdown above to view history.</p>
            )}
          </div>

        </div>
    </div>
  );
};

export default Ledger;
