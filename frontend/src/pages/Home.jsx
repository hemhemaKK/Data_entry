import React, { useEffect, useState } from "react";
import { getYears, createYear, updateYear, deleteYear, billRecordsApi } from "../services/api";
import YearCard from "../components/YearCard";
import QuickEntryForm from "../components/QuickEntryForm";

const Home = () => {
  const [years, setYears] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newYear, setNewYear] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchYearsAndRecent = async () => {
    try {
      const data = await getYears();
      setYears(data);
      
      const transactions = await billRecordsApi.getTransactions();
      // Filter for last 24-48 hours based on date (today or yesterday)
      const now = new Date();
      now.setHours(0,0,0,0);
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const recent = transactions.filter(t => {
          if (!t.date) return false;
          const tDate = new Date(t.date);
          return tDate >= yesterday;
      }).slice(0, 10); // Show max 10
      setRecentEntries(recent);

    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYearsAndRecent();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newYear) return;
    setCreating(true);
    try {
      const created = await createYear(parseInt(newYear, 10));
      setYears([created, ...years]);
      setNewYear("");
    } catch (err) {
      console.error(err);
      setError("Failed to create year");
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async (id, currentYear) => {
    const newVal = window.prompt("Enter new year value:", currentYear);
    if (!newVal) return;
    const parsed = parseInt(newVal, 10);
    if (isNaN(parsed)) {
      alert("Invalid year");
      return;
    }
    if (!window.confirm(`Update year ${currentYear} to ${parsed}?`)) return;
    try {
      const updated = await updateYear(id, parsed);
      setYears(years.map((y) => (y.id === id ? updated : y)));
    } catch (err) {
      console.error(err);
      alert("Failed to update year");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this year?")) return;
    try {
      await deleteYear(id);
      setYears(years.filter((y) => y.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete year");
    }
  };

  if (loading) return <div className="page-title">Loading years...</div>;
  if (error) return <div className="page-title error">{error}</div>;

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      
      {/* Quick Manual Entry */}
      <QuickEntryForm onRecordAdded={fetchYearsAndRecent} />

      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--border)' }}>
          <h2 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Recent Entries (Last 24 Hrs)</h2>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th style={{ padding: '0.75rem' }}>Date</th>
                  <th style={{ padding: '0.75rem' }}>Client</th>
                  <th style={{ padding: '0.75rem' }}>Flower</th>
                  <th style={{ padding: '0.75rem' }}>Weight</th>
                  <th style={{ padding: '0.75rem' }}>Rate</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map(entry => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem' }}>{entry.date}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 500 }}>{entry.client_name}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--primary)' }}>{entry.flower_name}</td>
                    <td style={{ padding: '0.75rem' }}>{entry.weight} kg</td>
                    <td style={{ padding: '0.75rem' }}>₹{entry.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <h2 className="page-title" style={{ marginTop: '2rem', fontSize: '1.5rem' }}>Year Management</h2>
      <form onSubmit={handleCreate} className="mb-4" style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          type="number"
          placeholder="Enter year"
          value={newYear}
          onChange={(e) => setNewYear(e.target.value)}
          className="input"
          style={{ padding: "0.5rem", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}
          required
        />
        <button type="submit" className="btn" disabled={creating}>
          {creating ? "Creating…" : "Add Year"}
        </button>
      </form>
      {years.length === 0 ? (
        <p>No years found. Create some using the form above.</p>
      ) : (
        <div className="metrics-grid">
          {years.map((yr) => (
            <YearCard key={yr.id} year={yr.year} id={yr.id} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
