import React, { useState, useEffect } from 'react';
import { ShieldAlert, BarChart3, Users, BellRing, LogOut, Terminal } from 'lucide-react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ConsumerList from './components/ConsumerList';
import AlertsPanel from './components/AlertsPanel';
import { authAPI, consumerAPI, alertAPI, readingsAPI } from './api';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loadingUser, setLoadingUser] = useState(true);

  // Global database states
  const [consumers, setConsumers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [readings, setReadings] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const checkAuth = async () => {
    setLoadingUser(true);
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await authAPI.getMe();
        setCurrentUser(res.data);
        setIsAuthenticated(true);
      } catch (err) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    } else {
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
    setLoadingUser(false);
  };

  // Authenticate user check on initial load
  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch all grid data
  const fetchGridData = async () => {
    if (!isAuthenticated) return;
    setLoadingData(true);
    try {
      const [consumersRes, alertsRes, readingsRes] = await Promise.all([
        consumerAPI.list(),
        alertAPI.list(),
        readingsAPI.list()
      ]);
      setConsumers(consumersRes.data);
      setAlerts(alertsRes.data);
      setReadings(readingsRes.data);
    } catch (err) {
      console.error('Failed to load operational data', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchGridData();
      // Poll database every 10 seconds for real-time alerts
      const interval = setInterval(fetchGridData, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm">Validating system keys...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={checkAuth} />;
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-brand-card/90 border-b border-brand-border px-6 py-4 flex justify-between items-center z-20 sticky top-0 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <ShieldAlert className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-md font-bold tracking-tight text-white">GridGuardian</h1>
            <p className="text-[10px] text-gray-400 leading-none">AI Power Theft Guard</p>
          </div>
        </div>

        {/* Tab Controls */}
        <nav className="hidden md:flex space-x-2">
          {[
            { id: 'dashboard', label: 'Dashboard Control', icon: BarChart3 },
            { id: 'consumers', label: 'Consumer Nodes', icon: Users },
            { id: 'alerts', label: 'Incident Alarms', icon: BellRing }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                    : 'text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Operator Profile and Logout */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-white">{currentUser?.username}</p>
            <p className="text-[10px] text-gray-400 capitalize">{currentUser?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 border border-brand-border rounded-lg transition-colors"
            title="Log Out Operator"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Sub-Navigation for Mobile view */}
      <div className="md:hidden flex justify-around bg-brand-card border-b border-brand-border p-2">
        {[
          { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
          { id: 'consumers', icon: Users, label: 'Registry' },
          { id: 'alerts', icon: BellRing, label: 'Alarms' }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center p-2 rounded-lg text-[9px] ${
                activeTab === tab.id ? 'text-blue-400' : 'text-gray-500'
              }`}
            >
              <Icon className="w-4.5 h-4.5 mb-1" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Panel Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-brand-border/60 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white capitalize">
              {activeTab === 'dashboard' ? 'Overview' : activeTab}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Active telemetry reporting from grid consumer monitors.
            </p>
          </div>
          <button 
            onClick={fetchGridData}
            disabled={loadingData}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0E1524] border border-brand-border hover:border-blue-500/40 text-xs rounded-lg text-gray-400 hover:text-white transition-all"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{loadingData ? 'Updating...' : 'Sync Now'}</span>
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <Dashboard 
            consumers={consumers} 
            alerts={alerts} 
            readings={readings} 
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'consumers' && (
          <ConsumerList 
            consumers={consumers} 
            onConsumerChange={fetchGridData} 
            loading={loadingData}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsPanel 
            alerts={alerts} 
            onAlertResolved={fetchGridData} 
            currentUser={currentUser} 
            loading={loadingData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-brand-card/50 border-t border-brand-border text-center py-4 text-[10px] text-gray-500">
        GridGuardian Core v1.0.0 © 2026. Security systems powered by XGBoost.
      </footer>
    </div>
  );
}
