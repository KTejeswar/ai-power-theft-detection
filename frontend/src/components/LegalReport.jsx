import React from 'react';
import { ArrowLeft, Printer, ShieldAlert, Award, FileText } from 'lucide-react';

export default function LegalReport({ alert, consumers, readings, onBack }) {
  if (!alert) {
    return (
      <div className="bg-brand-card border border-brand-border rounded-xl p-6 text-center text-gray-500">
        <p>No alert selected for legal evidence compilation.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-xs font-semibold">
          Back to Alarms
        </button>
      </div>
    );
  }

  // Find associated consumer
  const consumer = consumers.find(c => c._id === alert.consumer_id || c.id === alert.consumer_id) || {};

  // Find telemetry readings associated with this consumer to display in the evidence table
  const consumerReadings = readings
    .filter(r => r.consumer_id === alert.consumer_id)
    .slice(0, 5); // Take last 5 readings

  // Calculate electrical parameters for the main anomaly case
  // Use average or defaults if not present
  const baseReading = consumerReadings[0] || {
    voltage_v: 220,
    current_a: 0,
    power_factor: 1.0,
    energy_consumption_kwh: 0,
    anomaly_score: 0
  };

  const apparentPower = (baseReading.voltage_v * baseReading.current_a).toFixed(1);
  const activePower = (baseReading.voltage_v * baseReading.current_a * baseReading.power_factor).toFixed(1);
  const expectedEnergy = (activePower / 1000).toFixed(4);
  const reportedEnergy = baseReading.energy_consumption_kwh.toFixed(4);

  const deviationPercentage = expectedEnergy > 0 
    ? (((expectedEnergy - reportedEnergy) / expectedEnergy) * 100).toFixed(1)
    : '0';

  const caseId = `GG-CASE-${(alert._id || alert.id || '0000').substring(0, 8).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Control bar - hidden during print */}
      <div className="flex justify-between items-center bg-brand-card border border-brand-border rounded-xl p-4 shadow-lg print:hidden">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Alarms</span>
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-bold rounded-lg text-white transition-all shadow-md"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export Legal PDF</span>
        </button>
      </div>

      {/* The Printable Document */}
      <div className="bg-white text-gray-900 border border-gray-300 rounded-xl p-8 shadow-xl max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
        {/* Style block for printing */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body {
              background-color: white !important;
              color: black !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            .bg-white {
              background-color: white !important;
              color: black !important;
            }
            .border {
              border-color: #6b7280 !important;
            }
            .divide-y > * + * {
              border-color: #e5e7eb !important;
            }
          }
        `}} />

        {/* Letterhead */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gray-900 text-white rounded-lg">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wider uppercase text-gray-900">GridGuardian LLC</h2>
              <p className="text-xs text-gray-600 font-mono">Utility Security & Grid Compliance Analytics Division</p>
              <p className="text-[10px] text-gray-500">Official incident report, compliant with Energy Theft prosecution codes.</p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block bg-gray-100 border border-gray-300 rounded px-3 py-1.5 text-center font-mono">
              <span className="block text-[9px] uppercase text-gray-500">Case Docket ID</span>
              <span className="text-xs font-bold text-gray-900">{caseId}</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 font-mono">Compiled on: {new Date(alert.created_at).toLocaleString()}</p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="my-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-4">
          <div className="p-2 bg-red-600 text-white rounded mt-0.5">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-900 uppercase">Energy Diversion & Meter Tampering Incident Report</h3>
            <p className="text-xs text-red-700 mt-1 leading-relaxed">
              Based on the telemetry stream logged by smart meter serial number <strong className="font-semibold">{consumer.meter_serial_number}</strong>, the system flagged a critical mismatch between actual circuit current draw and reported active energy. The XGBoost theft classification classifier returns a risk score of <strong className="font-bold">{(alert.risk_score * 100).toFixed(1)}%</strong>. This constitutes a probable violation of utility bypass and tamper regulations.
            </p>
          </div>
        </div>

        {/* Case Metadata */}
        <div className="grid grid-cols-2 gap-6 my-6 border-b border-gray-300 pb-6 text-xs">
          <div>
            <h4 className="font-bold uppercase text-gray-500 text-[10px] tracking-wider mb-2">1. Consumer Node Information</h4>
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-1.5 font-semibold text-gray-600">Full Name:</td>
                  <td className="py-1.5 text-gray-900">{consumer.name}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-1.5 font-semibold text-gray-600">Consumer No:</td>
                  <td className="py-1.5 text-gray-900 font-mono">{consumer.consumer_number}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-1.5 font-semibold text-gray-600">Meter Serial:</td>
                  <td className="py-1.5 text-gray-900 font-mono">{consumer.meter_serial_number}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-1.5 font-semibold text-gray-600">Address:</td>
                  <td className="py-1.5 text-gray-900">{consumer.address}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h4 className="font-bold uppercase text-gray-500 text-[10px] tracking-wider mb-2">2. Detection Case Properties</h4>
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-1.5 font-semibold text-gray-600">Risk Severity:</td>
                  <td className="py-1.5 text-red-600 font-bold">
                    {alert.risk_score >= 0.90 ? '🔴 CRITICAL' : (alert.risk_score >= 0.80 ? '🟠 WARNING' : '🟡 EVALUATE')}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-1.5 font-semibold text-gray-600">XGBoost Confidence:</td>
                  <td className="py-1.5 text-gray-900 font-mono font-bold">{(alert.risk_score * 100).toFixed(2)}%</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-1.5 font-semibold text-gray-600">Alert Status:</td>
                  <td className="py-1.5 text-gray-900 font-semibold uppercase">{alert.status}</td>
                </tr>
                {alert.status === 'Resolved' && (
                  <>
                    <tr className="border-b border-gray-100">
                      <td className="py-1.5 font-semibold text-gray-600">Resolved On:</td>
                      <td className="py-1.5 text-gray-900 font-mono">{new Date(alert.resolved_at).toLocaleString()}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-1.5 font-semibold text-gray-600">Auditor:</td>
                      <td className="py-1.5 text-gray-900">{alert.resolved_by}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mathematical Proof */}
        <div className="my-6 border-b border-gray-300 pb-6">
          <h4 className="font-bold uppercase text-gray-500 text-[10px] tracking-wider mb-3">3. Electrical Physics Mathematical Proof</h4>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-[10px] uppercase font-sans">Circuit Apparent Power ($S$):</p>
                <p className="text-gray-900 font-bold">{baseReading.voltage_v} V × {baseReading.current_a} A = {apparentPower} VA</p>
              </div>
              <div>
                <p className="text-gray-500 text-[10px] uppercase font-sans">Active Active Power ($P$):</p>
                <p className="text-gray-900 font-bold">{apparentPower} VA × {baseReading.power_factor} PF = {activePower} W</p>
              </div>
              <div>
                <p className="text-gray-500 text-[10px] uppercase font-sans">Theoretical Draw ($E_{calc}$):</p>
                <p className="text-gray-900 font-bold">{expectedEnergy} kWh / hour</p>
              </div>
              <div>
                <p className="text-gray-500 text-[10px] uppercase font-sans">Reported Draw ($E_{reported}$):</p>
                <p className="text-red-600 font-bold">{reportedEnergy} kWh / hour</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200 font-sans">
              <span className="text-[10px] font-bold text-gray-600 uppercase">Mismatch Deviation Coefficient:</span>
              <p className="text-sm text-red-600 font-bold mt-0.5">
                The smart meter reported consumption is {deviationPercentage}% BELOW the physical expectation.
              </p>
              <p className="text-[10px] text-gray-500 mt-1 leading-relaxed font-mono">
                Formula: Deviation % = (Theoretical Draw - Reported Draw) / Theoretical Draw * 100.
                A deviation of &gt; 90% while current draw exceeds 5A indicates line shunting or direct transformer bypass.
              </p>
            </div>
          </div>
        </div>

        {/* Telemetry Log Table */}
        <div className="my-6">
          <h4 className="font-bold uppercase text-gray-500 text-[10px] tracking-wider mb-3">4. Historical Telemetry Audit Log</h4>
          <table className="w-full text-[10px] text-left border border-gray-200 divide-y divide-gray-200">
            <thead className="bg-gray-50 text-gray-600 uppercase font-sans font-bold">
              <tr>
                <th className="p-2.5">Timestamp</th>
                <th className="p-2.5">Voltage</th>
                <th className="p-2.5">Current</th>
                <th className="p-2.5">P.F.</th>
                <th className="p-2.5">Reported Energy</th>
                <th className="p-2.5">Anomaly Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-mono text-gray-900">
              {consumerReadings.map((r, i) => (
                <tr key={i} className={i === 0 ? 'bg-red-50 font-bold' : ''}>
                  <td className="p-2.5 font-sans">{new Date(r.timestamp).toLocaleTimeString()}</td>
                  <td className="p-2.5">{r.voltage_v} V</td>
                  <td className="p-2.5">{r.current_a} A</td>
                  <td className="p-2.5">{r.power_factor}</td>
                  <td className="p-2.5 text-red-600">{r.energy_consumption_kwh.toFixed(3)} kWh</td>
                  <td className="p-2.5">{r.anomaly_score}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Investigator Sign-off */}
        <div className="grid grid-cols-2 gap-12 mt-12 pt-12 border-t border-gray-300 text-xs">
          <div>
            <div className="border-b border-gray-900 h-10"></div>
            <p className="mt-2 text-gray-600 font-bold">Field Crew Officer Sign-off</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Signature indicates bypass wiring has been physically audited and removed.</p>
          </div>
          <div>
            <div className="border-b border-gray-900 h-10"></div>
            <p className="mt-2 text-gray-600 font-bold">Compliance Auditor Stamp</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Approved under regulatory grid security act GGD-SEC-9.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
