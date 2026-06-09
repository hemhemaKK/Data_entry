import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  advancesApi
} from "../services/api";
import { FaArrowLeft, FaPlus } from "react-icons/fa";
import { Printer } from "lucide-react";
import ClientCard from "../components/ClientCard.jsx";
import FlowerCard from "../components/FlowerCard.jsx";
import axios from 'axios';
import SearchBar from "../components/SearchBar.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
import ClientFormModal from "../components/ClientFormModal.jsx";
import FlowerFormModal from "../components/FlowerFormModal.jsx";

const PlaceDetails = () => {
  const { placeId } = useParams();
  const navigate = useNavigate();

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
  const [summaryMonth, setSummaryMonth] = useState('');
  
  const [globalFlowers, setGlobalFlowers] = useState([]);
  
  const [clientAdvances, setClientAdvances] = useState([]);
  const [printCols, setPrintCols] = useState({ date: true, van: true, weight: true, rate: true, total: true, laggage: true, collie: true });
  const [isSingleUserPrint, setIsSingleUserPrint] = useState(false);
  const [commissionPercent, setCommissionPercent] = useState(10);
  const [selectedPlace, setSelectedPlace] = useState(null);

  // ----- Global Print State -----
  const [globalFromDate, setGlobalFromDate] = useState("");
  const [globalToDate, setGlobalToDate] = useState("");
  const [globalMonth, setGlobalMonth] = useState("");
  const [isGlobalPrinting, setIsGlobalPrinting] = useState(false);
  const [globalPrintData, setGlobalPrintData] = useState([]);
  
  const [columns, setColumns] = useState({
    date: true, van: true, weight: true, rate: true, total: true, laggage: true, collie: true
  });

  const fetchClients = async () => {
    const data = await getUsers(placeId);
    setClients(data);
  };

  const fetchGlobalFlowers = async () => {
    try {
      const allFlowers = await getFlowers();
      const uniqueNames = [...new Set(allFlowers.map(f => f.name.toLowerCase()))].map(n => 
         allFlowers.find(f => f.name.toLowerCase() === n).name
      );
      setGlobalFlowers(uniqueNames);
    } catch (err) {
      console.error(err);
    }
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
    fetchGlobalFlowers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeId]);

  // When a client is selected, fetch their flowers and advances
  useEffect(() => {
    if (selectedClient) {
      fetchFlowers(selectedClient.id);
      fetchClientAdvances(selectedClient.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient]);

  const fetchClientAdvances = async (userId) => {
    try {
      const data = await advancesApi.getUserAdvances(userId);
      setClientAdvances(data || []);
    } catch (err) {
      console.error(err);
    }
  };

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
    const newNames = payload.names || [payload.name];
    let createdAny = false;
    
    for (const n of newNames) {
      if (flowers.some((f) => f.name.toLowerCase() === n.toLowerCase())) {
        alert(`Flower name "${n}" already exists for this client. Skipping.`);
        continue;
      }
      try {
        await createFlower({ name: n, user_id: selectedClient.id });
        createdAny = true;
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.detail || `Failed to add flower: ${n}`);
      }
    }
    
    if (createdAny) {
      fetchFlowers(selectedClient.id);
      fetchGlobalFlowers(); // Refresh global list too
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
      fetchGlobalFlowers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to update flower");
    }
  };

  const handleFlowerDelete = async (id) => {
    try {
      await deleteFlower(id);
      fetchFlowers(selectedClient.id);
      fetchGlobalFlowers();
    } catch (err) {
      console.error(err);
      alert("Failed to delete flower");
    }
  };
  const handleUserBulkPrint = async () => {
      if (!bulkMonth && (!fromDate && !toDate)) {
          alert("Please select a month or date range to bulk print.");
          return;
      }
      
      try {
          setIsGlobalPrinting(true);
          setIsSingleUserPrint(true);
          const printMap = {};
          
          filteredFlowers.forEach(flower => {
              if (!flower.bill_records || flower.bill_records.length === 0) return;
              
              const filteredRecords = flower.bill_records.filter(r => {
                  if (!r.date) return true;
                  if (bulkMonth && !r.date.startsWith(bulkMonth)) return false;
                  
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
              
              if (filteredRecords.length > 0) {
                  if (!printMap[selectedClient.id]) {
                      printMap[selectedClient.id] = { client: selectedClient, flowers: [] };
                  }
                  
                  filteredRecords.sort((a,b) => new Date(a.date) - new Date(b.date));
                  
                  const totals = filteredRecords.reduce((acc, curr) => {
                    const w = curr.weight || 0;
                    const rt = curr.rate || 0;
                    const l = curr.laggage || 0;
                    const c = curr.collie || 0;
                    acc.weight += w;
                    acc.laggage += l;
                    acc.collie += c;
                    acc.price += (w * rt);
                    return acc;
                  }, { weight: 0, laggage: 0, collie: 0, price: 0 });
                  
                  printMap[selectedClient.id].flowers.push({
                      ...flower,
                      records: filteredRecords,
                      totals
                  });
              }
          });
          
          if (!printMap[selectedClient.id] || printMap[selectedClient.id].flowers.length === 0) {
              alert("No records found for the selected date range/month.");
              setIsGlobalPrinting(false);
              return;
          }
          
          const group = printMap[selectedClient.id];
          const advances = await advancesApi.getUserAdvances(selectedClient.id);

           
           const historicalAdvancesList = advances.filter(a => {
               if (!a.date) return true;
               const aDate = new Date(a.date);
               if (isNaN(aDate.getTime())) return true;
               aDate.setHours(0,0,0,0);
               
               if (bulkMonth) {
                   const [year, month] = bulkMonth.split('-');
                   const endOfMonth = new Date(year, month, 0);
                   endOfMonth.setHours(0,0,0,0);
                   if (aDate > endOfMonth) return false;
               } else if (toDate) {
                   const tD = new Date(toDate);
                   tD.setHours(0,0,0,0);
                   if (aDate > tD) return false;
               }
               return true;
           });

           const periodAdvancesList = advances.filter(a => {
               if (!a.date) return true;
               if (bulkMonth && !a.date.startsWith(bulkMonth)) return false;
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
           
           const clientTotalPrice = group.flowers.reduce((sum, f) => sum + f.totals.price, 0);
           const clientTotalLaggage = group.flowers.reduce((sum, f) => sum + f.totals.laggage, 0);
           const clientTotalCollie = group.flowers.reduce((sum, f) => sum + f.totals.collie, 0);
           
           const commissionDeduction = clientTotalPrice * (commissionPercent / 100);
           const baseTotal = clientTotalPrice - commissionDeduction - clientTotalLaggage - clientTotalCollie;
           const grandTotal = baseTotal - periodDeduction;
           
           group.finalBalance = finalBalance;
           group.clientTotalPrice = clientTotalPrice;
           group.clientTotalLaggage = clientTotalLaggage;
           group.clientTotalCollie = clientTotalCollie;
           group.commissionDeduction = commissionDeduction;
           group.grandTotal = grandTotal;
           group.totalAdvance = historicalAdvance;
           group.periodDeduction = periodDeduction;
          
          setGlobalPrintData([group]);
          
          setTimeout(() => {
              const afterPrint = async () => {
                  window.removeEventListener('afterprint', afterPrint);
                  setTimeout(async () => {
                      const success = await window.confirmAsync("Did the document print successfully?\n\nClick 'OK' for Yes, or 'Cancel' if it failed.");
                      
                      const recordIds = [];
                      group.flowers.forEach(f => {
                          f.records.forEach(r => recordIds.push(r.id));
                      });
                      
                      if (recordIds.length > 0) {
                          try {
                              await billRecordsApi.markRecordsPrinted(recordIds, success);
                              fetchFlowers(selectedClient.id);
                          } catch (err) {
                              console.error("Failed to mark printed", err);
                          }
                      }
                      setIsGlobalPrinting(false);
                      setGlobalPrintData([]);
                  }, 300);
              };
              
              window.addEventListener('afterprint', afterPrint);
              window.print();
          }, 500);
          
      } catch (err) {
          console.error(err);
          alert("Failed to load records for printing");
          setIsGlobalPrinting(false);
      }
  };

  const handleGlobalPrint = async () => {
      if (!globalMonth && (!globalFromDate && !globalToDate)) {
          alert("Please select a month or date range to bulk print.");
          return;
      }
      
      try {
          setIsGlobalPrinting(true);
          setIsSingleUserPrint(false);
          const allFlowers = await getFlowers(null, { place_id: placeId });
          const printMap = {};
          
          allFlowers.forEach(flower => {
              if (!flower.bill_records || flower.bill_records.length === 0) return;
              
              const filteredRecords = flower.bill_records.filter(r => {
                  if (!r.date) return true;
                  
                  if (globalMonth && !r.date.startsWith(globalMonth)) return false;
                  
                  const recordDate = new Date(r.date);
                  if (isNaN(recordDate.getTime())) return true;
                  recordDate.setHours(0,0,0,0);

                  if (globalFromDate) {
                      const fDate = new Date(globalFromDate);
                      fDate.setHours(0,0,0,0);
                      if (recordDate < fDate) return false;
                  }
                  if (globalToDate) {
                      const tDate = new Date(globalToDate);
                      tDate.setHours(0,0,0,0);
                      if (recordDate > tDate) return false;
                  }
                  return true;
              });
              
              if (filteredRecords.length > 0) {
                  const client = clients.find(c => c.id === flower.user_id) || { name: 'Unknown', id: flower.user_id };
                  
                  if (!printMap[client.id]) {
                      printMap[client.id] = { client, flowers: [] };
                  }
                  
                  filteredRecords.sort((a,b) => new Date(a.date) - new Date(b.date));
                  
                  const totals = filteredRecords.reduce((acc, curr) => {
                    const w = curr.weight || 0;
                    const rt = curr.rate || 0;
                    const l = curr.laggage || 0;
                    const c = curr.collie || 0;
                    acc.weight += w;
                    acc.laggage += l;
                    acc.collie += c;
                    acc.price += (w * rt);
                    return acc;
                  }, { weight: 0, laggage: 0, collie: 0, price: 0 });
                  
                  printMap[client.id].flowers.push({
                      ...flower,
                      records: filteredRecords,
                      totals
                  });
              }
          });
          
          const printArray = Object.values(printMap).sort((a, b) => a.client.name.localeCompare(b.client.name));
          
          for (let group of printArray) {
              const advances = await advancesApi.getUserAdvances(group.client.id);

              const historicalAdvancesList = advances.filter(a => {
                  if (!a.date) return true;
                  const aDate = new Date(a.date);
                  if (isNaN(aDate.getTime())) return true;
                  aDate.setHours(0,0,0,0);
                  
                  if (globalMonth) {
                      const [year, month] = globalMonth.split('-');
                      const endOfMonth = new Date(year, month, 0);
                      endOfMonth.setHours(0,0,0,0);
                      if (aDate > endOfMonth) return false;
                  } else if (globalToDate) {
                      const tD = new Date(globalToDate);
                      tD.setHours(0,0,0,0);
                      if (aDate > tD) return false;
                  }
                  return true;
              });

              const periodAdvancesList = advances.filter(a => {
                  if (!a.date) return true;
                  if (globalMonth && !a.date.startsWith(globalMonth)) return false;
                  const aDate = new Date(a.date);
                  if (isNaN(aDate.getTime())) return true;
                  aDate.setHours(0,0,0,0);
                  if (globalFromDate) {
                      const fD = new Date(globalFromDate);
                      fD.setHours(0,0,0,0);
                      if (aDate < fD) return false;
                  }
                  if (globalToDate) {
                      const tD = new Date(globalToDate);
                      tD.setHours(0,0,0,0);
                      if (aDate > tD) return false;
                  }
                  return true;
              });

              const historicalAdvance = historicalAdvancesList.reduce((sum, a) => sum + (parseFloat(a.advance_amount) || 0), 0);
              const historicalDeduction = historicalAdvancesList.reduce((sum, a) => sum + (parseFloat(a.deduction_amount) || 0), 0);
              const finalBalance = historicalAdvance - historicalDeduction;

              const periodDeduction = periodAdvancesList.reduce((sum, a) => sum + (parseFloat(a.deduction_amount) || 0), 0);
              
              const clientTotalPrice = group.flowers.reduce((sum, f) => sum + f.totals.price, 0);
              const clientTotalLaggage = group.flowers.reduce((sum, f) => sum + f.totals.laggage, 0);
              const clientTotalCollie = group.flowers.reduce((sum, f) => sum + f.totals.collie, 0);
              
              const commissionDeduction = clientTotalPrice * (commissionPercent / 100);
              const baseTotal = clientTotalPrice - commissionDeduction - clientTotalLaggage - clientTotalCollie;
              const grandTotal = baseTotal - periodDeduction;
              
              group.finalBalance = finalBalance;
              group.clientTotalPrice = clientTotalPrice;
              group.clientTotalLaggage = clientTotalLaggage;
              group.clientTotalCollie = clientTotalCollie;
              group.commissionDeduction = commissionDeduction;
              group.grandTotal = grandTotal;
              group.totalAdvance = historicalAdvance;
              group.periodDeduction = periodDeduction;
          }
          
          if (printArray.length === 0) {
              alert("No records found for the selected date range/month.");
              setIsGlobalPrinting(false);
              return;
          }
          
          setGlobalPrintData(printArray);
          
          setTimeout(() => {
              const afterPrint = async () => {
                  window.removeEventListener('afterprint', afterPrint);
                  setTimeout(async () => {
                      const success = await window.confirmAsync("Did the global document print successfully?\n\nClick 'OK' for Yes, or 'Cancel' if it failed.");
                      
                      const recordIds = [];
                      printArray.forEach(group => {
                          group.flowers.forEach(f => {
                              f.records.forEach(r => recordIds.push(r.id));
                          });
                      });
                      
                      if (recordIds.length > 0) {
                          try {
                              await billRecordsApi.markRecordsPrinted(recordIds, success);
                          } catch (err) {
                              console.error("Failed to mark printed", err);
                          }
                      }
                      setIsGlobalPrinting(false);
                  }, 300);
              };
              
              window.addEventListener('afterprint', afterPrint);
              window.print();
          }, 500);
          
      } catch (err) {
          console.error(err);
          alert("Failed to load records for printing");
          setIsGlobalPrinting(false);
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
      (f) => f.name.toLowerCase().includes(flowerFilter.toLowerCase()) && f.bill_records && f.bill_records.length > 0
    );

  // Calculate Client Summary
  let summaryWeight = 0;
  let summaryLaggage = 0;
  let summaryCollie = 0;
  let summaryFlowerPrice = 0;

  filteredFlowers.forEach(flower => {
      // Apply the same date filters as FlowerCard to calculate accurate summary
      const fRecords = (flower.bill_records || []).filter(r => {
        if (!r.date) return true;
        if (summaryMonth && !r.date.startsWith(summaryMonth)) return false;
        
        const recordDate = new Date(r.date);
        if (isNaN(recordDate.getTime())) return true;
        recordDate.setHours(0,0,0,0);
        if (fromDate) {
            const fD = new Date(fromDate);
            fD.setHours(0,0,0,0);
            if (recordDate < fD) return false;
        }
        if (toDate) {
            const tD = new Date(toDate);
            tD.setHours(0,0,0,0);
            if (recordDate > tD) return false;
        }
        return true;
      });

      fRecords.forEach(r => {
          const w = r.weight || 0;
          const rt = r.rate || 0;
          const l = r.laggage || 0;
          const c = r.collie || 0;
          summaryWeight += w;
          summaryLaggage += l;
          summaryCollie += c;
          summaryFlowerPrice += (w * rt) + l + c;
      });
  });


  const totalAdvance = clientAdvances.reduce((sum, a) => sum + (parseFloat(a.advance_amount) || 0), 0);
  const totalDeduction = clientAdvances.reduce((sum, a) => sum + (parseFloat(a.deduction_amount) || 0), 0);
  const finalBalance = totalAdvance - totalDeduction;

  const renderGlobalPrintView = () => {
    if (!isGlobalPrinting) return null;
    return (
        <div className="print-only">

            {globalPrintData.map(group => (
                <div key={group.client.id} style={{ pageBreakAfter: 'always', paddingBottom: '2rem' }}>
                    <div className="print-header" style={{ marginBottom: '1rem' }}>
                        <img 
                            src="/header.jpeg" 
                            alt="Header Image" 
                            style={{ width: '100%', height: 'auto', display: 'block', marginTop: '10px', marginBottom: '0.25rem' }} 
                        />
                        <div style={{ marginTop: '10px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem', fontWeight: 'bold', background: 'white', color: 'black' }}>
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
                                        <td style={{ padding: '4px', border: '1px solid #ccc' }}>{selectedPlace ? selectedPlace.name : ''}</td>
                                        <td style={{ padding: '4px', border: '1px solid #ccc' }}>பாக்கி:</td>
                                        <td style={{ padding: '4px', border: '1px solid #ccc', color: 'black' }}>{Math.abs(group.finalBalance).toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {group.flowers.map(flower => (
                        <div key={flower.id} style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Flower: {flower.name}</h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left', color: 'black' }}>
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
                                            {columns.total && <td className="col-total" style={{ padding: '4px', fontWeight: 'bold' }}>{((parseFloat(r.weight) || 0) * (parseFloat(r.rate) || 0)).toFixed(2)}</td>}
                                            {columns.laggage && <td className="col-laggage" style={{ padding: '4px' }}>{r.laggage || '0'}</td>}
                                            {columns.collie && <td className="col-collie" style={{ padding: '4px' }}>{r.collie || '0'}</td>}
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ borderTop: '1px solid black', fontWeight: 'bold', backgroundColor: '#f0f0f0', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                        <td colSpan={(columns.date ? 1 : 0) + (columns.van ? 1 : 0)} style={{ padding: '4px', textAlign: 'right' }}>Total:</td>
                                        {columns.weight && <td className="col-weight" style={{ padding: '4px' }}>{flower.totals.weight.toFixed(3)}</td>}
                                        {columns.rate && <td className="col-rate" style={{ padding: '4px' }}></td>}
                                        {columns.total && <td className="col-total" style={{ padding: '4px' }}>{flower.totals.price.toFixed(2)}</td>}
                                        {columns.laggage && <td className="col-laggage" style={{ padding: '4px' }}>{flower.totals.laggage.toFixed(2)}</td>}
                                        {columns.collie && <td className="col-collie" style={{ padding: '4px' }}>{flower.totals.collie.toFixed(2)}</td>}
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ))}
                    
                    <div style={{ marginTop: '8px', padding: '8px 12px', background: 'transparent', border: '1px solid black', fontSize: '0.9rem', fontWeight: 'bold', color: 'black', width: '50%', marginLeft: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>Total of All Flowers:</span>
                            <span>{group.clientTotalPrice.toFixed(2)}</span>
                        </div>
                        {commissionPercent > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: 'red' }}>
                                <span>Commission:</span>
                                <span>-{group.commissionDeduction.toFixed(2)}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'red' }}>
                            <span>Total Laggage:</span>
                            <span>-{group.clientTotalLaggage.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'red' }}>
                            <span>Total Collie:</span>
                            <span>-{group.clientTotalCollie.toFixed(2)}</span>
                        </div>

                        {group.periodDeduction > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: 'red' }}>
                                <span>Advance Deduction:</span>
                                <span>-{group.periodDeduction.toFixed(2)}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ccc', paddingTop: '8px', color: 'green', fontSize: '1.1rem' }}>
                            <span>Grand Total:</span>
                            <span>{Math.abs(group.grandTotal).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
  };


  // =============================================
  // VIEW: Client's Flower Details
  // =============================================
  if (selectedClient) {
    return (
      <div className="place-details-page">
        {/* Back button + header */}
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem'}}>
            <button className="btn" style={{background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem'}} onClick={() => setSelectedClient(null)}>
              <FaArrowLeft size={14} /> Back to Parties
            </button>
        </div>

        <div className="detail-header no-print">
          <div>
            <h1 className="page-title" style={{ marginBottom: "0.25rem" }}>{selectedClient.name}</h1>
            {selectedClient.contact_number && (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{selectedClient.contact_number}</p>
            )}
          </div>
        </div>

        {/* Party Balance Summary */}
        <div className="no-print" style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Ledger Balance Summary</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Updated Balance (Total Advance - Total Deduction)</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: finalBalance >= 0 ? 'var(--success)' : 'red' }}>{finalBalance.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="no-print" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <SearchBar value={flowerFilter} onChange={setFlowerFilter} placeholder="Search flowers..." />
          </div>
          <button className="btn btn-primary" onClick={() => setShowFlowerForm(true)}>+ Add Flower</button>
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
                <button className="btn btn-primary" style={{ padding: '0.5rem' }} onClick={handleUserBulkPrint} disabled={isGlobalPrinting}>
                   {isGlobalPrinting ? "Preparing..." : "Bulk Print Month"}
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
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Commission (%):</span>
            <input 
              type="number" 
              step="0.1"
              value={commissionPercent} 
              onChange={e => setCommissionPercent(parseFloat(e.target.value) || 0)}
              style={{ width: '60px', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border)' }}
            />
          </div>
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
                clientBalance={finalBalance}
                fromDate={fromDate}
                toDate={toDate}
                commissionPercent={commissionPercent}
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
            globalFlowers={globalFlowers}
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

        {renderGlobalPrintView()}
      </div>
    );
  }

  // =============================================
  // VIEW: Clients List (main view)
  // =============================================


  return (
    <div className="place-details-page">
      <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem'}}>
          <button className="btn" style={{background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem'}} onClick={() => navigate(-1)}>
            <FaArrowLeft size={14} /> Back
          </button>
      </div>
      <div className="place-details-header">
        <h1 className="page-title">Parties {selectedPlace ? `- ${selectedPlace.name}` : ''}</h1>
      </div>

      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem', background: 'var(--surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '1.1rem' }}>Print All Parties</div>
          
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>From:</label>
                <input type="date" value={globalFromDate} onChange={(e) => setGlobalFromDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>To:</label>
                <input type="date" value={globalToDate} onChange={(e) => setGlobalToDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                
                {(globalFromDate || globalToDate) && (
                    <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => { setGlobalFromDate(''); setGlobalToDate(''); }}>Clear</button>
                )}
              </div>

              <div style={{ width: '1px', height: '24px', background: 'var(--border)', display: 'none' }} className="desktop-separator"></div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Month:</label>
                <input type="month" value={globalMonth} onChange={(e) => setGlobalMonth(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Commission (%):</label>
                <input type="number" step="0.1" value={commissionPercent} onChange={(e) => setCommissionPercent(parseFloat(e.target.value) || 0)} style={{ width: '80px', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <button className="btn btn-primary" onClick={handleGlobalPrint} style={{ padding: '0.5rem 1rem' }} disabled={isGlobalPrinting}>
                <Printer size={18} style={{ marginRight: '8px' }} />
                {isGlobalPrinting ? 'Generating...' : 'Bulk Print'}
              </button>
            </div>

          </div>
          
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
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
            No parties found. Click "+ Add Client" to create one.
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
          title="Delete Party"
          message="Are you sure you want to delete this party? All their flowers will also be removed."
          onConfirm={() => { handleClientDelete(clientConfirm.clientId); setClientConfirm({ open: false, clientId: null }); }}
          onClose={() => setClientConfirm({ open: false, clientId: null })}
        />
      )}

      {renderGlobalPrintView()}
    </div>
  );
};

export default PlaceDetails;
