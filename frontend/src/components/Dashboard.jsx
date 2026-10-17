import React from 'react';
import { 
  TrendingUp, 
  Truck, 
  Layers, 
  IndianRupee, 
  Clock, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  MapPin, 
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Scale
} from 'lucide-react';

export default function Dashboard({ 
  summary, 
  onNavigate, 
  mandis, 
  crops 
}) {
  const cards = summary?.summaryCards || {};
  const topMandis = summary?.topMandis || [];
  const recentDispatches = summary?.recentDispatches || [];

  return (
    <div className="space-y-6">
      {/* Top Banner: Urgent Perishability & Arbitrage Signal */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 shadow-lg shadow-emerald-950/10">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <Truck className="w-64 h-64 -mr-12" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>AI Arbitrage Agent Active</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Stop Selling 10-20% Below Market. Maximize Cooperative Realization.
          </h1>
          <p className="mt-2 text-sm text-emerald-100/90 leading-relaxed">
            MandiMitra checks real-time AGMARKNET APMC rates, calculates round-trip transport freight, 
            deducts state market cess, and factors in heat and queue perishability to route every produce batch to its peak profit terminal.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('optimizer')}
              className="inline-flex items-center space-x-2 bg-white text-emerald-800 hover:bg-emerald-50 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition"
            >
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>Run Automated Fleet Optimizer</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('calculator')}
              className="inline-flex items-center space-x-2 bg-emerald-600/60 hover:bg-emerald-600 border border-emerald-400/40 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition"
            >
              <Scale className="w-4 h-4" />
              <span>Compare Mandi A vs Mandi B</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Inventory */}
        <div 
          onClick={() => onNavigate('inventory')}
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-emerald-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Produce Inventory
            </span>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">
              {cards.totalInventoryQuintals || 0}
            </span>
            <span className="text-sm font-medium text-slate-500">Quintals</span>
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-600">
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {cards.activeBatches || 0} active batches
            </span>
            {cards.urgentBatches > 0 && (
              <span className="ml-2 font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {cards.urgentBatches} urgent (shelf-life)
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Fleet Availability */}
        <div 
          onClick={() => onNavigate('fleet')}
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-emerald-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Transport Fleet
            </span>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">
              {cards.availableVehicles || 0} / {cards.totalVehicles || 0}
            </span>
            <span className="text-sm font-medium text-slate-500">Vehicles Ready</span>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
              {cards.availableCapacityQuintals || 0}q fleet payload
            </span>
            <span className="ml-2 text-slate-400">Available now</span>
          </div>
        </div>

        {/* Card 3: Total Net Realized */}
        <div 
          onClick={() => onNavigate('schedules')}
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-emerald-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Projected Net Realization
            </span>
            <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-slate-900">
              ₹{(cards.totalNetRevenue || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {cards.activeDispatches || 0} scheduled dispatches
            </span>
            <span className="ml-2 text-slate-400">Net of freight & cess</span>
          </div>
        </div>

        {/* Card 4: Total Arbitrage Premium */}
        <div 
          onClick={() => onNavigate('calculator')}
          className="bg-gradient-to-br from-amber-500/10 to-emerald-500/10 bg-white rounded-xl p-5 border border-amber-200 shadow-sm hover:border-amber-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">
              Cooperative Arbitrage Gain
            </span>
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-1">
            <span className="text-2xl font-black text-amber-600">
              +₹{(cards.totalArbitrageGain || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 text-xs font-medium text-amber-800 flex items-center">
            <ArrowUpRight className="w-4 h-4 text-emerald-600 mr-0.5" />
            <span>Over traditional local trader sales</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Commodity Rates & Top Mandis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Mandi Arbitrage Highlights */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>Top Mandi Arbitrage Corridors</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Real-time APMC
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Benchmark modal prices across North & Western trade junctions from Alwar hub
              </p>
            </div>
            <button
              onClick={() => onNavigate('mandis')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
            >
              <span>View All Mandis</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="py-3 px-4">Mandi Market</th>
                  <th className="py-3 px-4">Distance & Transit</th>
                  <th className="py-3 px-4">Avg Modal Price</th>
                  <th className="py-3 px-4">Yard Queue Delay</th>
                  <th className="py-3 px-4 text-right">Arbitrage Potential</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {topMandis.map((mandi) => (
                  <tr key={mandi.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{mandi.name}</div>
                      <div className="text-[11px] text-slate-400">{mandi.district}, {mandi.state}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{mandi.distance_km} km</div>
                      <div className="text-[11px] text-slate-500">~{Math.round((mandi.distance_km / 50) * 10) / 10} hrs transit</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{Math.round(mandi.avg_price).toLocaleString('en-IN')}/q
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        mandi.avg_queue_wait_hours >= 3.5 
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {mandi.avg_queue_wait_hours}h waiting
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {mandi.distance_km <= 30 ? (
                        <span className="text-slate-500 font-medium">Local Base Mandi</span>
                      ) : (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                          +15% to +35% Spread
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Recent Dispatches & Fast Actions */}
        <div className="space-y-6">
          {/* Quick Dispatch Status */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Recent Dispatches</h3>
              <button
                onClick={() => onNavigate('schedules')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                View Board
              </button>
            </div>

            {recentDispatches.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No active dispatches yet. Run the optimizer to schedule your first batch!
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {recentDispatches.map((dsp) => (
                  <div 
                    key={dsp.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition"
                  >
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="font-mono text-emerald-700 font-bold">{dsp.dispatch_code}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
                        {dsp.status}
                      </span>
                    </div>
                    <div className="mt-1 font-semibold text-slate-900 text-xs">
                      {dsp.crop_name} ({dsp.quantity_quintals}q) → {dsp.mandi_name}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/50">
                      <span>Vehicle: {dsp.vehicle_name.split('(')[0]}</span>
                      <span className="font-bold text-slate-900">₹{dsp.net_revenue.toLocaleString('en-IN')} net</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Core Decision Rules Card */}
          <div className="bg-emerald-900 text-white rounded-2xl p-5 shadow-sm">
            <h4 className="text-sm font-bold flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>MandiMitra Decision Guarantee</span>
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-emerald-100/90 leading-relaxed">
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>No Blind Long-Hauls:</strong> Only recommends distant mandis if net gain exceeds freight by at least ₹500/quintal.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Shelf-Life Protection:</strong> For perishables (e.g. Tomatoes), transit + queue time is hard-capped within remaining hours.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Full Fee Accounting:</strong> Accounts for APMC market fee, rural development cess, and labor unloading charges.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
