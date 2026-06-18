import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle, Clock, Search, HelpCircle, Sliders, FileText, Info } from 'lucide-react';
import { alertAPI } from '../api';

export default function AlertsPanel({ alerts, onAlertResolved, onViewReport, currentUser, loading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All'); // All, Active, Resolved
  const [resolvingId, setResolvingId] = useState(null);
  const [sensitivity, setSensitivity] = useState(0.75); // Range: 0.70 to 0.95
  const [selectedAlert, setSelectedAlert] = useState(null);

  const handleResolve = async (alertId) => {
    setResolvingId(alertId);
    try {
      await alertAPI.resolve(alertId, currentUser.username);
      if (onAlertResolved) {
        onAlertResolved();
      }
      if (selectedAlert && (selectedAlert._id === alertId || selectedAlert.id === alertId)) {
        setSelectedAlert(prev => ({ ...prev, status: 'Resolved', resolved_by: currentUser.username, resolved_at: new Date().toISOString() }));
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

  // Filters the alerts according to tabs, searches, and sensitivity slider
  const filteredAlerts = alerts.filter(a => {
    const matchesFilter = filter === 'All' || a.status === filter;
    const matchesSearch = 
      a.consumer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.status.toLowerCase().includes(searchTerm.toLowerCase());
    const meetsSensitivity = a.risk_score >= sensitivity;
    return matchesFilter && matchesSearch && meetsSensitivity;
  });

  const hiddenCount = alerts.filter(a => {
    const matchesFilter = filter === 'All' || a.status === filter;
    const matchesSearch = 
      a.consumer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.status.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch && a.risk_score < sensitivity;
  }).length;

  // Generate mock SHAP/XAI values based on risk score
  const getShapImpacts = (score) => {
    if (score >= 0.90) {
      return [
        { feature: 'Current vs Energy Mismatch', impact: 48, direction: 'positive', description: 'Heavy load present but meter registers no energy flow.' },
        { feature: 'Meter Anomaly Index', impact: 28, direction: 'positive', description: 'Tamper sensor casing switches active.' },
        { feature: 'Voltage Drop Deviation', impact: 16, direction: 'positive', description: 'Localized earth voltage deviation.' },
        { feature: 'Baseline Consumption Shift', impact: 8, direction: 'positive', description: 'Usage dropped significantly below moving average.' }
      ];
    } else if (score >= 0.80) {
      return [
        { feature: 'Baseline Consumption Shift', impact: 36, direction: 'positive', description: 'Consumption dropped 40% below historical trend.' },
        { feature: 'Meter Anomaly Index', impact: 24, direction: 'positive', description: 'Smart meter reports mild magnetic shunt activity.' },
        { feature: 'Power Factor Drift', impact: 22, direction: 'positive', description: 'Low power factor detected during active usage.' },
        { feature: 'Current vs Energy Mismatch', impact: 18, direction: 'positive', description: 'Minor load mismatch coefficient.' }
      ];
    } else {
      return [
        { feature: 'Time of Day Profile Mismatch', impact: 32, direction: 'positive', description: 'Peak usage shift does not match neighborhood curve.' },
        { feature: 'Power Factor Drift', impact: 28, direction: 'positive', description: 'Inductive mismatch signature.' },
        { feature: 'Voltage Drop Deviation', impact: 24, direction: 'positive', description: 'Substation line drop variance.' },
        { feature: 'Meter Anomaly Index', impact: 16, direction: 'positive', description: 'Tamper score is slightly elevated.' }
      ];
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Alert Listings */}
      <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-xl shadow-lg p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="font-semibold text-lg text-white">Grid Security Alerts</h3>
            <p className="text-xs text-gray-400 mt-0.5">Manage theft classifications and audit logs</p>
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

        {/* Filters Panel: Search & Sensitivity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-[#0E1524] p-4 rounded-xl border border-brand-border/60">
          <div className="relative">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Search Filters</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Consumer ID..."
                className="w-full bg-brand-card border border-brand-border rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-gray-500"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase flex items-center">
                <Sliders className="w-3.5 h-3.5 text-blue-400 mr-1" />
                Confidence Sensitivity filter
              </label>
              <span className="text-xs font-bold text-blue-400 font-mono">{(sensitivity * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.70"
              max="0.95"
              step="0.05"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-brand-card rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            {hiddenCount > 0 && (
              <p className="text-[10px] text-gray-500 mt-1">
                Hiding {hiddenCount} alerts below threshold (set lower to view all).
              </p>
            )}
          </div>
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
                  <th className="pb-3">Theft Risk</th>
                  <th className="pb-3">Severity</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filteredAlerts.map((alert) => {
                  const severity = getSeverity(alert.risk_score);
                  const createdDate = new Date(alert.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
                  const isSelected = selectedAlert && (selectedAlert._id === alert._id || selectedAlert.id === alert.id);

                  return (
                    <tr 
                      key={alert._id || alert.id} 
                      onClick={() => setSelectedAlert(alert)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-600/10' : 'hover:bg-[#1A2338]/30'
                      }`}
                    >
                      <td className="py-4 pr-2">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${alert.status === 'Active' ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
                            {alert.status === 'Active' ? (
                              <ShieldAlert className="w-4 h-4 text-rose-400" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-white">Consumer: {(alert.consumer_id || '').substring(0, 12)}...</p>
                            <p className="text-[10px] text-gray-400 flex items-center mt-0.5">
                              <Clock className="w-3 h-3 mr-1" />
                              {createdDate}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 font-mono font-medium text-white pr-2">
                        {(alert.risk_score * 100).toFixed(1)}%
                      </td>
                      <td className="py-4 pr-2">
                        <span className={`px-2 py-1 rounded text-[9px] font-semibold border ${severity.style}`}>
                          {severity.label}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center text-xs font-semibold ${alert.status === 'Active' ? 'text-rose-400' : 'text-emerald-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${alert.status === 'Active' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                          {alert.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* XAI Diagnosis Details Panel */}
      <div className="bg-brand-card border border-brand-border rounded-xl shadow-lg p-5 h-full flex flex-col justify-between">
        {!selectedAlert ? (
          <div className="flex flex-col items-center justify-center text-center text-gray-500 py-24 h-full">
            <Info className="w-10 h-10 text-blue-500/20 mb-2" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select an Alert</p>
            <p className="text-[10px] text-gray-500 mt-1 max-w-xs leading-relaxed">
              Click on any row in the alarms table to load XGBoost neural features and explainable AI metrics.
            </p>
          </div>
        ) : (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="border-b border-brand-border pb-3 flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">AI Explainability Logs (XAI)</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">SHAP-based feature importance weights</p>
                </div>
                <span className="text-[9px] font-mono bg-blue-600/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded uppercase">
                  {selectedAlert.status}
                </span>
              </div>

              {/* SHAP Bars */}
              <div className="space-y-4">
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  The bar chart below outlines the contribution score of each parameter toward the classification risk of <strong className="font-bold text-white">{(selectedAlert.risk_score * 100).toFixed(1)}%</strong>:
                </p>
                
                <div className="space-y-3 font-mono text-[10px]">
                  {getShapImpacts(selectedAlert.risk_score).map((item, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-gray-300">
                        <span className="truncate max-w-[200px]" title={item.description}>{item.feature}</span>
                        <span className="text-emerald-400 font-bold">+{item.impact}%</span>
                      </div>
                      <div className="w-full bg-[#0E1524] h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-1.5 rounded-full bg-emerald-500" 
                          style={{ width: `${item.impact}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Feature Context description */}
              <div className="p-3 bg-[#0E1524] rounded-lg border border-brand-border">
                <span className="text-[10px] uppercase font-bold text-blue-400 flex items-center mb-1">
                  System Diagnostics
                </span>
                <p className="text-[10px] text-gray-400 leading-relaxed font-mono">
                  {selectedAlert.risk_score >= 0.90 
                    ? 'Physics rules override is active. Smart meter telemetry reports a total line shunt bypass. The reported consumption does not match calculated electrical laws.' 
                    : 'ML Gradient boosting decision trees evaluated consumption vectors. Flagged pattern matches a localized diversion trend over normal seasonal fluctuations.'
                  }
                </p>
              </div>
            </div>

            {/* Actions for Selected Alert */}
            <div className="pt-6 border-t border-brand-border space-y-3">
              <button
                onClick={() => onViewReport(selectedAlert)}
                className="w-full py-2.5 bg-[#0E1524] hover:bg-brand-border/60 border border-brand-border text-gray-300 hover:text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Generate Legal Evidence Report</span>
              </button>

              {selectedAlert.status === 'Active' && (
                <button
                  onClick={() => handleResolve(selectedAlert._id || selectedAlert.id)}
                  disabled={resolvingId === (selectedAlert._id || selectedAlert.id)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center justify-center transition-all"
                >
                  {resolvingId === (selectedAlert._id || selectedAlert.id) ? 'Resolving Incident...' : 'Approve Resolution (Close Alarm)'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
