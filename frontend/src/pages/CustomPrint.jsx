import React, { useState, useEffect } from 'react';
import { getYears, getPlaces, getUsers, getFlowers, advancesApi } from '../services/api';
import { Printer, Calendar } from 'lucide-react';
import PrintTemplate from '../components/PrintTemplate';

const CustomPrint = () => {
  const [years, setYears] = useState([]);
  const [places, setPlaces] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedPlace, setSelectedPlace] = useState('');
  
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [commissionPercent, setCommissionPercent] = useState(10);
  const [selectedFlowerName, setSelectedFlowerName] = useState('');
  const [groupFlowerNames, setGroupFlowerNames] = useState([]);
  const [selectedVan, setSelectedVan] = useState('');
  
  const [isPrinting, setIsPrinting] = useState(false);
  const [printData, setPrintData] = useState([]);
  
  const [columns, setColumns] = useState({
    date: true, van: true, weight: true, rate: true, total: true, laggage: false, laggageTotal: false, collie: false
  });

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

  const handleYearChange = async (e) => {
    const yId = e.target.value;
    setSelectedYear(yId);
    setSelectedPlace('');
    setUsers([]);
    setSelectedUserIds(new Set());
    setSelectAll(false);
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
    setUsers([]);
    setSelectedUserIds(new Set());
    setSelectAll(false);
    setSelectedFlowerName('');
    if (pId) {
      try {
        const u = await getUsers(pId);
        setUsers(u || []);
        const f = await getFlowers(null, { place_id: pId });
        if (f) {
            const uniqueNames = [...new Set(f.map(flower => flower.name.trim().toLowerCase()))];
            const displayNames = uniqueNames.map(name => {
               const original = f.find(fl => fl.name.trim().toLowerCase() === name);
               return original ? original.name.trim() : name;
            }).sort();
            setGroupFlowerNames(displayNames);
        }
      } catch (err) { console.error(err); }
    } else {
      setUsers([]);
      setGroupFlowerNames([]);
    }
  };

  const handleSelectUser = (id) => {
    const newSet = new Set(selectedUserIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedUserIds(newSet);
    setSelectAll(newSet.size === users.length && users.length > 0);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUserIds(new Set());
      setSelectAll(false);
    } else {
      setSelectedUserIds(new Set(users.map(u => u.id)));
      setSelectAll(true);
    }
  };

  const handlePrint = async () => {
    if (selectedUserIds.size === 0) {
      alert("Please select at least one party.");
      return;
    }

    const placeObj = places.find(p => p.id === parseInt(selectedPlace));
    const placeName = placeObj ? placeObj.name : '';

    const printGroups = [];

    for (let userId of selectedUserIds) {
      const user = users.find(u => u.id === userId);
      if (!user) continue;

      try {
        const flowers = await getFlowers(null, { user_id: userId });
        const advances = await advancesApi.getUserAdvances(userId);
        
        let clientTotalPrice = 0;
        const processedFlowers = [];

        for (let flower of flowers) {
            if (selectedFlowerName && flower.name.trim().toLowerCase() !== selectedFlowerName.toLowerCase()) {
                continue;
            }
            let records = flower.bill_records || [];
            
            // Apply Date and Van Filter
            records = records.filter(r => {
                if (selectedVan && (r.van || '').toLowerCase() !== selectedVan.toLowerCase()) return false;

                if (!r.date) return true;
                const recordDate = new Date(r.date);
                if (isNaN(recordDate.getTime())) return true;
                recordDate.setHours(0,0,0,0);
                
                if (fromDate) {
                    const fDate = new Date(fromDate);
                    fDate.setHours(0,0,0,0);
                    if (recordDate < fDate) return false;
                }
                if (toDate) {
                    const tDate = new Date(toDate);
                    tDate.setHours(0,0,0,0);
                    if (recordDate > tDate) return false;
                }
                return true;
            });

            if (records.length === 0) continue;

            records.sort((a, b) => {
                if (!a.date) return 1;
                if (!b.date) return -1;
                return new Date(a.date) - new Date(b.date);
            });

            const totals = records.reduce((acc, r) => {
                const w = parseFloat(r.weight) || 0;
                const rate = parseFloat(r.rate) || 0;
                const p = w * rate;
                return {
                    weight: acc.weight + w,
                    price: acc.price + p,
                    laggage: acc.laggage + (w * (parseFloat(r.laggage) || 0)),
                    collie: acc.collie + (parseFloat(r.collie) || 0)
                };
            }, { weight: 0, price: 0, laggage: 0, collie: 0 });

            processedFlowers.push({
                ...flower,
                records,
                totals
            });

            clientTotalPrice += totals.price;
        }

        if (processedFlowers.length === 0) continue;

        const historicalAdvancesList = advances.filter(a => {
            if (!a.date) return true;
            const aDate = new Date(a.date);
            if (isNaN(aDate.getTime())) return true;
            aDate.setHours(0,0,0,0);
            if (toDate) {
                const tD = new Date(toDate);
                tD.setHours(0,0,0,0);
                if (aDate > tD) return false;
            }
            return true;
        });

        const periodAdvancesList = advances.filter(a => {
            if (!a.date) return true;
            const aDate = new Date(a.date);
            if (isNaN(aDate.getTime())) return true;
            aDate.setHours(0,0,0,0);
            if (fromDate) {
                const fD = new Date(fromDate);
                fD.setHours(0,0,0,0);
                if (aDate < fD) return false;
            }
            if (toDate) {
                const tD = new Date(toDate);
                tD.setHours(0,0,0,0);
                if (aDate > tD) return false;
            }
            return true;
        });

        const historicalAdvance = historicalAdvancesList.reduce((sum, a) => sum + (parseFloat(a.advance_amount) || 0), 0);
        const historicalDeduction = historicalAdvancesList.reduce((sum, a) => sum + (parseFloat(a.deduction_amount) || 0), 0);
        const finalBalance = historicalAdvance - historicalDeduction;

        const periodDeduction = periodAdvancesList.reduce((sum, a) => sum + (parseFloat(a.deduction_amount) || 0), 0);

        const clientTotalLaggage = processedFlowers.reduce((sum, f) => sum + f.totals.laggage, 0);
        const clientTotalCollie = processedFlowers.reduce((sum, f) => sum + f.totals.collie, 0);
        
        const commissionDeduction = clientTotalPrice * (commissionPercent / 100);
        const baseTotal = clientTotalPrice - commissionDeduction - clientTotalLaggage - clientTotalCollie;
        const grandTotal = baseTotal - periodDeduction;

        printGroups.push({
            client: user,
            placeName: placeName,
            flowers: processedFlowers,
            clientTotalPrice,
            clientTotalLaggage,
            clientTotalCollie,
            commissionDeduction,
            grandTotal,
            finalBalance,
            totalAdvance: historicalAdvance,
            periodDeduction
        });

      } catch (err) {
        console.error("Error fetching data for user", userId, err);
      }
    }

    if (printGroups.length === 0) {
      alert("No records found for the selected parties in the given date range.");
      return;
    }

    printGroups.sort((a, b) => a.client.name.localeCompare(b.client.name));

    setPrintData(printGroups);
    setIsPrinting(true);

    setTimeout(() => {
        window.print();
        setIsPrinting(false);
    }, 500);
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header no-print">
        <h1 className="page-title"><Printer className="icon" /> Print Custom Parties</h1>
      </div>

      <div className="card no-print" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Select Year</label>
            <select className="select-input" value={selectedYear} onChange={handleYearChange} style={{ width: '100%', padding: '0.75rem', fontSize: '1.2rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)' }}>
              <option value="" style={{ color: 'black' }}>-- Select Year --</option>
              {years.map(y => <option key={y.id} value={y.id} style={{ color: 'black' }}>{y.year}</option>)}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Select Group</label>
            <select className="select-input" value={selectedPlace} onChange={handlePlaceChange} disabled={!selectedYear} style={{ width: '100%', padding: '0.75rem', fontSize: '1.2rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)' }}>
              <option value="" style={{ color: 'black' }}>-- Select Group --</option>
              {places.map(p => <option key={p.id} value={p.id} style={{ color: 'black' }}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Select Flower</label>
            <select className="select-input" value={selectedFlowerName} onChange={(e) => setSelectedFlowerName(e.target.value)} disabled={!selectedPlace} style={{ width: '100%', padding: '0.75rem', fontSize: '1.2rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)' }}>
              <option value="" style={{ color: 'black' }}>-- All Flowers --</option>
              {groupFlowerNames.map(name => <option key={name} value={name} style={{ color: 'black' }}>{name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Select Van</label>
            <select className="select-input" value={selectedVan} onChange={(e) => setSelectedVan(e.target.value)} style={{ width: '100%', padding: '0.75rem', fontSize: '1.2rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)' }}>
              <option value="" style={{ color: 'black' }}>-- Both --</option>
              <option value="v1" style={{ color: 'black' }}>V1</option>
              <option value="v2" style={{ color: 'black' }}>V2</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}><Calendar size={18} style={{ display: 'inline', marginRight: '6px' }}/> From Date</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ width: '100%', padding: '0.75rem', fontSize: '1.2rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', colorScheme: 'dark' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}><Calendar size={18} style={{ display: 'inline', marginRight: '6px' }}/> To Date</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ width: '100%', padding: '0.75rem', fontSize: '1.2rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', colorScheme: 'dark' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Commission (%)</label>
            <input type="number" step="0.1" value={commissionPercent} onChange={(e) => setCommissionPercent(parseFloat(e.target.value) || 0)} className="input" style={{ width: '100%', padding: '0.75rem', fontSize: '1.2rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)' }} />
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 'bold' }}>Select Columns to Print:</label>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {Object.keys(columns).map(col => (
              <label key={col} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', textTransform: 'capitalize' }}>
                <input 
                  type="checkbox" 
                  checked={columns[col]} 
                  onChange={(e) => setColumns({ ...columns, [col]: e.target.checked })} 
                />
                {col}
              </label>
            ))}
          </div>
        </div>
      </div>

      {users.length > 0 && (
        <div className="card no-print" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="card-title">Select Parties</h2>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              <input type="checkbox" checked={selectAll} onChange={handleSelectAll} style={{ width: '18px', height: '18px' }} />
              Select All Parties
            </label>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {users.map(u => (
              <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', border: selectedUserIds.has(u.id) ? '2px solid var(--primary)' : '2px solid transparent' }}>
                <input 
                  type="checkbox" 
                  checked={selectedUserIds.has(u.id)} 
                  onChange={() => handleSelectUser(u.id)}
                  style={{ width: '16px', height: '16px' }}
                />
                {u.name}
              </label>
            ))}
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handlePrint} className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }} disabled={isPrinting}>
              <Printer size={20} style={{ marginRight: '8px' }} />
              {isPrinting ? 'Generating Print...' : `Print ${selectedUserIds.size} Users`}
            </button>
          </div>
        </div>
      )}

      {/* Hidden Print Section */}
      {isPrinting && (
        <div className="print-only">
            {printData.map(group => (
                <PrintTemplate 
                    key={group.client.id}
                    clientName={group.client.name}
                    clientPhone={group.client.contact_number}
                    placeName={group.placeName}
                    dateRangeString={fromDate || toDate ? `${fromDate ? fromDate : '...'} to ${toDate ? toDate : '...'}` : 'All Dates'}
                    finalBalance={group.finalBalance}
                    flowers={group.flowers}
                    commissionPercent={commissionPercent}
                    commissionDeduction={group.commissionDeduction}
                    clientTotalLaggage={group.clientTotalLaggage}
                    clientTotalCollie={group.clientTotalCollie}
                    clientTotalPrice={group.clientTotalPrice}
                    periodDeduction={group.periodDeduction}
                    grandTotal={group.grandTotal}
                    columns={columns}
                />
            ))}
        </div>
      )}
    </div>
  );
};

export default CustomPrint;
