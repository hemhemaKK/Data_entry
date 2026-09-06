import React, { useState, useEffect, useRef, useMemo } from 'react';
import { creditSalesApi, getFlowers } from '../services/api';
import { CreditCard, RefreshCw, Plus, Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { formatDateDisplay } from '../utils/formatters';
import SearchableDropdown from '../components/SearchableDropdown';

const CreditSales = () => {
  const [data, setData] = useState({ users: [], records: [] });
  const [flowers, setFlowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('records');
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterFlower, setFilterFlower] = useState('');

  // Bulk Selection
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [bulkDate, setBulkDate] = useState('');
  const [bulkWeight, setBulkWeight] = useState('');
  const [bulkRate, setBulkRate] = useState('');

  // Individual Editing
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // User Editing
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserFormData, setEditUserFormData] = useState({});

  // Drilldown
  const [expandedUsers, setExpandedUsers] = useState([]);
  const [expandedMonths, setExpandedMonths] = useState({});

  const toggleUser = (userId) => {
    setExpandedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const toggleMonth = (userId, monthKey) => {
    const key = `${userId}_${monthKey}`;
    setExpandedMonths(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const dateRef = useRef(null);
  const customerRef = useRef(null);
  const flowerRef = useRef(null);
  const weightRef = useRef(null);
  const rateRef = useRef(null);
  const typeRef = useRef(null);
  const amountRef = useRef(null);
  const submitBtnRef = useRef(null);

  const handleEnterKey = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
      }
    }
  };

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    flower_id: '',
    customer_name: '',
    weight: '',
    rate: '',
    type: 'Credit',
    amount: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesData, flowersData] = await Promise.all([
        creditSalesApi.getAllData(),
        getFlowers()
      ]);
      setData(salesData || { users: [], records: [] });
      setFlowers(flowersData || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_name || !formData.amount || !formData.flower_id) return alert('Customer Name, Flower, and Amount are required');
    try {
      setSubmitting(true);
      await creditSalesApi.createEntry({
        date: formData.date,
        flower_id: formData.flower_id ? parseInt(formData.flower_id) : null,
        customer_name: formData.customer_name,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        rate: formData.rate ? parseFloat(formData.rate) : null,
        type: formData.type,
        amount: parseFloat(formData.amount)
      });
      setFormData(prev => ({ ...prev, customer_name: '', flower_id: '', amount: '', weight: '', rate: '', type: 'Credit' }));
      fetchData();
      dateRef.current?.focus();
    } catch (err) {
      console.error('Failed to create entry:', err);
      alert('Failed to save entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editFormData.customer_name || !editFormData.amount) return alert('Customer Name and Amount are required');
    try {
      await creditSalesApi.updateEntry(editingRecordId, {
        date: editFormData.date,
        flower_id: editFormData.flower_id ? parseInt(editFormData.flower_id) : null,
        customer_name: editFormData.customer_name,
        weight: editFormData.weight ? parseFloat(editFormData.weight) : null,
        rate: editFormData.rate ? parseFloat(editFormData.rate) : null,
        type: editFormData.type,
        amount: parseFloat(editFormData.amount)
      });
      setEditingRecordId(null);
      fetchData();
    } catch (err) {
      console.error('Failed to update entry:', err);
      alert('Failed to update entry');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await creditSalesApi.deleteEntry(id);
      fetchData();
    } catch (err) {
      console.error("Failed to delete record:", err);
      alert("Failed to delete record");
    }
  };

  const handleUserEditChange = (e) => {
    const { name, value } = e.target;
    setEditUserFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveUserEdit = async () => {
    if (!editUserFormData.customer_name) return alert('Customer Name is required');
    try {
      await creditSalesApi.updateUser(editingUserId, {
        customer_name: editUserFormData.customer_name
      });
      setEditingUserId(null);
      fetchData();
    } catch (err) {
      console.error('Failed to update user:', err);
      alert('Failed to update user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user AND all their credit sales records? This cannot be undone.")) return;
    try {
      await creditSalesApi.deleteUser(id);
      fetchData();
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert("Failed to delete user");
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedRecords.length === 0) return;
    if (!bulkDate && !bulkWeight && !bulkRate) return alert("Enter at least one field to update (Date, Weight, or Rate)");
    
    if (!window.confirm(`Update ${selectedRecords.length} records?`)) return;
    
    setIsBulkUpdating(true);
    try {
      const payload = { record_ids: selectedRecords };
      if (bulkDate) payload.date = bulkDate;
      if (bulkWeight) payload.weight = parseFloat(bulkWeight);
      if (bulkRate) payload.rate = parseFloat(bulkRate);
      
      await creditSalesApi.bulkUpdateEntries(payload);
      setBulkDate('');
      setBulkWeight('');
      setBulkRate('');
      setSelectedRecords([]);
      fetchData();
    } catch (err) {
      console.error("Bulk update failed:", err);
      alert("Bulk update failed");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRecords.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedRecords.length} records?`)) return;
    
    setIsBulkUpdating(true);
    try {
      await creditSalesApi.bulkDeleteEntries({ record_ids: selectedRecords });
      setSelectedRecords([]);
      fetchData();
    } catch (err) {
      console.error("Bulk delete failed:", err);
      alert("Bulk delete failed");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleSelectAll = (e, filteredRecords) => {
    if (e.target.checked) {
      setSelectedRecords(filteredRecords.map(r => r.id));
    } else {
      setSelectedRecords([]);
    }
  };

  const handleSelectRecord = (id) => {
    setSelectedRecords(prev => 
      prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
    );
  };

  const { processedRecords, processedUsers } = useMemo(() => {
    // Sort ascending for running balance calculation
    const sortedForBalance = [...data.records].sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      if (dateA.getTime() !== dateB.getTime()) return dateA - dateB;
      return a.id - b.id;
    });

    const balances = {};
    const userTotals = {};

    const recordsWithBalance = sortedForBalance.map(r => {
      const cust = r.customer_name;
      if (!balances[cust]) balances[cust] = 0;
      if (!userTotals[cust]) userTotals[cust] = { credit: 0, debit: 0 };

      const c = r.credit || 0;
      const d = r.debit || 0;
      
      balances[cust] += (c - d);
      userTotals[cust].credit += c;
      userTotals[cust].debit += d;

      return { ...r, daily_balance: balances[cust] };
    });

    const usersWithTotals = data.users.map(u => {
      const totals = userTotals[u.customer_name] || { credit: 0, debit: 0 };
      
      const userRecords = recordsWithBalance.filter(r => r.customer_name === u.customer_name);
      const monthsMap = {};
      userRecords.forEach(r => {
        if (!r.date) return;
        const monthKey = r.date.substring(0, 7); // YYYY-MM
        if (!monthsMap[monthKey]) {
          monthsMap[monthKey] = {
            monthKey,
            records: [],
            credit: 0,
            debit: 0
          };
        }
        monthsMap[monthKey].records.push(r);
        monthsMap[monthKey].credit += (r.credit || 0);
        monthsMap[monthKey].debit += (r.debit || 0);
      });

      const months = Object.values(monthsMap).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
      
      return {
        ...u,
        total_credited: totals.credit,
        total_debited: totals.debit,
        balance: totals.credit - totals.debit,
        months
      };
    });

    return { processedRecords: recordsWithBalance, processedUsers: usersWithTotals };
  }, [data]);

  const filteredRecords = processedRecords.filter(r => {
    let match = true;
    if (filterDateFrom && r.date < filterDateFrom) match = false;
    if (filterDateTo && r.date > filterDateTo) match = false;
    if (filterFlower && r.flower_name !== filterFlower) match = false;
    if (filterCustomer && (!r.customer_name || !r.customer_name.toLowerCase().includes(filterCustomer.toLowerCase()))) match = false;
    return match;
  }).sort((a, b) => b.id - a.id);

  return (
    <div className="page-container" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <CreditCard size={28} className="text-primary" /> Credit Sales
          </h1>
          <p style={{ color: 'var(--text-secondary, #888)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            Manage credit and debit entries for customers
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchData} title="Refresh">
            <RefreshCw size={18} /> Refresh
          </button>
        </div>
      </div>

      <div className="card quick-entry-form" style={{ marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid var(--primary)' }}>
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Plus className="icon" style={{ color: 'var(--primary)' }} />
          <h2 className="card-title">Sales Entry</h2>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 150px' }}>
            <label style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Date:</label>
            <input ref={dateRef} onKeyDown={(e) => handleEnterKey(e, customerRef)} type="date" name="date" className="input" value={formData.date} onChange={handleChange} required style={{ padding: '0.5rem', fontSize: '1.1rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', flex: '2 1 200px' }}>
            <label style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Customer:</label>
            <SearchableDropdown
              inputRef={customerRef}
              options={(() => {
                const names = [...new Set(data.users.map(u => u.customer_name))].filter(Boolean);
                const opts = names.map(n => ({ id: n, name: n }));
                return opts.concat([{ id: 'ADD_NEW', name: 'New Customer...' }]);
              })()}
              value={formData.customer_name}
              onChange={(e) => {
                if (e.target.value === 'ADD_NEW') {
                  const newCust = prompt("Enter new customer name:");
                  if (newCust && newCust.trim()) {
                     handleChange({ target: { name: 'customer_name', value: newCust.trim() } });
                  }
                } else {
                  handleChange({ target: { name: 'customer_name', value: e.target.value } });
                }
              }}
              onKeyDown={(e) => handleEnterKey(e, flowerRef)}
              placeholder="Select Customer"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: '2 1 200px' }}>
            <label style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Flower:</label>
            <SearchableDropdown
              inputRef={flowerRef}
              options={flowers.map(f => ({ id: f.id, name: f.name }))}
              value={formData.flower_id}
              onChange={(e) => handleChange({ target: { name: 'flower_id', value: e.target.value } })}
              onKeyDown={(e) => handleEnterKey(e, weightRef)}
              placeholder="Select Flower"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 100px' }}>
            <label style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Weight:</label>
            <input ref={weightRef} onKeyDown={(e) => handleEnterKey(e, rateRef)} type="number" step="0.01" name="weight" className="input" value={formData.weight} onChange={handleChange} placeholder="Weight" style={{ padding: '0.5rem', fontSize: '1.1rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 100px' }}>
            <label style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Rate:</label>
            <input ref={rateRef} onKeyDown={(e) => handleEnterKey(e, typeRef)} type="number" step="0.01" name="rate" className="input" value={formData.rate} onChange={handleChange} placeholder="Rate" style={{ padding: '0.5rem', fontSize: '1.1rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 120px' }}>
            <label style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Type:</label>
            <select ref={typeRef} onKeyDown={(e) => handleEnterKey(e, amountRef)} name="type" className="select" value={formData.type} onChange={handleChange} required style={{ padding: '0.5rem', fontSize: '1.1rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <option value="Credit">Credit</option>
              <option value="Debit">Debit</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 120px' }}>
            <label style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Amount:</label>
            <input ref={amountRef} onKeyDown={(e) => handleEnterKey(e, submitBtnRef)} type="number" step="0.01" name="amount" className="input" value={formData.amount} onChange={handleChange} required placeholder="Amt" style={{ padding: '0.5rem', fontSize: '1.1rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button ref={submitBtnRef} type="submit" className="btn btn-primary" disabled={submitting} style={{ padding: '0.5rem 1.5rem', fontSize: '1.1rem', fontWeight: 600, height: '42px' }}>
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className={`btn ${activeTab === 'records' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('records')}>
          Credit Sales Records
        </button>
        <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('users')}>
          Credit Sales Users
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        {activeTab === 'records' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 className="card-title" style={{ fontSize: '1.25rem', margin: 0 }}>
              {(filterCustomer || filterFlower || filterDateFrom || filterDateTo) ? "Search/Filter Results" : "All Records"}
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="input" title="From Date" style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
              <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="input" title="To Date" style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
              <input type="text" placeholder="Search Customer..." value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)} className="input" style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
              <select value={filterFlower} onChange={(e) => setFilterFlower(e.target.value)} className="select-input" style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                <option value="">All Flowers</option>
                {[...new Set(data.records.map(r => r.flower_name).filter(Boolean))].map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <button className="btn btn-secondary" onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); setFilterCustomer(''); setFilterFlower(''); }} style={{ padding: '0.5rem 1rem' }}>Clear</button>
            </div>
            
            {selectedRecords.length > 0 && (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--primary)' }}>
                <span style={{ fontWeight: 'bold' }}>{selectedRecords.length} selected</span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginLeft: 'auto' }}>
                  <input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} className="input" style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
                  <input type="number" step="0.01" placeholder="Weight" value={bulkWeight} onChange={(e) => setBulkWeight(e.target.value)} className="input" style={{ width: '90px', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
                  <input type="number" step="0.01" placeholder="Rate" value={bulkRate} onChange={(e) => setBulkRate(e.target.value)} className="input" style={{ width: '90px', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
                  <button className="btn btn-primary btn-sm" onClick={handleBulkUpdate} disabled={isBulkUpdating}>{isBulkUpdating ? 'Updating...' : 'Update Selected'}</button>
                  <div style={{ borderLeft: '1px solid var(--border)', height: '24px', margin: '0 0.5rem' }}></div>
                  <button className="btn btn-danger btn-sm" onClick={handleBulkDelete} disabled={isBulkUpdating}>{isBulkUpdating ? 'Deleting...' : 'Delete Selected'}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading credit sales data...
          </div>
        ) : activeTab === 'records' ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input type="checkbox" checked={selectedRecords.length > 0 && selectedRecords.length === filteredRecords.length} onChange={(e) => handleSelectAll(e, filteredRecords)} />
                  </th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Flower</th>
                  <th>Weight</th>
                  <th>Rate</th>
                  <th>Total</th>
                  <th style={{ textAlign: 'right' }}>Credit (₹)</th>
                  <th style={{ textAlign: 'right' }}>Debit (₹)</th>
                  <th style={{ textAlign: 'right' }}>Daily Balance (₹)</th>
                  <th style={{ textAlign: 'center', width: '80px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr><td colSpan="11" style={{textAlign: 'center'}}>No records found.</td></tr>
                ) : filteredRecords.map((item) => (
                  <tr key={item.id}>
                    <td style={{ textAlign: 'center' }}>
                      <input type="checkbox" checked={selectedRecords.includes(item.id)} onChange={() => handleSelectRecord(item.id)} />
                    </td>
                    {editingRecordId === item.id ? (
                      <>
                        <td><input type="date" name="date" value={editFormData.date} onChange={handleEditChange} className="input" style={{ width: '110px' }} /></td>
                        <td><input type="text" name="customer_name" value={editFormData.customer_name} onChange={handleEditChange} className="input" style={{ width: '120px' }} /></td>
                        <td>
                          <select name="flower_id" value={editFormData.flower_id} onChange={handleEditChange} className="select">
                            <option value="">-</option>
                            {flowers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                          </select>
                        </td>
                        <td><input type="number" step="0.01" name="weight" value={editFormData.weight} onChange={handleEditChange} className="input" style={{ width: '70px' }} /></td>
                        <td><input type="number" step="0.01" name="rate" value={editFormData.rate} onChange={handleEditChange} className="input" style={{ width: '70px' }} /></td>
                        <td style={{ fontWeight: '600' }}>{(editFormData.weight && editFormData.rate) ? (parseFloat(editFormData.weight) * parseFloat(editFormData.rate)).toFixed(2) : '-'}</td>
                        <td colSpan="3" style={{ display: 'flex', gap: '0.5rem' }}>
                          <select name="type" value={editFormData.type} onChange={handleEditChange} className="select" style={{ width: '80px' }}>
                            <option value="Credit">Cr</option>
                            <option value="Debit">Db</option>
                          </select>
                          <input type="number" step="0.01" name="amount" value={editFormData.amount} onChange={handleEditChange} className="input" style={{ width: '80px' }} />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button className="btn btn-primary btn-sm" onClick={handleSaveEdit} style={{ marginRight: '0.5rem' }}>Save</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditingRecordId(null)}>Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ whiteSpace: 'nowrap' }}>{item.date ? formatDateDisplay(item.date) : '-'}</td>
                        <td style={{ fontWeight: '500' }}>{item.customer_name || '-'}</td>
                        <td>{item.flower_name || '-'}</td>
                        <td>{item.weight || '-'}</td>
                        <td>{item.rate || '-'}</td>
                        <td style={{ fontWeight: '600' }}>{(item.weight && item.rate) ? (parseFloat(item.weight) * parseFloat(item.rate)).toFixed(2) : '-'}</td>
                        <td style={{ textAlign: 'right', fontWeight: '700', color: '#10b981' }}>{item.credit ? `₹${item.credit.toLocaleString('en-IN')}` : '-'}</td>
                        <td style={{ textAlign: 'right', fontWeight: '600', color: '#ef4444' }}>{item.debit ? `₹${item.debit.toLocaleString('en-IN')}` : '-'}</td>
                        <td style={{ textAlign: 'right', fontWeight: '700', color: item.daily_balance >= 0 ? '#10b981' : '#ef4444' }}>{item.daily_balance != null ? `₹${item.daily_balance.toLocaleString('en-IN')}` : '-'}</td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button className="btn btn-icon" onClick={() => {
                            setEditingRecordId(item.id);
                            setEditFormData({
                              date: item.date || '',
                              customer_name: item.customer_name || '',
                              flower_id: item.flower_id || '',
                              weight: item.weight || '',
                              rate: item.rate || '',
                              type: item.credit ? 'Credit' : 'Debit',
                              amount: item.credit || item.debit || ''
                            });
                          }} title="Edit"><Edit2 size={16} /></button>
                          <button className="btn btn-icon" onClick={() => handleDelete(item.id)} title="Delete" style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer Name</th>
                  <th style={{ textAlign: 'right' }}>Total Credited (₹)</th>
                  <th style={{ textAlign: 'right' }}>Total Debited (₹)</th>
                  <th style={{ textAlign: 'right' }}>Balance (₹)</th>
                  <th style={{ textAlign: 'center', width: '80px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {processedUsers.length === 0 ? (
                  <tr><td colSpan="6" style={{textAlign: 'center'}}>No users found.</td></tr>
                ) : [...processedUsers].sort((a, b) => b.id - a.id).map((user) => {
                  const isUserExpanded = expandedUsers.includes(user.id);
                  return (
                    <React.Fragment key={user.id}>
                      {editingUserId === user.id ? (
                        <tr style={{ background: 'var(--bg-secondary)' }}>
                          <td>{user.id}</td>
                          <td colSpan="5">
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                              <input type="text" name="customer_name" value={editUserFormData.customer_name} onChange={handleUserEditChange} className="input" style={{ width: '250px' }} />
                              <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); handleSaveUserEdit(); }}>Save</button>
                              <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); setEditingUserId(null); }}>Cancel</button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr onClick={() => toggleUser(user.id)} style={{ cursor: 'pointer', background: isUserExpanded ? 'var(--bg-secondary)' : 'transparent' }}>
                          <td>{user.id}</td>
                          <td style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {isUserExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            {user.customer_name}
                          </td>
                          <td style={{ textAlign: 'right', color: '#10b981' }}>{user.total_credited ? `₹${user.total_credited.toLocaleString('en-IN')}` : '-'}</td>
                          <td style={{ textAlign: 'right', color: '#ef4444' }}>{user.total_debited ? `₹${user.total_debited.toLocaleString('en-IN')}` : '-'}</td>
                          <td style={{ textAlign: 'right', fontWeight: '700', color: user.balance >= 0 ? '#10b981' : '#ef4444' }}>{user.balance != null ? `₹${user.balance.toLocaleString('en-IN')}` : '-'}</td>
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                            <button className="btn btn-icon" onClick={(e) => {
                              e.stopPropagation();
                              setEditingUserId(user.id);
                              setEditUserFormData({ customer_name: user.customer_name || '' });
                            }} title="Edit"><Edit2 size={16} /></button>
                            <button className="btn btn-icon" onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUser(user.id);
                            }} title="Delete" style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                          </td>
                        </tr>
                      )}
                      {isUserExpanded && (
                        <tr>
                          <td colSpan="6" style={{ padding: 0 }}>
                            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
                              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Monthly History</h4>
                              <table className="table" style={{ width: '100%', background: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <thead style={{ background: 'var(--bg-secondary)' }}>
                                  <tr>
                                    <th>Month</th>
                                    <th style={{ textAlign: 'right' }}>Month Credit</th>
                                    <th style={{ textAlign: 'right' }}>Month Debit</th>
                                    <th style={{ textAlign: 'right' }}>Month Balance</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {user.months.length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center' }}>No history found</td></tr>
                                  ) : user.months.map(m => {
                                    const mKey = `${user.id}_${m.monthKey}`;
                                    const isMonthExpanded = expandedMonths[mKey];
                                    const mBal = m.credit - m.debit;
                                    return (
                                      <React.Fragment key={mKey}>
                                        <tr onClick={() => toggleMonth(user.id, m.monthKey)} style={{ cursor: 'pointer', background: isMonthExpanded ? 'var(--bg-secondary)' : 'transparent', borderTop: '1px solid var(--border)' }}>
                                          <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                                            {isMonthExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            {m.monthKey}
                                          </td>
                                          <td style={{ textAlign: 'right', color: '#10b981' }}>{m.credit ? `₹${m.credit.toLocaleString('en-IN')}` : '-'}</td>
                                          <td style={{ textAlign: 'right', color: '#ef4444' }}>{m.debit ? `₹${m.debit.toLocaleString('en-IN')}` : '-'}</td>
                                          <td style={{ textAlign: 'right', fontWeight: '600', color: mBal >= 0 ? '#10b981' : '#ef4444' }}>{mBal !== 0 ? `₹${mBal.toLocaleString('en-IN')}` : '-'}</td>
                                        </tr>
                                        {isMonthExpanded && (
                                          <tr>
                                            <td colSpan="4" style={{ padding: 0 }}>
                                              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)' }}>
                                                <table className="table" style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                                                  <thead>
                                                    <tr>
                                                      <th>Date</th>
                                                      <th>Flower</th>
                                                      <th>Weight</th>
                                                      <th>Rate</th>
                                                      <th>Total</th>
                                                      <th style={{ textAlign: 'right' }}>Credit (₹)</th>
                                                      <th style={{ textAlign: 'right' }}>Debit (₹)</th>
                                                      <th style={{ textAlign: 'right' }}>Daily Bal (₹)</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {m.records.sort((a,b)=> b.id - a.id).map(item => (
                                                      <tr key={item.id}>
                                                        <td style={{ whiteSpace: 'nowrap' }}>{item.date ? formatDateDisplay(item.date) : '-'}</td>
                                                        <td>{item.flower_name || '-'}</td>
                                                        <td>{item.weight || '-'}</td>
                                                        <td>{item.rate || '-'}</td>
                                                        <td style={{ fontWeight: '600' }}>{(item.weight && item.rate) ? (parseFloat(item.weight) * parseFloat(item.rate)).toFixed(2) : '-'}</td>
                                                        <td style={{ textAlign: 'right', fontWeight: '700', color: '#10b981' }}>{item.credit ? `₹${item.credit.toLocaleString('en-IN')}` : '-'}</td>
                                                        <td style={{ textAlign: 'right', fontWeight: '600', color: '#ef4444' }}>{item.debit ? `₹${item.debit.toLocaleString('en-IN')}` : '-'}</td>
                                                        <td style={{ textAlign: 'right', fontWeight: '700', color: item.daily_balance >= 0 ? '#10b981' : '#ef4444' }}>{item.daily_balance != null ? `₹${item.daily_balance.toLocaleString('en-IN')}` : '-'}</td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                            </td>
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditSales;
