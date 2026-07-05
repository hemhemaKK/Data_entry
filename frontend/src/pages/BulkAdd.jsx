import React, { useState, useEffect } from 'react';
import { bulkApi, getYears, getPlaces, deletePlace, deleteUser, updatePlace, updateUser } from '../services/api';
import { Users, MapPin, Flower2, Trash2, Edit2, Check, X } from 'lucide-react';

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

  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  const [editingPartyId, setEditingPartyId] = useState(null);
  const [editingPartyName, setEditingPartyName] = useState('');

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
    if (!await window.confirmAsync(`Are you sure you want to delete the group "${placeName}" and ALL its parties?`)) return;
    try {
      await deletePlace(placeId);
      fetchPlaces(selectedYear);
      fetchViewerData();
    } catch (err) { alert("Failed to delete group"); console.error(err); }
  };

  const handleDeleteUser = async (e, placeId, userId, userName) => {
    e.stopPropagation();
    if (!await window.confirmAsync(`Are you sure you want to delete the party "${userName}" and ALL its flowers?`)) return;
    try {
      await deleteUser(userId);
      const { getUsers } = await import('../services/api');
      const data = await getUsers(placeId);
      setPlaceUsersMap(prev => ({ ...prev, [placeId]: data || [] }));
      fetchViewerData();
    } catch (err) { alert("Failed to delete party"); console.error(err); }
  };

  const handleDeleteGlobalFlower = async (flowerName) => {
    if (!await window.confirmAsync(`Are you sure you want to delete ALL flowers named "${flowerName}" across the entire system?`)) return;
    try {
      await bulkApi.deleteGlobalFlower(flowerName);
      fetchViewerData();
    } catch (err) { alert("Failed to delete flowers"); console.error(err); }
  };

  const handleUpdateGroup = async (e, id) => {
    e.stopPropagation();
    if (!editingGroupName.trim()) return;
    try {
      await updatePlace(id, { name: editingGroupName.trim(), year_id: parseInt(selectedYear) });
      setPlaces(places.map(p => p.id === id ? { ...p, name: editingGroupName.trim() } : p));
      setEditingGroupId(null);
    } catch (err) { alert("Failed to update group name"); console.error(err); }
  };

  const handleUpdateParty = async (e, placeId, userId) => {
    e.stopPropagation();
    if (!editingPartyName.trim()) return;
    try {
      await updateUser(userId, { name: editingPartyName.trim(), place_id: placeId });
      setPlaceUsersMap({
        ...placeUsersMap,
        [placeId]: placeUsersMap[placeId].map(u => u.id === userId ? { ...u, name: editingPartyName.trim() } : u)
      });
      setEditingPartyId(null);
    } catch (err) { alert("Failed to update party name"); console.error(err); }
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
    if (!bulkFlowersText.trim()) return alert("Please enter flowers.");
    
    const flower_names = bulkFlowersText.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
    if (flower_names.length === 0) return;

    setLoading(true);
    try {
      const res = await bulkApi.createFlowers({ flower_names });
      alert(res.detail);
      setBulkFlowersText('');
      
      // Refresh flowers view
      fetchViewerData();
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
            <h2 className="card-title" style={{ fontSize: '1.15rem' }}>1. Add Groups</h2>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <select className="select-input" value={selectedYear} onChange={handleYearChange} style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '1.2rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)' }}>
              <option value="" style={{ color: 'black' }}>-- Select Year --</option>
              {years.map(y => (
                <option key={y.id} value={y.id} style={{ color: 'black' }}>{y.year}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '1.1rem' }}>Groups List (comma or line separated)</label>
            <textarea 
              rows={5} 
              style={{ width: '100%', padding: '0.75rem', fontSize: '1.2rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', transition: 'border-color 0.2s', resize: 'vertical' }}
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
            <h2 className="card-title" style={{ fontSize: '1.15rem' }}>2. Add Parties</h2>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <select className="select-input" value={selectedPlace} onChange={(e) => setSelectedPlace(e.target.value)} style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '1.2rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)' }}>
              <option value="" style={{ color: 'black' }}>-- Select Group --</option>
              {places.map(p => (
                <option key={p.id} value={p.id} style={{ color: 'black' }}>{p.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '1.1rem' }}>Parties List (comma or line separated)</label>
            <textarea 
              rows={5} 
              style={{ width: '100%', padding: '0.75rem', fontSize: '1.2rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', transition: 'border-color 0.2s', resize: 'vertical' }}
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
            <h2 className="card-title" style={{ fontSize: '1.15rem' }}>3. Add Global Flowers</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Creates common flowers that are available to ALL parties instantly.
          </p>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '1.1rem' }}>Flowers List (comma or line separated)</label>
            <textarea 
              rows={5} 
              className="input" 
              placeholder="e.g. Rose, Lily, Jasmine"
              value={bulkFlowersText}
              onChange={(e) => setBulkFlowersText(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', fontSize: '1.2rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', resize: 'vertical' }}
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAddFlowers} disabled={loading || !bulkFlowersText}>
            Add Global Flowers
          </button>
        </div>

      </div>

      {selectedYear && (
        <div style={{ marginTop: '3rem' }}>
          <h2 style={{ marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)', fontSize: '1.25rem' }}>
            Existing Data for Selected Year
          </h2>
          
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Unique Flowers Added</h3>
            {allUniqueFlowers.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No flowers added yet.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {allUniqueFlowers.map((fn, idx) => (
                  <span key={idx} style={{ padding: '0.35rem 0.6rem 0.35rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
              <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {places.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => togglePlace(p.id)}
                      style={{ 
                        padding: '0.5rem 1rem', 
                        background: expandedPlaceId === p.id ? 'var(--primary)' : 'var(--bg-secondary)', 
                        border: expandedPlaceId === p.id ? '1px solid var(--primary)' : '1px solid var(--border)', 
                        borderRadius: '8px', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {editingGroupId === p.id ? (
                          <>
                            <input 
                              type="text" 
                              value={editingGroupName} 
                              onChange={(e) => setEditingGroupName(e.target.value)} 
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                              style={{ padding: '0.25rem 0.5rem', fontSize: '1.2rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'white', color: 'black', width: '120px' }} 
                            />
                            <button onClick={(e) => handleUpdateGroup(e, p.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--success)', display: 'flex', alignItems: 'center', padding: '4px' }} title="Save">
                               <Check size={16} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setEditingGroupId(null); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: '4px' }} title="Cancel">
                               <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span style={{ fontWeight: 500, fontSize: '1.2rem', color: expandedPlaceId === p.id ? 'white' : 'var(--text-primary)' }}>{p.name}</span>
                            <button onClick={(e) => { e.stopPropagation(); setEditingGroupId(p.id); setEditingGroupName(p.name); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: expandedPlaceId === p.id ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: '4px', marginLeft: '0.25rem' }} title="Edit Group" onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseOut={(e) => e.currentTarget.style.color = expandedPlaceId === p.id ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)'}>
                               <Edit2 size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeletePlace(e, p.id, p.name); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: expandedPlaceId === p.id ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: '4px' }} title="Delete Group" onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger)'} onMouseOut={(e) => e.currentTarget.style.color = expandedPlaceId === p.id ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)'}>
                               <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {expandedPlaceId && (
                  <div style={{ padding: '1.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', width: '100%' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--primary)', fontSize: '1.2rem' }}>
                      Parties in {places.find(p => p.id === expandedPlaceId)?.name}
                    </h4>
                    {!placeUsersMap[expandedPlaceId] ? (
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Loading...</p>
                    ) : placeUsersMap[expandedPlaceId].length === 0 ? (
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No parties in this group.</p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        {placeUsersMap[expandedPlaceId].map(u => (
                          <div key={u.id} style={{ padding: '0.4rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '16px', fontSize: '1.15rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', gap: '0.5rem' }}>
                            {editingPartyId === u.id ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <input 
                                  type="text" 
                                  value={editingPartyName} 
                                  onChange={(e) => setEditingPartyName(e.target.value)} 
                                  autoFocus
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '1.15rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'white', color: 'black', width: '100px' }} 
                                />
                                <button onClick={(e) => handleUpdateParty(e, expandedPlaceId, u.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--success)', display: 'flex', alignItems: 'center', padding: '2px' }} title="Save">
                                   <Check size={16} />
                                </button>
                                <button onClick={() => setEditingPartyId(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: '2px' }} title="Cancel">
                                   <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span>{u.name}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <button onClick={() => { setEditingPartyId(u.id); setEditingPartyName(u.name); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: '2px' }} title="Edit Party" onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                                     <Edit2 size={14} />
                                  </button>
                                  <button onClick={(e) => handleDeleteUser(e, expandedPlaceId, u.id, u.name)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: '2px' }} title="Delete Party" onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                                     <Trash2 size={14} />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default BulkAdd;
