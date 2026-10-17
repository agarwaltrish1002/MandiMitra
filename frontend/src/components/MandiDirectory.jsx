import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Clock, 
  TrendingUp, 
  Edit3, 
  Plus, 
  IndianRupee, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Phone
} from 'lucide-react';
import { createMandi, updateMandiPrice } from '../services/api';

export default function MandiDirectory({ mandis, onRefreshData }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // New Mandi Form State
  const [mandiForm, setMandiForm] = useState({
    name: 'Sonipat Sabzi Mandi',
    short_code: 'SNP-HAR',
    district: 'Sonipat',
    state: 'Haryana',
    distance_km: 180,
    avg_transit_hours: 4.2,
    market_fee_percent: 2.0,
    cess_percent: 1.0,
    unloading_charge_per_quintal: 11.0,
    weighment_charge_per_quintal: 4.0,
    avg_queue_wait_hours: 2.5,
    agmarknet_id: 'HR-SNP-001',
    contact_person: 'Balraj Malik',
    phone: '+91 130 224 8890',
    facilities: 'Covered Sheds, E-NAM electronic platform'
  });

  const handlePriceUpdate = async (e) => {
    e.preventDefault();
    if (!editingPrice) return;
    setSubmitting(true);
    try {
      const res = await updateMandiPrice(editingPrice.id, {
        modal_price: editingPrice.modal_price,
        min_price: editingPrice.min_price,
        max_price: editingPrice.max_price,
        arrivals_tonnes: editingPrice.arrivals_tonnes,
        trend: editingPrice.trend
      });
      if (res.success) {
        setEditingPrice(null);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      alert('Error updating price: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateMandi = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createMandi(mandiForm);
      if (res.success) {
        setShowAddModal(false);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      alert('Error adding mandi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold mb-2">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>APMC Terminal Markets Directory</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Mandi Directory & Live APMC Price Board
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track distances, transit hours, APMC market tax fees, labor charges, yard queue delays, and live commodity rates.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Mandi</span>
        </button>
      </div>

      {/* Mandis List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mandis.map((m) => (
          <div 
            key={m.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition flex flex-col justify-between"
          >
            <div>
              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                      {m.short_code || 'APMC'}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {m.district}, {m.state}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    {m.name}
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-lg font-black text-slate-900">
                    {m.distance_km} km
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    ~{m.avg_transit_hours} hrs transit
                  </span>
                </div>
              </div>

              {/* Mandi Metrics Bar */}
              <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">APMC Fee + Cess</span>
                  <span className="font-bold text-slate-900">
                    {m.market_fee_percent + m.cess_percent}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {m.market_fee_percent}% fee + {m.cess_percent}% cess
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Labor & Weigh</span>
                  <span className="font-bold text-slate-900">
                    ₹{m.unloading_charge_per_quintal + m.weighment_charge_per_quintal} / q
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    ₹{m.unloading_charge_per_quintal} unload + ₹{m.weighment_charge_per_quintal} weigh
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Yard Queue Wait</span>
                  <span className={`font-bold inline-block px-1.5 py-0.5 rounded text-[11px] ${
                    m.avg_queue_wait_hours >= 3.5 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {m.avg_queue_wait_hours} hrs
                  </span>
                  <span className="text-[10px] text-slate-400 block">Gate to auction</span>
                </div>
              </div>

              {/* Commodity Prices Grid */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span>Tracked Commodity Prices (₹/Quintal)</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">AGMARKNET Synced</span>
                </div>

                <div className="space-y-1.5">
                  {m.prices && m.prices.map((p) => (
                    <div 
                      key={p.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 hover:bg-slate-100 text-xs transition"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-800">{p.crop_name}</span>
                        <span className={`text-[10px] font-bold ${
                          p.trend === 'up' ? 'text-emerald-600' : p.trend === 'down' ? 'text-red-600' : 'text-slate-400'
                        }`}>
                          {p.trend === 'up' ? '▲ Up' : p.trend === 'down' ? '▼ Down' : '● Stable'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="font-black text-slate-900 text-sm">
                          ₹{p.modal_price}
                        </span>
                        <span className="text-[10px] text-slate-400 hidden sm:inline">
                          (₹{p.min_price} - ₹{p.max_price})
                        </span>
                        <button
                          onClick={() => setEditingPrice(p)}
                          className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Edit price for test scenario"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer details */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate max-w-xs">{m.facilities}</span>
              {m.phone && (
                <span className="flex items-center font-mono">
                  <Phone className="w-3 h-3 mr-1" />
                  {m.phone}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Price Modal */}
      {editingPrice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative animate-fadeIn">
            <button
              onClick={() => setEditingPrice(null)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Adjust APMC Modal Rate
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Update rate for <strong>{editingPrice.crop_name}</strong> to test dynamic arbitrage recalculation.
            </p>

            <form onSubmit={handlePriceUpdate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Modal Price (₹ / Quintal)</label>
                <input
                  type="number"
                  value={editingPrice.modal_price}
                  onChange={(e) => setEditingPrice({ ...editingPrice, modal_price: parseFloat(e.target.value) })}
                  className="w-full text-sm font-black rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Price (₹)</label>
                  <input
                    type="number"
                    value={editingPrice.min_price}
                    onChange={(e) => setEditingPrice({ ...editingPrice, min_price: parseFloat(e.target.value) })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Price (₹)</label>
                  <input
                    type="number"
                    value={editingPrice.max_price}
                    onChange={(e) => setEditingPrice({ ...editingPrice, max_price: parseFloat(e.target.value) })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Arrivals (Tonnes)</label>
                  <input
                    type="number"
                    value={editingPrice.arrivals_tonnes}
                    onChange={(e) => setEditingPrice({ ...editingPrice, arrivals_tonnes: parseFloat(e.target.value) })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price Trend</label>
                  <select
                    value={editingPrice.trend}
                    onChange={(e) => setEditingPrice({ ...editingPrice, trend: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="up">▲ Up</option>
                    <option value="stable">● Stable</option>
                    <option value="down">▼ Down</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingPrice(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm"
                >
                  {submitting ? 'Saving...' : 'Update Price'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Mandi Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-fadeIn">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1">
              Add APMC Mandi Market
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Register a target wholesale terminal mandi to track price arbitrage.
            </p>

            <form onSubmit={handleCreateMandi} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mandi Name</label>
                  <input
                    type="text"
                    value={mandiForm.name}
                    onChange={(e) => setMandiForm({ ...mandiForm, name: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Short Code</label>
                  <input
                    type="text"
                    value={mandiForm.short_code}
                    onChange={(e) => setMandiForm({ ...mandiForm, short_code: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">District</label>
                  <input
                    type="text"
                    value={mandiForm.district}
                    onChange={(e) => setMandiForm({ ...mandiForm, district: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={mandiForm.state}
                    onChange={(e) => setMandiForm({ ...mandiForm, state: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Distance from Hub (km)</label>
                  <input
                    type="number"
                    value={mandiForm.distance_km}
                    onChange={(e) => setMandiForm({ ...mandiForm, distance_km: e.target.value })}
                    className="w-full text-xs font-bold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Avg Yard Queue Wait (hrs)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={mandiForm.avg_queue_wait_hours}
                    onChange={(e) => setMandiForm({ ...mandiForm, avg_queue_wait_hours: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">APMC Market Fee (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={mandiForm.market_fee_percent}
                    onChange={(e) => setMandiForm({ ...mandiForm, market_fee_percent: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rural Cess (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={mandiForm.cess_percent}
                    onChange={(e) => setMandiForm({ ...mandiForm, cess_percent: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unloading Charge (₹/q)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={mandiForm.unloading_charge_per_quintal}
                    onChange={(e) => setMandiForm({ ...mandiForm, unloading_charge_per_quintal: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Weighment Charge (₹/q)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={mandiForm.weighment_charge_per_quintal}
                    onChange={(e) => setMandiForm({ ...mandiForm, weighment_charge_per_quintal: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm"
                >
                  {submitting ? 'Adding...' : 'Add Mandi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
