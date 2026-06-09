import React, { useState, useEffect } from 'react';
import { bulkApi, getYears, getPlaces, deletePlace, deleteUser } from '../services/api';
import { Users, MapPin, Flower2, Trash2 } from 'lucide-react';

const BulkAdd = () => {
  const [years, setYears] = useState([]);
  const [places, setPlaces] = useState([]);
  
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedPlace, setSelectedPlace] = useState('');

  const [bulkPlacesText, setBulkPlacesText] = useState('');
  const [bulkUsersText, setBulkUsersText] = useState('');
  const [bulkFlowersText, setBulkFlowersText] = useState('');

  const [loading, setLoading] = useState(false);

  // Viewer state
  const [allUniqueFlowers, setAllUniqueFlowers] = useState([]);
  const [expandedPlaceId, setExpandedPlaceId] = useState(null);
  const [placeUsersMap, setPlaceUsersMap] = useState({});

  useEffect(() => {
    fetchYears();
  }, []);

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

  const fetchViewerData = async () => {
    try {
      const { getFlowers } = await import('../services/api');
      const flowersData = await getFlowers();
      const uniqueNames = [...new Set(flowersData.map(f => f.name.toLowerCase()))].map(n => 
         flowersData.find(f => f.name.toLowerCase() === n).name
      );
      setAllUniqueFlowers(uniqueNames);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlace = async (e, placeId, placeName) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete the group "${placeName}" and ALL its parties?`)) return;
    try {
      await deletePlace(placeId);
      fetchPlaces(selectedYear);
      fetchViewerData();
    } catch (err) { alert("Failed to delete group"); console.error(err); }
  };

  const handleDeleteUser = async (e, placeId, userId, userName) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete the party "${userName}" and ALL its flowers?`)) return;
    try {
      await deleteUser(userId);
      const { getUsers } = await import('../services/api');
      const data = await getUsers(placeId);
      setPlaceUsersMap(prev => ({ ...prev, [placeId]: data || [] }));
      fetchViewerData();
    } catch (err) { alert("Failed to delete party"); console.error(err); }
  };

  const handleDeleteGlobalFlower = async (flowerName) => {
    if (!window.confirm(`Are you sure you want to delete ALL flowers named "${flowerName}" across the entire system?`)) return;
    try {
      await bulkApi.deleteGlobalFlower(flowerName);
      fetchViewerData();
    } catch (err) { alert("Failed to delete flowers"); console.error(err); }
  };

  const fetchPlaces = async (yearId) => {
    try {
      const data = await getPlaces(yearId);
      setPlaces(data || []);
      fetchViewerData();
    } catch (err) {
      console.error(err);
    }
  };

  const togglePlace = async (placeId) => {
    if (expandedPlaceId === placeId) {
      setExpandedPlaceId(null);
    } else {
      setExpandedPlaceId(placeId);
      if (!placeUsersMap[placeId]) {
        const { getUsers } = await import('../services/api');
        const users = await getUsers(placeId);
        setPlaceUsersMap(prev => ({ ...prev, [placeId]: users }));
      }
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
      const msg = err.response?.data?.detail || "Failed to add places.";
      alert(msg);
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
      
      // Refresh user view
      if (expandedPlaceId === parseInt(selectedPlace)) {
        const { getUsers } = await import('../services/api');
        const users = await getUsers(selectedPlace);
        setPlaceUsersMap(prev => ({ ...prev, [selectedPlace]: users }));
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to add parties.";
      alert(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFlowers = async () => {
    if (!selectedPlace) return alert("Please select a Group.");
    if (!bulkFlowersText.trim()) return alert("Please enter flowers.");
    
    const flower_names = bulkFlowersText.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
    if (flower_names.length === 0) return;

    setLoading(true);
    try {
      const res = await bulkApi.createFlowers({ place_id: parseInt(selectedPlace), flower_names });
      alert(res.detail);
      setBulkFlowersText('');
      
      // Refresh flowers view
      if (selectedYear) {
         fetchPlaces(selectedYear);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to add flowers.";
      alert(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">Add Group & Party</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Bulk Places */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin className="icon" />
            <h2 className="card-title">1. Add Groups</h2>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select Year</label>
            <select className="select-input" value={selectedYear} onChange={handleYearChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)' }}>
              <option value="" style={{ color: 'black' }}>-- Select Year --</option>
              {years.map(y => (
                <option key={y.id} value={y.id} style={{ color: 'black' }}>{y.year}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Groups List (comma or line separated)</label>
            <textarea 
              rows={5} 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', transition: 'border-color 0.2s', resize: 'vertical' }}
              placeholder="Mysore&#10;Bangalore&#10;Ooty"
              value={bulkPlacesText}
              onChange={(e) => setBulkPlacesText(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAddPlaces} disabled={loading || !selectedYear || !bulkPlacesText}>
            Add Groups
          </button>
        </div>

        {/* Bulk Users */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users className="icon" />
            <h2 className="card-title">2. Add Parties</h2>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select Place</label>
            <select className="select-input" value={selectedPlace} onChange={(e) => setSelectedPlace(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)' }}>
              <option value="" style={{ color: 'black' }}>-- Select Group --</option>
              {places.map(p => (
                <option key={p.id} value={p.id} style={{ color: 'black' }}>{p.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Parties List (comma or line separated)</label>
            <textarea 
              rows={5} 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', transition: 'border-color 0.2s', resize: 'vertical' }}
              placeholder="Ramesh&#10;Suresh&#10;Mahesh"
              value={bulkUsersText}
              onChange={(e) => setBulkUsersText(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAddUsers} disabled={loading || !selectedPlace || !bulkUsersText}>
            Add Parties
          </button>
        </div>

        {/* Add Flowers */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flower2 className="icon" />
            <h2 className="card-title">3. Add Flowers</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Assigns these flowers to ALL parties inside the selected group above.
          </p>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Flowers List (comma or line separated)</label>
            <textarea 
              rows={5} 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', transition: 'border-color 0.2s', resize: 'vertical' }}
              placeholder="Rose&#10;Jasmine&#10;Lily"
              value={bulkFlowersText}
              onChange={(e) => setBulkFlowersText(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAddFlowers} disabled={loading || !selectedPlace || !bulkFlowersText}>
            Add Flowers to All
          </button>
        </div>

      </div>

      {selectedYear && (
        <div style={{ marginTop: '3rem' }}>
          <h2 style={{ marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
            Existing Data for Selected Year
          </h2>
          
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Unique Flowers Added</h3>
            {allUniqueFlowers.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No flowers added yet.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {allUniqueFlowers.map((fn, idx) => (
                  <span key={idx} style={{ padding: '0.25rem 0.5rem 0.25rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {fn}
                    <button onClick={() => handleDeleteGlobalFlower(fn)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete Flower Globally" onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                       <Trash2 size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Groups & Parties</h3>
            {places.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No groups added yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {places.map(p => (
                  <div key={p.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div 
                      onClick={() => togglePlace(p.id)}
                      style={{ padding: '1rem', background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 500 }}>{p.name}</span>
                        <button onClick={(e) => handleDeletePlace(e, p.id, p.name)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: '4px' }} title="Delete Group" onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                           <Trash2 size={14} />
                        </button>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {expandedPlaceId === p.id ? '▼ Hide Parties' : '▶ Show Parties'}
                      </span>
                    </div>
                    {expandedPlaceId === p.id && (
                      <div style={{ padding: '1rem', background: 'var(--surface)' }}>
                        {!placeUsersMap[p.id] ? (
                          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading...</p>
                        ) : placeUsersMap[p.id].length === 0 ? (
                          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No parties in this group.</p>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                            {placeUsersMap[p.id].map(u => (
                              <div key={u.id} style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
                                <span>{u.name}</span>
                                <button onClick={(e) => handleDeleteUser(e, p.id, u.id, u.name)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: '2px' }} title="Delete Party" onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                                   <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default BulkAdd;
