import React, { useState, useEffect } from "react";
import { FaEdit, FaTrashAlt, FaChevronDown, FaChevronUp, FaPlus, FaCheck, FaTimes } from "react-icons/fa";
import { billRecordsApi } from "../services/api";

// Helper to format month (YYYY-MM to "October 2023")
const formatMonthLabel = (yyyyMm) => {
  if (yyyyMm === 'Unknown') return 'Unknown Month';
  const [year, month] = yyyyMm.split('-');
  const date = new Date(year, month - 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const MonthCard = ({ month, records, onUpdateRecord, onDeleteRecord, onRecordsUpdated, flowerName, clientName, clientPhone, placeName, printTargetMonth, flowerId }) => {
  const [expanded, setExpanded] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    const handlePrint = (e) => {
        const targetMonth = typeof e.detail === 'string' ? e.detail : e.detail?.month;
        const targetFlowerId = typeof e.detail === 'string' ? null : e.detail?.flowerId;
        
        if (targetMonth === month) {
            if (!targetFlowerId || targetFlowerId === flowerId) {
                setExpanded(true);
            } else {
                setExpanded(false);
            }
        } else {
            setExpanded(false);
        }
    };
    window.addEventListener('printMonth', handlePrint);
    return () => window.removeEventListener('printMonth', handlePrint);
  }, [month]);

  useEffect(() => {
    if (printTargetMonth === month) {
        setExpanded(true);
    }
  }, [printTargetMonth, month]);

  const handleIndividualPrint = async (e) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('printMonth', { detail: { month, flowerId } }));
    
    const afterPrint = async () => {
        window.removeEventListener('afterprint', afterPrint);
        // Add a tiny delay so the browser can close the print dialog cleanly
        setTimeout(async () => {
            const success = window.confirm("Did the document print successfully?\n\nClick 'OK' for Yes, or 'Cancel' if it failed.");
            const recordIds = records.map(r => r.id);
            if (recordIds.length > 0) {
                try {
                    await billRecordsApi.markRecordsPrinted(recordIds, success);
                    if (onRecordsUpdated) onRecordsUpdated();
                } catch (err) {
                    console.error("Failed to mark printed", err);
                }
            }
        }, 300);
    };
    
    window.addEventListener('afterprint', afterPrint);
    setTimeout(() => window.print(), 500);
  };

  // Calculate totals
  const totals = records.reduce((acc, curr) => {
    const w = curr.weight || 0;
    const r = curr.rate || 0;
    const l = curr.laggage || 0;
    const c = curr.collie || 0;
    
    acc.weight += w;
    acc.laggage += l;
    acc.collie += c;
    acc.price += (w * r) + l + c;
    return acc;
  }, { weight: 0, laggage: 0, collie: 0, price: 0 });

  const handleEditClick = (record) => {
    setEditingId(record.id);
    setEditFormData({
      date: record.date || "",
      weight: record.weight || "",
      van: record.van || "",
      rate: record.rate || "",
      laggage: record.laggage || "",
      collie: record.collie || ""
    });
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = async (recordId) => {
    const payload = {
      flower_id: records[0].flower_id,
      date: editFormData.date || null,
      weight: editFormData.weight !== "" ? parseFloat(editFormData.weight) : null,
      van: editFormData.van || null,
      rate: editFormData.rate !== "" ? parseFloat(editFormData.rate) : null,
      laggage: editFormData.laggage !== "" ? parseFloat(editFormData.laggage) : 0,
      collie: editFormData.collie !== "" ? parseFloat(editFormData.collie) : 0
    };
    await onUpdateRecord(recordId, payload);
    setEditingId(null);
  };

  return (
    <div className={`month-card ${expanded ? 'expanded' : ''}`} style={{ border: '1px solid var(--border)', borderRadius: '6px', marginBottom: '8px' }}>
      <div className="print-header" style={{ display: 'none', marginBottom: '1rem' }}>
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
                        <td style={{ padding: '4px', width: '30%', border: '1px solid #ccc' }}>{clientName}</td>
                        <td style={{ padding: '4px', width: '20%', border: '1px solid #ccc' }}></td>
                        <td style={{ padding: '4px', width: '30%', border: '1px solid #ccc' }}></td>
                    </tr>
                    <tr>
                        <td style={{ padding: '4px', border: '1px solid #ccc' }}>Phone:</td>
                        <td style={{ padding: '4px', border: '1px solid #ccc' }}>{clientPhone || ''}</td>
                        <td style={{ padding: '4px', border: '1px solid #ccc' }}></td>
                        <td style={{ padding: '4px', border: '1px solid #ccc' }}></td>
                    </tr>
                    <tr>
                        <td style={{ padding: '4px', border: '1px solid #ccc' }}>Address:</td>
                        <td style={{ padding: '4px', border: '1px solid #ccc' }}>{placeName || ''}</td>
                        <td style={{ padding: '4px', border: '1px solid #ccc', textAlign: 'right' }}>பாக்கி:</td>
                        <td style={{ padding: '4px', border: '1px solid #ccc', color: 'black' }}>₹{totals.price.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style={{ padding: '4px', border: '1px solid #ccc' }}>Flower:</td>
                        <td style={{ padding: '4px', border: '1px solid #ccc' }}>{flowerName}</td>
                        <td style={{ padding: '4px', border: '1px solid #ccc' }}></td>
                        <td style={{ padding: '4px', border: '1px solid #ccc' }}></td>
                    </tr>
                </tbody>
            </table>
        </div>
      </div>
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{ padding: '12px', background: 'var(--surface)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <strong>{formatMonthLabel(month)}</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={handleIndividualPrint} className="btn btn-sm no-print" style={{ padding: '2px 6px', fontSize: '0.75rem', background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
            Print Month
          </button>
          {expanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
        </div>
      </div>
      
      {expanded && (
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)', overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '0.85rem', textAlign: 'left', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="col-date" style={{ padding: '8px 4px' }}>Date</th>
                <th className="col-weight" style={{ padding: '8px 4px' }}>Weight (kg)</th>
                <th className="col-van" style={{ padding: '8px 4px' }}>Van</th>
                <th className="col-rate" style={{ padding: '8px 4px' }}>Rate (₹)</th>
                <th className="col-laggage" style={{ padding: '8px 4px' }}>Laggage (₹)</th>
                <th className="col-collie" style={{ padding: '8px 4px' }}>Collie (₹)</th>
                <th className="col-printed no-print" style={{ padding: '8px 4px', textAlign: 'center' }}>Printed</th>
                <th className="col-actions no-print" style={{ padding: '8px 4px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...records].sort((a, b) => {
                  if (!a.date) return 1;
                  if (!b.date) return -1;
                  return new Date(a.date) - new Date(b.date);
              }).map(record => (
                <tr key={record.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  {editingId === record.id ? (
                    <>
                      <td className="col-date" style={{ padding: '4px' }}>
                        <input type="date" name="date" value={editFormData.date} onChange={handleEditChange} style={{ width: '100%', padding: '4px' }} />
                      </td>
                      <td className="col-weight" style={{ padding: '4px' }}>
                        <input type="number" step="0.01" name="weight" value={editFormData.weight} onChange={handleEditChange} style={{ width: '100%', padding: '4px' }} />
                      </td>
                      <td className="col-van" style={{ padding: '4px' }}>
                        <input type="text" name="van" value={editFormData.van} onChange={handleEditChange} style={{ width: '100%', padding: '4px' }} />
                      </td>
                      <td className="col-rate" style={{ padding: '4px' }}>
                        <input type="number" step="0.01" name="rate" value={editFormData.rate} onChange={handleEditChange} style={{ width: '100%', padding: '4px' }} />
                      </td>
                      <td className="col-laggage" style={{ padding: '4px' }}>
                        <input type="number" step="0.01" name="laggage" value={editFormData.laggage} onChange={handleEditChange} style={{ width: '100%', padding: '4px' }} />
                      </td>
                      <td className="col-collie" style={{ padding: '4px' }}>
                        <input type="number" step="0.01" name="collie" value={editFormData.collie} onChange={handleEditChange} style={{ width: '100%', padding: '4px' }} />
                      </td>
                      <td className="col-printed no-print" style={{ padding: '4px', textAlign: 'center' }}>
                        <select name="print_taken" value={editFormData.print_taken ? "true" : "false"} onChange={(e) => setEditFormData({...editFormData, print_taken: e.target.value === "true"})} style={{ padding: '4px' }}>
                            <option value="false">No</option>
                            <option value="true">Yes</option>
                        </select>
                      </td>
                      <td className="col-actions no-print" style={{ padding: '4px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button onClick={() => handleSaveEdit(record.id)} className="icon-btn icon-btn-sm" style={{ marginRight: '4px', color: 'green' }} title="Save"><FaCheck /></button>
                        <button onClick={() => setEditingId(null)} className="icon-btn icon-btn-sm icon-btn-danger" title="Cancel"><FaTimes /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="col-date" style={{ padding: '6px 4px' }}>{record.date || '-'}</td>
                      <td className="col-weight" style={{ padding: '6px 4px' }}>{record.weight !== null && record.weight !== undefined ? parseFloat(record.weight).toFixed(3) : '-'}</td>
                      <td className="col-van" style={{ padding: '6px 4px' }}>{record.van || '-'}</td>
                      <td className="col-rate" style={{ padding: '6px 4px' }}>{record.rate || '-'}</td>
                      <td className="col-laggage" style={{ padding: '6px 4px' }}>{record.laggage || '0'}</td>
                      <td className="col-collie" style={{ padding: '6px 4px' }}>{record.collie || '0'}</td>
                      <td className="col-printed no-print" style={{ padding: '6px 4px', textAlign: 'center' }}>
                          <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', background: record.print_taken ? '#d4edda' : '#e2e3e5', color: record.print_taken ? '#155724' : '#383d41' }}>
                              {record.print_taken ? 'Yes' : 'No'}
                          </span>
                      </td>
                      <td className="col-actions no-print" style={{ padding: '6px 4px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button onClick={() => handleEditClick(record)} className="icon-btn icon-btn-sm" style={{ marginRight: '4px' }} title="Edit"><FaEdit /></button>
                        <button onClick={() => onDeleteRecord(record.id)} className="icon-btn icon-btn-sm icon-btn-danger" title="Delete"><FaTrashAlt /></button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '12px', padding: '8px', background: 'var(--background)', borderRadius: '4px', fontSize: '0.85rem', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span><strong>Total Weight:</strong> {totals.weight.toFixed(3)} kg</span>
            <span><strong>Laggage:</strong> ₹{totals.laggage.toFixed(3)}</span>
            <span><strong>Collie:</strong> ₹{totals.collie.toFixed(3)}</span>
            <span><strong>Monthly Total:</strong> ₹{totals.price.toFixed(3)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const InlineAddForm = ({ flowerId, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    date: "", weight: "", van: "", rate: "", laggage: "", collie: ""
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      flower_id: flowerId,
      date: formData.date || null,
      weight: formData.weight !== "" ? parseFloat(formData.weight) : null,
      van: formData.van || null,
      rate: formData.rate !== "" ? parseFloat(formData.rate) : null,
      laggage: formData.laggage !== "" ? parseFloat(formData.laggage) : 0,
      collie: formData.collie !== "" ? parseFloat(formData.collie) : 0
    });
  };

  return (
    <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--surface)', border: '1px solid var(--primary)', borderRadius: '6px' }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--primary)' }}>Add New Record</h4>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 120px' }}>
          <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Date</label>
          <input type="date" name="date" required value={formData.date} onChange={handleChange} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }} />
        </div>
        <div style={{ flex: '1 1 80px' }}>
          <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Weight</label>
          <input type="number" step="0.01" name="weight" value={formData.weight} onChange={handleChange} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }} />
        </div>
        <div style={{ flex: '1 1 80px' }}>
          <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Van</label>
          <input type="text" name="van" value={formData.van} onChange={handleChange} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }} />
        </div>
        <div style={{ flex: '1 1 80px' }}>
          <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Rate</label>
          <input type="number" step="0.01" name="rate" value={formData.rate} onChange={handleChange} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }} />
        </div>
        <div style={{ flex: '1 1 80px' }}>
          <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Laggage</label>
          <input type="number" step="0.01" name="laggage" value={formData.laggage} onChange={handleChange} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }} />
        </div>
        <div style={{ flex: '1 1 80px' }}>
          <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Collie</label>
          <input type="number" step="0.01" name="collie" value={formData.collie} onChange={handleChange} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }} />
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '6px 12px' }}>Save</button>
          <button type="button" onClick={onCancel} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px' }}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

