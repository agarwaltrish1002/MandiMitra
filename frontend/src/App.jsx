import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ArbitrageCalculator from './components/ArbitrageCalculator';
import LogisticsOptimizer from './components/LogisticsOptimizer';
import DispatchSchedules from './components/DispatchSchedules';
import ProduceInventory from './components/ProduceInventory';
import FleetManagement from './components/FleetManagement';
import MandiDirectory from './components/MandiDirectory';
import PriceVerification from './components/PriceVerification';

import {
  fetchDashboardSummary,
  fetchCooperative,
  fetchInventory,
  fetchVehicles,
  fetchMandis,
  fetchCrops,
  fetchSchedules
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Core application state
  const [summary, setSummary] = useState(null);
  const [cooperative, setCooperative] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [mandis, setMandis] = useState([]);
  const [crops, setCrops] = useState([]);
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [
        summaryRes,
        coopRes,
        invRes,
        vehRes,
        mandisRes,
        cropsRes,
        schedRes
      ] = await Promise.all([
        fetchDashboardSummary(),
        fetchCooperative(),
        fetchInventory(),
        fetchVehicles(),
        fetchMandis(),
        fetchCrops(),
        fetchSchedules()
      ]);

      if (summaryRes.success) setSummary(summaryRes);
      if (coopRes.success) setCooperative(coopRes.data);
      if (invRes.success) setInventory(invRes.data);
      if (vehRes.success) setVehicles(vehRes.data);
      if (mandisRes.success) setMandis(mandisRes.data);
      if (cropsRes.success) setCrops(cropsRes.data);
      if (schedRes.success) setSchedules(schedRes.data);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cooperative={cooperative}
        onRefreshData={loadAllData}
        priceFreshness={summary?.summaryCards?.priceDataFreshness}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-600">
              Initializing MandiMitra Arbitrage Engine & Connecting APMC Mandis...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                summary={summary}
                onNavigate={setActiveTab}
                mandis={mandis}
                crops={crops}
              />
            )}

            {activeTab === 'calculator' && (
              <ArbitrageCalculator
                crops={crops}
                mandis={mandis}
                vehicles={vehicles}
              />
            )}

            {activeTab === 'optimizer' && (
              <LogisticsOptimizer
                onNavigate={setActiveTab}
                onRefreshData={loadAllData}
              />
            )}

            {activeTab === 'schedules' && (
              <DispatchSchedules
                schedules={schedules}
                onRefreshData={loadAllData}
                cooperative={cooperative}
              />
            )}

            {activeTab === 'inventory' && (
              <ProduceInventory
                inventory={inventory}
                crops={crops}
                onRefreshData={loadAllData}
              />
            )}

            {activeTab === 'fleet' && (
              <FleetManagement
                vehicles={vehicles}
                onRefreshData={loadAllData}
              />
            )}

            {activeTab === 'mandis' && (
              <MandiDirectory
                mandis={mandis}
                onRefreshData={loadAllData}
              />
            )}

            {activeTab === 'verification' && (
              <PriceVerification
                onRefreshData={loadAllData}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">MandiMitra</span>
            <span>•</span>
            <span>Agricultural APMC Mandi Price Arbitrage & Logistics Agent</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>Data Grounded in AGMARKNET & E-NAM Gateways</span>
            <span>•</span>
            <span>Empowering 400+ Indian Farmer Cooperatives</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
