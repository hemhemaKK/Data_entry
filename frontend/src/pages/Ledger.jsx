import React, { useState, useEffect } from 'react';
import { getYears, getPlaces, getUsers, advancesApi } from '../services/api';
import { Wallet, Plus, Trash2 } from 'lucide-react';

const Ledger = () => {
  const [years, setYears] = useState([]);
  const [places, setPlaces] = useState([]);
  const [users, setUsers] = useState([]);
  const [entries, setEntries] = useState([]);
  
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedPlace, setSelectedPlace] = useState('');
  const [selectedUser, setSelectedUser] = useState('');

  const [date, setDate] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [deductionAmount, setDeductionAmount] = useState('');
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    fetchYears();
  }, []);

  const fetchYears = async () => {
    try {
      const data = await getYears();
      setYears(data || []);
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
        setPlaces(p || []);
      } catch (err) { console.error(err); }
    } else {
      setPlaces([]);
    }
  };

  const handlePlaceChange = async (e) => {
    const pId = e.target.value;
    setSelectedPlace(pId);
    setSelectedUser('');
    setEntries([]);
    if (pId) {
      try {
        const u = await getUsers(pId);
        setUsers(u || []);
      } catch (err) { console.error(err); }
    } else {
      setUsers([]);
    }
  };

  const handleUserChange = async (e) => {
    const uId = e.target.value;
    setSelectedUser(uId);
    if (uId) {
      fetchEntries(uId);
    } else {
      setEntries([]);
    }
  };

  const fetchEntries = async (uId) => {
    setLoading(true);
    try {
      const data = await advancesApi.getUserAdvances(uId);
      setEntries(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!selectedUser || !date) return;
    
    const adv = parseFloat(advanceAmount) || 0;
    const ded = parseFloat(deductionAmount) || 0;
    
    if (adv === 0 && ded === 0) return alert("Enter either an Advance or Deduction amount.");

    setLoading(true);
    try {
      await advancesApi.createAdvance({
        user_id: parseInt(selectedUser),
        date: date,
        advance_amount: adv,
        deduction_amount: ded,
        notes: notes
      });
      setAdvanceAmount('');
      setDeductionAmount('');
      setNotes('');
      fetchEntries(selectedUser);
    } catch (err) {
      alert("Failed to add entry.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      await advancesApi.deleteAdvance(id);
      fetchEntries(selectedUser);
    } catch (err) {
      alert("Failed to delete.");
      console.error(err);
    }
  };

  const totalAdvance = entries.reduce((sum, e) => sum + (e.advance_amount || 0), 0);
  const totalDeduction = entries.reduce((sum, e) => sum + (e.deduction_amount || 0), 0);

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title"><Wallet className="icon" /> Ledger: Advances & Deductions</h1>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <select className="select-input" value={selectedYear} onChange={handleYearChange}>
          <option value="">-- Select Year --</option>
          {years.map(y => <option key={y.id} value={y.id}>{y.year}</option>)}
        </select>
        
        <select className="select-input" value={selectedPlace} onChange={handlePlaceChange} disabled={!selectedYear}>
          <option value="">-- Select Place --</option>
          {places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <select className="select-input" value={selectedUser} onChange={handleUserChange} disabled={!selectedPlace}>
          <option value="">-- Select User --</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      {selectedUser && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
          
          <div className="card">
            <h2 className="card-title">Add Entry</h2>
            <form onSubmit={handleAddEntry} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Date</label>
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'green' }}>Advance Amount (₹)</label>
                <input type="number" step="0.01" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'red' }}>Deduction Amount (₹)</label>
                <input type="number" step="0.01" value={deductionAmount} onChange={(e) => setDeductionAmount(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Notes (Optional)</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Plus size={16} style={{ marginRight: '8px' }} /> Add to Ledger
              </button>
            </form>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="card-title">History</h2>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
                <span style={{ color: 'green' }}>Total Advances: ₹{totalAdvance.toFixed(2)}</span>
                <span style={{ color: 'red' }}>Total Deductions: ₹{totalDeduction.toFixed(2)}</span>
              </div>
            </div>

            {entries.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No entries found for this user.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '8px' }}>Date</th>
                    <th style={{ padding: '8px', color: 'green' }}>Advance</th>
                    <th style={{ padding: '8px', color: 'red' }}>Deduction</th>
                    <th style={{ padding: '8px' }}>Notes</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => (
                    <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px' }}>{e.date}</td>
                      <td style={{ padding: '8px', color: 'green' }}>{e.advance_amount > 0 ? `₹${e.advance_amount.toFixed(2)}` : '-'}</td>
                      <td style={{ padding: '8px', color: 'red' }}>{e.deduction_amount > 0 ? `₹${e.deduction_amount.toFixed(2)}` : '-'}</td>
                      <td style={{ padding: '8px' }}>{e.notes || '-'}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        <button onClick={() => handleDelete(e.id)} className="icon-btn icon-btn-sm icon-btn-danger">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default Ledger;
