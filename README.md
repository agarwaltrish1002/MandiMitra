# MandiMitra (मंडीमित्र)
### Agricultural Market Mandi Price Arbitrage & Logistics Agent for Farmer Cooperatives

**MandiMitra** is a production-ready, full-stack web application designed for Indian Farmer Producer Organizations (FPOs), cooperatives, and agricultural aggregators. It eliminates the 10-20% revenue discount typically suffered by farmers relying on WhatsApp rumors and gut feel, by computing real-time APMC mandi price arbitrage, true freight transport costs, state mandi taxes/cesses, and transit perishability degradation.

---

## 🚀 Key Features

### 1. 📊 Executive Dashboard
- **Real-Time Operational Cards:** Active inventory batches & quintals, fleet availability & payload capacity, projected net revenue, and extra arbitrage profits.
- **Top Arbitrage Destinations:** Distance, travel time, yard queue wait hours, and commodity spread indicators.
- **1-Click Quick Actions:** Direct navigation to Fleet Optimizer and Head-to-Head Calculator.

### 2. ⚖️ Interactive Farmer Profit Calculator
- **Custom Batch Testing:** Select produce (Tomato, Onion, Potato, Mustard, Green Peas, etc.), quantity in quintals, and quality grade.
- **Side-by-Side Mandi Comparison:** Compare **Destination A** (e.g. Azadpur Mandi, Delhi) vs **Destination B** (e.g. Alwar Local Base APMC or Village Aggregator).
- **Comprehensive Waterfall Breakdown:**
  $$\text{Net Price} = (\text{Mandi Price} \times \text{Quantity}) - (\text{Distance} \times \text{Per-Km Rate}) - \text{Mandi Fees} - \text{Labor Unloading} - \text{Perishability Loss}$$
- **Green Arbitrage Banner:** Instantly highlights "₹X More Profit (+Y%)" compared to traditional local selling.
- **Full Corridors Leaderboard:** Ranks all tracked regional APMC mandis for that exact load.
- **Actionable Outputs:**
  - **Copy WhatsApp Advisory:** Formatted bilingual/English summary ready for farmer WhatsApp groups.
  - **Print Farmer Advisory Slip:** Clean printable receipt.

### 3. 🚚 Arbitrage & Logistics Optimization Engine (The Core Logic)
- **Multi-Constraint Linear Allocation:** Evaluates all active produce batches against available fleet vehicles and destination mandis.
- **Perishability & Queue Safety Capping:**
  - Total exposure $T_{\text{exposure}} = T_{\text{transit}} + T_{\text{mandi queue}}$.
  - Checks against remaining crop shelf life.
  - Mitigates degradation by 85% for cold chain reefer vehicles.
- **Capacity Fit Heuristics:** Matches vehicle payload (quintals) with batch volume to maximize utilization and avoid overloading.
- **AI Rationale & Suggested Departure:** Computes departure timings (e.g., 03:24 AM) to reach mandi yards pre-auction (06:30 AM).
- **1-Click Commit:** Instantly converts the solved plan into active dispatch schedules.

### 4. 📋 Logistics Schedule & Dispatch Board
- **Active Dispatch Tracker:** Tracks Scheduled, In-Transit, Delivered, and Cancelled orders.
- **Official APMC Gate Pass / Transhipment Waybill:** Printable official pass formatted with FPO registration, batch barcode/QR styling, driver details, and signature lines.
- **Transporter WhatsApp Slip:** 1-click formatted driver dispatch itinerary with instructions.
- **CSV Manifest Export:** Downloadable dispatch sheet for cooperative accounting.

### 5. 📦 Produce Inventory & Perishability Tracker
- Aggregates farm batches with quantity (quintals), harvest date, quality grade, and remaining shelf-life hours with color-coded countdown indicators.

### 6. 🚛 Fleet Availability & Logistics Economics
- Manage vehicles (Mini Truck Tata Ace, Bolero Maxi Pickup, 14-ft Eicher, Tractor Trolley, Reefer Cold Van) with payload capacities, freight cost/km, speed, and driver contacts.

### 7. 🏛️ Mandi Directory & Live Price Editor
- Directory of APMC mandis with distances, travel hours, market fees %, cess %, unloading charges, and yard queue delays.
- Real-time modal price board with inline modal editing for what-if scenarios.

### 8. 🔍 System Verification & Price Data Freshness Suite
- **Price Freshness Validation:** Audits all quotes against the 120-minute threshold.
- **Transport Math Integrity:** Validates freight calculation and statutory APMC cess rules.
- **Government Feeds:** Grounded in Government of India's AGMARKNET & E-NAM gateways with 1-click live synchronization.

---

## 🛠️ Architecture & Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React Icons.
- **Backend:** Node.js with Express (REST API).
- **Database:** SQLite with `better-sqlite3` (WAL mode enabled, realistic seed data pre-populated).
- **Portals & Serving:** Express serves the compiled React SPA directly on port `5000` or via Vite development server on port `5173`.

---

## 🏁 Quickstart Guide

### 1. Start the Unified Server (Backend + Frontend)
```bash
cd backend
node server.js
```
The application will be live at: **`http://localhost:5000`**

### 2. (Optional) Run Vite Development Server
```bash
cd frontend
npm run dev
```
Accessible at: **`http://localhost:5173`** (automatically proxies `/api` calls to port 5000).

---

## 📋 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard-summary` | Overview statistics, active batches, top mandis, revenue |
| `GET` | `/api/inventory` | List all produce batches |
| `POST` | `/api/inventory` | Register a new batch |
| `DELETE`| `/api/inventory/:id` | Delete batch |
| `GET` | `/api/vehicles` | List all transport vehicles |
| `POST` | `/api/vehicles` | Add vehicle |
| `PUT` | `/api/vehicles/:id` | Update vehicle |
| `GET` | `/api/mandis` | List all APMC mandis with live commodity rates |
| `POST` | `/api/mandis` | Register new mandi |
| `PUT` | `/api/mandi-prices/:id` | Update commodity modal rate |
| `POST` | `/api/calculate-arbitrage` | Interactive Head-to-Head Mandi A vs B calculator |
| `POST` | `/api/optimize-logistics` | Run multi-constraint batch-mandi-vehicle allocation |
| `GET` | `/api/schedules` | View active dispatch schedules |
| `POST` | `/api/schedules/commit-plan`| Commit solved allocation to persistent schedules |
| `PUT` | `/api/schedules/:id/status` | Update dispatch order status |
| `POST` | `/api/mandi-prices/sync` | Sync live AGMARKNET APMC rates |
| `GET` | `/api/verify-prices` | Freshness and mathematical verification audit |
| `POST` | `/api/reset-seed` | Reset demo data to initial pristine state |
