import React from 'react';
import { Users, AlertTriangle, ShieldAlert, Radio, Clock, ShieldCheck } from 'lucide-react';
import AnalyticsChart from './AnalyticsChart';

export default function Dashboard({ consumers, alerts, readings, onNavigate }) {
  // Compute metrics
  const totalConsumers = consumers.length;
  const suspiciousConsumers = consumers.filter(c => c.risk_category === 'Suspicious').length;
  const activeAlerts = alerts.filter(a => a.status === 'Active').length;
  
  // Format cards data
  const metrics = [
    {
      title: 'Total Active Nodes',
      value: totalConsumers,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      description: 'Active digital consumer meters'
    },
    {
      title: 'Active Theft Alerts',
      value: activeAlerts,
      icon: ShieldAlert,
      color: 'text-rose-400 font-bold',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      description: 'Unresolved flagged anomalies'
    },
    {
      title: 'Theft Cases Detected',
      value: suspiciousConsumers,
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      description: 'Suspicious consumer profiles'
    },
    {
      title: 'Detection Core Status',
      value: 'ONLINE',
      icon: Radio,
      color: 'text-emerald-400 text-sm font-semibold tracking-wider',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      description: 'XGBoost engine active'
    }
  ];

  // Get last 4 active alerts for the quick view feed
  const activeFeed = alerts.filter(a => a.status === 'Active').slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((card, i) => {
          const Icon = card.icon;
          return (
            <div 
              key={i} 
              className={`bg-brand-card border ${card.borderColor} rounded-xl p-5 shadow-lg flex flex-col justify-between`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{card.title}</p>
                  <p className={`text-2xl font-bold mt-2 ${card.color}`}>{card.value}</p>
                </div>
                <div className={`p-2.5 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-5 h-5 ${card.color.split(' ')[0]}`} />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4 border-t border-brand-border/60 pt-2.5">
                {card.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics Chart */}
        <div className="lg:col-span-2">
          <AnalyticsChart readings={readings} />
        </div>

        {/* Quick Alerts Feed */}
        <div className="bg-brand-card border border-brand-border rounded-xl p-5 shadow-lg flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-white">Live Operations Feed</h3>
            <button 
              onClick={() => onNavigate('alerts')}
              className="text-xs text-blue-400 hover:underline"
            >
              View History
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-72">
            {activeFeed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 h-full">
                <ShieldCheck className="w-10 h-10 text-emerald-500/20 mb-2" />
                <p className="text-xs font-medium text-gray-400">All Nodes Operating Safely</p>
                <p className="text-[10px] text-gray-500 mt-0.5">XGBoost telemetry reporting normal parameters.</p>
              </div>
            ) : (
              activeFeed.map((alert) => {
                const date = new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <div 
                    key={alert._id || alert.id} 
                    className="p-3 bg-[#0E1524] border border-brand-border rounded-lg flex items-start space-x-3"
                  >
                    <div className="p-1.5 bg-rose-500/10 rounded-md text-rose-400 mt-0.5 animate-pulse">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-semibold text-white truncate">Anomalous Spike Flagged</p>
                        <span className="text-[9px] text-gray-500 font-medium font-mono">{date}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">Consumer: #{(alert.consumer_id || '').substring(0, 12)}...</p>
                      <p className="text-[10px] text-rose-400 font-semibold mt-1">Risk Score: {(alert.risk_score * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
