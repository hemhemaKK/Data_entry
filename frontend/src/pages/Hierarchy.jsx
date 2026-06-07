import React, { useEffect, useState } from 'react';
import { getYears, getPlaces, getUsers, getFlowers, exportFlowers } from '../services/api';
import TreeNode from '../components/TreeNode';
import FilterBar from '../components/FilterBar';
import ExportButton from '../components/ExportButton';

function Hierarchy() {
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [flowers, setFlowers] = useState([]);
  const [filterName, setFilterName] = useState('');

  // Load hierarchy data
  useEffect(() => {
    getYears().then(setYears);
  }, []);

  useEffect(() => {
    if (selectedYear) {
      getPlaces(selectedYear.id).then(setPlaces);
    } else {
      setPlaces([]);
    }
    setSelectedPlace(null);
    setSelectedUser(null);
    setFlowers([]);
  }, [selectedYear]);

  useEffect(() => {
    if (selectedPlace) {
      getUsers(selectedPlace.id).then(setUsers);
    } else {
      setUsers([]);
    }
    setSelectedUser(null);
    setFlowers([]);
  }, [selectedPlace]);

  useEffect(() => {
    if (selectedUser) {
      const params = {};
      if (filterName) params.name = filterName;
      getFlowers(selectedUser.id, params).then(setFlowers);
    } else {
      setFlowers([]);
    }
  }, [selectedUser, filterName]);

  const handleExport = (format) => {
    if (!selectedUser) return;
    exportFlowers(selectedUser.id, format).then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flowers_user_${selectedUser.id}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="hierarchy-page">
      <h1 className="page-title">Year → Place → User → Flowers</h1>
      <div className="tree-container">
        <TreeNode label="Years" selectedId={selectedYear?.id} onSelect={setSelectedYear} items={years} />
        {selectedYear && (
          <TreeNode label="Places" selectedId={selectedPlace?.id} onSelect={setSelectedPlace} items={places} />
        )}
        {selectedPlace && (
          <TreeNode label="Users" selectedId={selectedUser?.id} onSelect={setSelectedUser} items={users} />
        )}
      </div>
      {selectedUser && (
        <>
          <FilterBar placeholder="Search by name" value={filterName} onChange={setFilterName} />
          <ExportButton formats={["pdf", "csv"]} onExport={handleExport} />
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Bloom Date</th>
                </tr>
              </thead>
              <tbody>
                {flowers.map((f) => (
                  <tr key={f.id}>
                    <td>{f.name}</td>
                    <td>{f.type}</td>
                    <td>{f.quantity}</td>
                    <td>{f.bloom_date ? new Date(f.bloom_date).toLocaleDateString() : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default Hierarchy;
