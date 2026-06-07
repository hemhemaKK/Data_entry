import React, { useState, useEffect } from 'react';
import { getYears, getPlaces, getUsers, getFlowers, billRecordsApi } from '../services/api';
import { PlusCircle } from 'lucide-react';

const QuickEntryForm = ({ onRecordAdded }) => {
  const [years, setYears] = useState([]);
  const [places, setPlaces] = useState([]);
  const [users, setUsers] = useState([]);
  const [flowers, setFlowers] = useState([]);

  const [selectedYear, setSelectedYear] = useState('');
  const [selectedPlace, setSelectedPlace] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedFlower, setSelectedFlower] = useState('');

  // Form Fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [van, setVan] = useState('');
  const [rate, setRate] = useState('');
  const [laggage, setLaggage] = useState('');
  const [collie, setCollie] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const data = await getYears();
      setYears(data || []);
      
      // Try to default to current year
      const currentYearVal = new Date().getFullYear();
      const currentYearObj = (data || []).find(y => parseInt(y.year) === currentYearVal);
      if (currentYearObj) {
        setSelectedYear(currentYearObj.id);
        fetchPlaces(currentYearObj.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlaces = async (yearId) => {
    try {
      const data = await getPlaces(yearId);
      setPlaces(data || []);
    } catch (err) { console.error(err); }
  };

  const handleYearChange = (e) => {
    const yId = e.target.value;
    setSelectedYear(yId);
    setSelectedPlace('');
    setSelectedUser('');
    setSelectedFlower('');
    setUsers([]);
    setFlowers([]);
    if (yId) fetchPlaces(yId);
    else setPlaces([]);
  };

  const handlePlaceChange = async (e) => {
    const pId = e.target.value;
    setSelectedPlace(pId);
    setSelectedUser('');
    setSelectedFlower('');
    setFlowers([]);
    if (pId) {
      try {
        const data = await getUsers(pId);
        setUsers(data || []);
      } catch (err) { console.error(err); }
    } else setUsers([]);
  };

  const handleUserChange = async (e) => {
    const uId = e.target.value;
    setSelectedUser(uId);
    setSelectedFlower('');
    if (uId) {
      try {
        const data = await getFlowers(null, { user_id: uId });
        setFlowers(data || []);
      } catch (err) { console.error(err); }
    } else setFlowers([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFlower) return alert("Please select a flower.");

    const payload = {
      flower_id: parseInt(selectedFlower),
      date: date || null,
      weight: parseFloat(weight) || 0,
      van: van || null,
      rate: parseFloat(rate) || 0,
      laggage: parseFloat(laggage) || 0,
      collie: parseFloat(collie) || 0,
    };

    setLoading(true);
    try {
      await billRecordsApi.createRecord(payload);
      alert("Record added successfully!");
      // Clear numeric fields but keep date, van, and selections
      setWeight('');
      setRate('');
      setLaggage('');
      setCollie('');
      if (onRecordAdded) {
        onRecordAdded();
      }
    } catch (err) {
      alert("Failed to add record.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--primary)' }}>
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <PlusCircle className="icon" style={{ color: 'var(--primary)' }} />
        <h2 className="card-title">Quick Manual Entry</h2>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Selection Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Year</label>
            <select className="select-input" value={selectedYear} onChange={handleYearChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              <option value="">-- Year --</option>
              {years.map(y => <option key={y.id} value={y.id}>{y.year}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Place</label>
            <select className="select-input" value={selectedPlace} onChange={handlePlaceChange} disabled={!selectedYear} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              <option value="">-- Place --</option>
              {places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>User</label>
            <select className="select-input" value={selectedUser} onChange={handleUserChange} disabled={!selectedPlace} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              <option value="">-- User --</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Flower</label>
            <select className="select-input" value={selectedFlower} onChange={(e) => setSelectedFlower(e.target.value)} disabled={!selectedUser} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              <option value="">-- Flower --</option>
              {flowers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>

        {/* Data Entry Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.5rem', background: 'var(--surface)', padding: '1rem', borderRadius: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Weight (kg)</label>
            <input type="number" step="0.001" value={weight} onChange={e => setWeight(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Van</label>
            <input type="text" value={van} onChange={e => setVan(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Rate (₹)</label>
            <input type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Laggage (₹)</label>
            <input type="number" step="0.01" value={laggage} onChange={e => setLaggage(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Collie (₹)</label>
            <input type="number" step="0.01" value={collie} onChange={e => setCollie(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={loading || !selectedFlower}>
          {loading ? "Adding..." : "Add Record"}
        </button>
      </form>
    </div>
  );
};

export default QuickEntryForm;
