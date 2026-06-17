import React, { useState } from 'react';
import { UserPlus, Cpu, Activity, AlertTriangle, CheckCircle, Trash2, Search, X } from 'lucide-react';
import { consumerAPI, readingsAPI } from '../api';

export default function ConsumerList({ consumers, onConsumerChange, loading }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Registration States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newConsumer, setNewConsumer] = useState({
    consumer_number: '',
    name: '',
    address: '',
    meter_serial_number: ''
  });
  
  // Prediction Telemetry Input States
  const [selectedConsumer, setSelectedConsumer] = useState(null);
  const [telemetry, setTelemetry] = useState({
    voltage_v: 220,
    current_a: 5,
    power_factor: 0.95,
    energy_consumption_kwh: 1.2,
    peak_load_kw: 1.5,
    hour_of_day: 12,
    meter_reading_kwh: 5200,
    anomaly_score: 5
  });
  const [predictResult, setPredictResult] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await consumerAPI.create(newConsumer);
      setShowAddModal(false);
      setNewConsumer({ consumer_number: '', name: '', address: '', meter_serial_number: '' });
      if (onConsumerChange) onConsumerChange();
    } catch (err) {
      alert('Error registering consumer: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this consumer profile?')) return;
    try {
      await consumerAPI.delete(id);
      if (onConsumerChange) onConsumerChange();
    } catch (err) {
      alert('Failed to delete: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handlePredictSubmit = async (e) => {
    e.preventDefault();
    setPredictLoading(true);
    setPredictResult(null);
    try {
      const payload = {
        consumer_id: selectedConsumer._id || selectedConsumer.id,
        voltage_v: parseFloat(telemetry.voltage_v),
        current_a: parseFloat(telemetry.current_a),
        power_factor: parseFloat(telemetry.power_factor),
        energy_consumption_kwh: parseFloat(telemetry.energy_consumption_kwh),
        peak_load_kw: parseFloat(telemetry.peak_load_kw),
        hour_of_day: parseInt(telemetry.hour_of_day),
        meter_reading_kwh: parseFloat(telemetry.meter_reading_kwh),
        anomaly_score: parseFloat(telemetry.anomaly_score)
      };

      const res = await readingsAPI.predict(payload);
      setPredictResult(res.data);
      if (onConsumerChange) onConsumerChange();
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'string'
        ? detail
        : (Array.isArray(detail)
            ? detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', ')
            : (detail ? JSON.stringify(detail) : err.message));
      alert('Telemetry processing failed: ' + errorMsg);
    } finally {
      setPredictLoading(false);
    }
  };

  const filteredConsumers = consumers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.consumer_number.includes(searchTerm) ||
    c.meter_serial_number.includes(searchTerm)
  );

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl shadow-lg p-5 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="font-semibold text-lg text-white">Consumer Registry Database</h3>
          <p className="text-xs text-gray-400 mt-0.5">Register nodes and run predictive anomaly pipelines</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register Consumer</span>
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter registry by Number, Name, or Meter Serial..."
          className="w-full bg-[#0E1524] border border-brand-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-gray-500"
        />
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredConsumers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Cpu className="w-12 h-12 text-brand-border/40 mx-auto mb-3" />
            <p className="text-sm font-medium">Empty Consumer List</p>
            <p className="text-xs text-gray-400 mt-1">Register new consumer nodes to evaluate real-time grid theft models.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-brand-border text-xs text-gray-400 font-semibold uppercase">
                <th className="pb-3">Consumer Node</th>
                <th className="pb-3">Meter Serial</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Location Address</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {filteredConsumers.map((consumer) => (
                <tr key={consumer._id || consumer.id} className="hover:bg-[#1A2338]/30 transition-colors">
                  <td className="py-4">
                    <div>
                      <p className="font-semibold text-white">{consumer.name}</p>
                      <p className="text-xs text-blue-400 font-mono font-medium mt-0.5"># {consumer.consumer_number}</p>
                    </div>
                  </td>
                  <td className="py-4 font-mono text-gray-300 text-xs">
                    {consumer.meter_serial_number}
                  </td>
                  <td className="py-4">
                    <span className={`inline-flex items-center text-xs font-semibold ${
                      consumer.risk_category === 'Suspicious' ? 'text-amber-400 animate-pulse' : 'text-emerald-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        consumer.risk_category === 'Suspicious' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}></span>
                      {consumer.risk_category}
                    </span>
                  </td>
                  <td className="py-4 text-xs text-gray-400 max-w-xs truncate">
                    {consumer.address}
                  </td>
                  <td className="py-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setSelectedConsumer(consumer);
                        setPredictResult(null);
                      }}
                      className="bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 text-xs px-2.5 py-1.5 rounded-lg inline-flex items-center space-x-1 transition-all"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Ingest Telemetry</span>
                    </button>
                    <button
                      onClick={() => handleDelete(consumer._id || consumer.id)}
                      className="text-gray-400 hover:text-rose-400 p-1.5 rounded-lg border border-transparent hover:border-rose-500/20 hover:bg-rose-500/5 transition-all inline-flex align-middle"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* REGISTER NEW CONSUMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#070A11]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card border border-brand-border rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-semibold text-lg text-white mb-4">Register Consumer Node</h3>
            
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Consumer ID Number</label>
                <input
                  type="text" required
                  value={newConsumer.consumer_number}
                  onChange={(e) => setNewConsumer({...newConsumer, consumer_number: e.target.value})}
                  className="w-full bg-[#0E1524] border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. 9533729023"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text" required
                  value={newConsumer.name}
                  onChange={(e) => setNewConsumer({...newConsumer, name: e.target.value})}
                  className="w-full bg-[#0E1524] border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Meter Serial Number</label>
                <input
                  type="text" required
                  value={newConsumer.meter_serial_number}
                  onChange={(e) => setNewConsumer({...newConsumer, meter_serial_number: e.target.value})}
                  className="w-full bg-[#0E1524] border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="MSN-9988442"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Service Address</label>
                <textarea
                  required rows={2}
                  value={newConsumer.address}
                  onChange={(e) => setNewConsumer({...newConsumer, address: e.target.value})}
                  className="w-full bg-[#0E1524] border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="123 Grid Lane, Sector 4..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg py-2 transition-colors mt-2"
              >
                Register Consumer Node
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TELEMETRY INGEST & PREDICT DIALOG */}
      {selectedConsumer && (
        <div className="fixed inset-0 bg-[#070A11]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card border border-brand-border rounded-xl shadow-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedConsumer(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="font-semibold text-lg text-white mb-2 flex items-center">
              <Cpu className="w-5 h-5 text-blue-400 mr-2" />
              Ingest Meter Telemetry: {selectedConsumer.name}
            </h3>
            <p className="text-xs text-gray-400 mb-6">Consumer: #{selectedConsumer.consumer_number} | Meter Serial: {selectedConsumer.meter_serial_number}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form onSubmit={handlePredictSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Voltage (V)</label>
                    <input
                      type="number" step="0.1" required
                      value={telemetry.voltage_v}
                      onChange={(e) => setTelemetry({...telemetry, voltage_v: e.target.value})}
                      className="w-full bg-[#0E1524] border border-brand-border rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Current (A)</label>
                    <input
                      type="number" step="0.01" required
                      value={telemetry.current_a}
                      onChange={(e) => setTelemetry({...telemetry, current_a: e.target.value})}
                      className="w-full bg-[#0E1524] border border-brand-border rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Power Factor</label>
                    <input
                      type="number" step="0.01" min="0" max="1" required
                      value={telemetry.power_factor}
                      onChange={(e) => setTelemetry({...telemetry, power_factor: e.target.value})}
                      className="w-full bg-[#0E1524] border border-brand-border rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Consumption (kWh)</label>
                    <input
                      type="number" step="0.01" required
                      value={telemetry.energy_consumption_kwh}
                      onChange={(e) => setTelemetry({...telemetry, energy_consumption_kwh: e.target.value})}
                      className="w-full bg-[#0E1524] border border-brand-border rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Peak Load (kW)</label>
                    <input
                      type="number" step="0.1" required
                      value={telemetry.peak_load_kw}
                      onChange={(e) => setTelemetry({...telemetry, peak_load_kw: e.target.value})}
                      className="w-full bg-[#0E1524] border border-brand-border rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Hour of Day</label>
                    <input
                      type="number" min="0" max="23" required
                      value={telemetry.hour_of_day}
                      onChange={(e) => setTelemetry({...telemetry, hour_of_day: e.target.value})}
                      className="w-full bg-[#0E1524] border border-brand-border rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Cumulative (kWh)</label>
                    <input
                      type="number" step="0.1" required
                      value={telemetry.meter_reading_kwh}
                      onChange={(e) => setTelemetry({...telemetry, meter_reading_kwh: e.target.value})}
                      className="w-full bg-[#0E1524] border border-brand-border rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Anomaly Score</label>
                    <input
                      type="number" step="0.1" required
                      value={telemetry.anomaly_score}
                      onChange={(e) => setTelemetry({...telemetry, anomaly_score: e.target.value})}
                      className="w-full bg-[#0E1524] border border-brand-border rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={predictLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg py-2 transition-colors disabled:opacity-50 mt-4"
                >
                  {predictLoading ? 'Calculating Theft Risk...' : 'Run Theft Detection Pipeline'}
                </button>
              </form>

              <div className="bg-[#0E1524] border border-brand-border rounded-xl p-5 flex flex-col justify-center items-center text-center">
                {predictResult ? (
                  <div className="space-y-4">
                    <div className={`mx-auto p-4 rounded-full w-16 h-16 flex items-center justify-center border-2 ${
                      predictResult.status === 'Suspicious' 
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {predictResult.status === 'Suspicious' ? (
                        <AlertTriangle className="w-8 h-8" />
                      ) : (
                        <CheckCircle className="w-8 h-8" />
                      )}
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400">Model Classification</h4>
                      <p className={`text-xl font-bold mt-1 ${
                        predictResult.status === 'Suspicious' ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {predictResult.status}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-400">Theft Risk Probability</h4>
                      <p className="text-3xl font-bold text-white font-mono mt-1">
                        {(predictResult.risk_score * 100).toFixed(1)}%
                      </p>
                    </div>

                    {predictResult.alert_raised && (
                      <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg">
                        ⚠️ High-risk flagged. Active Grid Alert #{predictResult.alert_id.substring(0, 8)}... created in DB.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <Cpu className="w-12 h-12 text-brand-border/40 mx-auto mb-2" />
                    <p className="text-sm font-medium">Predictive Inference Panel</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">
                      Adjust the consumption parameters on the left and submit to run the XGBoost classification model.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
