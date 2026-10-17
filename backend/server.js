const express = require('express');
const cors = require('cors');
const { db, initDatabase } = require('./database');
const {
  calculateBatchMandiRealization,
  runLogisticsOptimization
} = require('./optimizationEngine');
const {
  verifyPriceFreshness,
  syncLiveAgmarknetFeed
} = require('./agmarknetService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize database schema and initial realistic seeds
initDatabase();

// -----------------------------------------------------------------------------
// 1. DASHBOARD OVERVIEW SUMMARY
// -----------------------------------------------------------------------------
app.get('/api/dashboard-summary', (req, res) => {
  try {
    const coop = db.prepare('SELECT * FROM cooperative LIMIT 1').get();

    // Inventory metrics
    const inventoryStats = db.prepare(`
      SELECT 
        count(*) as total_batches,
        coalesce(sum(quantity_quintals), 0) as total_quintals,
        count(CASE WHEN status = 'active' THEN 1 END) as active_batches,
        count(CASE WHEN remaining_shelf_life_hours <= 48 AND status = 'active' THEN 1 END) as urgent_batches
      FROM inventory
    `).get();

    // Vehicles metrics
    const vehicleStats = db.prepare(`
      SELECT 
        count(*) as total_vehicles,
        count(CASE WHEN status = 'available' THEN 1 END) as available_vehicles,
        coalesce(sum(CASE WHEN status = 'available' THEN payload_capacity_quintals ELSE 0 END), 0) as available_capacity_quintals
      FROM vehicles
    `).get();

    // Dispatches metrics
    const dispatchStats = db.prepare(`
      SELECT 
        count(*) as total_dispatches,
        coalesce(sum(net_revenue), 0) as total_net_revenue,
        coalesce(sum(arbitrage_gain), 0) as total_arbitrage_gain,
        count(CASE WHEN status = 'scheduled' OR status = 'in_transit' THEN 1 END) as active_dispatches
      FROM dispatches
    `).get();

    // Top Mandis by average price arbitrage for Tomato & Onion
    const topMandis = db.prepare(`
      SELECT m.id, m.name, m.district, m.state, m.distance_km, m.avg_queue_wait_hours,
        avg(mp.modal_price) as avg_price,
        count(mp.id) as commodities_tracked
      FROM mandis m
      JOIN mandi_prices mp ON m.id = mp.mandi_id
      GROUP BY m.id
      ORDER BY avg_price DESC
      LIMIT 5
    `).all();

    // Recent activity / recent dispatches
    const recentDispatches = db.prepare(`
      SELECT * FROM dispatches ORDER BY id DESC LIMIT 5
    `).all();

    // Price Freshness Check
    const freshness = verifyPriceFreshness();

    res.json({
      success: true,
      cooperative: coop,
      summaryCards: {
        activeBatches: inventoryStats.active_batches,
        totalInventoryQuintals: inventoryStats.total_quintals,
        urgentBatches: inventoryStats.urgent_batches,
        availableVehicles: vehicleStats.available_vehicles,
        totalVehicles: vehicleStats.total_vehicles,
        availableCapacityQuintals: vehicleStats.available_capacity_quintals,
        totalNetRevenue: dispatchStats.total_net_revenue,
        totalArbitrageGain: dispatchStats.total_arbitrage_gain,
        activeDispatches: dispatchStats.active_dispatches,
        priceDataFreshness: freshness.verified ? 'Verified Fresh (< 2h)' : 'Updates Pending'
      },
      topMandis,
      recentDispatches,
      freshnessSummary: {
        freshQuotes: freshness.freshCount,
        staleQuotes: freshness.staleCount,
        total: freshness.totalQuotes
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard summary:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 2. COOPERATIVE PROFILE
// -----------------------------------------------------------------------------
app.get('/api/cooperative', (req, res) => {
  const coop = db.prepare('SELECT * FROM cooperative LIMIT 1').get();
  res.json({ success: true, data: coop });
});

app.put('/api/cooperative', (req, res) => {
  const { name, district, state, contact_person, phone, total_farmers, active_cluster } = req.body;
  const stmt = db.prepare(`
    UPDATE cooperative
    SET name = ?, district = ?, state = ?, contact_person = ?, phone = ?, total_farmers = ?, active_cluster = ?
    WHERE id = (SELECT id FROM cooperative LIMIT 1)
  `);
  stmt.run(name, district, state, contact_person, phone, total_farmers, active_cluster);
  res.json({ success: true, message: 'Cooperative profile updated' });
});

// -----------------------------------------------------------------------------
// 3. PRODUCE INVENTORY MANAGEMENT
// -----------------------------------------------------------------------------
app.get('/api/inventory', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM inventory ORDER BY created_at DESC').all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/inventory', (req, res) => {
  try {
    const {
      crop_name,
      variety,
      quantity_quintals,
      harvest_date,
      shelf_life_days,
      quality_grade,
      farm_location,
      farmer_name,
      notes
    } = req.body;

    // Generate batch code
    const count = db.prepare('SELECT count(*) as count FROM inventory').get().count + 1;
    const cropPrefix = crop_name.slice(0, 3).toUpperCase();
    const batch_code = `BAT-${new Date().getFullYear()}-${cropPrefix}-${String(count).padStart(2, '0')}`;

    // Compute remaining shelf-life hours
    const harvestTime = new Date(harvest_date).getTime();
    const totalShelfHours = (parseFloat(shelf_life_days) || 5) * 24;
    const elapsedHours = Math.max(0, (Date.now() - harvestTime) / 3600000);
    const remaining_shelf_life_hours = Math.max(0, Math.round(totalShelfHours - elapsedHours));

    const stmt = db.prepare(`
      INSERT INTO inventory (
        batch_code, crop_name, variety, quantity_quintals, harvest_date,
        shelf_life_days, remaining_shelf_life_hours, quality_grade,
        farm_location, farmer_name, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `);

    const result = stmt.run(
      batch_code, crop_name, variety || 'Standard', parseFloat(quantity_quintals),
      harvest_date, parseFloat(shelf_life_days), remaining_shelf_life_hours,
      quality_grade, farm_location, farmer_name, notes || ''
    );

    const inserted = db.prepare('SELECT * FROM inventory WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: inserted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/inventory/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      crop_name,
      variety,
      quantity_quintals,
      harvest_date,
      shelf_life_days,
      remaining_shelf_life_hours,
      quality_grade,
      farm_location,
      farmer_name,
      status,
      notes
    } = req.body;

    const stmt = db.prepare(`
      UPDATE inventory
      SET crop_name = ?, variety = ?, quantity_quintals = ?, harvest_date = ?,
          shelf_life_days = ?, remaining_shelf_life_hours = ?, quality_grade = ?,
          farm_location = ?, farmer_name = ?, status = ?, notes = ?
      WHERE id = ?
    `);

    stmt.run(
      crop_name, variety, parseFloat(quantity_quintals), harvest_date,
      parseFloat(shelf_life_days), parseFloat(remaining_shelf_life_hours),
      quality_grade, farm_location, farmer_name, status, notes, id
    );

    const updated = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/inventory/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM inventory WHERE id = ?').run(id);
    res.json({ success: true, message: 'Batch removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 4. VEHICLE AVAILABILITY & FLEET MANAGEMENT
// -----------------------------------------------------------------------------
app.get('/api/vehicles', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM vehicles ORDER BY payload_capacity_quintals ASC').all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/vehicles', (req, res) => {
  try {
    const {
      name,
      vehicle_number,
      type,
      payload_capacity_quintals,
      cost_per_km,
      avg_speed_kmh,
      driver_name,
      driver_phone,
      is_refrigerated,
      status,
      current_location
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO vehicles (
        name, vehicle_number, type, payload_capacity_quintals, cost_per_km,
        avg_speed_kmh, driver_name, driver_phone, is_refrigerated, status, current_location
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name, vehicle_number, type, parseFloat(payload_capacity_quintals),
      parseFloat(cost_per_km), parseFloat(avg_speed_kmh || 50),
      driver_name || '', driver_phone || '', is_refrigerated ? 1 : 0,
      status || 'available', current_location || 'Central Yard'
    );

    const inserted = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: inserted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/vehicles/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      vehicle_number,
      type,
      payload_capacity_quintals,
      cost_per_km,
      avg_speed_kmh,
      driver_name,
      driver_phone,
      is_refrigerated,
      status,
      current_location
    } = req.body;

    const stmt = db.prepare(`
      UPDATE vehicles
      SET name = ?, vehicle_number = ?, type = ?, payload_capacity_quintals = ?,
          cost_per_km = ?, avg_speed_kmh = ?, driver_name = ?, driver_phone = ?,
          is_refrigerated = ?, status = ?, current_location = ?
      WHERE id = ?
    `);

    stmt.run(
      name, vehicle_number, type, parseFloat(payload_capacity_quintals),
      parseFloat(cost_per_km), parseFloat(avg_speed_kmh || 50),
      driver_name, driver_phone, is_refrigerated ? 1 : 0, status, current_location, id
    );

    const updated = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/vehicles/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM vehicles WHERE id = ?').run(id);
    res.json({ success: true, message: 'Vehicle removed from fleet' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 5. MANDIS DIRECTORY & APMC PRICES
// -----------------------------------------------------------------------------
app.get('/api/mandis', (req, res) => {
  try {
    const mandis = db.prepare('SELECT * FROM mandis ORDER BY distance_km ASC').all();
    const prices = db.prepare('SELECT * FROM mandi_prices').all();

    // Map prices into mandi objects
    const mandisWithPrices = mandis.map(m => {
      const mPrices = prices.filter(p => p.mandi_id === m.id);
      return {
        ...m,
        prices: mPrices
      };
    });

    res.json({ success: true, data: mandisWithPrices });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/mandis', (req, res) => {
  try {
    const {
      name,
      short_code,
      district,
      state,
      distance_km,
      avg_transit_hours,
      market_fee_percent,
      cess_percent,
      unloading_charge_per_quintal,
      weighment_charge_per_quintal,
      avg_queue_wait_hours,
      agmarknet_id,
      contact_person,
      phone,
      facilities
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO mandis (
        name, short_code, district, state, distance_km, avg_transit_hours,
        market_fee_percent, cess_percent, unloading_charge_per_quintal,
        weighment_charge_per_quintal, avg_queue_wait_hours, agmarknet_id,
        contact_person, phone, facilities
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name, short_code || name.slice(0, 3).toUpperCase(), district, state,
      parseFloat(distance_km), parseFloat(avg_transit_hours || (distance_km / 45)),
      parseFloat(market_fee_percent || 1.5), parseFloat(cess_percent || 0.5),
      parseFloat(unloading_charge_per_quintal || 10), parseFloat(weighment_charge_per_quintal || 3.5),
      parseFloat(avg_queue_wait_hours || 2.0), agmarknet_id || '',
      contact_person || '', phone || '', facilities || 'Standard APMC Yard'
    );

    const inserted = db.prepare('SELECT * FROM mandis WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: inserted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/mandis/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      short_code,
      district,
      state,
      distance_km,
      avg_transit_hours,
      market_fee_percent,
      cess_percent,
      unloading_charge_per_quintal,
      weighment_charge_per_quintal,
      avg_queue_wait_hours,
      agmarknet_id,
      contact_person,
      phone,
      facilities
    } = req.body;

    const stmt = db.prepare(`
      UPDATE mandis
      SET name = ?, short_code = ?, district = ?, state = ?, distance_km = ?,
          avg_transit_hours = ?, market_fee_percent = ?, cess_percent = ?,
          unloading_charge_per_quintal = ?, weighment_charge_per_quintal = ?,
          avg_queue_wait_hours = ?, agmarknet_id = ?, contact_person = ?,
          phone = ?, facilities = ?
      WHERE id = ?
    `);

    stmt.run(
      name, short_code, district, state, parseFloat(distance_km),
      parseFloat(avg_transit_hours), parseFloat(market_fee_percent),
      parseFloat(cess_percent), parseFloat(unloading_charge_per_quintal),
      parseFloat(weighment_charge_per_quintal), parseFloat(avg_queue_wait_hours),
      agmarknet_id, contact_person, phone, facilities, id
    );

    const updated = db.prepare('SELECT * FROM mandis WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update specific mandi crop price
app.put('/api/mandi-prices/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { modal_price, min_price, max_price, arrivals_tonnes, trend } = req.body;

    const stmt = db.prepare(`
      UPDATE mandi_prices
      SET modal_price = ?, min_price = ?, max_price = ?,
          arrivals_tonnes = ?, trend = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      parseFloat(modal_price),
      parseFloat(min_price || modal_price * 0.9),
      parseFloat(max_price || modal_price * 1.1),
      parseFloat(arrivals_tonnes || 50),
      trend || 'stable',
      id
    );

    const updated = db.prepare('SELECT * FROM mandi_prices WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 6. CROPS MASTER
// -----------------------------------------------------------------------------
app.get('/api/crops', (req, res) => {
  try {
    const crops = db.prepare('SELECT * FROM crops').all();
    res.json({ success: true, data: crops });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 7. AGMARKNET SYNC & VERIFICATION
// -----------------------------------------------------------------------------
app.post('/api/mandi-prices/sync', (req, res) => {
  try {
    const syncResult = syncLiveAgmarknetFeed();
    res.json(syncResult);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/verify-prices', (req, res) => {
  try {
    const report = verifyPriceFreshness();
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 8. INTERACTIVE FARMER PROFIT CALCULATOR & ARBITRAGE COMPARISON
// -----------------------------------------------------------------------------
app.post('/api/calculate-arbitrage', (req, res) => {
  try {
    const {
      crop_name,
      quantity_quintals,
      quality_grade,
      vehicle_id,
      mandi_a_id,
      mandi_b_id,
      remaining_shelf_life_hours
    } = req.body;

    const qty = parseFloat(quantity_quintals) || 50;

    // Fetch crop
    const crop = db.prepare('SELECT * FROM crops WHERE name = ?').get(crop_name) || {
      name: crop_name,
      degradation_rate_per_hour: 0.004,
      default_shelf_life_days: 5
    };

    // Fetch vehicle
    let vehicle = null;
    if (vehicle_id) {
      vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id);
    }
    if (!vehicle) {
      // Pick suitable vehicle based on quantity
      vehicle = db.prepare(`
        SELECT * FROM vehicles 
        WHERE payload_capacity_quintals >= ? 
        ORDER BY payload_capacity_quintals ASC 
        LIMIT 1
      `).get(qty) || db.prepare('SELECT * FROM vehicles LIMIT 1').get();
    }

    // Fetch mandis
    const mandiA = db.prepare('SELECT * FROM mandis WHERE id = ?').get(mandi_a_id || 1); // default Azadpur
    const mandiB = db.prepare('SELECT * FROM mandis WHERE id = ?').get(mandi_b_id || 3); // default Alwar Local

    // Fetch prices for crop at both mandis
    const priceA = db.prepare('SELECT * FROM mandi_prices WHERE mandi_id = ? AND crop_name = ?').get(mandiA.id, crop.name);
    const priceB = db.prepare('SELECT * FROM mandi_prices WHERE mandi_id = ? AND crop_name = ?').get(mandiB.id, crop.name);

    if (!priceA || !priceB) {
      return res.status(400).json({
        success: false,
        error: `Price data missing for ${crop.name} in selected mandis.`
      });
    }

    // Calculate realization for Mandi A
    const resultA = calculateBatchMandiRealization({
      crop,
      quantityQuintals: qty,
      qualityGrade: quality_grade || 'Grade A (Export/Premium)',
      mandi: mandiA,
      mandiPrice: priceA.modal_price,
      vehicle,
      remainingShelfLifeHours: remaining_shelf_life_hours ? parseFloat(remaining_shelf_life_hours) : null,
      localBenchmarkMandi: mandiB,
      localBenchmarkPrice: priceB.modal_price
    });

    // Calculate realization for Mandi B
    const resultB = calculateBatchMandiRealization({
      crop,
      quantityQuintals: qty,
      qualityGrade: quality_grade || 'Grade A (Export/Premium)',
      mandi: mandiB,
      mandiPrice: priceB.modal_price,
      vehicle,
      remainingShelfLifeHours: remaining_shelf_life_hours ? parseFloat(remaining_shelf_life_hours) : null,
      localBenchmarkMandi: mandiB,
      localBenchmarkPrice: priceB.modal_price
    });

    // Also calculate for all other mandis to show comprehensive arbitrage leaderboard
    const allMandis = db.prepare('SELECT * FROM mandis').all();
    const allPrices = db.prepare('SELECT * FROM mandi_prices WHERE crop_name = ?').all(crop.name);
    const priceByMandiId = {};
    allPrices.forEach(p => { priceByMandiId[p.mandi_id] = p.modal_price; });

    const allMandisComparison = allMandis
      .filter(m => priceByMandiId[m.id])
      .map(m => {
        return calculateBatchMandiRealization({
          crop,
          quantityQuintals: qty,
          qualityGrade: quality_grade || 'Grade A (Export/Premium)',
          mandi: m,
          mandiPrice: priceByMandiId[m.id],
          vehicle,
          remainingShelfLifeHours: remaining_shelf_life_hours ? parseFloat(remaining_shelf_life_hours) : null,
          localBenchmarkMandi: mandiB,
          localBenchmarkPrice: priceB.modal_price
        });
      })
      .sort((a, b) => b.riskAdjustedNetRevenue - a.riskAdjustedNetRevenue);

    // Head-to-Head delta
    const profitDelta = resultA.riskAdjustedNetRevenue - resultB.riskAdjustedNetRevenue;
    const profitDeltaPct = resultB.riskAdjustedNetRevenue > 0
      ? Math.round((profitDelta / resultB.riskAdjustedNetRevenue) * 1000) / 10
      : 0;

    res.json({
      success: true,
      crop,
      vehicle,
      mandiA: resultA,
      mandiB: resultB,
      comparison: {
        winner: profitDelta >= 0 ? mandiA.name : mandiB.name,
        profitDelta: Math.abs(profitDelta),
        profitDeltaPct: Math.abs(profitDeltaPct),
        isPositiveArbitrage: profitDelta > 0,
        extraPerQuintal: Math.round((Math.abs(profitDelta) / qty) * 100) / 100,
        summaryText: profitDelta >= 0
          ? `Selling at ${mandiA.name} realizes ₹${Math.abs(profitDelta).toLocaleString('en-IN')} (+${profitDeltaPct}%) MORE net profit than ${mandiB.name} even after factoring ${mandiA.distance_km}km freight, fees, and perishability risks.`
          : `Selling at ${mandiB.name} is MORE profitable by ₹${Math.abs(profitDelta).toLocaleString('en-IN')} due to high freight and waiting risk at ${mandiA.name}.`
      },
      leaderboard: allMandisComparison
    });
  } catch (err) {
    console.error('Error calculating arbitrage:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 9. LOGISTICS OPTIMIZATION & FLEET ALLOCATION ENGINE
// -----------------------------------------------------------------------------
app.post('/api/optimize-logistics', (req, res) => {
  try {
    const activeBatches = db.prepare("SELECT * FROM inventory WHERE status = 'active'").all();
    const mandis = db.prepare('SELECT * FROM mandis').all();
    const vehicles = db.prepare('SELECT * FROM vehicles').all();
    const crops = db.prepare('SELECT * FROM crops').all();
    const prices = db.prepare('SELECT * FROM mandi_prices').all();

    if (activeBatches.length === 0) {
      return res.json({
        success: true,
        message: 'No active inventory batches waiting for allocation.',
        summary: { totalAllocatedBatches: 0 },
        allocations: []
      });
    }

    const mandiPricesMap = {};
    prices.forEach(p => {
      mandiPricesMap[`${p.mandi_id}_${p.crop_name}`] = p.modal_price;
    });

    const cropsMap = {};
    crops.forEach(c => {
      cropsMap[c.name] = c;
    });

    const optimizationPlan = runLogisticsOptimization({
      inventoryBatches: activeBatches,
      mandis,
      mandiPricesMap,
      vehicles,
      cropsMap,
      localMandiId: 3 // Alwar Base APMC
    });

    res.json(optimizationPlan);
  } catch (err) {
    console.error('Error in logistics optimization engine:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 10. DISPATCH SCHEDULES & GENERATION
// -----------------------------------------------------------------------------
app.get('/api/schedules', (req, res) => {
  try {
    const schedules = db.prepare(`
      SELECT d.*, i.variety, i.quality_grade, i.farm_location, i.farmer_name,
             v.vehicle_number, v.type as vehicle_type, v.driver_name, v.driver_phone,
             m.distance_km, m.state as mandi_state
      FROM dispatches d
      LEFT JOIN inventory i ON d.batch_id = i.id
      LEFT JOIN vehicles v ON d.vehicle_id = v.id
      LEFT JOIN mandis m ON d.mandi_id = m.id
      ORDER BY d.created_at DESC
    `).all();

    res.json({ success: true, data: schedules });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Commit an optimization plan into persistent dispatch schedules
app.post('/api/schedules/commit-plan', (req, res) => {
  try {
    const { allocations } = req.body;
    if (!allocations || !Array.isArray(allocations) || allocations.length === 0) {
      return res.status(400).json({ success: false, error: 'No allocations provided to commit' });
    }

    const insertDispatch = db.prepare(`
      INSERT INTO dispatches (
        dispatch_code, batch_id, batch_code, mandi_id, mandi_name,
        vehicle_id, vehicle_name, crop_name, quantity_quintals, modal_price,
        gross_revenue, transport_cost, mandi_fees, unloading_cost,
        spoilage_risk_loss, net_revenue, local_benchmark_net, arbitrage_gain,
        arbitrage_gain_pct, departure_time, estimated_arrival_time, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)
    `);

    const updateInventory = db.prepare("UPDATE inventory SET status = 'allocated' WHERE id = ?");
    const updateVehicle = db.prepare("UPDATE vehicles SET status = 'dispatched' WHERE id = ?");

    const createdSchedules = [];

    db.transaction(() => {
      allocations.forEach((alloc, index) => {
        const count = db.prepare('SELECT count(*) as count FROM dispatches').get().count + 1 + index;
        const dispatchCode = `DSP-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

        insertDispatch.run(
          dispatchCode,
          alloc.batchId,
          alloc.batchCode,
          alloc.assignedMandi.id,
          alloc.assignedMandi.name,
          alloc.assignedVehicle.id,
          alloc.assignedVehicle.name,
          alloc.cropName,
          alloc.quantityQuintals,
          alloc.financials.mandiPrice,
          alloc.financials.grossRevenue,
          alloc.financials.transportCost,
          alloc.financials.mandiFees,
          alloc.financials.unloadingCost,
          alloc.financials.spoilageRiskLoss,
          alloc.financials.riskAdjustedNetRevenue,
          alloc.financials.localBenchmarkNetRevenue,
          alloc.financials.arbitrageGain,
          alloc.financials.arbitrageGainPct,
          alloc.transitDetails.suggestedDeparture,
          alloc.transitDetails.estimatedArrival,
          alloc.rationale || 'Auto-generated by MandiMitra Arbitrage Engine'
        );

        updateInventory.run(alloc.batchId);
        updateVehicle.run(alloc.assignedVehicle.id);

        createdSchedules.push(dispatchCode);
      });
    })();

    res.json({
      success: true,
      message: `Successfully scheduled ${createdSchedules.length} dispatch orders.`,
      dispatches: createdSchedules
    });
  } catch (err) {
    console.error('Error committing dispatch plan:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update dispatch status
app.put('/api/schedules/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'scheduled', 'in_transit', 'delivered', 'cancelled'

    db.prepare('UPDATE dispatches SET status = ? WHERE id = ?').run(status, id);

    const dispatch = db.prepare('SELECT * FROM dispatches WHERE id = ?').get(id);

    // If delivered or cancelled, release vehicle
    if (status === 'delivered' || status === 'cancelled') {
      db.prepare("UPDATE vehicles SET status = 'available' WHERE id = ?").run(dispatch.vehicle_id);
    }
    if (status === 'delivered') {
      db.prepare("UPDATE inventory SET status = 'sold' WHERE id = ?").run(dispatch.batch_id);
    } else if (status === 'cancelled') {
      db.prepare("UPDATE inventory SET status = 'active' WHERE id = ?").run(dispatch.batch_id);
    }

    res.json({ success: true, data: dispatch });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete dispatch
app.delete('/api/schedules/:id', (req, res) => {
  try {
    const { id } = req.params;
    const dispatch = db.prepare('SELECT * FROM dispatches WHERE id = ?').get(id);
    if (dispatch) {
      db.prepare("UPDATE vehicles SET status = 'available' WHERE id = ?").run(dispatch.vehicle_id);
      db.prepare("UPDATE inventory SET status = 'active' WHERE id = ?").run(dispatch.batch_id);
      db.prepare('DELETE FROM dispatches WHERE id = ?').run(id);
    }
    res.json({ success: true, message: 'Dispatch schedule deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 11. DEMO RESET ENDPOINT
// -----------------------------------------------------------------------------
app.post('/api/reset-seed', (req, res) => {
  try {
    db.prepare('DELETE FROM dispatches').run();
    db.prepare('DELETE FROM inventory').run();
    db.prepare('DELETE FROM vehicles').run();
    db.prepare('DELETE FROM mandi_prices').run();
    db.prepare('DELETE FROM mandis').run();
    db.prepare('DELETE FROM crops').run();
    db.prepare('DELETE FROM cooperative').run();

    const { initDatabase } = require('./database');
    initDatabase();

    res.json({ success: true, message: 'Cooperative and market datasets reset to pristine state' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 12. STATIC FRONTEND SERVING (Production Mode)
// -----------------------------------------------------------------------------
const path = require('path');
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));

// Fallback all non-API GET requests to index.html for SPA routing (Express 5 compatible)
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    return next();
  }
  const indexFile = path.join(distPath, 'index.html');
  res.sendFile(indexFile, (err) => {
    if (err) {
      res.status(200).send('MandiMitra API is running. Vite frontend available on port 5173 or build dist.');
    }
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🌾 MandiMitra Backend Server running at http://localhost:${PORT}`);
});