const FlowerCard = ({ flower, clientName, fromDate, toDate, onEdit, onDelete, onRecordsUpdated }) => {
  const [expanded, setExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [printTargetMonth, setPrintTargetMonth] = useState(null);

  // Group records by month, sorted by date descending internally
  const groupedRecords = {};
  let records = flower.bill_records ? [...flower.bill_records].sort((a, b) => (b.date || "").localeCompare(a.date || "")) : [];
  
  // Date Range Filtering
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

  records.forEach(r => {
    const month = r.date ? r.date.substring(0, 7) : 'Unknown';
    if (!groupedRecords[month]) groupedRecords[month] = [];
    groupedRecords[month].push(r);
  });

  const months = Object.keys(groupedRecords).sort().reverse(); // newest first

  useEffect(() => {
    const handlePrintMonth = (e) => {
        const targetMonth = typeof e.detail === 'string' ? e.detail : e.detail.month;
        const targetFlowerId = typeof e.detail === 'object' ? e.detail.flowerId : null;

        if (groupedRecords[targetMonth]) {
            if (!targetFlowerId || targetFlowerId === flower.id) {
                setPrintTargetMonth(targetMonth);
                setExpanded(true);
            } else {
                setExpanded(false);
            }
        } else {
            setExpanded(false);
        }
    };
    window.addEventListener('printMonth', handlePrintMonth);
    return () => window.removeEventListener('printMonth', handlePrintMonth);
  }, [JSON.stringify(Object.keys(groupedRecords)), flower.id]);

  const handleUpdateRecord = async (recordId, payload) => {
    try {
      await billRecordsApi.updateRecord(recordId, payload);
      if (onRecordsUpdated) onRecordsUpdated();
    } catch (err) {
      alert("Failed to update record");
      console.error(err);
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await billRecordsApi.deleteRecord(recordId);
        if (onRecordsUpdated) onRecordsUpdated();
      } catch (err) {
        alert("Failed to delete record");
        console.error(err);
      }
    }
  };

  const handleCreateRecord = async (payload) => {
    try {
      await billRecordsApi.createRecord(payload);
      setShowAddForm(false);
      if (onRecordsUpdated) onRecordsUpdated();
    } catch (err) {
      alert("Failed to add record");
      console.error(err);
    }
  };

  return (
    <div className={`flower-card ${expanded ? 'expanded' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="flower-card-name" onClick={() => setExpanded(!expanded)} style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
           {flower.name} 
          <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
            {records.length > 0 && `(${records.length} records)`}
          </span>
          {expanded ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
        </span>
        <div className="flower-card-actions no-print">
          {expanded && !showAddForm && (
             <button onClick={() => setShowAddForm(true)} className="btn btn-sm" style={{ marginRight: '8px', padding: '4px 8px', fontSize: '0.8rem' }} title="Add Record">
               <FaPlus style={{ marginRight: '4px' }} /> Add Record
             </button>
          )}
          <button onClick={onEdit} className="icon-btn icon-btn-sm" title="Edit">
            <FaEdit />
          </button>
          <button onClick={onDelete} className="icon-btn icon-btn-sm icon-btn-danger" title="Delete">
            <FaTrashAlt />
          </button>
        </div>
      </div>
      
      {expanded && (
        <div style={{ marginTop: '1rem' }}>
          {/* Add form appears at the top when adding a new record */}
          {showAddForm && (
            <InlineAddForm 
              flowerId={flower.id} 
              onSave={handleCreateRecord} 
              onCancel={() => setShowAddForm(false)} 
            />
          )}

          {months.length > 0 ? (
            months.map(month => (
              <MonthCard 
                key={month} 
                month={month} 
                flowerId={flower.id}
                flowerName={flower.name}
                clientName={clientName}
                records={groupedRecords[month]} 
                onUpdateRecord={handleUpdateRecord}
                onDeleteRecord={handleDeleteRecord}
                onRecordsUpdated={onRecordsUpdated}
                printTargetMonth={printTargetMonth}
              />
            ))
          ) : (
            !showAddForm && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                No records found. Click "Add Record" to add one manually.
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default FlowerCard;
