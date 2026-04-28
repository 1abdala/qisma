import React from 'react';
import '@xterm/xterm/css/xterm.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Pockets from './pages/Pockets';
import Receive from './pages/Receive';
import Splitting from './pages/Splitting';
import Analytics from './pages/Analytics';


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="*" element={<Dashboard />} />
          <Route path="/pockets" element={<Pockets />} />
          <Route path="/receive" element={<Receive />} />
          <Route path="/splitting" element={<Splitting />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;