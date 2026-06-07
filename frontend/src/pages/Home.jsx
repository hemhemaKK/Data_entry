import React, { useEffect, useState } from "react";
import { getYears, createYear, updateYear, deleteYear } from "../services/api";
import YearCard from "../components/YearCard";

const Home = () => {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newYear, setNewYear] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchYears = async () => {
    try {
      const data = await getYears();
      setYears(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load years");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
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
      <h1 className="page-title">Year Dashboard</h1>
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
