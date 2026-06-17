import React, { useState } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import Journal from './components/Journal';
import Stats from './components/Stats';
import TradeForm from './components/TradeForm';
import BottomNav from './components/BottomNav';
import PositionCalculator from './components/PositionCalculator';
import BackupModal from './components/BackupModal';
import ConnectionsModal from './components/ConnectionsModal';

function App() {
  const [tab, setTab] = useState('dashboard');
  const [editing, setEditing] = useState(null); // trade being edited
  const [prefill, setPrefill] = useState(null); // values from the calculator
  const [formOpen, setFormOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [connOpen, setConnOpen] = useState(false);

  const openNew = () => {
    setEditing(null);
    setPrefill(null);
    setFormOpen(true);
  };

  const openEdit = (trade) => {
    setEditing(trade);
    setPrefill(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setPrefill(null);
  };

  const logFromCalc = (data) => {
    setCalcOpen(false);
    setEditing(null);
    setPrefill(data);
    setFormOpen(true);
  };

  return (
    <div className="app">
      <div className="phone">
        <main className="screen">
          <div className="screen-inner" key={tab}>
            {tab === 'dashboard' && (
              <Dashboard
                onAdd={openNew}
                goTab={setTab}
                onBackup={() => setBackupOpen(true)}
                onConnections={() => setConnOpen(true)}
              />
            )}
            {tab === 'journal' && <Journal onAdd={openNew} onEdit={openEdit} />}
            {tab === 'stats' && <Stats />}
          </div>
        </main>

        <BottomNav
          tab={tab}
          setTab={setTab}
          onAdd={openNew}
          onCalc={() => setCalcOpen(true)}
        />

        {formOpen && (
          <TradeForm trade={editing} prefill={prefill} onClose={closeForm} />
        )}
        {calcOpen && (
          <PositionCalculator
            onClose={() => setCalcOpen(false)}
            onLogTrade={logFromCalc}
          />
        )}
        {backupOpen && <BackupModal onClose={() => setBackupOpen(false)} />}
        {connOpen && <ConnectionsModal onClose={() => setConnOpen(false)} />}
      </div>
    </div>
  );
}

export default App;
