import React, { useState, useEffect } from 'react';
import { getYears, getPlaces, getUsers, getFlowers, advancesApi } from '../services/api';
import { Printer, Calendar } from 'lucide-react';

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
  
  const [isPrinting, setIsPrinting] = useState(false);
  const [printData, setPrintData] = useState([]);
  
  const [columns, setColumns] = useState({
    date: true, van: true, weight: true, rate: true, total: true, laggage: true, collie: true
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
    if (pId) {
      try {
        const u = await getUsers(pId);
        setUsers(u || []);
      } catch (err) { console.error(err); }
    } else {
      setUsers([]);
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
      alert("Please select at least one user.");
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
            let records = flower.bill_records || [];
            
            // Apply Date Filter
            records = records.filter(r => {
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

            records.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

            const totals = records.reduce((acc, r) => {
                const w = parseFloat(r.weight) || 0;
                const rate = parseFloat(r.rate) || 0;
                const p = w * rate;
                return {
                    weight: acc.weight + w,
                    price: acc.price + p,
                    laggage: acc.laggage + (parseFloat(r.laggage) || 0),
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

        const totalAdvance = advances.reduce((sum, a) => sum + (parseFloat(a.advance_amount) || 0), 0);
        const totalDeduction = advances.reduce((sum, a) => sum + (parseFloat(a.deduction_amount) || 0), 0);
        
        const clientTotalLaggage = processedFlowers.reduce((sum, f) => sum + f.totals.laggage, 0);
        const clientTotalCollie = processedFlowers.reduce((sum, f) => sum + f.totals.collie, 0);
        
        const commissionDeduction = clientTotalPrice * (commissionPercent / 100);
        const grandTotal = clientTotalPrice - commissionDeduction - clientTotalLaggage - clientTotalCollie;
        const finalBalance = grandTotal - totalAdvance + totalDeduction;

        printGroups.push({
            client: user,
            placeName: placeName,
            flowers: processedFlowers,
            clientTotalPrice,
            clientTotalLaggage,
            clientTotalCollie,
            commissionDeduction,
            grandTotal,
            finalBalance
        });

      } catch (err) {
        console.error("Error fetching data for user", userId, err);
      }
    }

    if (printGroups.length === 0) {
      alert("No records found for the selected users in the given date range.");
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
        <h1 className="page-title"><Printer className="icon" /> Print Custom Users</h1>
      </div>

      <div className="card no-print" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Select Year</label>
            <select className="select-input" value={selectedYear} onChange={handleYearChange} style={{ width: '100%' }}>
              <option value="">-- Select Year --</option>
              {years.map(y => <option key={y.id} value={y.id}>{y.year}</option>)}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Select Place</label>
            <select className="select-input" value={selectedPlace} onChange={handlePlaceChange} disabled={!selectedYear} style={{ width: '100%' }}>
              <option value="">-- Select Place --</option>
              {places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}><Calendar size={14} style={{ display: 'inline', marginRight: '4px' }}/> From Date</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}><Calendar size={14} style={{ display: 'inline', marginRight: '4px' }}/> To Date</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Commission (%)</label>
            <input type="number" step="0.1" value={commissionPercent} onChange={(e) => setCommissionPercent(parseFloat(e.target.value) || 0)} className="input" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
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
            <h2 className="card-title">Select Users</h2>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              <input type="checkbox" checked={selectAll} onChange={handleSelectAll} style={{ width: '18px', height: '18px' }} />
              Select All Users
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
                <div key={group.client.id} style={{ pageBreakAfter: 'always', paddingBottom: '2rem' }}>
                    <div className="print-header" style={{ marginBottom: '1rem' }}>
                        <img 
                            src="/header.jpeg" 
                            alt="Header Image" 
                            style={{ width: '100%', height: 'auto', display: 'block', marginBottom: '1rem' }} 
                        />
                        <div style={{ marginTop: '10px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem', fontWeight: 'bold', background: 'white' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '4px', width: '20%', border: '1px solid #ccc' }}>Party Name:</td>
                                        <td style={{ padding: '4px', width: '30%', border: '1px solid #ccc' }}>{group.client.name}</td>
                                        <td style={{ padding: '4px', width: '20%', border: '1px solid #ccc' }}></td>
                                        <td style={{ padding: '4px', width: '30%', border: '1px solid #ccc' }}></td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '4px', border: '1px solid #ccc' }}>Phone:</td>
                                        <td style={{ padding: '4px', border: '1px solid #ccc' }}>{group.client.contact_number || ''}</td>
                                        <td style={{ padding: '4px', border: '1px solid #ccc' }}>Dates:</td>
                                        <td style={{ padding: '4px', border: '1px solid #ccc', fontSize: '0.85rem' }}>
                                          {fromDate || toDate ? `${fromDate ? fromDate : '...'} to ${toDate ? toDate : '...'}` : 'All Dates'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '4px', border: '1px solid #ccc' }}>Address:</td>
                                        <td style={{ padding: '4px', border: '1px solid #ccc' }}>{group.placeName}</td>
                                        <td style={{ padding: '4px', border: '1px solid #ccc', textAlign: 'right' }}>பாக்கி:</td>
                                        <td style={{ padding: '4px', border: '1px solid #ccc', color: 'black' }}>₹{Math.abs(group.finalBalance).toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {group.flowers.map(flower => (
                        <div key={flower.id} style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Flower: {flower.name}</h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid black' }}>
                                        {columns.date && <th className="col-date" style={{ padding: '4px' }}>Date</th>}
                                        {columns.van && <th className="col-van" style={{ padding: '4px' }}>Van</th>}
                                        {columns.weight && <th className="col-weight" style={{ padding: '4px' }}>Weight</th>}
                                        {columns.rate && <th className="col-rate" style={{ padding: '4px' }}>Rate</th>}
                                        {columns.total && <th className="col-total" style={{ padding: '4px' }}>Total</th>}
                                        {columns.laggage && <th className="col-laggage" style={{ padding: '4px' }}>Laggage</th>}
                                        {columns.collie && <th className="col-collie" style={{ padding: '4px' }}>Collie</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {flower.records.map((r, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #ccc' }}>
                                            {columns.date && <td className="col-date" style={{ padding: '4px' }}>{r.date}</td>}
                                            {columns.van && <td className="col-van" style={{ padding: '4px' }}>{r.van || '-'}</td>}
                                            {columns.weight && <td className="col-weight" style={{ padding: '4px' }}>{r.weight !== null && r.weight !== undefined ? parseFloat(r.weight).toFixed(3) : '-'}</td>}
                                            {columns.rate && <td className="col-rate" style={{ padding: '4px' }}>{r.rate || '-'}</td>}
                                            {columns.total && <td className="col-total" style={{ padding: '4px', fontWeight: 'bold' }}>₹{((parseFloat(r.weight) || 0) * (parseFloat(r.rate) || 0)).toFixed(2)}</td>}
                                            {columns.laggage && <td className="col-laggage" style={{ padding: '4px' }}>{r.laggage || '0'}</td>}
                                            {columns.collie && <td className="col-collie" style={{ padding: '4px' }}>{r.collie || '0'}</td>}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div style={{ marginTop: '8px', padding: '4px', background: 'transparent', fontSize: '0.85rem', display: 'flex', gap: '16px', flexWrap: 'wrap', fontWeight: 'bold' }}>
                                <span>Total Weight: {flower.totals.weight.toFixed(3)} kg</span>
                                <span>Laggage: ₹{flower.totals.laggage.toFixed(3)}</span>
                                <span>Collie: ₹{flower.totals.collie.toFixed(3)}</span>
                                <span>Flower Total: ₹{flower.totals.price.toFixed(3)}</span>
                            </div>
                        </div>
                    ))}
                    
                    <div style={{ marginTop: '16px', padding: '12px', background: 'transparent', border: '2px solid black', fontSize: '1rem', fontWeight: 'bold' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>Total of All Flowers:</span>
                            <span>₹{group.clientTotalPrice.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'red' }}>
                            <span>Total Laggage:</span>
                            <span>-₹{group.clientTotalLaggage.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'red' }}>
                            <span>Total Collie:</span>
                            <span>-₹{group.clientTotalCollie.toFixed(2)}</span>
                        </div>
                            {commissionPercent > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                                <span>Commission:</span>
                                <span>₹{group.commissionDeduction.toFixed(2)}</span>
                                </div>
                            )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ccc', paddingTop: '8px', color: 'green', fontSize: '1.1rem' }}>
                            <span>Grand Total:</span>
                            <span>₹{group.grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default CustomPrint;
