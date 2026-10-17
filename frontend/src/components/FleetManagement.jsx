import React, { useState } from 'react';
import { 
  Truck, 
  Plus, 
  Trash2, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Snowflake, 
  X,
  Gauge,
  IndianRupee
} from 'lucide-react';
import { createVehicle, deleteVehicle, updateVehicle } from '../services/api';

export default function FleetManagement({ vehicles, onRefreshData }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: 'Tata 407 LPT Eco',
    vehicle_number: 'RJ-02-CD-5521',
    type: 'Heavy Pickup (Tata 407)',
    payload_capacity_quintals: 35,
    cost_per_km: 25,
    avg_speed_kmh: 52,
    driver_name: 'Dharmendra Meena',
    driver_phone: '+91 94140 22334',
    is_refrigerated: 0,
    status: 'available',
    current_location: 'Central FPO Yard'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createVehicle(formData);
      if (res.success) {
        setShowAddModal(false);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      alert('Error adding vehicle: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (vehicle) => {
    const nextStatus = vehicle.status === 'available' ? 'maintenance' : 'available';
    try {
      await updateVehicle(vehicle.id, {
        ...vehicle,
        status: nextStatus
      });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert('Error updating vehicle: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this vehicle from the cooperative fleet?')) return;
    try {
      await deleteVehicle(id);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert('Error deleting vehicle: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-xs font-bold mb-2">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            <span>Cooperative Logistics & Transport Fleet</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Vehicle Availability & Freight Economics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure vehicle payload capacities in quintals, per-kilometer freight tariffs, and driver contacts.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Fleet Vehicle</span>
        </button>
      </div>

      {/* Fleet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {vehicles.map((v) => (
          <div 
            key={v.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                      {v.vehicle_number}
                    </span>
                    {v.is_refrigerated === 1 && (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                        <Snowflake className="w-3 h-3 text-blue-600" />
                        <span>Cold Chain Reefer</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1.5 truncate">
                    {v.name}
                  </h3>
                  <span className="text-xs text-slate-400 block">{v.type}</span>
                </div>

                <button
                  onClick={() => handleToggleStatus(v)}
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    v.status === 'available'
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : v.status === 'dispatched'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  }`}
                  title="Click to toggle maintenance/available"
                >
                  {v.status}
                </button>
              </div>

              {/* Specs Box */}
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Payload Capacity</span>
                  <span className="font-black text-slate-900 text-sm">{v.payload_capacity_quintals} Quintals</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Freight Cost</span>
                  <span className="font-black text-slate-900 text-sm">₹{v.cost_per_km} / km</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Average Speed</span>
                  <span className="font-semibold text-slate-700">{v.avg_speed_kmh} km/h</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Location</span>
                  <span className="font-semibold text-slate-700 truncate block">{v.current_location}</span>
                </div>
              </div>

              {/* Driver info */}
              <div className="mt-3 text-xs text-slate-600 flex items-center justify-between">
                <span>Driver: <strong className="text-slate-800">{v.driver_name}</strong></span>
                {v.driver_phone && (
                  <span className="flex items-center text-slate-500 font-mono text-[11px]">
                    <Phone className="w-3 h-3 mr-1 text-slate-400" />
                    {v.driver_phone}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                {v.status === 'available' ? 'Ready for immediate dispatch' : 'Currently in transit or depot'}
              </span>
              <button
                onClick={() => handleDelete(v.id)}
                className="text-slate-400 hover:text-red-600 p-1 rounded transition"
                title="Remove vehicle"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Vehicle Modal */}
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
              Add Transport Fleet Vehicle
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Add owned or cooperative member contracted trucks for mandi dispatches.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vehicle Name / Model</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Bolero Maxi Truck"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Registration Number</label>
                  <input
                    type="text"
                    value={formData.vehicle_number}
                    onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. RJ-02-GB-1234"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vehicle Type Category</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Mini Truck (Tata Ace)">Mini Truck (Tata Ace)</option>
                    <option value="Maxi Pickup (Bolero)">Maxi Pickup (Bolero)</option>
                    <option value="Heavy Pickup (Tata 407)">Heavy Pickup (Tata 407)</option>
                    <option value="14-ft Truck (Eicher)">14-ft Truck (Eicher Pro)</option>
                    <option value="Tractor Trolley">Tractor Trolley</option>
                    <option value="Reefer Cold Van">Reefer Cold Van (Refrigerated)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payload Capacity (Quintals)</label>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={formData.payload_capacity_quintals}
                    onChange={(e) => setFormData({ ...formData, payload_capacity_quintals: e.target.value })}
                    className="w-full text-xs font-bold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Freight Cost (₹ per km)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.cost_per_km}
                    onChange={(e) => setFormData({ ...formData, cost_per_km: e.target.value })}
                    className="w-full text-xs font-bold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Average Speed (km/h)</label>
                  <input
                    type="number"
                    value={formData.avg_speed_kmh}
                    onChange={(e) => setFormData({ ...formData, avg_speed_kmh: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Driver Name</label>
                  <input
                    type="text"
                    value={formData.driver_name}
                    onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Driver Phone</label>
                  <input
                    type="text"
                    value={formData.driver_phone}
                    onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="reefer-check"
                  checked={formData.is_refrigerated === 1}
                  onChange={(e) => setFormData({ ...formData, is_refrigerated: e.target.checked ? 1 : 0 })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <label htmlFor="reefer-check" className="font-semibold text-slate-700 text-xs">
                  Refrigerated / Insulated Cold Chain Truck (protects perishable crops)
                </label>
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
                  {submitting ? 'Adding...' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
