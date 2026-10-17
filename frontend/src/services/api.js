/**
 * MandiMitra Frontend API Service
 */

const API_BASE = '/api';

export async function fetchDashboardSummary() {
  const res = await fetch(`${API_BASE}/dashboard-summary`);
  return res.json();
}

export async function fetchCooperative() {
  const res = await fetch(`${API_BASE}/cooperative`);
  return res.json();
}

export async function updateCooperative(data) {
  const res = await fetch(`${API_BASE}/cooperative`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function fetchInventory() {
  const res = await fetch(`${API_BASE}/inventory`);
  return res.json();
}

export async function createInventoryBatch(batchData) {
  const res = await fetch(`${API_BASE}/inventory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batchData)
  });
  return res.json();
}

export async function updateInventoryBatch(id, batchData) {
  const res = await fetch(`${API_BASE}/inventory/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batchData)
  });
  return res.json();
}

export async function deleteInventoryBatch(id) {
  const res = await fetch(`${API_BASE}/inventory/${id}`, {
    method: 'DELETE'
  });
  return res.json();
}

export async function fetchVehicles() {
  const res = await fetch(`${API_BASE}/vehicles`);
  return res.json();
}

export async function createVehicle(vehicleData) {
  const res = await fetch(`${API_BASE}/vehicles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vehicleData)
  });
  return res.json();
}

export async function updateVehicle(id, vehicleData) {
  const res = await fetch(`${API_BASE}/vehicles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vehicleData)
  });
  return res.json();
}

export async function deleteVehicle(id) {
  const res = await fetch(`${API_BASE}/vehicles/${id}`, {
    method: 'DELETE'
  });
  return res.json();
}

export async function fetchMandis() {
  const res = await fetch(`${API_BASE}/mandis`);
  return res.json();
}

export async function createMandi(mandiData) {
  const res = await fetch(`${API_BASE}/mandis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mandiData)
  });
  return res.json();
}

export async function updateMandiPrice(priceId, priceData) {
  const res = await fetch(`${API_BASE}/mandi-prices/${priceId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(priceData)
  });
  return res.json();
}

export async function fetchCrops() {
  const res = await fetch(`${API_BASE}/crops`);
  return res.json();
}

export async function calculateArbitrage(params) {
  const res = await fetch(`${API_BASE}/calculate-arbitrage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return res.json();
}

export async function optimizeLogistics() {
  const res = await fetch(`${API_BASE}/optimize-logistics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
}

export async function fetchSchedules() {
  const res = await fetch(`${API_BASE}/schedules`);
  return res.json();
}

export async function commitOptimizationPlan(allocations) {
  const res = await fetch(`${API_BASE}/schedules/commit-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ allocations })
  });
  return res.json();
}

export async function updateScheduleStatus(id, status) {
  const res = await fetch(`${API_BASE}/schedules/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return res.json();
}

export async function deleteSchedule(id) {
  const res = await fetch(`${API_BASE}/schedules/${id}`, {
    method: 'DELETE'
  });
  return res.json();
}

export async function syncAgmarknetPrices() {
  const res = await fetch(`${API_BASE}/mandi-prices/sync`, {
    method: 'POST'
  });
  return res.json();
}

export async function fetchPriceVerification() {
  const res = await fetch(`${API_BASE}/verify-prices`);
  return res.json();
}

export async function resetDatabaseSeed() {
  const res = await fetch(`${API_BASE}/reset-seed`, {
    method: 'POST'
  });
  return res.json();
}
