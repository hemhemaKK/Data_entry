import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getFlowers,
  createFlower,
  updateFlower,
  deleteFlower,
  billRecordsApi,
  getPlace,
} from "../services/api";
import { FaArrowLeft, FaPlus } from "react-icons/fa";
import ClientCard from "../components/ClientCard.jsx";
import FlowerCard from "../components/FlowerCard.jsx";
import axios from 'axios';
import SearchBar from "../components/SearchBar.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
import ClientFormModal from "../components/ClientFormModal.jsx";
import FlowerFormModal from "../components/FlowerFormModal.jsx";

const PlaceDetails = () => {
  const { placeId } = useParams();

  // ----- Clients -----
  const [clients, setClients] = useState([]);
  const [clientFilter, setClientFilter] = useState("");
  const [showClientForm, setShowClientForm] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [clientConfirm, setClientConfirm] = useState({ open: false, clientId: null });

  // ----- Selected client (View Details) -----
  const [selectedClient, setSelectedClient] = useState(null);

  // ----- Flowers (for selected client) -----
  const [flowers, setFlowers] = useState([]);
  const [flowerFilter, setFlowerFilter] = useState("");
  const [showFlowerForm, setShowFlowerForm] = useState(false);
  const [editFlower, setEditFlower] = useState(null);
  const [flowerConfirm, setFlowerConfirm] = useState({ open: false, flowerId: null });
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [bulkMonth, setBulkMonth] = useState("");
  const [printCols, setPrintCols] = useState({ date: true, weight: true, van: true, rate: true, laggage: true, collie: true });
  const [selectedPlace, setSelectedPlace] = useState(null);

  const fetchClients = async () => {
    const data = await getUsers(placeId);
    setClients(data);
  };

  const fetchPlaceDetails = async () => {
    try {
      const placeData = await getPlace(placeId);
      setSelectedPlace(placeData);
    } catch (err) {
      console.error("Failed to fetch place details", err);
    }
  };

  const fetchFlowers = async (userId) => {
    const data = await getFlowers(null, { user_id: userId });
    setFlowers(data);
  };

  useEffect(() => {
    fetchClients();
    fetchPlaceDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeId]);

  // When a client is selected, fetch their flowers
  useEffect(() => {
    if (selectedClient) {
      fetchFlowers(selectedClient.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient]);

  // Sync print columns to body classes for CSS handling (WYSIWYG)
  useEffect(() => {
    Object.entries(printCols).forEach(([col, isVisible]) => {
      if (!isVisible) {
        document.body.classList.add(`hide-col-${col}`);
      } else {
        document.body.classList.remove(`hide-col-${col}`);
      }
    });
    return () => {
      Object.keys(printCols).forEach(col => document.body.classList.remove(`hide-col-${col}`));
    };
  }, [printCols]);

  // ---------- Client Handlers ----------
  const handleClientCreate = async (payload) => {
    const trimmedName = payload.name?.trim();
    if (!trimmedName) { alert("Name is required"); return; }
    if (clients.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      alert("A client with this name already exists.");
      return;
    }
    try {
      await createUser({ name: trimmedName, place_id: Number(placeId), contact_number: payload.contactNumber });
      fetchClients();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to create client");
    }
  };

  const handleClientUpdate = async (id, payload) => {
    const trimmedName = payload.name?.trim();
    if (!trimmedName) { alert("Name is required"); return; }
    if (clients.some((c) => c.id !== id && c.name.toLowerCase() === trimmedName.toLowerCase())) {
      alert("A client with this name already exists.");
      return;
    }
    try {
      await updateUser(id, { name: trimmedName, place_id: Number(placeId), contact_number: payload.contactNumber });
      fetchClients();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to update client");
    }
  };

  const handleClientDelete = async (id) => {
    try {
      await deleteUser(id);
      fetchClients();
      if (selectedClient?.id === id) setSelectedClient(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete client");
    }
  };

  // ---------- Flower Handlers ----------
  const handleFlowerCreate = async (payload) => {
    if (flowers.some((f) => f.name.toLowerCase() === payload.name.toLowerCase())) {
      alert("This flower name already exists for this client.");
      return;
    }
    try {
      await createFlower({ name: payload.name, user_id: selectedClient.id });
      fetchFlowers(selectedClient.id);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to add flower");
    }
  };

  const handleFlowerUpdate = async (id, payload) => {
    if (flowers.some((f) => f.id !== id && f.name.toLowerCase() === payload.name.toLowerCase())) {
      alert("This flower name already exists for this client.");
      return;
    }
    try {
      await updateFlower(id, { name: payload.name, user_id: selectedClient.id });
      fetchFlowers(selectedClient.id);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to update flower");
    }
  };

  const handleFlowerDelete = async (id) => {
    try {
      await deleteFlower(id);
      fetchFlowers(selectedClient.id);
    } catch (err) {
      console.error(err);
      alert("Failed to delete flower");
    }
  };

  const filteredClients = [...clients]
    .sort((a, b) => b.id - a.id)
    .filter(
      (c) =>
        c.name.toLowerCase().includes(clientFilter.toLowerCase()) ||
        (c.contact_number || "").toString().includes(clientFilter)
    );

  const filteredFlowers = [...flowers]
    .sort((a, b) => b.id - a.id)
    .filter(
      (f) => f.name.toLowerCase().includes(flowerFilter.toLowerCase())
    );

  // =============================================
  // VIEW: Client's Flower Details
  // =============================================
  if (selectedClient) {
    return (
      <div className="place-details-page">
        {/* Back button + header */}
        <button className="back-btn" onClick={() => setSelectedClient(null)}>
          <FaArrowLeft size={14} />
          Back to Clients
        </button>

        <div className="detail-header no-print">
          <div>
            <h1 className="page-title" style={{ marginBottom: "0.25rem" }}>{selectedClient.name}</h1>
            {selectedClient.contact_number && (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{selectedClient.contact_number}</p>
            )}
          </div>
          <button className="btn" onClick={() => { setEditFlower(null); setShowFlowerForm(true); }}>
            <FaPlus size={12} /> Add Flower
          </button>
        </div>

        <div className="no-print" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <SearchBar value={flowerFilter} onChange={setFlowerFilter} placeholder="Search flowers..." />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>From:</label>
            <input 
              type="date" 
              value={fromDate} 
              onChange={(e) => setFromDate(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>To:</label>
            <input 
              type="date" 
              value={toDate} 
              onChange={(e) => setToDate(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
            {(fromDate || toDate) && (
                <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => { setFromDate(''); setToDate(''); }}>Clear Dates</button>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem', borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
                <input 
                  type="month" 
                  value={bulkMonth} 
                  onChange={(e) => setBulkMonth(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
                <button className="btn btn-primary" style={{ padding: '0.5rem' }} onClick={async () => {
                    if (!bulkMonth) {
                        alert("Please select a month to bulk print.");
                        return;
                    }
                    window.dispatchEvent(new CustomEvent('printMonth', { detail: bulkMonth }));
                    
                    const afterPrint = async () => {
                        window.removeEventListener('afterprint', afterPrint);
                        setTimeout(async () => {
                            const success = window.confirm("Did the document print successfully?\n\nClick 'OK' for Yes, or 'Cancel' if it failed.");
                            
                            // Collect all record IDs for the bulk month to mark them
                            const recordIds = [];
                            filteredFlowers.forEach(f => {
                                if (f.bill_records) {
                                    f.bill_records.forEach(r => {
                                        if (r.date && r.date.startsWith(bulkMonth)) {
                                            recordIds.push(r.id);
                                        }
                                    });
                                }
                            });
                            
                            if (recordIds.length > 0) {
                                try {
                                    await billRecordsApi.markRecordsPrinted(recordIds, success);
                                    fetchFlowers(selectedClient.id);
                                } catch (err) {
                                    console.error("Failed to mark printed", err);
                                }
                            }
                        }, 300);
                    };
                    
                    window.addEventListener('afterprint', afterPrint);
                    setTimeout(() => window.print(), 500);
                }}>
                   Bulk Print Month
                </button>
            </div>
          </div>
        </div>

        {/* Toggle Columns Row */}
        <div className="no-print" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Print Columns:</span>
          {Object.keys(printCols).map(col => (
             <label key={col} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
               <input 
                 type="checkbox" 
                 checked={printCols[col]} 
                 onChange={() => setPrintCols(prev => ({ ...prev, [col]: !prev[col] }))} 
                 style={{ accentColor: 'var(--accent)' }}
               />
               {col.charAt(0).toUpperCase() + col.slice(1)}
             </label>
          ))}
        </div>

        {/* Flower list */}
        <div className="flower-list print-area">
          {filteredFlowers.length > 0 ? (
            filteredFlowers.map((flower) => (
              <FlowerCard
                key={flower.id}
                flower={flower}
                clientName={selectedClient.name}
                clientPhone={selectedClient.contact_number}
                placeName={selectedPlace?.name || ''}
                fromDate={fromDate}
                toDate={toDate}
                onEdit={() => { setEditFlower(flower); setShowFlowerForm(true); }}
                onDelete={() => setFlowerConfirm({ open: true, flowerId: flower.id })}
                onRecordsUpdated={() => fetchFlowers(selectedClient.id)}
              />
            ))
          ) : (
            <div className="empty-state">
              <p>{flowerFilter ? "No flowers match your search" : "No flowers added yet"}</p>
              <span>{flowerFilter ? "Try a different search term." : "Click \"+ Add Flower\" to add flower names for this client."}</span>
            </div>
          )}
        </div>

        {/* Flower modals */}
        {showFlowerForm && (
          <FlowerFormModal
            isOpen={showFlowerForm}
            initialData={editFlower}
            clientName={selectedClient.name}
            onClose={() => setShowFlowerForm(false)}
            onSubmit={editFlower ? (p) => handleFlowerUpdate(editFlower.id, p) : handleFlowerCreate}
          />
        )}

        {flowerConfirm.open && (
          <ConfirmationModal
            isOpen={flowerConfirm.open}
            title="Delete Flower"
            message="Are you sure you want to delete this flower?"
            onConfirm={() => { handleFlowerDelete(flowerConfirm.flowerId); setFlowerConfirm({ open: false, flowerId: null }); }}
            onClose={() => setFlowerConfirm({ open: false, flowerId: null })}
          />
        )}
      </div>
    );
  }

  // =============================================
  // VIEW: Clients List (main view)
  // =============================================
  return (
    <div className="place-details-page">
      <div className="place-details-header">
        <h1 className="page-title">Clients</h1>
        <button className="btn" onClick={() => { setEditClient(null); setShowClientForm(true); }}>
          + Add Client
        </button>
      </div>

      <SearchBar value={clientFilter} onChange={setClientFilter} placeholder="Search clients..." />

      <div className="client-grid">
        {filteredClients.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            onEdit={() => { setEditClient(client); setShowClientForm(true); }}
            onDelete={() => setClientConfirm({ open: true, clientId: client.id })}
            onViewDetails={() => setSelectedClient(client)}
          />
        ))}
        {filteredClients.length === 0 && (
          <p className="empty-state" style={{ gridColumn: "1 / -1" }}>
            No clients found. Click "+ Add Client" to create one.
          </p>
        )}
      </div>

      {/* Client modals */}
      {showClientForm && (
        <ClientFormModal
          isOpen={showClientForm}
          initialData={editClient}
          onClose={() => setShowClientForm(false)}
          onSubmit={editClient ? (p) => handleClientUpdate(editClient.id, p) : handleClientCreate}
        />
      )}

      {clientConfirm.open && (
        <ConfirmationModal
          isOpen={clientConfirm.open}
          title="Delete Client"
          message="Are you sure you want to delete this client? All their flowers will also be removed."
          onConfirm={() => { handleClientDelete(clientConfirm.clientId); setClientConfirm({ open: false, clientId: null }); }}
          onClose={() => setClientConfirm({ open: false, clientId: null })}
        />
      )}
    </div>
  );
};

export default PlaceDetails;
