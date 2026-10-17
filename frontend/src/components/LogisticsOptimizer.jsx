import React, { useState } from 'react';
import { 
  Truck, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  IndianRupee, 
  ShieldCheck, 
  MapPin, 
  ChevronRight,
  ArrowRight,
  Send,
  RotateCcw
} from 'lucide-react';
import { optimizeLogistics, commitOptimizationPlan } from '../services/api';

export default function LogisticsOptimizer({ onNavigate, onRefreshData }) {
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [plan, setPlan] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleRunOptimization = async () => {
    setLoading(true);
    setSuccessMessage(null);
    try {
      const res = await optimizeLogistics();
      if (res.success) {
        setPlan(res);
      }
    } catch (err) {
      alert('Error running optimizer: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCommitPlan = async () => {
    if (!plan || !plan.allocations || plan.allocations.length === 0) return;
    setCommitting(true);
    try {
      const res = await commitOptimizationPlan(plan.allocations);
      if (res.success) {
        setSuccessMessage(`Successfully dispatched and scheduled ${res.dispatches.length} orders!`);
        if (onRefreshData) onRefreshData();
        setTimeout(() => {
          onNavigate('schedules');
        }, 1500);
      }
    } catch (err) {
      alert('Error committing plan: ' + err.message);
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Engine Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold mb-2">
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Multi-Constraint Linear Allocation Solver</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Arbitrage & Logistics Allocation Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Solves the cooperative batch-to-mandi-to-vehicle matching matrix. 
              Balances perishable transit limits, truck payload capacity, APMC queue wait times, 
              and freight expenses to maximize overall farmer group profits.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRunOptimization}
              disabled={loading}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Mandi Matrix...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Run Logistics Optimization</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Verification Check Indicators */}
        <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span><strong>Price Freshness:</strong> AGMARKNET APMC validated</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span><strong>Perishability Check:</strong> Hard-capped within shelf-life hours</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span><strong>Vehicle Capacity:</strong> Payload matched to prevent overloading</span>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successMessage} Redirecting to Dispatch Board...</span>
        </div>
      )}

      {/* When no plan has been run yet */}
      {!plan && !loading && (
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-4">
            <Play className="w-8 h-8 ml-1" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            Ready to Solve Optimal Dispatch Routes
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
            Click "Run Logistics Optimization" above. The engine will match all active cooperative produce batches 
            with the highest-yield target mandis and available vehicles.
          </p>
          <button
            onClick={handleRunOptimization}
            className="mt-5 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch Engine</span>
          </button>
        </div>
      )}

      {/* Plan Results View */}
      {plan && plan.summary && (
        <div className="space-y-6">
          {/* Summary Dashboard Bar */}
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Optimal Cooperative Allocation Summary
                </span>
                <h2 className="text-2xl sm:text-3xl font-black mt-1">
                  ₹{plan.summary.totalNetRealization.toLocaleString('en-IN')} Projected Net Realization
                </h2>
                <div className="mt-2 flex items-center space-x-2 text-xs text-emerald-100">
                  <span className="bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded font-bold">
                    +₹{plan.summary.totalArbitrageGain.toLocaleString('en-IN')} (+{plan.summary.overallArbitragePct}%) Extra Arbitrage Profit
                  </span>
                  <span>over local base selling</span>
                </div>
              </div>

              {/* Commit Button */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCommitPlan}
                  disabled={committing || plan.allocations.length === 0}
                  className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black text-sm shadow-lg transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{committing ? 'Scheduling Dispatches...' : 'Commit & Generate Dispatch Slips'}</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="mt-6 pt-6 border-t border-emerald-700/50 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-emerald-300 block">Produce Allocated</span>
                <span className="text-lg font-bold text-white mt-0.5 block">
                  {plan.summary.totalQuantityQuintals} q ({plan.summary.totalAllocatedBatches} Batches)
                </span>
              </div>
              <div>
                <span className="text-emerald-300 block">Fleet Utilized</span>
                <span className="text-lg font-bold text-white mt-0.5 block">
                  {plan.summary.vehiclesUtilized} / {plan.summary.totalVehiclesAvailable} Trucks
                </span>
              </div>
              <div>
                <span className="text-emerald-300 block">Freight Transport Cost</span>
                <span className="text-lg font-bold text-white mt-0.5 block">
                  ₹{plan.summary.totalTransportCost.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-emerald-300 block">Spoilage Risk Deducted</span>
                <span className="text-lg font-bold text-white mt-0.5 block">
                  ₹{plan.summary.totalSpoilageRiskLoss.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Allocation Cards List */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Optimized Batch Dispatch Schedules ({plan.allocations.length})</span>
              <span className="text-xs font-normal text-slate-500">
                Sorted by priority and shelf-life urgency
              </span>
            </h3>

            {plan.allocations.map((alloc) => (
              <div 
                key={alloc.batchId}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-emerald-300 transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  {/* Batch & Crop Info */}
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                      {alloc.quantityQuintals}q
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {alloc.batchCode}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {alloc.cropName} ({alloc.variety})
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {alloc.qualityGrade}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Farmer: <strong className="text-slate-700">{alloc.farmerName}</strong> • {alloc.farmLocation}
                      </div>
                    </div>
                  </div>

                  {/* Profit Pill */}
                  <div className="flex items-center space-x-3 text-right">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                        Net Realization
                      </span>
                      <span className="text-xl font-black text-slate-900">
                        ₹{alloc.financials.riskAdjustedNetRevenue.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-emerald-600 font-bold block">
                        +₹{alloc.financials.arbitrageGain.toLocaleString('en-IN')} (+{alloc.financials.arbitrageGainPct}%) Arbitrage
                      </span>
                    </div>
                  </div>
                </div>

                {/* Routing & Logistics Grid */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  {/* Mandi Assignment */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold block">
                      Target Mandi
                    </span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {alloc.assignedMandi.name}
                    </span>
                    <span className="text-slate-500 mt-1 flex items-center">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1" />
                      {alloc.assignedMandi.distanceKm} km • {alloc.assignedMandi.state}
                    </span>
                  </div>

                  {/* Vehicle Assignment */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold block">
                      Assigned Fleet Vehicle
                    </span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">
                      {alloc.assignedVehicle.name.split('(')[0]}
                    </span>
                    <span className="text-slate-500 mt-1 flex items-center">
                      <Truck className="w-3.5 h-3.5 text-slate-400 mr-1" />
                      {alloc.assignedVehicle.vehicleNumber} ({alloc.assignedVehicle.type.split('(')[0]})
                    </span>
                  </div>

                  {/* Transit & Timing */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold block">
                      Schedule & Auction Timing
                    </span>
                    <span className="font-bold text-slate-900 mt-0.5 block">
                      Depart: {alloc.transitDetails.suggestedDeparture}
                    </span>
                    <span className="text-emerald-700 font-medium mt-1 flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      Arrival: {alloc.transitDetails.estimatedArrival}
                    </span>
                  </div>

                  {/* Spoilage Risk & Score */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold block">
                      Perishability & Safety Check
                    </span>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {alloc.transitDetails.riskLevel} Risk ({alloc.transitDetails.spoilageRiskPct}%)
                      </span>
                      <span className="font-black text-slate-800">
                        Score: {alloc.recommendationScore}/100
                      </span>
                    </div>
                    <span className="text-slate-400 text-[10px] mt-1 block">
                      {alloc.transitDetails.totalHours}h total transit+queue
                    </span>
                  </div>
                </div>

                {/* Rationale Footer */}
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span><strong>AI Decision Rationale:</strong> {alloc.rationale}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Unassigned Batches Warning if any */}
          {plan.unassigned && plan.unassigned.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-amber-900 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Unallocated Produce Batches ({plan.unassigned.length})</span>
              </h4>
              <p className="text-xs text-amber-800 mt-1">
                The following batches require additional truck capacity or specialized refrigerated haulage before dispatch:
              </p>
              <div className="mt-3 space-y-2">
                {plan.unassigned.map((u, i) => (
                  <div key={i} className="text-xs bg-white p-3 rounded-xl border border-amber-200 text-slate-700 flex justify-between items-center">
                    <span><strong>{u.batch.batch_code}</strong>: {u.batch.crop_name} ({u.batch.quantity_quintals}q) - {u.batch.farm_location}</span>
                    <span className="text-red-600 font-semibold">{u.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
