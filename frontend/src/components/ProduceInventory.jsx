import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Tag, 
  X,
  Sparkles
} from 'lucide-react';
import { createInventoryBatch, deleteInventoryBatch } from '../services/api';

export default function ProduceInventory({ inventory, crops, onRefreshData }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    crop_name: 'Tomato (Tamatar)',
    variety: 'Himsona Hybrid',
    quantity_quintals: 50,
    harvest_date: new Date().toISOString().split('T')[0],
    shelf_life_days: 4,
    quality_grade: 'Grade A (Export/Premium)',
    farm_location: 'Alwar Cluster Farm #2',
    farmer_name: 'Rajendra Prasad Sharma',
    notes: 'Freshly harvested, sorted in plastic crates'
  });

  const handleCropChange = (cropName) => {
    const cropObj = crops.find(c => c.name === cropName);
    setFormData(prev => ({
      ...prev,
      crop_name: cropName,
      shelf_life_days: cropObj ? cropObj.default_shelf_life_days : 5
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createInventoryBatch(formData);
      if (res.success) {
        setShowAddModal(false);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      alert('Error creating batch: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this produce batch?')) return;
    try {
      await deleteInventoryBatch(id);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert('Error deleting batch: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold mb-2">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cooperative Aggregation Batches</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Produce Inventory & Perishability Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Register and monitor aggregated farmer produce batches, quality grades, and remaining shelf life hours.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Produce Batch</span>
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Current Farm Batches ({inventory.length})
          </h3>
          <span className="text-xs text-slate-500">
            Total Volume: <strong>{inventory.reduce((acc, i) => acc + i.quantity_quintals, 0)} Quintals</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Batch Code</th>
                <th className="py-3 px-4">Crop & Variety</th>
                <th className="py-3 px-4">Quantity (q)</th>
                <th className="py-3 px-4">Quality Grade</th>
                <th className="py-3 px-4">Shelf-Life Remaining</th>
                <th className="py-3 px-4">Farmer / Farm Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {inventory.map((item) => {
                const isUrgent = item.remaining_shelf_life_hours <= 48 && item.status === 'active';
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {item.batch_code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.crop_name}</div>
                      <div className="text-[11px] text-slate-400">{item.variety}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                      {item.quantity_quintals} q
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.quality_grade.includes('Grade A') 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : item.quality_grade.includes('Grade B')
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.quality_grade.split('(')[0]}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5">
                        <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
                        <span className={`font-semibold ${isUrgent ? 'text-red-600 font-bold' : 'text-slate-700'}`}>
                          {item.remaining_shelf_life_hours} hrs left
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Harvested: {item.harvest_date}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{item.farmer_name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center">
                        <MapPin className="w-3 h-3 mr-0.5" />
                        {item.farm_location}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        item.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'allocated'
                          ? 'bg-blue-100 text-blue-800'
                          : item.status === 'sold'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete batch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Batch Modal */}
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
              Add Produce Inventory Batch
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Enter aggregated harvest details from cooperative farmer members.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Crop</label>
                  <select
                    value={formData.crop_name}
                    onChange={(e) => handleCropChange(e.target.value)}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {crops.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Variety</label>
                  <input
                    type="text"
                    value={formData.variety}
                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Himsona / Pukhraj"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity (Quintals)</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.quantity_quintals}
                    onChange={(e) => setFormData({ ...formData, quantity_quintals: e.target.value })}
                    className="w-full text-xs font-bold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quality Grade</label>
                  <select
                    value={formData.quality_grade}
                    onChange={(e) => setFormData({ ...formData, quality_grade: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Grade A (Export/Premium)">Grade A (Export/Premium)</option>
                    <option value="Grade B (Standard)">Grade B (Standard)</option>
                    <option value="Grade C (Fair)">Grade C (Fair)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harvest Date</label>
                  <input
                    type="date"
                    value={formData.harvest_date}
                    onChange={(e) => setFormData({ ...formData, harvest_date: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shelf Life (Days)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.shelf_life_days}
                    onChange={(e) => setFormData({ ...formData, shelf_life_days: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Farmer / Member Name</label>
                  <input
                    type="text"
                    value={formData.farmer_name}
                    onChange={(e) => setFormData({ ...formData, farmer_name: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Farm / Yard Location</label>
                  <input
                    type="text"
                    value={formData.farm_location}
                    onChange={(e) => setFormData({ ...formData, farm_location: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes & Packaging</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Crated, cold pre-cooled, ready for immediate dispatch"
                />
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
                  {submitting ? 'Saving...' : 'Register Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
