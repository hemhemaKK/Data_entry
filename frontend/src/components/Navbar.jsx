import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Upload, FileSpreadsheet, Table2, Users, Wallet, Printer } from 'lucide-react';

const Navbar = () => (
  <aside className="sidebar">
    <div className="logo">
      <Table2 size={28} />
      <span>BillEntry</span>
    </div>
    <nav>
      <ul className="nav-links">
        <li>
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/upload" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Upload size={20} /> Upload Excel
          </NavLink>
        </li>
        <li>
          <NavLink to="/transactions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Table2 size={20} /> Transactions
          </NavLink>
        </li>
        <li>
          <NavLink to="/bulk-add" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Users size={20} /> Bulk Add
          </NavLink>
        </li>
        <li>
          <NavLink to="/ledger" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Wallet size={20} /> Ledger
          </NavLink>
        </li>
        <li>
          <NavLink to="/custom-print" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Printer size={20} /> Custom Print
          </NavLink>
        </li>
      </ul>
    </nav>
  </aside>
);

export default Navbar;
