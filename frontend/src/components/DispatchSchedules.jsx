import React, { useState } from 'react';
import { 
  Calendar, 
  Truck, 
  MapPin, 
  Clock, 
  IndianRupee, 
  Download, 
  Printer, 
  Share2, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  FileText, 
  ShieldCheck,
  X
} from 'lucide-react';
import { updateScheduleStatus, deleteSchedule } from '../services/api';

export default function DispatchSchedules({ 
  schedules, 
  onRefreshData, 
  cooperative 
}) {
  const [selectedPass, setSelectedPass] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await updateScheduleStatus(id, newStatus);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert('Error updating status: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this dispatch schedule and release the assigned vehicle?')) return;
    try {
      await deleteSchedule(id);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert('Error deleting schedule: ' + err.message);
    }
  };

  const handleExportCSV = () => {
    if (!schedules || schedules.length === 0) return;

    const headers = [
      'Dispatch Code',
      'Batch Code',
      'Crop',
      'Quantity (q)',
      'Assigned Mandi',
      'Assigned Vehicle',
      'Driver Name',
      'Driver Phone',
      'Departure Time',
      'Estimated Arrival',
      'Gross Revenue (₹)',
      'Transport Freight (₹)',
      'Mandi Fees (₹)',
      'Net Revenue (₹)',
      'Arbitrage Gain (₹)',
      'Status'
    ];

    const rows = schedules.map(s => [
      s.dispatch_code,
      s.batch_code || '',
      s.crop_name,
      s.quantity_quintals,
      `"${s.mandi_name}"`,
      `"${s.vehicle_name}"`,
      `"${s.driver_name || ''}"`,
      `"${s.driver_phone || ''}"`,
      `"${s.departure_time}"`,
      `"${s.estimated_arrival_time}"`,
      s.gross_revenue,
      s.transport_cost,
      s.mandi_fees,
      s.net_revenue,
      s.arbitrage_gain,
      s.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MandiMitra_Dispatch_Manifest_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyDriverWhatsapp = (dsp) => {
    const text = `🚚 *MANDIMITRA APMC DISPATCH ORDER*
Order Ref: *${dsp.dispatch_code}*
---------------------------------
🌾 *Produce:* ${dsp.crop_name} (${dsp.quantity_quintals} Quintals)
📍 *Origin Yard:* ${dsp.farm_location || 'Central FPO Depot, Alwar'}
🏛️ *Destination Mandi:* *${dsp.mandi_name}* (${dsp.distance_km || 150} km)

🚛 *Vehicle:* ${dsp.vehicle_name}
🔢 *Vehicle No:* ${dsp.vehicle_number || 'RJ-02'}
👨‍✈️ *Driver:* ${dsp.driver_name || 'Driver'} (${dsp.driver_phone || ''})

⏰ *Departure:* *${dsp.departure_time}*
🏁 *Expected Gate Arrival:* *${dsp.estimated_arrival_time}* (Pre-Auction)
💰 *Target Modal Rate:* ₹${dsp.modal_price}/quintal

*Instructions:*
1. Maintain speed within 55 km/h to prevent crop shaking.
2. Present this slip at APMC Gate #2 for Weighment & Token.
3. Call FPO Logistics desk on any en-route delay.`;

    navigator.clipboard.writeText(text);
    alert('Driver WhatsApp dispatch instructions copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Header with Export & Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold mb-2">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Active Cooperative Logistics Schedule</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Dispatch Schedules & Gate Passes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time track and manage active vehicle dispatches, departure timings, and official APMC transit passes.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            disabled={!schedules || schedules.length === 0}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export Manifest (CSV)</span>
          </button>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            All Cooperative Dispatches ({schedules.length})
          </h3>
          <span className="text-xs text-slate-500">
            Total Net Earning: <strong>₹{schedules.reduce((acc, s) => acc + s.net_revenue, 0).toLocaleString('en-IN')}</strong>
          </span>
        </div>

        {schedules.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No dispatches scheduled yet. Launch the Logistics Optimizer to generate dispatches!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Dispatch Pass</th>
                  <th className="py-3 px-4">Produce Batch</th>
                  <th className="py-3 px-4">Assigned Mandi</th>
                  <th className="py-3 px-4">Fleet & Driver</th>
                  <th className="py-3 px-4">Departure & ETA</th>
                  <th className="py-3 px-4">Expected Net Profit</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {schedules.map((dsp) => (
                  <tr key={dsp.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                      {dsp.dispatch_code}
                      <span className="block font-sans text-[10px] text-slate-400 font-normal">
                        {new Date(dsp.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{dsp.crop_name}</div>
                      <div className="text-[11px] text-slate-500">{dsp.quantity_quintals} Quintals • {dsp.batch_code}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{dsp.mandi_name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center">
                        <MapPin className="w-3 h-3 mr-0.5 text-slate-300" />
                        {dsp.distance_km || 150} km
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{dsp.vehicle_name.split('(')[0]}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{dsp.vehicle_number}</div>
                      {dsp.driver_phone && (
                        <div className="text-[10px] text-slate-400">{dsp.driver_name} • {dsp.driver_phone}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-slate-400" />
                        {dsp.departure_time}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                        ETA: {dsp.estimated_arrival_time}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        ₹{dsp.net_revenue.toLocaleString('en-IN')}
                      </div>
                      {dsp.arbitrage_gain > 0 && (
                        <div className="text-[10px] font-bold text-emerald-600">
                          +₹{dsp.arbitrage_gain.toLocaleString('en-IN')} (+{dsp.arbitrage_gain_pct}%)
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={dsp.status}
                        onChange={(e) => handleStatusChange(dsp.id, e.target.value)}
                        disabled={updatingId === dsp.id}
                        className={`text-xs font-bold rounded-lg px-2.5 py-1 border focus:outline-none ${
                          dsp.status === 'scheduled'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : dsp.status === 'in_transit'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : dsp.status === 'delivered'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="in_transit">In Transit 🚚</option>
                        <option value="delivered">Delivered & Sold ✅</option>
                        <option value="cancelled">Cancelled ❌</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => copyDriverWhatsapp(dsp)}
                          title="Copy WhatsApp Driver Slip"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedPass(dsp)}
                          title="Print Official APMC Transit Pass"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(dsp.id)}
                          title="Cancel / Delete Schedule"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official APMC Gate Pass Modal */}
      {selectedPass && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative animate-fadeIn">
            <button
              onClick={() => setSelectedPass(null)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Official Pass Content */}
            <div id="printable-gate-pass" className="border-4 border-slate-800 p-6 rounded-xl bg-white font-sans text-slate-900">
              <div className="text-center pb-4 border-b-2 border-slate-800">
                <span className="text-[10px] uppercase tracking-widest font-black text-slate-500">
                  Government of India • Ministry of Agriculture & Farmers Welfare
                </span>
                <h2 className="text-lg font-black uppercase tracking-tight mt-0.5">
                  Inter-Mandi Transit Waybill & Gate Pass
                </h2>
                <p className="text-xs font-semibold text-slate-600">
                  {cooperative?.name || 'Kisan Samriddhi Farmer Producer Company'} (FPO Reg # RJ/ALW/2024/099)
                </p>
                <div className="mt-2 inline-block bg-slate-900 text-white font-mono text-xs px-3 py-1 font-bold rounded">
                  PASS #: {selectedPass.dispatch_code}
                </div>
              </div>

              {/* Waybill Details */}
              <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 uppercase text-[10px] font-bold block">Commodity Description</span>
                  <span className="font-black text-sm text-slate-900 block">{selectedPass.crop_name}</span>
                  <span className="text-slate-600">Quantity: <strong>{selectedPass.quantity_quintals} Quintals</strong></span>
                  <span className="text-slate-500 block text-[11px]">Batch: {selectedPass.batch_code}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[10px] font-bold block">Target APMC Mandi</span>
                  <span className="font-black text-sm text-slate-900 block">{selectedPass.mandi_name}</span>
                  <span className="text-slate-600">Distance: <strong>{selectedPass.distance_km || 155} km</strong></span>
                  <span className="text-slate-500 block text-[11px]">Auction Window: 07:00 AM - 11:30 AM</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 uppercase text-[10px] font-bold block">Authorized Transport</span>
                  <span className="font-bold text-slate-900 block">{selectedPass.vehicle_name}</span>
                  <span className="font-mono text-slate-700 block font-bold">Vehicle Reg: {selectedPass.vehicle_number}</span>
                  <span className="text-slate-600 block">Driver: {selectedPass.driver_name || 'Assigned'} ({selectedPass.driver_phone || ''})</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[10px] font-bold block">Departure & Transit Itinerary</span>
                  <span className="font-bold text-slate-900 block">Depart: {selectedPass.departure_time}</span>
                  <span className="font-bold text-emerald-700 block">Mandi Yard ETA: {selectedPass.estimated_arrival_time}</span>
                  <span className="text-slate-500 block text-[10px]">Route: Via National Highway / Freight Corridor</span>
                </div>
              </div>

              {/* Financial Benchmark */}
              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Projected Net Realization</span>
                  <span className="font-black text-slate-900 text-base">₹{selectedPass.net_revenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-700 font-bold block">+₹{selectedPass.arbitrage_gain.toLocaleString('en-IN')} Extra Arbitrage Gain</span>
                  <span className="text-[10px] text-slate-400">Net of ₹{selectedPass.transport_cost} freight & fees</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="mt-6 pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-[11px] text-slate-500 text-center">
                <div className="border-t border-dashed border-slate-400 pt-1">
                  Driver / Transporter Signature
                </div>
                <div className="border-t border-dashed border-slate-400 pt-1">
                  FPO Logistics Manager & Seal
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedPass(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Pass</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
