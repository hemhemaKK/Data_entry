import React, { useState, useEffect } from 'react';
import { dashboardApi, bulkApi, getPlaces } from '../services/api';
import { Users, MapPin, Flower2 } from 'lucide-react';

const BulkAdd = () => {
  const [years, setYears] = useState([]);
  const [places, setPlaces] = useState([]);
  
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedPlace, setSelectedPlace] = useState('');

  const [bulkPlacesText, setBulkPlacesText] = useState('');
  const [bulkUsersText, setBulkUsersText] = useState('');
  const [bulkFlowersText, setBulkFlowersText] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchYears();
  }, []);

  const fetchYears = async () => {
    try {
      const data = await dashboardApi.getStats();
      setYears(data.years || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlaces = async (yearId) => {
    try {
      const data = await getPlaces(yearId);
      setPlaces(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleYearChange = (e) => {
    const yId = e.target.value;
    setSelectedYear(yId);
    setSelectedPlace('');
    if (yId) {
      fetchPlaces(yId);
    } else {
      setPlaces([]);
    }
  };

  const handleAddPlaces = async () => {
    if (!selectedYear) return alert("Please select a year.");
    if (!bulkPlacesText.trim()) return alert("Please enter places.");
    
    const names = bulkPlacesText.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
    if (names.length === 0) return;

    setLoading(true);
    try {
      const res = await bulkApi.createPlaces({ year_id: parseInt(selectedYear), names });
      alert(res.detail);
      setBulkPlacesText('');
      fetchPlaces(selectedYear); // refresh
    } catch (err) {
      alert("Failed to add places.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUsers = async () => {
    if (!selectedPlace) return alert("Please select a place.");
    if (!bulkUsersText.trim()) return alert("Please enter users.");
    
    const names = bulkUsersText.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
    if (names.length === 0) return;

    setLoading(true);
    try {
      const res = await bulkApi.createUsers({ place_id: parseInt(selectedPlace), names });
      alert(res.detail);
      setBulkUsersText('');
    } catch (err) {
      alert("Failed to add users.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFlowers = async () => {
    if (!selectedPlace) return alert("Please select a place.");
    if (!bulkFlowersText.trim()) return alert("Please enter flowers.");
    
    const flower_names = bulkFlowersText.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
    if (flower_names.length === 0) return;

    setLoading(true);
    try {
      const res = await bulkApi.createFlowers({ place_id: parseInt(selectedPlace), flower_names });
      alert(res.detail);
      setBulkFlowersText('');
    } catch (err) {
      alert("Failed to add flowers.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">Bulk Add Utilities</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Quickly add multiple places, users, and common flowers.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Bulk Places */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin className="icon" />
            <h2 className="card-title">1. Bulk Add Places</h2>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select Year</label>
            <select className="select-input" value={selectedYear} onChange={handleYearChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px' }}>
              <option value="">-- Select Year --</option>
              {years.map(y => (
                <option key={y.id} value={y.id}>{y.year}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Places List (comma or line separated)</label>
            <textarea 
              rows={5} 
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              placeholder="Mysore&#10;Bangalore&#10;Ooty"
              value={bulkPlacesText}
              onChange={(e) => setBulkPlacesText(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAddPlaces} disabled={loading || !selectedYear || !bulkPlacesText}>
            Add Places
          </button>
        </div>

        {/* Bulk Users */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users className="icon" />
            <h2 className="card-title">2. Bulk Add Users</h2>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select Place</label>
            <select className="select-input" value={selectedPlace} onChange={(e) => setSelectedPlace(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px' }}>
              <option value="">-- Select Place --</option>
              {places.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Users List (comma or line separated)</label>
            <textarea 
              rows={5} 
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              placeholder="Ramesh&#10;Suresh&#10;Mahesh"
              value={bulkUsersText}
              onChange={(e) => setBulkUsersText(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAddUsers} disabled={loading || !selectedPlace || !bulkUsersText}>
            Add Users
          </button>
        </div>

        {/* Bulk Flowers */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flower2 className="icon" />
            <h2 className="card-title">3. Common Flowers</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Assigns these flowers to ALL users inside the selected place above.
          </p>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Flowers List (comma or line separated)</label>
            <textarea 
              rows={5} 
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              placeholder="Rose&#10;Jasmine&#10;Lily"
              value={bulkFlowersText}
              onChange={(e) => setBulkFlowersText(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAddFlowers} disabled={loading || !selectedPlace || !bulkFlowersText}>
            Assign Flowers to All
          </button>
        </div>

      </div>
    </div>
  );
};

export default BulkAdd;
