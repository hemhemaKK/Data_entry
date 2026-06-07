import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import Navbar from './components/Navbar';
import ThemeProvider from './components/ThemeProvider';
import Home from './pages/Home';
import UploadPage from './pages/Upload';
import Transactions from './pages/Transactions';
import ValidationResults from './pages/ValidationResults';
import YearDetails from './pages/YearDetails';
import PlaceDetails from './pages/PlaceDetails';
import BulkAdd from './pages/BulkAdd';
import Ledger from './pages/Ledger';
import CustomPrint from './pages/CustomPrint';

function App() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <ThemeProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10 }}>
              <button className="theme-toggle" onClick={toggleTheme} title="Toggle Theme">
                {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
              </button>
            </div>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/results/:id" element={<ValidationResults />} />
              <Route path="/year/:yearId" element={<YearDetails />} />
              <Route path="/place/:placeId" element={<PlaceDetails />} />
              <Route path="/bulk-add" element={<BulkAdd />} />
              <Route path="/ledger" element={<Ledger />} />
              <Route path="/custom-print" element={<CustomPrint />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
