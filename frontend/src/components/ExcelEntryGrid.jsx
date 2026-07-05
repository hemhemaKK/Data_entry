import React, { useState, useEffect, useRef } from 'react';
import { getYears, getPlaces, getUsers, getFlowers, billRecordsApi } from '../services/api';
import { DataSheetGrid, textColumn, keyColumn, floatColumn } from 'react-datasheet-grid';
import { formatDateDisplay } from '../utils/formatters';
import 'react-datasheet-grid/dist/style.css';
import { Save, RefreshCw } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';
const ExcelEntryGrid = ({ onRecordsSaved }) => {
  const [years, setYears] = useState([]);
  const [places, setPlaces] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedPlace, setSelectedPlace] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedUserName, setSelectedUserName] = useState('');

  const [data, setData] = useState([{}]); // At least one empty row
  const [draftData, setDraftData] = useState(Array.from({ length: 31 }, () => ({})));
  const [viewMode, setViewMode] = useState('entry'); // 'entry' or 'latest'
  
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [partyFlowers, setPartyFlowers] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const yData = await getYears();
      setYears(yData || []);
      const currentYearVal = new Date().getFullYear();
      const currentYearObj = (yData || []).find(y => parseInt(y.year) === currentYearVal);
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
      const pData = await getPlaces(yearId);
      setPlaces(pData || []);
    } catch (err) { console.error(err); }
  };

  const handleYearChange = (e) => {
    const yId = e.target.value;
    setSelectedYear(yId);
    setSelectedPlace('');
    setSelectedUser('');
    setUsers([]);
    setData([{}]);
    if (yId) fetchPlaces(yId);
    else setPlaces([]);
  };

  const handlePlaceChange = async (e) => {
    const pId = e.target.value;
    setSelectedPlace(pId);
    setSelectedUser('');
    setData([{}]);
    if (pId) {
      try {
        const uData = await getUsers(pId);
        setUsers(uData || []);
      } catch (err) { console.error(err); }
    } else setUsers([]);
  };

  const handleUserChange = async (e) => {
    const uId = e.target.value;
    setSelectedUser(uId);
    
    if (uId) {
      const userObj = users.find(u => u.id === parseInt(uId));
      if (userObj) setSelectedUserName(userObj.name);
      
      try {
        setLoading(true);
        // Fetch flowers for the party
        const fData = await getFlowers(uId);
        setPartyFlowers(fData || []);
        
        // Add empty rows at the bottom (empty sheet)
        const emptyRows = Array.from({ length: 31 }, () => ({}));
        setDraftData(emptyRows);
        setData(emptyRows);
        setViewMode('entry');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      setSelectedUserName('');
      setPartyFlowers([]);
      setData([{}]);
      setDraftData([{}]);
      setViewMode('entry');
    }
  };

  const handleDataChange = (newData) => {
    let nextData = [...newData];

    let firstChange = -1;
    let lastChange = -1;
    for (let i = 0; i < nextData.length; i++) {
       const oldDate = data[i] ? data[i].date : undefined;
       const newDate = nextData[i] ? nextData[i].date : undefined;
       if (oldDate !== newDate && newDate) {
           if (firstChange === -1) firstChange = i;
           lastChange = i;
       }
    }

    if (firstChange !== -1 && lastChange > firstChange) {
        let anchorIdx = firstChange - 1;
        
        if (anchorIdx >= 1) { // Need at least 2 cells to form a pattern
            // Find selection length by searching backward from anchorIdx for a match to firstChange
            let selectionLength = 0;
            for (let k = anchorIdx; k >= 0; k--) {
                if (nextData[k] && nextData[firstChange] && nextData[k].date === nextData[firstChange].date) {
                    selectionLength = firstChange - k;
                    break;
                }
            }

            if (selectionLength > 0) {
                // Verify the entire changed block perfectly repeats the pattern
                let isDragFill = true;
                for (let i = firstChange; i <= lastChange; i++) {
                    const sourceIdx = firstChange - selectionLength + ((i - firstChange) % selectionLength);
                    if (nextData[i] && nextData[sourceIdx] && nextData[i].date !== nextData[sourceIdx].date) {
                        isDragFill = false;
                        break;
                    }
                }

                if (isDragFill) {
                    const d1 = new Date(nextData[anchorIdx - 1].date);
                    const d2 = new Date(nextData[anchorIdx].date);
                    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
                        let step = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
                        if (step !== 0) {
                            let baseDate = new Date(d2);
                            for (let i = firstChange; i <= lastChange; i++) {
                                baseDate.setDate(baseDate.getDate() + step);
                                const yyyy = baseDate.getFullYear();
                                const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
                                const dd = String(baseDate.getDate()).padStart(2, '0');
                                nextData[i] = { ...nextData[i], date: `${yyyy}-${mm}-${dd}` };
                            }
                        }
                    }
                }
            }
        }
    }

    setData(nextData);
    if (viewMode === 'entry') setDraftData(nextData);
  };


  const fetchLatestEntries = async () => {
    if (!selectedUser || !selectedUserName) return;
    try {
      setLoading(true);
      if (viewMode === 'entry') {
         setDraftData(data); // save draft
      }

      // Fetch transactions for the party
      const allTx = await billRecordsApi.getTransactions();
      // Filter by user id (client_id)
      const userTx = allTx.filter(t => t.client_id === parseInt(selectedUser)).slice(0, 50); // Get latest 50
      
      // Map to grid format
      const gridData = userTx.map(t => ({
        id: t.id,
        date: t.date || '',
        flower: t.flower_name || '',
        van: t.van || '',
        weight: t.weight || null,
        rate: t.rate || null,
        laggage: t.laggage || null,
        collie: t.collie || null
      }));
      
      // Add a few empty rows at the bottom
      gridData.push({}, {}, {}, {}, {});
      
      setData(gridData);
      setViewMode('latest');
    } catch (err) {
      console.error(err);
      alert("Failed to fetch latest entries.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToEntry = () => {
    setData(draftData);
    setViewMode('entry');
  };



  const handleFillDates = () => {
    let startDateStr = null;
    let startIdx = -1;
    for (let i = 0; i < data.length; i++) {
      if (data[i].date && !isNaN(new Date(data[i].date).getTime())) {
        startDateStr = data[i].date;
        startIdx = i;
        break;
      }
    }
    
    if (startIdx === -1) {
      alert("Please enter a valid date (YYYY-MM-DD) in the first row to start auto-filling.");
      return;
    }
    
    const newData = [...data];
    let currentDate = new Date(startDateStr);
    
    for (let i = startIdx + 1; i < newData.length; i++) {
      currentDate.setDate(currentDate.getDate() + 1);
      const yyyy = currentDate.getFullYear();
      const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dd = String(currentDate.getDate()).padStart(2, '0');
      
      newData[i] = { ...newData[i], date: `${yyyy}-${mm}-${dd}` };
    }
    setData(newData);
  };

  const processVan = (vanStr) => {
    let processedVan = (vanStr || "").trim();
    if (!processedVan) processedVan = 'v1';
    else if (!isNaN(processedVan)) processedVan = 'v' + processedVan;
    return processedVan;
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    
    try {
      let currentFlowers = [...partyFlowers];
      
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        // Skip completely empty rows
        if (!row.flower && !row.weight && !row.rate && !row.date) continue;
        
        // Validate required
        if (!row.flower) {
          alert(`Row ${i+1} is missing a Flower name. Skipping.`);
          continue;
        }
        
        let finalFlowerId = null;
        const existingFlower = currentFlowers.find(f => f.name.toLowerCase() === row.flower.toLowerCase().trim());
        
        if (existingFlower) {
          finalFlowerId = existingFlower.id;
        } else {
          const { createFlower } = await import('../services/api');
          const newFlower = await createFlower({ name: row.flower.trim(), user_id: parseInt(selectedUser, 10) });
          finalFlowerId = newFlower.id;
          currentFlowers.push(newFlower);
          setPartyFlowers(currentFlowers);
        }
        
        let formattedDate = row.date || null;
        if (formattedDate) {
           formattedDate = formattedDate.trim();
           const d = new Date(formattedDate);
           if (!isNaN(d.getTime())) {
               const yyyy = d.getFullYear();
               const mm = String(d.getMonth() + 1).padStart(2, '0');
               const dd = String(d.getDate()).padStart(2, '0');
               formattedDate = `${yyyy}-${mm}-${dd}`;
           }
        }

        const payload = {
          flower_id: finalFlowerId,
          date: formattedDate,
          weight: parseFloat(row.weight) || 0,
          van: processVan(row.van),
          rate: parseFloat(row.rate) || 0,
          laggage: parseFloat(row.laggage) || 0,
          collie: parseFloat(row.collie) || 0,
        };

        if (row.id) {
          // Update existing
          await billRecordsApi.updateRecord(row.id, payload);
        } else {
          // Create new
          await billRecordsApi.createRecord(payload);
        }
      }
      
      alert("Saved successfully!");
      if (onRecordsSaved) onRecordsSaved();
      
      // Refresh the grid
      handleUserChange({ target: { value: selectedUser } });
      
    } catch (err) {
      console.error(err);
      alert("Error saving some records. Please check the console.");
    } finally {
      setIsSaving(false);
    }
  };

  const uniqueFlowerNames = Array.from(new Set(partyFlowers.map(f => f.name)));
  const flowerOptions = uniqueFlowerNames.map(name => ({ value: name, label: name }));

  const datePickerColumn = {
    component: ({ rowData, setRowData, focus }) => {
      return (
        <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center' }}>
          <input
            type="text"
            autoFocus={focus}
            value={focus ? (rowData || '') : formatDateDisplay(rowData)}
            placeholder={focus ? "YYYY-MM-DD" : "DD-MM-YYYY"}
            onChange={(e) => setRowData(e.target.value)}
            style={{
              flex: 1,
              minWidth: 0,
              height: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              padding: '0 8px',
              color: 'black',
              fontFamily: 'inherit',
              fontSize: 'inherit',
            }}
          />
        </div>
      );
    },
    deleteValue: () => '',
    copyValue: ({ rowData }) => rowData || '',
    pasteValue: ({ value }) => {
      if (!value) return '';
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
      }
      return '';
    },
  };

  const flowerSelectColumn = {
    keepFocus: true,
    component: ({ rowData, setRowData, focus, stopEditing }) => {
      const selectRef = useRef(null);

      useEffect(() => {
        if (focus && selectRef.current) {
          selectRef.current.focus();
        }
      }, [focus]);

      return (
        <CreatableSelect
          ref={selectRef}
          menuPortalTarget={document.body}
          options={flowerOptions}
          value={flowerOptions.find((o) => o.value === rowData) || (rowData ? { value: rowData, label: rowData } : null)}
          onChange={(option) => {
            setRowData(option?.value || '');
            if (stopEditing) stopEditing({ nextRow: false });
            setTimeout(() => {
              const activeEl = document.activeElement || document.body;
              activeEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, bubbles: true, cancelable: true }));
            }, 10);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter') {
              e.stopPropagation();
            }
          }}
          styles={{
            control: (base) => ({
              ...base,
              border: 0,
              boxShadow: 'none',
              minHeight: '100%',
              height: '100%',
              backgroundColor: 'transparent',
              borderRadius: 0,
            }),
            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            menu: (base) => ({ ...base, right: 0, left: 'auto', width: 'max-content', minWidth: '100%' }),
            dropdownIndicator: (base) => ({ ...base, padding: '2px' }),
            clearIndicator: (base) => ({ ...base, padding: '2px' }),
            singleValue: (base) => ({ ...base, color: 'black' }),
            input: (base) => ({ ...base, color: 'black' }),
            option: (base, state) => ({ ...base, color: 'black', backgroundColor: state.isFocused ? '#e0e0e0' : 'white' }),
          }}
        />
      );
    },
    deleteValue: () => '',
    copyValue: ({ rowData }) => rowData || '',
    pasteValue: ({ value }) => value || '',
  };

  const columns = [
    { ...keyColumn('date', datePickerColumn), title: 'Date' },
    { ...keyColumn('flower', flowerSelectColumn), title: 'Flower' },
    { ...keyColumn('van', textColumn), title: 'Van' },
    { ...keyColumn('weight', floatColumn), title: 'Weight (kg)' },
    { ...keyColumn('rate', floatColumn), title: 'Rate (₹)' },
    { ...keyColumn('laggage', floatColumn), title: 'Laggage (₹)' },
    { ...keyColumn('collie', floatColumn), title: 'Collie (₹)' },
  ];

  return (
    <div className="card" style={{ marginBottom: '1rem', border: '1px solid var(--primary)' }}>
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <span style={{ fontSize: '1.4rem' }}>📊</span> Excel Entry
        </h2>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginLeft: '0.5rem' }}>
          Select a party to view and edit their records in a spreadsheet.
        </span>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '1.2rem', fontWeight: 600 }}>Year</label>
          <select className="select-input" value={selectedYear} onChange={handleYearChange} style={{ minWidth: '120px', padding: '0.5rem', fontSize: '1.2rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'white', color: 'black' }}>
            <option value="">-- Year --</option>
            {years.map(y => <option key={y.id} value={y.id}>{y.year}</option>)}
          </select>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '1.2rem', fontWeight: 600 }}>Group</label>
          <select className="select-input" value={selectedPlace} onChange={handlePlaceChange} disabled={!selectedYear} style={{ minWidth: '150px', padding: '0.5rem', fontSize: '1.2rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'white', color: 'black' }}>
            <option value="">-- Group --</option>
            {places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '1.2rem', fontWeight: 600 }}>Party</label>
          <select className="select-input" value={selectedUser} onChange={handleUserChange} disabled={!selectedPlace} style={{ minWidth: '180px', padding: '0.5rem', fontSize: '1.2rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'white', color: 'black' }}>
            <option value="">-- Party --</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        {selectedUser && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {viewMode === 'latest' && (
              <button 
                onClick={handleGoToEntry} 
                className="btn btn-secondary" 
                style={{ padding: '0.75rem 1.25rem', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              >
                Go Back to Entry
              </button>
            )}
            
            {viewMode === 'entry' && (
              <button 
                onClick={fetchLatestEntries} 
                disabled={isSaving || loading} 
                className="btn btn-secondary" 
                style={{ padding: '0.75rem 1.25rem', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <RefreshCw size={20} />
                Show Latest
              </button>
            )}

            
            <button 
              onClick={handleSave} 
              disabled={isSaving} 
              className="btn btn-primary" 
              style={{ padding: '0.75rem 1.5rem', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Save size={20} />
              {isSaving ? "Saving..." : "Save Data"}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <RefreshCw className="icon spin" /> Loading spreadsheet...
        </div>
      ) : selectedUser ? (
        <div style={{ height: '400px', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
          <DataSheetGrid
            value={data}
            onChange={handleDataChange}
            columns={columns}
          />
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)' }}>
          Select a Group and Party to start entering data in Excel mode.
        </div>
      )}
    </div>
  );
};

export default ExcelEntryGrid;
