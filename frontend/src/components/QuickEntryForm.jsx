import React, { useState, useEffect, useRef } from 'react';
import { getYears, getPlaces, getUsers, getFlowers, billRecordsApi, createYear, updateYear, deleteYear } from '../services/api';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';

const QuickEntryForm = ({ onRecordAdded }) => {
  const placeRef = useRef(null);
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
  const [newYear, setNewYear] = useState('');

  const handleCreateYear = async (e) => {
    e.preventDefault();
    if (!newYear) return;
    try {
      await createYear(parseInt(newYear, 10));
      setNewYear('');
      fetchInitialData();
    } catch (err) { alert("Failed to add year"); }
  };

  const handleEditYear = async (id, currentYear) => {
    const newVal = window.prompt("Enter new year value:", currentYear);
    if (!newVal) return;
    const parsed = parseInt(newVal, 10);
    if (!isNaN(parsed)) {
      try {
        await updateYear(id, parsed);
        fetchInitialData();
      } catch (err) { alert("Failed to update year"); }
    }
  };

  const handleDeleteYear = async (id) => {
    if (window.confirm("Are you sure you want to delete this year?")) {
      try {
        await deleteYear(id);
        fetchInitialData();
      } catch (err) { alert("Failed to delete year"); }
    }
  };

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
      
      const allFlowersData = await getFlowers();
      setFlowers(allFlowersData || []);
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
    setUsers([]);
    if (yId) fetchPlaces(yId);
    else setPlaces([]);
  };

  const handlePlaceChange = async (e) => {
    const pId = e.target.value;
    setSelectedPlace(pId);
    setSelectedUser('');
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
      if (placeRef.current) {
        placeRef.current.focus();
      }
    } catch (err) {
      alert("Failed to add record.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1rem', border: '1px solid var(--primary)' }}>
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <PlusCircle className="icon" style={{ color: 'var(--primary)' }} />
        <h2 className="card-title">Quick Manual Entry & Years</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Left Column: Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Selection Row - Vertical / Compact Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', maxWidth: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ width: '80px', fontSize: '0.85rem', fontWeight: 600 }}>Year:</label>
            <select className="select-input" value={selectedYear} onChange={handleYearChange} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              <option value="">-- Select Year --</option>
              {years.map(y => <option key={y.id} value={y.id}>{y.year}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ width: '80px', fontSize: '0.85rem', fontWeight: 600 }}>Group:</label>
            <select ref={placeRef} className="select-input" value={selectedPlace} onChange={handlePlaceChange} disabled={!selectedYear} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              <option value="">-- Select Group --</option>
              {places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ width: '80px', fontSize: '0.85rem', fontWeight: 600 }}>Party:</label>
            <select className="select-input" value={selectedUser} onChange={handleUserChange} disabled={!selectedPlace} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              <option value="">-- Select Party --</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ width: '80px', fontSize: '0.85rem', fontWeight: 600 }}>Flower:</label>
            <select className="select-input" value={selectedFlower} onChange={(e) => setSelectedFlower(e.target.value)} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              <option value="">-- Select Flower --</option>
              {flowers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>

        {/* Data Entry Row with Button on same line */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end', background: 'var(--surface)', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
          </div>
          <div style={{ flex: '1 1 80px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Van</label>
            <input type="text" value={van} onChange={e => setVan(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
          </div>
          <div style={{ flex: '1 1 80px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Weight (kg)</label>
            <input type="number" step="0.001" value={weight} onChange={e => setWeight(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
          </div>
          <div style={{ flex: '1 1 80px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Rate (₹)</label>
            <input type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
          </div>
          <div style={{ flex: '1 1 80px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Laggage (₹)</label>
            <input type="number" step="0.01" value={laggage} onChange={e => setLaggage(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
          </div>
          <div style={{ flex: '1 1 80px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Collie (₹)</label>
            <input type="number" step="0.01" value={collie} onChange={e => setCollie(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
          </div>
          <div style={{ flex: '0 0 auto', marginTop: 'auto' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', height: '38px' }} disabled={loading || !selectedFlower}>
              {loading ? "..." : "Add Record"}
            </button>
          </div>
        </div>
      </form>

      {/* Right Column: Years */}
      <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Years</h3>
        <form onSubmit={handleCreateYear} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="number" 
            placeholder="e.g. 2026" 
            value={newYear} 
            onChange={e => setNewYear(e.target.value)} 
            required 
            style={{ width: '90px', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} 
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.95rem' }}>Add</button>
        </form>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {years.map(y => (
            <div key={y.id} style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', gap: '0.75rem', fontSize: '1rem' }}>
              <Link to={`/year/${y.id}`} style={{ fontWeight: 'bold', textDecoration: 'none', color: 'var(--text-primary)' }} title="View details">
                {y.year}
              </Link>
              <div style={{ borderLeft: '1px solid var(--border)', height: '18px', margin: '0 2px' }}></div>
              <button type="button" onClick={() => handleEditYear(y.id, y.year)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }} title="Edit">✏️</button>
              <button type="button" onClick={() => handleDeleteYear(y.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }} title="Delete">❌</button>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};

export default QuickEntryForm;
