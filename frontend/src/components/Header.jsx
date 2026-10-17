import React, { useState } from 'react';
import { 
  Sprout, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Truck, 
  TrendingUp, 
  Building2, 
  Calendar,
  Layers,
  Calculator,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { syncAgmarknetPrices, resetDatabaseSeed } from '../services/api';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  cooperative, 
  onRefreshData,
  priceFreshness 
}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  const handleSyncPrices = async () => {
    setIsSyncing(true);
    setSyncStatus('Connecting to AGMARKNET & E-NAM APMC gateways...');
    try {
      const res = await syncAgmarknetPrices();
      if (res.success) {
        setSyncStatus(`Updated ${res.updatesCount} live commodity rates!`);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      setSyncStatus('Sync error. Try again.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset all cooperative batches, fleet status, and market rates to pristine demo state?')) return;
    setIsResetting(true);
    try {
      await resetDatabaseSeed();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert('Error resetting demo: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'calculator', label: 'Profit Calculator', icon: Calculator },
    { id: 'optimizer', label: 'Logistics Optimizer', icon: Truck },
    { id: 'schedules', label: 'Dispatch Schedules', icon: Calendar },
    { id: 'inventory', label: 'Produce Inventory', icon: Layers },
    { id: 'fleet', label: 'Fleet & Vehicles', icon: Truck },
    { id: 'mandis', label: 'Mandi Directory', icon: Building2 },
    { id: 'verification', label: 'Price Verification', icon: ShieldCheck },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Mandi<span className="text-emerald-600">Mitra</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                  FPO Edition
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block truncate max-w-sm">
                Agricultural Price Arbitrage & Logistics Agent for Farmer Cooperatives
              </p>
            </div>
          </div>

          {/* FPO Info & Actions */}
          <div className="flex items-center space-x-3">
            {cooperative && (
              <div className="hidden md:flex flex-col text-right pr-3 border-r border-slate-200">
                <span className="text-xs font-semibold text-slate-800 truncate max-w-xs">
                  {cooperative.name}
                </span>
                <span className="text-[11px] text-slate-500">
                  {cooperative.district}, {cooperative.state} • {cooperative.total_farmers || 420} Farmers
                </span>
              </div>
            )}

            {/* Price Freshness Pill */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>AGMARKNET Live</span>
            </div>

            {/* Sync Rates Button */}
            <button
              onClick={handleSyncPrices}
              disabled={isSyncing}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition shadow-sm disabled:opacity-50"
              title="Fetch fresh APMC rates from government mandi gateways"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Live Prices'}</span>
            </button>

            {/* Reset Demo State Button */}
            <button
              onClick={handleResetData}
              disabled={isResetting}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              title="Reset Demo Data"
            >
              <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Sync Toast Notification */}
        {syncStatus && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs py-1.5 px-3 rounded-md mb-2 flex items-center justify-between animate-fadeIn">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{syncStatus}</span>
            </span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-50/80 border-t border-slate-200 px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 overflow-x-auto scrollbar-none py-1.5 max-w-7xl mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
