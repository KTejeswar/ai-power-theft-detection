import React from 'react';
import { Cpu, Layers, Radio, Network } from 'lucide-react';

export default function IotTopology() {
  const jsonPayload = `{
  "consumer_id": "6a32dc93c28df...",
  "voltage_v": 231.2,
  "current_a": 14.58,
  "power_factor": 0.92,
  "energy_consumption_kwh": 3.104,
  "peak_load_kw": 3.38,
  "hour_of_day": 19,
  "meter_reading_kwh": 5003.1,
  "anomaly_score": 12.0
}`;

  return (
    <div className="space-y-6">
      <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white flex items-center mb-4">
          <Cpu className="w-5 h-5 text-blue-400 mr-2" />
          IoT Smart Meter Hardware Integration & Circuit Topology
        </h3>
        <p className="text-xs text-gray-400 max-w-3xl leading-relaxed">
          This schematic shows how GridGuardian connects with physical smart meter nodes deployed at consumer sites. The telemetry is gathered at the grid edge using low-power IoT microcontrollers and dispatched to the centralized FastAPI cloud server.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hardware Block diagram */}
        <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-6 pb-2 border-b border-brand-border flex items-center">
              <Layers className="w-4 h-4 text-blue-400 mr-1.5" />
              Circuit Wire Diagram (Physical Schematics)
            </h4>
            
            {/* SVG schematic representation */}
            <div className="bg-[#0E1524] rounded-xl p-6 border border-brand-border flex items-center justify-center my-4 overflow-x-auto min-h-64">
              <svg width="600" height="240" viewBox="0 0 600 240" className="w-full text-white font-mono text-[9px] select-none">
                {/* 220V AC Grid Lines */}
                <path d="M 20 60 L 580 60" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="5,5" />
                <text x="25" y="52" fill="#f43f5e">220V AC Phase Line (L)</text>
                
                <path d="M 20 180 L 580 180" stroke="#3b82f6" strokeWidth="2.5" />
                <text x="25" y="196" fill="#3b82f6">Neutral Line (N)</text>

                {/* SCT-013 Current Sensor */}
                <rect x="180" y="35" width="50" height="50" rx="4" fill="#151C2C" stroke="#f59e0b" strokeWidth="2" />
                <circle cx="205" cy="60" r="12" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,2" />
                <text x="188" y="77" fill="#f59e0b" className="font-bold text-[8px]">SCT-013</text>
                <text x="186" y="24" fill="#f59e0b">Current Clip</text>

                {/* ZMPT101B Voltage Sensor */}
                <rect x="300" y="80" width="80" height="80" rx="4" fill="#151C2C" stroke="#10b981" strokeWidth="2" />
                <text x="312" y="124" fill="#10b981" className="font-bold text-[8px]">ZMPT101B</text>
                <text x="310" y="96" fill="#10b981">Voltage Sensor</text>
                
                {/* Wiring to Voltage Sensor */}
                <line x1="340" y1="60" x2="340" y2="80" stroke="#f43f5e" strokeWidth="1" />
                <line x1="360" y1="180" x2="360" y2="160" stroke="#3b82f6" strokeWidth="1" />

                {/* Microcontroller ESP32 */}
                <rect x="460" y="60" width="100" height="120" rx="6" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
                <text x="495" y="85" fill="#3b82f6" className="font-bold text-[10px]">ESP32</text>
                <text x="472" y="102" fill="#94a3b8">Pin 34: ADC (V)</text>
                <text x="472" y="117" fill="#94a3b8">Pin 35: ADC (I)</text>
                <text x="472" y="138" fill="#10b981">Wi-Fi (Active)</text>

                {/* Analog Sensor wiring to ESP32 */}
                <path d="M 230 60 C 260 60, 420 117, 460 117" stroke="#f59e0b" strokeWidth="1.5" fill="none" />
                <path d="M 380 102 C 410 102, 430 102, 460 102" stroke="#10b981" strokeWidth="1.5" fill="none" />

                {/* Load (Consumer Appliances) */}
                <rect x="520" y="90" width="50" height="60" rx="2" fill="#0E1524" stroke="#64748b" strokeWidth="1" strokeDasharray="3,3" />
                <text x="532" y="125" fill="#64748b">LOAD</text>
              </svg>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Calibration Mathematics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-[#0E1524] rounded-lg border border-brand-border">
                <span className="text-blue-400 font-bold">1. RMS Current Calibration</span>
                <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
                  The SCT-013 CT sensor outputs a small current. Using a burden resistor (e.g. 22 Ω), this is converted to a voltage:
                  <code className="block text-emerald-400 mt-1 bg-brand-card/50 p-1.5 rounded">$I_{RMS} = ADC_{value} \times (V_{REF}/4096) / R_{Burden} \times N_{Turns}$</code>
                </p>
              </div>

              <div className="p-3 bg-[#0E1524] rounded-lg border border-brand-border">
                <span className="text-blue-400 font-bold">2. RMS Voltage Calibration</span>
                <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
                  ZMPT101B uses a micro voltage transformer. The phase-shifted sine wave is sampled over a 50Hz cycle:
                  <code className="block text-emerald-400 mt-1 bg-brand-card/50 p-1.5 rounded">$V_{RMS} = \sqrt{\frac{1}{N}\sum(ADC_{v} - V_{offset})^2} \times Scale_{Multiplier}$</code>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* JSON API and Specs */}
        <div className="space-y-6">
          {/* Hardware Specifications */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-5 shadow-lg">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b border-brand-border flex items-center">
              <Radio className="w-4 h-4 text-blue-400 mr-1.5" />
              Node Specifications
            </h4>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-brand-border/60">
                <tr>
                  <td className="py-2.5 text-gray-400">Microcontroller</td>
                  <td className="py-2.5 text-white text-right font-semibold">ESP32 (Tensilica 32-bit Dual-core)</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-400">Current Transformer</td>
                  <td className="py-2.5 text-white text-right font-semibold">SCT-013-000 (0 - 100A AC)</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-400">Voltage Transformer</td>
                  <td className="py-2.5 text-white text-right font-semibold">ZMPT101B (Active Single-Phase)</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-400">Wi-Fi Protocol</td>
                  <td className="py-2.5 text-white text-right font-semibold">ESP-NOW / HTTP 1.1 REST Client</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-400">RF Transceiver Option</td>
                  <td className="py-2.5 text-white text-right font-semibold">LoRa (SX1276) for remote substations</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* MQTT/HTTP Payload structure */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-5 shadow-lg">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b border-brand-border flex items-center">
              <Network className="w-4 h-4 text-blue-400 mr-1.5" />
              IoT Telemetry JSON Payload
            </h4>
            <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">
              Every hour (or on-demand during query events), the ESP32 posts this telemetry JSON to the backend API:
            </p>
            <pre className="p-3 bg-[#0E1524] rounded-lg border border-brand-border text-[9px] text-emerald-400 font-mono overflow-x-auto">
              {jsonPayload}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
