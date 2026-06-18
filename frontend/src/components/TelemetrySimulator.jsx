import React, { useState } from 'react';
import { Activity, ShieldAlert, CheckCircle, Zap } from 'lucide-react';
import { readingsAPI } from '../api';

export default function TelemetrySimulator({ consumers, onSimulationComplete }) {
  const [selectedConsumerId, setSelectedConsumerId] = useState('');
  const [voltage, setVoltage] = useState(220);
  const [current, setCurrent] = useState(5);
  const [powerFactor, setPowerFactor] = useState(0.95);
  const [energy, setEnergy] = useState(1.0);
  const [anomalyScore, setAnomalyScore] = useState(10);
  
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Find selected consumer metadata
  const selectedConsumer = consumers.find(c => c._id === selectedConsumerId || c.id === selectedConsumerId);

  // Electrical math calculations
  const apparentPower = (voltage * current).toFixed(1); // S = V * I (VA)
  const activePower = (voltage * current * powerFactor).toFixed(1); // P = V * I * PF (W)
  const expectedEnergy = (activePower / 1000).toFixed(4); // Expected kWh in 1 hour

  // Check for obvious bypass signature on frontend for explanation
  const hasBypassSignature = current > 5.0 && energy < 0.01;
  const hasTamperSignature = anomalyScore > 75;

  const handleSimulate = async (e) => {
    e.preventDefault();
    if (!selectedConsumerId) {
      setError('Please select a consumer node to simulate.');
      return;
    }
    setError('');
    setSimulating(true);
    setResult(null);

    const payload = {
      consumer_id: selectedConsumerId,
      voltage_v: parseFloat(voltage),
      current_a: parseFloat(current),
      power_factor: parseFloat(powerFactor),
      energy_consumption_kwh: parseFloat(energy),
      peak_load_kw: parseFloat((activePower / 1000).toFixed(2)),
      hour_of_day: new Date().getHours(),
      meter_reading_kwh: parseFloat((energy + 5000).toFixed(2)), // Offset from baseline
      anomaly_score: parseFloat(anomalyScore)
    };

    try {
      const res = await readingsAPI.predict(payload);
      setResult(res.data);
      if (onSimulationComplete) {
        onSimulationComplete();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to execute prediction pipeline.');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Simulation Form */}
      <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white flex items-center mb-6">
          <Activity className="w-5 h-5 text-blue-400 mr-2" />
          Real-time Smart Meter Telemetry Simulator
        </h3>

        <form onSubmit={handleSimulate} className="space-y-6">
          {/* Consumer Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Select Consumer Node
            </label>
            <select
              value={selectedConsumerId}
              onChange={(e) => setSelectedConsumerId(e.target.value)}
              className="w-full bg-[#0E1524] border border-brand-border text-white text-sm rounded-lg p-3 focus:outline-none focus:border-blue-500/50"
            >
              <option value="">-- Choose a smart meter --</option>
              {consumers.map(c => (
                <option key={c._id || c.id} value={c._id || c.id}>
                  {c.name} (Meter: {c.meter_serial_number} - Number: {c.consumer_number})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Voltage (V) */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-semibold text-gray-400 uppercase">Voltage (V)</label>
                <span className="text-xs font-bold text-blue-400">{voltage} V</span>
              </div>
              <input
                type="range"
                min="150"
                max="260"
                value={voltage}
                onChange={(e) => setVoltage(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#0E1524] rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-[10px] text-gray-500">Normal grid operations: 220V - 240V</span>
            </div>

            {/* Current (A) */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-semibold text-gray-400 uppercase">Current (A)</label>
                <span className="text-xs font-bold text-blue-400">{current} A</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="0.5"
                value={current}
                onChange={(e) => setCurrent(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#0E1524] rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-[10px] text-gray-500">Loads vary from 0A (idle) up to 30A+ (heavy loads)</span>
            </div>

            {/* Power Factor */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-semibold text-gray-400 uppercase">Power Factor (cos θ)</label>
                <span className="text-xs font-bold text-blue-400">{powerFactor}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={powerFactor}
                onChange={(e) => setPowerFactor(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#0E1524] rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-[10px] text-gray-500">Resistive loads approach 1.0; inductive loads pull it lower</span>
            </div>

            {/* Reported Energy (kWh) */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-semibold text-gray-400 uppercase">Reported Energy (kWh)</label>
                <span className="text-xs font-bold text-blue-400">{energy} kWh</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.001"
                value={energy}
                onChange={(e) => setEnergy(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#0E1524] rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-[10px] text-gray-500">Hourly consumption reported by smart meter</span>
            </div>

            {/* Anomaly Score */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex justify-between">
                <label className="text-xs font-semibold text-gray-400 uppercase">Meter Anomaly Index (Tamper Sensor)</label>
                <span className="text-xs font-bold text-blue-400">{anomalyScore}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={anomalyScore}
                onChange={(e) => setAnomalyScore(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#0E1524] rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-[10px] text-gray-500">Physical magnetic/casing sensor indicator (values &gt; 75 indicate casing violation)</span>
            </div>
          </div>

          {error && <p className="text-rose-400 text-xs font-semibold">{error}</p>}

          <button
            type="submit"
            disabled={simulating}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-lg font-bold text-sm tracking-wider flex items-center justify-center transition-all shadow-md"
          >
            {simulating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Injecting Live Telemetry Stream...
              </>
            ) : (
              'Stream Simulated Telemetry to Detection Pipeline'
            )}
          </button>
        </form>
      </div>

      {/* Physics Math & Pipeline Response Panel */}
      <div className="space-y-6">
        {/* Real-time Math Diagnostics */}
        <div className="bg-brand-card border border-brand-border rounded-xl p-5 shadow-lg">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b border-brand-border">
            Physical Math Diagnostics
          </h4>
          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Apparent Power (S):</span>
              <span className="text-white font-semibold">{apparentPower} VA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Active Power (P):</span>
              <span className="text-white font-semibold">{activePower} W</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Expected Draw:</span>
              <span className="text-white font-semibold">{expectedEnergy} kWh</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Reported Draw:</span>
              <span className="text-white font-semibold">{energy} kWh</span>
            </div>
            
            <div className="pt-2 border-t border-brand-border/60">
              <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Grid Compliance status:</p>
              {hasBypassSignature ? (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded text-rose-400 text-[10px] leading-relaxed flex items-start">
                  <ShieldAlert className="w-4 h-4 mr-1.5 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">CRITICAL BYPASS DETECTED</span>
                    <p className="mt-0.5 text-gray-400">Current load is {current}A but energy registered is nearly zero ({energy} kWh). Physics law violated ($P \neq E$).</p>
                  </div>
                </div>
              ) : hasTamperSignature ? (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400 text-[10px] leading-relaxed flex items-start">
                  <ShieldAlert className="w-4 h-4 mr-1.5 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">TAMPER ANOMALY DETECTED</span>
                    <p className="mt-0.5 text-gray-400">Meter casing switch or magnet threshold exceeded ({anomalyScore}%). Anomaly score &gt; 75.</p>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 text-[10px] leading-relaxed flex items-start">
                  <CheckCircle className="w-4 h-4 mr-1.5 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">PHYSICAL RULES COMPLIANT</span>
                    <p className="mt-0.5 text-gray-400">Usage parameters correlate normally. Standard deviation inside normal boundaries.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Prediction Pipeline Result */}
        {result && (
          <div className="bg-brand-card border border-brand-border rounded-xl p-5 shadow-lg animate-fadeIn">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b border-brand-border">
              Pipeline Response Logs
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-semibold">Classification:</span>
                <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                  result.prediction.status === 'Suspicious' 
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25' 
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                }`}>
                  {result.prediction.status}
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Theft Risk Probability:</span>
                  <span className="text-white font-bold font-mono">{(result.prediction.risk_score * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[#0E1524] rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      result.prediction.status === 'Suspicious' ? 'bg-rose-500' : 'bg-emerald-500'
                    }`} 
                    style={{ width: `${result.prediction.risk_score * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-3 bg-[#0E1524] rounded-lg border border-brand-border">
                <p className="text-[10px] text-gray-400 leading-relaxed font-mono">
                  <span className="text-blue-400 font-semibold">[Engine Log]:</span> Ingested reading ID: {result.reading_id.substring(0, 12)}... 
                  {result.alert_triggered ? (
                    <span className="text-rose-400 block mt-1 font-bold">⚠️ CRITICAL: Risk exceeds threshold. Grid Alert triggered in DB.</span>
                  ) : (
                    <span className="text-emerald-400 block mt-1">✓ Node remains clean. No DB alert created.</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
