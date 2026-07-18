import React, { useState, useEffect, useRef } from 'react';
import { getYears, getPlaces, getUsers, getFlowers, billRecordsApi, createYear, updateYear, deleteYear } from '../services/api';
import { Link } from 'react-router-dom';
import { Save, PlusCircle, Trash2, Printer } from 'lucide-react';

const SearchableDropdown = ({ options, value, onChange, placeholder, disabled, onKeyDown, inputRef }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const opt = options.find(o => o.id.toString() === value.toString());
    if (opt) {
      setSearchTerm(opt.name);
    } else {
      setSearchTerm('');
    }
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        const opt = options.find(o => o.id.toString() === value.toString());
        setSearchTerm(opt ? opt.name : '');
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, value, options]);

  const currentSelectedOpt = options.find(o => o.id.toString() === value.toString());
  const isSearchTermPristine = currentSelectedOpt && searchTerm === currentSelectedOpt.name;

  const filteredOptions = isSearchTermPristine 
    ? options 
    : options.filter(opt => opt.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Reset active index when search changes, OR set to currently selected item if pristine
  useEffect(() => {
    if (isOpen) {
      if (isSearchTermPristine && currentSelectedOpt) {
        const idx = options.findIndex(o => o.id.toString() === currentSelectedOpt.id.toString());
        setActiveIndex(idx >= 0 ? idx : 0);
      } else {
        setActiveIndex(0);
      }
    }
  }, [searchTerm, isOpen, isSearchTermPristine, currentSelectedOpt ? currentSelectedOpt.id : null]);

  const handleSelect = (id) => {
    onChange({ target: { value: id } });
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flex: 1 }}>
      <input
        ref={inputRef}
        type="text"
        className="input"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
        onFocus={(e) => {
          setIsOpen(true);
          e.target.select();
        }}
        onKeyDown={(e) => {
           if (e.key === 'Tab' && e.shiftKey) {
               setIsOpen(false);
               return; // Allow native shift-tab navigation
           }
           
           if (e.key === 'Enter' || e.key === 'Tab') {
              e.preventDefault();
              
              if (isOpen && filteredOptions.length > 0 && searchTerm.trim() !== '') {
                  // They are making a valid selection
                  const selectedId = filteredOptions[activeIndex].id;
                  handleSelect(selectedId);
                  if (onKeyDown) setTimeout(() => onKeyDown(e), 0);
              } else {
                  // Invalid or empty selection
                  // Do NOT go to the next field. Just revert to the last valid value.
                  setIsOpen(false);
                  const opt = options.find(o => o.id.toString() === value.toString());
                  setSearchTerm(opt ? opt.name : '');
              }
              return;
           }

           if (isOpen && filteredOptions.length > 0) {
              if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActiveIndex(prev => (prev + 1) % filteredOptions.length);
                  return;
              }
              if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActiveIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
                  return;
              }
           }
        }}
        disabled={disabled}
        style={{ width: '100%', padding: '0.5rem', fontSize: '1.2rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'white', color: 'black' }}
      />
      {isOpen && !disabled && (
        <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, background: 'white', border: '1px solid var(--border)', borderRadius: '4px', maxHeight: '250px', overflowY: 'auto', listStyle: 'none', padding: 0, margin: 0, boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
          {filteredOptions.length === 0 ? (
            <li style={{ padding: '0.75rem', color: 'gray' }}>No options found</li>
          ) : (
            filteredOptions.map((opt, idx) => (
              <li 
                key={idx} 
                onClick={() => handleSelect(opt.id)}
                style={{ 
                  padding: '0.75rem', 
                  cursor: 'pointer', 
                  color: opt.id === 'ADD_NEW' ? 'blue' : 'black', 
                  fontWeight: opt.id === 'ADD_NEW' ? 'bold' : 'normal', 
                  borderBottom: '1px solid #eee',
                  background: activeIndex === idx ? '#e6f7ff' : 'white'
                }}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                {opt.name}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

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
  const [selectedPlaceName, setSelectedPlaceName] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedUserName, setSelectedUserName] = useState('');
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
    setSelectedPlaceName('');
    setSelectedUser('');
    setSelectedUserName('');
    setUsers([]);
    if (yId) fetchPlaces(yId);
    else setPlaces([]);
  };

  const handlePlaceChange = async (e) => {
    const pId = e.target.value;
    
    // If the group hasn't actually changed, don't clear the party
    if (pId && selectedPlace && pId.toString() === selectedPlace.toString()) {
      return;
    }

    const pObj = places.find(p => p.id === parseInt(pId));
    
    setSelectedPlace(pId);
    setSelectedPlaceName(pObj ? pObj.name : '');
    setSelectedUser('');
    setSelectedUserName('');
    setUsers([]);
    
    if (pId) {
      try {
        const data = await getUsers(pId);
        setUsers(data || []);
      } catch (err) { console.error(err); }
    }
  };

  const handleUserChange = async (e) => {
    const uId = e.target.value;
    
    // If the party hasn't actually changed, don't clear the flower list
    if (uId && selectedUser && uId.toString() === selectedUser.toString()) {
      return;
    }

    const uObj = users.find(u => u.id === parseInt(uId));
    
    setSelectedUser(uId);
    setSelectedUserName(uObj ? uObj.name : '');
    
    if (uId) {
      try {
        const data = await getFlowers(uId);
        setPartyFlowers(data || []);
      } catch (err) { console.error(err); }
    } else {
      setPartyFlowers([]);
    }
  };

  const handleFlowerChange = (e) => {
    const val = e.target.value;
    if (val === 'ADD_NEW') {
      const newFlower = prompt("Enter new flower name:");
      if (newFlower && newFlower.trim()) {
        const cleaned = newFlower.trim();
        setSelectedFlower(cleaned);
        if (!globalFlowers.find(f => f.toLowerCase() === cleaned.toLowerCase())) {
          setGlobalFlowers([...globalFlowers, cleaned]);
        }
      } else {
        setSelectedFlower('');
      }
    } else {
      setSelectedFlower(val);
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
            <SearchableDropdown
              inputRef={placeRef}
              options={places.map(p => ({ id: p.id, name: p.name }))}
              value={selectedPlace}
              onChange={handlePlaceChange}
              disabled={!selectedYear}
              placeholder="Select Group..."
              onKeyDown={(e) => handleEnterKey(e, userRef)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ width: '80px', fontSize: '1.2rem', fontWeight: 600 }}>Party:</label>
            <SearchableDropdown
              inputRef={userRef}
              options={users.map(u => ({ id: u.id, name: u.name }))}
              value={selectedUser}
              onChange={handleUserChange}
              disabled={!selectedPlace}
              placeholder="Select Party..."
              onKeyDown={(e) => handleEnterKey(e, flowerRef)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ width: '80px', fontSize: '1.2rem', fontWeight: 600 }}>Flower:</label>
            <SearchableDropdown
              inputRef={flowerRef}
              options={globalFlowers.map(f => ({ id: f, name: f })).concat([{id: 'ADD_NEW', name: '+ Add New Flower...'}])}
              value={selectedFlower}
              onChange={handleFlowerChange}
              disabled={!selectedUser}
              placeholder="Select Flower..."
              onKeyDown={(e) => handleEnterKey(e, dateRef)}
            />
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
