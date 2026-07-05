import React, { useState, useEffect, useRef } from 'react';
import { getYears, getPlaces, getUsers, getFlowers, billRecordsApi, createYear, updateYear, deleteYear } from '../services/api';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';

const QuickEntryForm = ({ onRecordAdded }) => {
  const yearRef = useRef(null);
  const placeRef = useRef(null);
  const userRef = useRef(null);
  const flowerRef = useRef(null);
  const dateRef = useRef(null);
  const vanRef = useRef(null);
  const weightRef = useRef(null);
  const rateRef = useRef(null);
  const laggageRef = useRef(null);
  const collieRef = useRef(null);
  const submitBtnRef = useRef(null);

  const handleEnterKey = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
      }
    }
  };

  const [years, setYears] = useState([]);
  const [places, setPlaces] = useState([]);
  const [users, setUsers] = useState([]);
  const [globalFlowers, setGlobalFlowers] = useState([]);
  const [partyFlowers, setPartyFlowers] = useState([]);

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
    if (await window.confirmAsync("Are you sure you want to delete this year?")) {
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
      const uniqueNames = [...new Set((allFlowersData || []).map(f => f.name.toLowerCase()))].map(n => 
         allFlowersData.find(f => f.name.toLowerCase() === n).name
      );
      setGlobalFlowers(uniqueNames);
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
    if (uId) {
      try {
        const data = await getFlowers(uId);
        setPartyFlowers(data || []);
      } catch (err) { console.error(err); }
    } else {
      setPartyFlowers([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFlower) return alert("Please select a flower.");

    setLoading(true);
    let finalFlowerId = null;

    try {
      const existingFlower = partyFlowers.find(f => f.name.toLowerCase() === selectedFlower.toLowerCase());
      if (existingFlower) {
        finalFlowerId = existingFlower.id;
      } else {
        const { createFlower } = await import('../services/api');
        const newFlower = await createFlower({ name: selectedFlower, user_id: parseInt(selectedUser, 10) });
        finalFlowerId = newFlower.id;
        setPartyFlowers([...partyFlowers, newFlower]);
      }

      let processedVan = (van || "").trim();
      if (!processedVan) processedVan = 'v1';
      else if (!isNaN(processedVan)) processedVan = 'v' + processedVan;

      const payload = {
        flower_id: finalFlowerId,
        date: date || null,
        weight: parseFloat(weight) || 0,
        van: processedVan,
        rate: parseFloat(rate) || 0,
        laggage: parseFloat(laggage) || 0,
        collie: parseFloat(collie) || 0,
      };

      await billRecordsApi.createRecord(payload);
      // Clear numeric fields but keep date, van, laggage, collie, and selections
      setWeight('');
      setRate('');
      if (onRecordAdded) {
        onRecordAdded();
      }
      if (placeRef.current) {
        setTimeout(() => placeRef.current.focus(), 10);
      }
    } catch (err) {
      alert("Failed to add record.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card quick-entry-form" style={{ marginBottom: '1rem', border: '1px solid var(--primary)' }}>
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
            <label style={{ width: '80px', fontSize: '1.2rem', fontWeight: 600 }}>Year:</label>
            <select ref={yearRef} onKeyDown={(e) => handleEnterKey(e, placeRef)} className="select-input" value={selectedYear} onChange={handleYearChange} style={{ flex: 1, padding: '0.5rem', fontSize: '1.2rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'white', color: 'black' }}>
              <option value="" style={{ color: 'black' }}>-- Select Year --</option>
              {years.map(y => <option key={y.id} value={y.id} style={{ color: 'black' }}>{y.year}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ width: '80px', fontSize: '1.2rem', fontWeight: 600 }}>Group:</label>
            <select ref={placeRef} onKeyDown={(e) => handleEnterKey(e, userRef)} className="select-input" value={selectedPlace} onChange={handlePlaceChange} disabled={!selectedYear} style={{ flex: 1, padding: '0.5rem', fontSize: '1.2rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'white', color: 'black' }}>
              <option value="" style={{ color: 'black' }}>-- Select Group --</option>
              {places.map(p => <option key={p.id} value={p.id} style={{ color: 'black' }}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ width: '80px', fontSize: '1.2rem', fontWeight: 600 }}>Party:</label>
            <select ref={userRef} onKeyDown={(e) => handleEnterKey(e, flowerRef)} className="select-input" value={selectedUser} onChange={handleUserChange} disabled={!selectedPlace} style={{ flex: 1, padding: '0.5rem', fontSize: '1.2rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'white', color: 'black' }}>
              <option value="" style={{ color: 'black' }}>-- Select Party --</option>
              {users.map(u => <option key={u.id} value={u.id} style={{ color: 'black' }}>{u.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ width: '80px', fontSize: '1.2rem', fontWeight: 600 }}>Flower:</label>
            <input ref={flowerRef} onKeyDown={(e) => handleEnterKey(e, dateRef)} list="flower-options" className="input" value={selectedFlower} onChange={(e) => setSelectedFlower(e.target.value)} disabled={!selectedUser} placeholder="Type or select flower..." style={{ flex: 1, padding: '0.5rem', fontSize: '1.2rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'white', color: 'black' }} />
            <datalist id="flower-options">
              {globalFlowers.map(fname => <option key={fname} value={fname} />)}
            </datalist>
          </div>
        </div>
 
        {/* Data Entry Row with Button on same line */}
        <div style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', gap: '1rem', alignItems: 'flex-end', background: 'var(--surface)', padding: '1.25rem', borderRadius: '8px' }}>
          <div style={{ flex: '1 1 160px', minWidth: '160px' }}>
            <label style={{ display: 'block', fontSize: '1.2rem', marginBottom: '4px' }}>Date</label>
            <input ref={dateRef} onKeyDown={(e) => handleEnterKey(e, vanRef)} type="date" value={date} onChange={e => setDate(e.target.value)} required style={{ width: '100%', padding: '0.5rem', fontSize: '1.2rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
          </div>
          <div style={{ flex: '1 1 70px', minWidth: '70px' }}>
            <label style={{ display: 'block', fontSize: '1.2rem', marginBottom: '4px' }}>Van</label>
            <input ref={vanRef} onKeyDown={(e) => handleEnterKey(e, weightRef)} type="text" value={van} onChange={e => setVan(e.target.value)} style={{ width: '100%', padding: '0.5rem', fontSize: '1.2rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
          </div>
          <div style={{ flex: '1 1 140px', minWidth: '140px' }}>
            <label style={{ display: 'block', fontSize: '1.2rem', marginBottom: '4px' }}>Weight (kg)</label>
            <input ref={weightRef} onKeyDown={(e) => handleEnterKey(e, rateRef)} type="number" step="0.001" value={weight} onChange={e => setWeight(e.target.value)} style={{ width: '100%', padding: '0.5rem', fontSize: '1.2rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
          </div>
          <div style={{ flex: '1 1 70px', minWidth: '70px' }}>
            <label style={{ display: 'block', fontSize: '1.2rem', marginBottom: '4px' }}>Rate</label>
            <input ref={rateRef} onKeyDown={(e) => handleEnterKey(e, laggageRef)} type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)} style={{ width: '100%', padding: '0.5rem', fontSize: '1.2rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
          </div>
          <div style={{ flex: '1 1 70px', minWidth: '70px' }}>
            <label style={{ display: 'block', fontSize: '1.2rem', marginBottom: '4px' }}>Laggage</label>
            <input ref={laggageRef} onKeyDown={(e) => handleEnterKey(e, collieRef)} type="number" step="0.01" value={laggage} onChange={e => setLaggage(e.target.value)} style={{ width: '100%', padding: '0.5rem', fontSize: '1.2rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
          </div>
          <div style={{ flex: '1 1 70px', minWidth: '70px' }}>
            <label style={{ display: 'block', fontSize: '1.2rem', marginBottom: '4px' }}>Collie</label>
            <input ref={collieRef} onKeyDown={(e) => handleEnterKey(e, submitBtnRef)} type="number" step="0.01" value={collie} onChange={e => setCollie(e.target.value)} style={{ width: '100%', padding: '0.5rem', fontSize: '1.2rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
          </div>
          <div style={{ flex: '0 0 auto', marginTop: 'auto' }}>
            <button ref={submitBtnRef} type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1.2rem', whiteSpace: 'nowrap' }} disabled={loading || !selectedFlower}>
              {loading ? "..." : "Add Record"}
            </button>
          </div>
        </div>
      </form>

      {/* Right Column: Years */}
      <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h3 style={{ fontSize: '1.5rem', margin: 0 }}>Years</h3>
        <form onSubmit={handleCreateYear} style={{ display: 'flex', gap: '0.75rem' }}>
          <input 
            type="number" 
            placeholder="Year" 
            value={newYear} 
            onChange={e => setNewYear(e.target.value)} 
            required 
            style={{ width: '120px', padding: '0.75rem', fontSize: '1.25rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} 
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1.1rem' }}>Add</button>
        </form>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {years.map(y => (
            <div key={y.id} style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border)', gap: '1rem', fontSize: '1.25rem' }}>
              <Link to={`/year/${y.id}`} style={{ fontWeight: 'bold', textDecoration: 'none', color: 'var(--text-primary)' }} title="View details">
                {y.year}
              </Link>
              <div style={{ borderLeft: '2px solid var(--border)', height: '24px', margin: '0 4px' }}></div>
              <button type="button" onClick={() => handleEditYear(y.id, y.year)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} title="Edit">✏️</button>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};

export default QuickEntryForm;
