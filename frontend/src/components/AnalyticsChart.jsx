import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function AnalyticsChart({ readings }) {
  // Generate dummy visualization data if no readings exist
  const getChartData = () => {
    if (!readings || readings.length === 0) {
      return [
        { name: 'Mon', 'Energy (kWh)': 4.2, 'Anomaly Score': 12 },
        { name: 'Tue', 'Energy (kWh)': 3.8, 'Anomaly Score': 15 },
        { name: 'Wed', 'Energy (kWh)': 10.5, 'Anomaly Score': 85 }, // simulated anomaly
        { name: 'Thu', 'Energy (kWh)': 4.1, 'Anomaly Score': 8 },
        { name: 'Fri', 'Energy (kWh)': 4.5, 'Anomaly Score': 14 },
        { name: 'Sat', 'Energy (kWh)': 3.9, 'Anomaly Score': 25 },
        { name: 'Sun', 'Energy (kWh)': 4.0, 'Anomaly Score': 18 },
      ];
    }

    // Format real readings (last 10 items, oldest to newest)
    return [...readings]
      .slice(0, 15)
      .reverse()
      .map((r, index) => {
        const date = new Date(r.timestamp);
        const timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return {
          name: timeLabel || `M-${index + 1}`,
          'Energy (kWh)': parseFloat(r.energy_consumption_kwh.toFixed(2)),
          'Anomaly Score': parseFloat(r.anomaly_score.toFixed(1)),
        };
      });
  };

  const data = getChartData();

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-5 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-white">Consumption Trends vs. Anomaly Index</h3>
        <span className="text-xs px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full">
          Real-time updates
        </span>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#222F43" />
            <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
            <YAxis yAxisId="left" stroke="#3B82F6" fontSize={11} label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft', fill: '#3B82F6', offset: 10 }} />
            <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" fontSize={11} label={{ value: 'Anomaly Score', angle: 90, position: 'insideRight', fill: '#F59E0B', offset: 10 }} />
            
            <Tooltip 
              contentStyle={{ backgroundColor: '#151C2C', border: '1px solid #222F43', borderRadius: '8px', color: '#fff' }}
              labelStyle={{ color: '#94A3B8' }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
            
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="Energy (kWh)"
              stroke="#3B82F6"
              strokeWidth={2}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="Anomaly Score"
              stroke="#F59E0B"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
