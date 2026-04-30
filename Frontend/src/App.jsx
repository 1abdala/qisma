import React from 'react';
import '@xterm/xterm/css/xterm.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Pockets from './pages/Pockets';
import Receive from './pages/Receive';
import Splitting from './pages/Splitting';
import Analytics from './pages/Analytics';
import Sending from './pages/Sending';
import { UserProvider } from './contexts/UserContext';
import { DisplayCurrencyProvider } from './contexts/DisplayCurrencyContext';
import Scanner from './pages/Scanner';
import History from './pages/History';

function App() {
  return (
    <UserProvider>
      <DisplayCurrencyProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="*" element={<Dashboard />} />
              <Route path="/pockets" element={<Pockets />} />
              <Route path="/receive" element={<Receive />} />
              <Route path="/splitting" element={<Splitting />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/sending" element={<Sending />} />
              <Route path="/scan" element={<Scanner />} />
              <Route path="/history" element={<History />} />
            </Routes>
          </div>
        </Router>
      </DisplayCurrencyProvider>
    </UserProvider>
  );
}

export default App;