import React, { useState } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import Journal from './components/Journal';
import Stats from './components/Stats';
import TradeForm from './components/TradeForm';
import BottomNav from './components/BottomNav';

function App() {
  const [tab, setTab] = useState('dashboard');
  const [editing, setEditing] = useState(null); // trade being edited
  const [formOpen, setFormOpen] = useState(false);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (trade) => {
    setEditing(trade);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  return (
    <div className="app">
      <div className="phone">
        <main className="screen">
          <div className="screen-inner" key={tab}>
            {tab === 'dashboard' && <Dashboard onAdd={openNew} goTab={setTab} />}
            {tab === 'journal' && <Journal onAdd={openNew} onEdit={openEdit} />}
            {tab === 'stats' && <Stats />}
          </div>
        </main>

        <BottomNav tab={tab} setTab={setTab} onAdd={openNew} />

        {formOpen && <TradeForm trade={editing} onClose={closeForm} />}
      </div>
    </div>
  );
}

export default App;
