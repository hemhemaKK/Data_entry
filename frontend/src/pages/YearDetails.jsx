import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getPlaces, createPlace, updatePlace, deletePlace } from "../services/api";
import PlaceCard from "../components/PlaceCard";

const YearDetails = () => {
  const { yearId } = useParams();
  const [places, setPlaces] = useState([]);
  const [newPlace, setNewPlace] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlaces = async () => {
    try {
      const data = await getPlaces(parseInt(yearId, 10), search);
      setPlaces(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load places");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, [yearId, search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmed = newPlace.trim();
    if (!trimmed) return;
    // Local duplicate check (case‑insensitive)
    if (places.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      alert("A place with this name already exists.");
      return;
    }
    try {
      const created = await createPlace({ name: trimmed, year_id: parseInt(yearId, 10) });
      setPlaces([created, ...places]);
      setNewPlace("");
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || "Failed to create place";
      alert(msg);
    }
  };

  const handleEdit = async (id, currentName) => {
    const newName = window.prompt("Enter new place name:", currentName);
    if (!newName) return;
    const trimmed = newName.trim();
    // Local duplicate check excluding the edited place
    if (places.some(p => p.id !== id && p.name.toLowerCase() === trimmed.toLowerCase())) {
      alert("A place with this name already exists.");
      return;
    }
    if (!window.confirm(`Update place "${currentName}" to "${trimmed}"?`)) return;
    try {
      const updated = await updatePlace(id, { name: trimmed, year_id: parseInt(yearId, 10) });
      setPlaces(places.map(p => (p.id === id ? updated : p)));
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || "Failed to update place";
      alert(msg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;
    try {
      await deletePlace(id);
      setPlaces(places.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete place");
    }
  };

  if (loading) return <div className="page-title">Loading places...</div>;
  if (error) return <div className="page-title error">{error}</div>;

  return (
    <div>
      <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem'}}>
          <Link to="/" className="btn" style={{background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem'}}>
              <ArrowLeft size={16} /> Back to Dashboard
          </Link>
      </div>
      <h1 className="page-title">Places for Year {yearId}</h1>
      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="Search places..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
          style={{ padding: "0.5rem", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}
        />
        <button className="btn" onClick={fetchPlaces}>Search</button>
      </div>
      <form onSubmit={handleCreate} style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="New place name"
          value={newPlace}
          onChange={(e) => setNewPlace(e.target.value)}
          className="input"
          required
          style={{ padding: "0.5rem", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}
        />
        <button type="submit" className="btn">Add Place</button>
      </form>
      {places.length === 0 ? (
        <p>No groups found.</p>
      ) : (
        <div className="metrics-grid">
          {places.map((pl) => (
            <PlaceCard
              key={pl.id}
              name={pl.name}
              id={pl.id}
              yearId={pl.year_id}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default YearDetails;
