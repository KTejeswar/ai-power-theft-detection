import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle, Clock, Search, HelpCircle } from 'lucide-react';
import { alertAPI } from '../api';

export default function AlertsPanel({ alerts, onAlertResolved, currentUser, loading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All'); // All, Active, Resolved
  const [resolvingId, setResolvingId] = useState(null);

  const handleResolve = async (alertId) => {
    setResolvingId(alertId);
    try {
      await alertAPI.resolve(alertId, currentUser.username);
      if (onAlertResolved) {
        onAlertResolved();
      }
    } catch (err) {
      alert('Failed to resolve alert: ' + (err.response?.data?.detail || err.message));
    } finally {
      setResolvingId(null);
    }
  };

  const getSeverity = (score) => {
    if (score >= 0.90) return { label: 'CRITICAL', style: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
    if (score >= 0.80) return { label: 'WARNING', style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    return { label: 'EVALUATE', style: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
  };

  // Filters the alerts according to tabs and searches
  const filteredAlerts = alerts.filter(a => {
    const matchesFilter = filter === 'All' || a.status === filter;
    const matchesSearch = 
      a.consumer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.status.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl shadow-lg p-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="font-semibold text-lg text-white">Grid Security Alerts</h3>
          <p className="text-xs text-gray-400 mt-0.5">Manage theft classifications flag telemetry</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['All', 'Active', 'Resolved'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === tab 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-[#0E1524] text-gray-400 border border-brand-border hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search alerts by Consumer ID or Status..."
          className="w-full bg-[#0E1524] border border-brand-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-gray-500"
        />
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
            <ShieldCheck className="w-12 h-12 text-emerald-500/30 mb-3" />
            <p className="text-sm font-medium text-gray-300">System Secure</p>
            <p className="text-xs text-gray-400 mt-1">No anomalous grid alerts found for selected filter.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-brand-border text-xs text-gray-400 font-semibold uppercase">
                <th className="pb-3">Alert Details</th>
                <th className="pb-3">Theft Risk Score</th>
                <th className="pb-3">Severity</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {filteredAlerts.map((alert) => {
                const severity = getSeverity(alert.risk_score);
                const createdDate = new Date(alert.created_at).toLocaleString();

                return (
                  <tr key={alert._id || alert.id} className="hover:bg-[#1A2338]/30 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${alert.status === 'Active' ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
                          {alert.status === 'Active' ? (
                            <ShieldAlert className="w-4 h-4 text-rose-400" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white">Consumer: {(alert.consumer_id || '').substring(0, 10)}...</p>
                          <p className="text-xs text-gray-400 flex items-center mt-0.5">
                            <Clock className="w-3 h-3 mr-1" />
                            {createdDate}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 font-mono font-medium text-white">
                      {(alert.risk_score * 100).toFixed(1)}%
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-semibold border ${severity.style}`}>
                        {severity.label}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center text-xs font-semibold ${alert.status === 'Active' ? 'text-rose-400' : 'text-emerald-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${alert.status === 'Active' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                        {alert.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {alert.status === 'Active' ? (
                        <button
                          onClick={() => handleResolve(alert._id || alert.id)}
                          disabled={resolvingId === (alert._id || alert.id)}
                          className="bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                        >
                          {resolvingId === alert.id ? 'Resolving...' : 'Resolve Alert'}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500">
                          By {alert.resolved_by || 'system'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
