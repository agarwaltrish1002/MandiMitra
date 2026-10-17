const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'mandimitra.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for better concurrency
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cooperative (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      district TEXT NOT NULL,
      state TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      total_farmers INTEGER DEFAULT 340,
      active_cluster TEXT DEFAULT 'Alwar-Kotputli Corridor'
    );

    CREATE TABLE IF NOT EXISTS crops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      hindi_name TEXT,
      category TEXT NOT NULL,
      default_shelf_life_days REAL NOT NULL,
      degradation_rate_per_hour REAL NOT NULL, -- fractional loss of quality/value per hour in unconditioned transit
      base_unit TEXT DEFAULT 'Quintal',
      icon TEXT
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_code TEXT UNIQUE NOT NULL,
      crop_name TEXT NOT NULL,
      variety TEXT,
      quantity_quintals REAL NOT NULL,
      harvest_date TEXT NOT NULL,
      shelf_life_days REAL NOT NULL,
      remaining_shelf_life_hours REAL NOT NULL,
      quality_grade TEXT NOT NULL, -- 'Grade A (Export/Premium)', 'Grade B (Standard)', 'Grade C (Fair)'
      farm_location TEXT NOT NULL,
      farmer_name TEXT NOT NULL,
      status TEXT DEFAULT 'active', -- 'active', 'allocated', 'dispatched', 'sold'
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      vehicle_number TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL, -- 'Mini Truck (Tata Ace)', 'Maxi Pickup (Bolero)', '14-ft Truck (Eicher)', 'Tractor Trolley', 'Reefer Cold Van'
      payload_capacity_quintals REAL NOT NULL,
      cost_per_km REAL NOT NULL,
      avg_speed_kmh REAL NOT NULL,
      driver_name TEXT,
      driver_phone TEXT,
      is_refrigerated INTEGER DEFAULT 0,
      status TEXT DEFAULT 'available', -- 'available', 'dispatched', 'maintenance'
      current_location TEXT DEFAULT 'Central Cooperative Yard'
    );

    CREATE TABLE IF NOT EXISTS mandis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      short_code TEXT,
      district TEXT NOT NULL,
      state TEXT NOT NULL,
      distance_km REAL NOT NULL,
      avg_transit_hours REAL NOT NULL,
      market_fee_percent REAL NOT NULL, -- APMC mandi tax %
      cess_percent REAL NOT NULL, -- Rural development / user cess %
      unloading_charge_per_quintal REAL NOT NULL, -- ₹ per quintal
      weighment_charge_per_quintal REAL NOT NULL, -- ₹ per quintal
      avg_queue_wait_hours REAL NOT NULL, -- Average truck waiting time in mandi yard
      agmarknet_id TEXT,
      contact_person TEXT,
      phone TEXT,
      facilities TEXT,
      last_price_sync DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mandi_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mandi_id INTEGER NOT NULL,
      crop_name TEXT NOT NULL,
      modal_price REAL NOT NULL, -- ₹/Quintal benchmark modal price
      min_price REAL NOT NULL,
      max_price REAL NOT NULL,
      arrivals_tonnes REAL DEFAULT 50,
      trend TEXT DEFAULT 'stable', -- 'up', 'down', 'stable'
      source TEXT DEFAULT 'AGMARKNET APMC Live',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mandi_id) REFERENCES mandis (id) ON DELETE CASCADE,
      UNIQUE(mandi_id, crop_name)
    );

    CREATE TABLE IF NOT EXISTS dispatches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dispatch_code TEXT UNIQUE NOT NULL,
      batch_id INTEGER,
      batch_code TEXT,
      mandi_id INTEGER NOT NULL,
      mandi_name TEXT NOT NULL,
      vehicle_id INTEGER NOT NULL,
      vehicle_name TEXT NOT NULL,
      crop_name TEXT NOT NULL,
      quantity_quintals REAL NOT NULL,
      modal_price REAL NOT NULL,
      gross_revenue REAL NOT NULL,
      transport_cost REAL NOT NULL,
      mandi_fees REAL NOT NULL,
      unloading_cost REAL NOT NULL,
      spoilage_risk_loss REAL NOT NULL,
      net_revenue REAL NOT NULL,
      local_benchmark_net REAL DEFAULT 0,
      arbitrage_gain REAL DEFAULT 0,
      arbitrage_gain_pct REAL DEFAULT 0,
      departure_time TEXT NOT NULL,
      estimated_arrival_time TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_transit', 'delivered', 'cancelled'
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (batch_id) REFERENCES inventory(id) ON DELETE SET NULL,
      FOREIGN KEY (mandi_id) REFERENCES mandis(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );
  `);

  seedDefaultData();
}

function seedDefaultData() {
  const coopCount = db.prepare('SELECT count(*) as count FROM cooperative').get();
  if (coopCount.count > 0) return; // already seeded

  console.log('Seeding initial Indian Agricultural APMC Mandi, crop, vehicle, and inventory datasets...');

  // 1. Cooperative Profile
  db.prepare(`
    INSERT INTO cooperative (name, district, state, contact_person, phone, total_farmers, active_cluster)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Kisan Samriddhi Farmer Producer Company (FPO)',
    'Alwar',
    'Rajasthan',
    'Ramesh Patel (FPO Chairman)',
    '+91 98290 12345',
    420,
    'Alwar - Behror - Kotputli Vegetable & Grain Belt'
  );

  // 2. Master Crops
  const cropList = [
    {
      name: 'Tomato (Tamatar)',
      hindi_name: 'टमाटर',
      category: 'Vegetables',
      shelf_life: 4.0, // days
      degradation_per_hour: 0.008, // ~0.8% loss per unconditioned transit hour + queue
      icon: '🍅'
    },
    {
      name: 'Onion (Pyaaz)',
      hindi_name: 'प्याज',
      category: 'Vegetables',
      shelf_life: 60.0,
      degradation_per_hour: 0.0004,
      icon: '🧅'
    },
    {
      name: 'Potato (Aloo)',
      hindi_name: 'आलू',
      category: 'Tubers',
      shelf_life: 90.0,
      degradation_per_hour: 0.0002,
      icon: '🥔'
    },
    {
      name: 'Green Peas (Matar)',
      hindi_name: 'हरी मटर',
      category: 'Vegetables',
      shelf_life: 5.0,
      degradation_per_hour: 0.006,
      icon: '🫛'
    },
    {
      name: 'Cauliflower (Gobhi)',
      hindi_name: 'फूलगोभी',
      category: 'Vegetables',
      shelf_life: 6.0,
      degradation_per_hour: 0.005,
      icon: '🥦'
    },
    {
      name: 'Wheat (Gehun)',
      hindi_name: 'गेहूं',
      category: 'Grains',
      shelf_life: 365.0,
      degradation_per_hour: 0.00001,
      icon: '🌾'
    },
    {
      name: 'Mustard (Sarson)',
      hindi_name: 'सरसों',
      category: 'Oilseeds',
      shelf_life: 365.0,
      degradation_per_hour: 0.00001,
      icon: '🌱'
    }
  ];

  const insertCrop = db.prepare(`
    INSERT INTO crops (name, hindi_name, category, default_shelf_life_days, degradation_rate_per_hour, icon)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  cropList.forEach(c => insertCrop.run(c.name, c.hindi_name, c.category, c.shelf_life, c.degradation_per_hour, c.icon));

  // 3. Realistic Mandis across North & Western corridors from Alwar / Kotputli hub
  const mandiList = [
    {
      name: 'Azadpur Mandi (Delhi)',
      short_code: 'AZD-DEL',
      district: 'North Delhi',
      state: 'Delhi (NCT)',
      distance_km: 155,
      avg_transit_hours: 4.0,
      market_fee_percent: 1.0,
      cess_percent: 1.0,
      unloading_charge_per_quintal: 12.0,
      weighment_charge_per_quintal: 4.0,
      avg_queue_wait_hours: 4.5, // High congestion at Asia's largest terminal market
      agmarknet_id: 'DL-AZD-001',
      contact: 'Sh. Rajeshwar Tyagi',
      phone: '+91 11 2769 1100',
      facilities: 'Cold Storage, Electronic Weighbridge, 24x7 E-NAM Auction'
    },
    {
      name: 'Jaipur (Muhana Terminal Mandi)',
      short_code: 'JPR-MUH',
      district: 'Jaipur',
      state: 'Rajasthan',
      distance_km: 140,
      avg_transit_hours: 3.2,
      market_fee_percent: 1.6,
      cess_percent: 0.5,
      unloading_charge_per_quintal: 10.0,
      weighment_charge_per_quintal: 3.5,
      avg_queue_wait_hours: 2.5,
      agmarknet_id: 'RJ-JPR-002',
      contact: 'Mahesh Sharma (Secretary)',
      phone: '+91 141 273 4567',
      facilities: 'Ripening Chambers, Farmer Rest House, Covered Sheds'
    },
    {
      name: 'Alwar Krishi Upaj Mandi (Local Base APMC)',
      short_code: 'ALW-LOC',
      district: 'Alwar',
      state: 'Rajasthan',
      distance_km: 25,
      avg_transit_hours: 0.8,
      market_fee_percent: 1.6,
      cess_percent: 0.4,
      unloading_charge_per_quintal: 8.0,
      weighment_charge_per_quintal: 3.0,
      avg_queue_wait_hours: 1.0, // Low queue, local hub
      agmarknet_id: 'RJ-ALW-001',
      contact: 'Dinesh Yadav',
      phone: '+91 144 233 8900',
      facilities: 'Direct Auction Platform, Primary Grading Unit'
    },
    {
      name: 'Agra (Sikandra Mandi)',
      short_code: 'AGR-SIK',
      district: 'Agra',
      state: 'Uttar Pradesh',
      distance_km: 175,
      avg_transit_hours: 4.5,
      market_fee_percent: 2.0,
      cess_percent: 0.5,
      unloading_charge_per_quintal: 11.0,
      weighment_charge_per_quintal: 4.0,
      avg_queue_wait_hours: 3.0,
      agmarknet_id: 'UP-AGR-004',
      contact: 'Om Prakash Baghel',
      phone: '+91 562 260 1245',
      facilities: 'Massive Potato Cold Chain, Inter-State Transhipment'
    },
    {
      name: 'Mathura Fruit & Vegetable Mandi',
      short_code: 'MTH-APMC',
      district: 'Mathura',
      state: 'Uttar Pradesh',
      distance_km: 115,
      avg_transit_hours: 2.8,
      market_fee_percent: 2.0,
      cess_percent: 0.5,
      unloading_charge_per_quintal: 9.5,
      weighment_charge_per_quintal: 3.5,
      avg_queue_wait_hours: 2.0,
      agmarknet_id: 'UP-MTH-002',
      contact: 'Satish Chandra',
      phone: '+91 565 240 7890',
      facilities: 'Wholesale Bins, High Pilgrim Demand Corridor'
    },
    {
      name: 'Kota Krishi Upaj Mandi',
      short_code: 'KOT-APMC',
      district: 'Kota',
      state: 'Rajasthan',
      distance_km: 360,
      avg_transit_hours: 8.0,
      market_fee_percent: 1.6,
      cess_percent: 0.5,
      unloading_charge_per_quintal: 10.0,
      weighment_charge_per_quintal: 3.5,
      avg_queue_wait_hours: 2.0,
      agmarknet_id: 'RJ-KOT-001',
      contact: 'Sunil Meena',
      phone: '+91 744 250 3344',
      facilities: 'Major Grain & Mustard Terminal, Rail Siding'
    },
    {
      name: 'Karnal Anaj & Sabzi Mandi',
      short_code: 'KRN-HAR',
      district: 'Karnal',
      state: 'Haryana',
      distance_km: 265,
      avg_transit_hours: 6.0,
      market_fee_percent: 2.0,
      cess_percent: 2.0, // HRDF cess
      unloading_charge_per_quintal: 11.5,
      weighment_charge_per_quintal: 4.0,
      avg_queue_wait_hours: 2.8,
      agmarknet_id: 'HR-KRN-003',
      contact: 'Gurpreet Singh',
      phone: '+91 184 225 6780',
      facilities: 'Grain silos, Automated cleaners, Agmark lab'
    }
  ];

  const insertMandi = db.prepare(`
    INSERT INTO mandis (name, short_code, district, state, distance_km, avg_transit_hours, market_fee_percent, cess_percent, unloading_charge_per_quintal, weighment_charge_per_quintal, avg_queue_wait_hours, agmarknet_id, contact_person, phone, facilities)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  mandiList.forEach(m => {
    insertMandi.run(
      m.name, m.short_code, m.district, m.state, m.distance_km, m.avg_transit_hours,
      m.market_fee_percent, m.cess_percent, m.unloading_charge_per_quintal,
      m.weighment_charge_per_quintal, m.avg_queue_wait_hours, m.agmarknet_id,
      m.contact, m.phone, m.facilities
    );
  });

  // 4. Live Commodity Prices per Mandi (AGMARKNET calibrated)
  // Let's create realistic prices showing clear arbitrage opportunities:
  // E.g. Tomato is ₹2,850 in Azadpur, ₹2,600 in Jaipur, but only ₹2,050 in local Alwar!
  const mandiRows = db.prepare('SELECT id, name FROM mandis').all();
  const mandiMap = {};
  mandiRows.forEach(m => { mandiMap[m.name] = m.id; });

  const priceMatrix = [
    // Azadpur (Delhi) - Highest metropolitan consumption premiums
    { mandi: 'Azadpur Mandi (Delhi)', crop: 'Tomato (Tamatar)', modal: 2850, min: 2500, max: 3100, arrivals: 420, trend: 'up' },
    { mandi: 'Azadpur Mandi (Delhi)', crop: 'Onion (Pyaaz)', modal: 2400, min: 2150, max: 2650, arrivals: 850, trend: 'stable' },
    { mandi: 'Azadpur Mandi (Delhi)', crop: 'Potato (Aloo)', modal: 1650, min: 1450, max: 1800, arrivals: 1200, trend: 'up' },
    { mandi: 'Azadpur Mandi (Delhi)', crop: 'Green Peas (Matar)', modal: 4200, min: 3800, max: 4600, arrivals: 180, trend: 'up' },
    { mandi: 'Azadpur Mandi (Delhi)', crop: 'Cauliflower (Gobhi)', modal: 2100, min: 1800, max: 2350, arrivals: 220, trend: 'stable' },
    { mandi: 'Azadpur Mandi (Delhi)', crop: 'Wheat (Gehun)', modal: 2480, min: 2350, max: 2550, arrivals: 600, trend: 'stable' },
    { mandi: 'Azadpur Mandi (Delhi)', crop: 'Mustard (Sarson)', modal: 5650, min: 5400, max: 5800, arrivals: 310, trend: 'up' },

    // Jaipur (Muhana) - Strong tier-1 state capital demand
    { mandi: 'Jaipur (Muhana Terminal Mandi)', crop: 'Tomato (Tamatar)', modal: 2580, min: 2300, max: 2750, arrivals: 280, trend: 'stable' },
    { mandi: 'Jaipur (Muhana Terminal Mandi)', crop: 'Onion (Pyaaz)', modal: 2300, min: 2100, max: 2500, arrivals: 450, trend: 'stable' },
    { mandi: 'Jaipur (Muhana Terminal Mandi)', crop: 'Potato (Aloo)', modal: 1520, min: 1350, max: 1680, arrivals: 600, trend: 'stable' },
    { mandi: 'Jaipur (Muhana Terminal Mandi)', crop: 'Green Peas (Matar)', modal: 3950, min: 3600, max: 4300, arrivals: 120, trend: 'up' },
    { mandi: 'Jaipur (Muhana Terminal Mandi)', crop: 'Cauliflower (Gobhi)', modal: 1950, min: 1700, max: 2150, arrivals: 160, trend: 'up' },
    { mandi: 'Jaipur (Muhana Terminal Mandi)', crop: 'Wheat (Gehun)', modal: 2420, min: 2300, max: 2500, arrivals: 520, trend: 'stable' },
    { mandi: 'Jaipur (Muhana Terminal Mandi)', crop: 'Mustard (Sarson)', modal: 5720, min: 5500, max: 5900, arrivals: 480, trend: 'up' },

    // Alwar (Local Base Mandi) - Lower local glut price
    { mandi: 'Alwar Krishi Upaj Mandi (Local Base APMC)', crop: 'Tomato (Tamatar)', modal: 2050, min: 1800, max: 2200, arrivals: 340, trend: 'down' },
    { mandi: 'Alwar Krishi Upaj Mandi (Local Base APMC)', crop: 'Onion (Pyaaz)', modal: 2000, min: 1850, max: 2150, arrivals: 390, trend: 'stable' },
    { mandi: 'Alwar Krishi Upaj Mandi (Local Base APMC)', crop: 'Potato (Aloo)', modal: 1380, min: 1200, max: 1500, arrivals: 450, trend: 'down' },
    { mandi: 'Alwar Krishi Upaj Mandi (Local Base APMC)', crop: 'Green Peas (Matar)', modal: 3400, min: 3100, max: 3650, arrivals: 95, trend: 'down' },
    { mandi: 'Alwar Krishi Upaj Mandi (Local Base APMC)', crop: 'Cauliflower (Gobhi)', modal: 1650, min: 1400, max: 1800, arrivals: 140, trend: 'down' },
    { mandi: 'Alwar Krishi Upaj Mandi (Local Base APMC)', crop: 'Wheat (Gehun)', modal: 2350, min: 2250, max: 2420, arrivals: 750, trend: 'stable' },
    { mandi: 'Alwar Krishi Upaj Mandi (Local Base APMC)', crop: 'Mustard (Sarson)', modal: 5580, min: 5350, max: 5700, arrivals: 820, trend: 'stable' },

    // Agra (Sikandra) - Strong potato, onion, tomato demand
    { mandi: 'Agra (Sikandra Mandi)', crop: 'Tomato (Tamatar)', modal: 2620, min: 2350, max: 2850, arrivals: 210, trend: 'up' },
    { mandi: 'Agra (Sikandra Mandi)', crop: 'Onion (Pyaaz)', modal: 2280, min: 2050, max: 2450, arrivals: 380, trend: 'stable' },
    { mandi: 'Agra (Sikandra Mandi)', crop: 'Potato (Aloo)', modal: 1420, min: 1280, max: 1550, arrivals: 2400, trend: 'down' },
    { mandi: 'Agra (Sikandra Mandi)', crop: 'Green Peas (Matar)', modal: 3800, min: 3500, max: 4100, arrivals: 110, trend: 'stable' },
    { mandi: 'Agra (Sikandra Mandi)', crop: 'Cauliflower (Gobhi)', modal: 1880, min: 1650, max: 2050, arrivals: 130, trend: 'stable' },
    { mandi: 'Agra (Sikandra Mandi)', crop: 'Wheat (Gehun)', modal: 2400, min: 2320, max: 2470, arrivals: 420, trend: 'stable' },
    { mandi: 'Agra (Sikandra Mandi)', crop: 'Mustard (Sarson)', modal: 5640, min: 5450, max: 5800, arrivals: 390, trend: 'up' },

    // Mathura
    { mandi: 'Mathura Fruit & Vegetable Mandi', crop: 'Tomato (Tamatar)', modal: 2480, min: 2250, max: 2680, arrivals: 140, trend: 'up' },
    { mandi: 'Mathura Fruit & Vegetable Mandi)', crop: 'Onion (Pyaaz)', modal: 2240, min: 2050, max: 2380, arrivals: 210, trend: 'stable' },
    { mandi: 'Mathura Fruit & Vegetable Mandi', crop: 'Potato (Aloo)', modal: 1450, min: 1320, max: 1580, arrivals: 320, trend: 'stable' },
    { mandi: 'Mathura Fruit & Vegetable Mandi', crop: 'Green Peas (Matar)', modal: 3750, min: 3450, max: 4050, arrivals: 85, trend: 'stable' },
    { mandi: 'Mathura Fruit & Vegetable Mandi', crop: 'Cauliflower (Gobhi)', modal: 1820, min: 1600, max: 2000, arrivals: 90, trend: 'up' },
    { mandi: 'Mathura Fruit & Vegetable Mandi', crop: 'Wheat (Gehun)', modal: 2380, min: 2300, max: 2440, arrivals: 260, trend: 'stable' },
    { mandi: 'Mathura Fruit & Vegetable Mandi', crop: 'Mustard (Sarson)', modal: 5600, min: 5400, max: 5750, arrivals: 290, trend: 'stable' },

    // Kota - Premium on Mustard & Wheat
    { mandi: 'Kota Krishi Upaj Mandi', crop: 'Mustard (Sarson)', modal: 5890, min: 5680, max: 6100, arrivals: 1100, trend: 'up' },
    { mandi: 'Kota Krishi Upaj Mandi', crop: 'Wheat (Gehun)', modal: 2540, min: 2440, max: 2620, arrivals: 950, trend: 'up' },
    { mandi: 'Kota Krishi Upaj Mandi', crop: 'Onion (Pyaaz)', modal: 2180, min: 1980, max: 2320, arrivals: 290, trend: 'down' },
    { mandi: 'Kota Krishi Upaj Mandi', crop: 'Tomato (Tamatar)', modal: 2350, min: 2100, max: 2500, arrivals: 130, trend: 'stable' },

    // Karnal
    { mandi: 'Karnal Anaj & Sabzi Mandi', crop: 'Wheat (Gehun)', modal: 2510, min: 2420, max: 2580, arrivals: 880, trend: 'up' },
    { mandi: 'Karnal Anaj & Sabzi Mandi', crop: 'Green Peas (Matar)', modal: 4100, min: 3800, max: 4400, arrivals: 140, trend: 'up' },
    { mandi: 'Karnal Anaj & Sabzi Mandi', crop: 'Potato (Aloo)', modal: 1540, min: 1400, max: 1660, arrivals: 510, trend: 'stable' },
    { mandi: 'Karnal Anaj & Sabzi Mandi', crop: 'Tomato (Tamatar)', modal: 2720, min: 2450, max: 2950, arrivals: 190, trend: 'up' }
  ];

  const insertPrice = db.prepare(`
    INSERT OR REPLACE INTO mandi_prices (mandi_id, crop_name, modal_price, min_price, max_price, arrivals_tonnes, trend, source, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  priceMatrix.forEach(p => {
    const mId = mandiMap[p.mandi];
    if (mId) {
      insertPrice.run(mId, p.crop, p.modal, p.min, p.max, p.arrivals, p.trend, 'AGMARKNET Direct API');
    }
  });

  // 5. Cooperative Fleet / Transport Vehicles
  const vehicleList = [
    {
      name: 'Mahindra Bolero Maxi Truck HD',
      number: 'RJ-02-GB-4512',
      type: 'Maxi Pickup (Bolero)',
      capacity: 25.0, // quintals
      cost_per_km: 22.0, // ₹ per km
      speed: 55.0, // km/h
      driver: 'Mukesh Choudhary',
      phone: '+91 94140 88219',
      is_ref: 0,
      status: 'available',
      location: 'Kotputli Hub'
    },
    {
      name: 'Tata Ace Gold (Chhota Hathi)',
      number: 'RJ-02-EA-1920',
      type: 'Mini Truck (Tata Ace)',
      capacity: 15.0,
      cost_per_km: 17.5,
      speed: 50.0,
      driver: 'Kishore Gurjar',
      phone: '+91 97850 44321',
      is_ref: 0,
      status: 'available',
      location: 'Alwar Central Yard'
    },
    {
      name: 'Eicher Pro 2059 (14-ft Cargo Truck)',
      number: 'RJ-32-GA-6781',
      type: '14-ft Truck (Eicher)',
      capacity: 70.0,
      cost_per_km: 34.0,
      speed: 50.0,
      driver: 'Balwant Singh',
      phone: '+91 98288 33119',
      is_ref: 0,
      status: 'available',
      location: 'Behror Junction'
    },
    {
      name: 'Mahindra 575 DI Tractor Trolley',
      number: 'RJ-02-TA-8840',
      type: 'Tractor Trolley',
      capacity: 45.0,
      cost_per_km: 21.0,
      speed: 30.0, // slower, best for short haul
      driver: 'Ramphool Meena',
      phone: '+91 91660 77123',
      is_ref: 0,
      status: 'available',
      location: 'Thanagazi Depot'
    },
    {
      name: 'Ashok Leyland Reefer Cool-Van (Refrigerated)',
      number: 'DL-01-AX-9942',
      type: 'Reefer Cold Van',
      capacity: 50.0,
      cost_per_km: 46.0,
      speed: 60.0,
      driver: 'Harpreet Singh',
      phone: '+91 99112 00412',
      is_ref: 1, // refrigerated, negligible perishability degradation
      status: 'available',
      location: 'Shahjahanpur Border'
    },
    {
      name: 'Tata 407 LPT Heavy Duty',
      number: 'RJ-02-LB-3110',
      type: 'Heavy Pickup (Tata 407)',
      capacity: 38.0,
      cost_per_km: 27.0,
      speed: 52.0,
      driver: 'Devendra Yadav',
      phone: '+91 96490 55102',
      status: 'available',
      location: 'Alwar Central Yard'
    }
  ];

  const insertVehicle = db.prepare(`
    INSERT INTO vehicles (name, vehicle_number, type, payload_capacity_quintals, cost_per_km, avg_speed_kmh, driver_name, driver_phone, is_refrigerated, status, current_location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  vehicleList.forEach(v => {
    insertVehicle.run(v.name, v.number, v.type, v.capacity, v.cost_per_km, v.speed, v.driver, v.phone, v.is_ref || 0, v.status, v.location);
  });

  // 6. Active Farmer Inventory Batches
  const inventoryList = [
    {
      code: 'BAT-2026-TOM-01',
      crop: 'Tomato (Tamatar)',
      variety: 'Himsona Hybrid',
      qty: 65.0, // quintals (perfect for Eicher 70q)
      harvest_date: new Date(Date.now() - 14 * 3600000).toISOString().split('T')[0], // harvested 14h ago
      shelf_life: 4.0, // days
      remaining_hours: 65.0, // ~65 hours left
      grade: 'Grade A (Export/Premium)',
      farm: 'Rajgarh Cluster Farm #4',
      farmer: 'Girdhari Lal & 6 Farmer Members',
      notes: 'Firm red, graded in plastic crates, high metropolitan demand'
    },
    {
      code: 'BAT-2026-ONI-02',
      crop: 'Onion (Pyaaz)',
      variety: 'Nasik Red Medium',
      qty: 42.0,
      harvest_date: new Date(Date.now() - 48 * 3600000).toISOString().split('T')[0],
      shelf_life: 60.0,
      remaining_hours: 1350.0,
      grade: 'Grade A (Export/Premium)',
      farm: 'Kotputli Kisan Sangh Yard',
      farmer: 'Suresh Chand Sharma',
      notes: 'Well cured, mesh bagged in 50kg bags'
    },
    {
      code: 'BAT-2026-POT-03',
      crop: 'Potato (Aloo)',
      variety: 'Kufri Pukhraj',
      qty: 68.0,
      harvest_date: new Date(Date.now() - 72 * 3600000).toISOString().split('T')[0],
      shelf_life: 90.0,
      remaining_hours: 2050.0,
      grade: 'Grade B (Standard)',
      farm: 'Behror Sub-center',
      farmer: 'Hawa Singh & Sons',
      notes: 'Medium oval size, clean skin, ready for wholesale table consumption'
    },
    {
      code: 'BAT-2026-PEA-04',
      crop: 'Green Peas (Matar)',
      variety: 'Golden Pea GS-10',
      qty: 24.0,
      harvest_date: new Date(Date.now() - 8 * 3600000).toISOString().split('T')[0],
      shelf_life: 5.0,
      remaining_hours: 88.0,
      grade: 'Grade A (Export/Premium)',
      farm: 'Tijara Organic Cluster',
      farmer: 'Mahendra Singh FPO Group',
      notes: 'Sweet, full pods, tender green, urgent dispatch needed'
    },
    {
      code: 'BAT-2026-TOM-05',
      crop: 'Tomato (Tamatar)',
      variety: 'Abhinav Regular',
      qty: 22.0, // fits in Bolero Maxi Truck (25q)
      harvest_date: new Date(Date.now() - 20 * 3600000).toISOString().split('T')[0],
      shelf_life: 3.5,
      remaining_hours: 48.0,
      grade: 'Grade B (Standard)',
      farm: 'Kishangarh Bas Mandi Yard',
      farmer: 'Kallu Ram Saini',
      notes: 'Moderate ripeness, needs rapid sale within 48h'
    },
    {
      code: 'BAT-2026-MUS-06',
      crop: 'Mustard (Sarson)',
      variety: 'Giriraj Oilseed (DRMRIJ-31)',
      qty: 40.0,
      harvest_date: new Date(Date.now() - 120 * 3600000).toISOString().split('T')[0],
      shelf_life: 365.0,
      remaining_hours: 8500.0,
      grade: 'Grade A (Export/Premium)',
      farm: 'Khairthal Depot',
      farmer: 'Raghunath Meena FPC',
      notes: '42.5% oil content tested, high trader demand at Kota & Jaipur'
    }
  ];

  const insertInv = db.prepare(`
    INSERT INTO inventory (batch_code, crop_name, variety, quantity_quintals, harvest_date, shelf_life_days, remaining_shelf_life_hours, quality_grade, farm_location, farmer_name, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `);

  inventoryList.forEach(inv => {
    insertInv.run(
      inv.code, inv.crop, inv.variety, inv.qty, inv.harvest_date,
      inv.shelf_life, inv.remaining_hours, inv.grade, inv.farm,
      inv.farmer, inv.notes
    );
  });

  // 7. Seed one completed historical dispatch record to demonstrate the audit trail
  const seedDispatch = db.prepare(`
    INSERT INTO dispatches (
      dispatch_code, batch_id, batch_code, mandi_id, mandi_name,
      vehicle_id, vehicle_name, crop_name, quantity_quintals, modal_price,
      gross_revenue, transport_cost, mandi_fees, unloading_cost,
      spoilage_risk_loss, net_revenue, local_benchmark_net, arbitrage_gain,
      arbitrage_gain_pct, departure_time, estimated_arrival_time, status, notes
    ) VALUES (
      'DSP-2026-0881', 1, 'BAT-2026-TOM-01', 1, 'Azadpur Mandi (Delhi)',
      3, 'Eicher Pro 2059 (14-ft Cargo Truck)', 'Tomato (Tamatar)', 65.0, 2850,
      185250, 5270, 3705, 1040, 2800, 172435, 128500, 43935, 34.19,
      '04:30 AM (Next Day)', '10:30 AM (Auction Ready)', 'scheduled',
      'Optimized overnight dispatch to avoid traffic jams and beat Delhi sunrise auction'
    )
  `);
  seedDispatch.run();

  console.log('Database seeded successfully with realistic APMC Mandi, crop, vehicle, and inventory records!');
}

module.exports = {
  db,
  initDatabase
};
