/**
 * MandiMitra - Agricultural Arbitrage & Logistics Optimization Engine
 *
 * Implements:
 * 1. Net Realization Price Calculation:
 *    Net Price = (Mandi Price * Quantity) - (Distance * Per-Km Cost) - Market Fees - Unloading Charges
 * 2. Perishability & Queue Risk Check:
 *    Loss = Gross Revenue * (Transit Hours + Queue Wait Hours) * Degradation Rate (mitigated by Reefer)
 * 3. Fleet Capacity & Allocation Solver:
 *    Matches active produce batches with optimal vehicles & target mandis to maximize collective cooperative net earnings.
 */

// Quality grade price adjustments relative to APMC modal price
const QUALITY_MULTIPLIERS = {
  'Grade A (Export/Premium)': 1.05,
  'Grade A': 1.05,
  'Grade B (Standard)': 0.95,
  'Grade B': 0.95,
  'Grade C (Fair)': 0.82,
  'Grade C': 0.82,
};

/**
 * Computes complete financial and risk breakdown for a batch sold at a specific mandi using a specific vehicle.
 */
function calculateBatchMandiRealization({
  crop,
  quantityQuintals,
  qualityGrade = 'Grade B (Standard)',
  mandi,
  mandiPrice,
  vehicle,
  remainingShelfLifeHours = null,
  localBenchmarkMandi = null,
  localBenchmarkPrice = null
}) {
  const gradeMultiplier = QUALITY_MULTIPLIERS[qualityGrade] || 1.0;
  const effectiveModalPrice = mandiPrice * gradeMultiplier;

  // 1. Gross Revenue
  const grossRevenue = Math.round(effectiveModalPrice * quantityQuintals);

  // 2. Transport Logistics Cost
  // Explicit formula: (Distance * Per-Km Cost)
  const transportCost = Math.round(mandi.distance_km * vehicle.cost_per_km);

  // 3. Mandi / APMC Fees & Cess
  const feePercentTotal = (mandi.market_fee_percent || 0) + (mandi.cess_percent || 0);
  const mandiFees = Math.round(grossRevenue * (feePercentTotal / 100));

  // 4. Labor / Handling Costs (Unloading + Weighment)
  const unloadingRate = (mandi.unloading_charge_per_quintal || 0) + (mandi.weighment_charge_per_quintal || 0);
  const unloadingCost = Math.round(unloadingRate * quantityQuintals);

  // 5. Transit & Waiting Hours
  const transitSpeed = vehicle.avg_speed_kmh || 45;
  const transitHours = Math.round((mandi.distance_km / transitSpeed) * 10) / 10;
  const queueHours = mandi.avg_queue_wait_hours || 0;
  const totalExposureHours = Math.round((transitHours + queueHours) * 10) / 10;

  // 6. Perishability & Spoilage Risk Calculation
  const baseDegradationPerHour = crop.degradation_rate_per_hour || 0.001;
  // If refrigerated truck is chosen, cooling reduces degradation by 85%
  const refrigerationMitigation = vehicle.is_refrigerated ? 0.15 : 1.0;
  const effectiveDegradationPerHour = baseDegradationPerHour * refrigerationMitigation;

  let spoilageRiskPct = totalExposureHours * effectiveDegradationPerHour;

  // Shelf-life expiration penalty
  const shelfHoursLeft = remainingShelfLifeHours !== null
    ? remainingShelfLifeHours
    : (crop.default_shelf_life_days || 5) * 24;

  let isExpiredRisk = false;
  let riskLevel = 'LOW';

  if (totalExposureHours > shelfHoursLeft) {
    isExpiredRisk = true;
    riskLevel = 'CRITICAL';
    spoilageRiskPct = Math.min(0.85, spoilageRiskPct + 0.50); // Severe distress markdown
  } else if (totalExposureHours > shelfHoursLeft * 0.5) {
    riskLevel = 'MODERATE';
    spoilageRiskPct = Math.min(0.40, spoilageRiskPct * 1.3);
  } else {
    spoilageRiskPct = Math.min(0.25, spoilageRiskPct);
  }

  const spoilageRiskLoss = Math.round(grossRevenue * spoilageRiskPct);

  // 7. Net Realization Price (Base formula without risk)
  const baseNetRevenue = grossRevenue - transportCost - mandiFees - unloadingCost;

  // 8. Risk-Adjusted Net Revenue
  const riskAdjustedNetRevenue = baseNetRevenue - spoilageRiskLoss;
  const netRealizedPerQuintal = Math.round((riskAdjustedNetRevenue / quantityQuintals) * 100) / 100;

  // 9. Local Benchmark Comparison (Default to local benchmark mandi if provided)
  let localNetRevenue = 0;
  let arbitrageGain = 0;
  let arbitrageGainPct = 0;

  if (localBenchmarkMandi && localBenchmarkPrice) {
    const localEffectivePrice = localBenchmarkPrice * gradeMultiplier;
    const localGross = Math.round(localEffectivePrice * quantityQuintals);
    // Local transport: assume local pickup/trolley (e.g. 25km * ₹20)
    const localTransport = Math.round(localBenchmarkMandi.distance_km * 20);
    const localFees = Math.round(localGross * (((localBenchmarkMandi.market_fee_percent || 1.6) + (localBenchmarkMandi.cess_percent || 0.4)) / 100));
    const localUnloading = Math.round(((localBenchmarkMandi.unloading_charge_per_quintal || 8) + (localBenchmarkMandi.weighment_charge_per_quintal || 3)) * quantityQuintals);
    localNetRevenue = localGross - localTransport - localFees - localUnloading;

    arbitrageGain = riskAdjustedNetRevenue - localNetRevenue;
    arbitrageGainPct = localNetRevenue > 0 ? Math.round((arbitrageGain / localNetRevenue) * 1000) / 10 : 0;
  }

  // Capacity fit check
  const capacityFit = {
    isWithinCapacity: vehicle.payload_capacity_quintals >= quantityQuintals,
    utilizationPct: Math.min(100, Math.round((quantityQuintals / vehicle.payload_capacity_quintals) * 100)),
    excessCapacityQuintals: Math.max(0, vehicle.payload_capacity_quintals - quantityQuintals)
  };

  return {
    mandiId: mandi.id,
    mandiName: mandi.name,
    mandiDistrict: mandi.district,
    mandiState: mandi.state,
    distanceKm: mandi.distance_km,
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    vehicleType: vehicle.type,
    isRefrigerated: !!vehicle.is_refrigerated,
    cropName: crop.name,
    quantityQuintals,
    qualityGrade,
    effectiveModalPrice,
    rawModalPrice: mandiPrice,
    grossRevenue,
    transportCost,
    mandiFees,
    feePercentTotal,
    unloadingCost,
    transitHours,
    queueHours,
    totalExposureHours,
    shelfHoursLeft,
    isExpiredRisk,
    riskLevel,
    spoilageRiskPct: Math.round(spoilageRiskPct * 1000) / 10,
    spoilageRiskLoss,
    baseNetRevenue,
    riskAdjustedNetRevenue,
    netRealizedPerQuintal,
    localBenchmarkNetRevenue: localNetRevenue,
    arbitrageGain,
    arbitrageGainPct,
    capacityFit,
    recommendationScore: calculateRecommendationScore({
      riskAdjustedNetRevenue,
      arbitrageGain,
      riskLevel,
      isWithinCapacity: capacityFit.isWithinCapacity,
      utilizationPct: capacityFit.utilizationPct
    })
  };
}

/**
 * Calculates a holistic score (0-100) factoring profit, arbitrage gain, shelf risk, and truck capacity utilization.
 */
function calculateRecommendationScore({
  riskAdjustedNetRevenue,
  arbitrageGain,
  riskLevel,
  isWithinCapacity,
  utilizationPct
}) {
  if (!isWithinCapacity) return 10; // Penalized heavily if vehicle is too small
  if (riskLevel === 'CRITICAL') return 15;

  let score = 50;
  // Profit & arbitrage boost
  if (arbitrageGain > 0) {
    score += Math.min(30, (arbitrageGain / 1000) * 0.8);
  } else {
    score -= 15;
  }

  // Utilization boost (optimal between 70% and 100%)
  if (utilizationPct >= 75 && utilizationPct <= 100) {
    score += 15;
  } else if (utilizationPct >= 50) {
    score += 8;
  }

  // Risk deductions
  if (riskLevel === 'MODERATE') score -= 10;

  return Math.max(10, Math.min(99, Math.round(score)));
}

/**
 * Allocation Planner:
 * Analyzes all active inventory batches and fleet vehicles to allocate the best (Mandi, Vehicle) pairing for each batch.
 */
function runLogisticsOptimization({
  inventoryBatches,
  mandis,
  mandiPricesMap, // { mandiId_cropName: modalPrice }
  vehicles,
  cropsMap, // { cropName: cropObj }
  localMandiId = 3 // default Alwar Local APMC
}) {
  const localMandi = mandis.find(m => m.id === localMandiId) || mandis[0];

  // Keep track of vehicle availability during allocation
  const availableVehicles = vehicles
    .filter(v => v.status === 'available')
    .map(v => ({ ...v, assignedBatches: [], remainingCapacity: v.payload_capacity_quintals }));

  const planResults = [];
  const unassignedBatches = [];

  // Sort batches: Most perishable first (lowest remaining shelf life), then largest quantity
  const sortedBatches = [...inventoryBatches].sort((a, b) => {
    return (a.remaining_shelf_life_hours || 100) - (b.remaining_shelf_life_hours || 100);
  });

  for (const batch of sortedBatches) {
    const crop = cropsMap[batch.crop_name] || {
      name: batch.crop_name,
      degradation_rate_per_hour: 0.003,
      default_shelf_life_days: batch.shelf_life_days || 5
    };

    const localKey = `${localMandi.id}_${batch.crop_name}`;
    const localPrice = mandiPricesMap[localKey] || 2000;

    // Evaluate all combinations of mandis and available vehicles
    const candidateOptions = [];

    for (const mandi of mandis) {
      const priceKey = `${mandi.id}_${batch.crop_name}`;
      const mandiPrice = mandiPricesMap[priceKey];
      if (!mandiPrice) continue;

      for (const vehicle of availableVehicles) {
        // Can vehicle carry this batch alone or with its remaining capacity?
        if (vehicle.remainingCapacity >= batch.quantity_quintals) {
          const evalResult = calculateBatchMandiRealization({
            crop,
            quantityQuintals: batch.quantity_quintals,
            qualityGrade: batch.quality_grade,
            mandi,
            mandiPrice,
            vehicle,
            remainingShelfLifeHours: batch.remaining_shelf_life_hours,
            localBenchmarkMandi: localMandi,
            localBenchmarkPrice: localPrice
          });

          candidateOptions.push({
            batch,
            mandi,
            vehicle,
            evalResult
          });
        }
      }
    }

    // Sort candidate options by highest recommendation score, then highest riskAdjustedNetRevenue
    candidateOptions.sort((a, b) => {
      if (b.evalResult.recommendationScore !== a.evalResult.recommendationScore) {
        return b.evalResult.recommendationScore - a.evalResult.recommendationScore;
      }
      return b.evalResult.riskAdjustedNetRevenue - a.evalResult.riskAdjustedNetRevenue;
    });

    if (candidateOptions.length > 0) {
      const best = candidateOptions[0];
      // Assign to vehicle and deduct capacity
      best.vehicle.remainingCapacity -= batch.quantity_quintals;
      best.vehicle.assignedBatches.push(batch.id);

      // Determine departure recommendation
      const departureTime = generateSuggestedDeparture(best.mandi, best.evalResult.transitHours);

      planResults.push({
        batchId: batch.id,
        batchCode: batch.batch_code,
        farmerName: batch.farmer_name,
        farmLocation: batch.farm_location,
        cropName: batch.crop_name,
        variety: batch.variety,
        quantityQuintals: batch.quantity_quintals,
        qualityGrade: batch.quality_grade,
        assignedMandi: {
          id: best.mandi.id,
          name: best.mandi.name,
          distanceKm: best.mandi.distance_km,
          state: best.mandi.state
        },
        assignedVehicle: {
          id: best.vehicle.id,
          name: best.vehicle.name,
          vehicleNumber: best.vehicle_number,
          type: best.vehicle.type,
          driverName: best.vehicle.driver_name,
          driverPhone: best.vehicle.driver_phone,
          isRefrigerated: !!best.vehicle.is_refrigerated
        },
        financials: {
          mandiPrice: best.evalResult.rawModalPrice,
          effectivePrice: best.evalResult.effectiveModalPrice,
          grossRevenue: best.evalResult.grossRevenue,
          transportCost: best.evalResult.transportCost,
          mandiFees: best.evalResult.mandiFees,
          unloadingCost: best.evalResult.unloadingCost,
          spoilageRiskLoss: best.evalResult.spoilageRiskLoss,
          riskAdjustedNetRevenue: best.evalResult.riskAdjustedNetRevenue,
          localBenchmarkNetRevenue: best.evalResult.localBenchmarkNetRevenue,
          arbitrageGain: best.evalResult.arbitrageGain,
          arbitrageGainPct: best.evalResult.arbitrageGainPct,
          netPerQuintal: best.evalResult.netRealizedPerQuintal
        },
        transitDetails: {
          transitHours: best.evalResult.transitHours,
          queueWaitHours: best.evalResult.queueHours,
          totalHours: best.evalResult.totalExposureHours,
          riskLevel: best.evalResult.riskLevel,
          spoilageRiskPct: best.evalResult.spoilageRiskPct,
          suggestedDeparture: departureTime.departure,
          estimatedArrival: departureTime.arrival,
          auctionReadiness: departureTime.auctionWindow
        },
        recommendationScore: best.evalResult.recommendationScore,
        rationale: generateAllocationRationale(best.evalResult, best.mandi, best.vehicle, crop)
      });
    } else {
      unassignedBatches.push({
        batch,
        reason: 'Insufficient vehicle capacity or critical shelf-life expiration in transit'
      });
    }
  }

  // Aggregate Cooperative Summary
  const totalAllocatedBatches = planResults.length;
  const totalQuantityQuintals = planResults.reduce((acc, p) => acc + p.quantityQuintals, 0);
  const totalProjectedGross = planResults.reduce((acc, p) => acc + p.financials.grossRevenue, 0);
  const totalTransportCost = planResults.reduce((acc, p) => acc + p.financials.transportCost, 0);
  const totalMandiFees = planResults.reduce((acc, p) => acc + p.financials.mandiFees, 0);
  const totalUnloadingCost = planResults.reduce((acc, p) => acc + p.financials.unloadingCost, 0);
  const totalSpoilageRiskLoss = planResults.reduce((acc, p) => acc + p.financials.spoilageRiskLoss, 0);
  const totalNetRealization = planResults.reduce((acc, p) => acc + p.financials.riskAdjustedNetRevenue, 0);
  const totalLocalBenchmarkNet = planResults.reduce((acc, p) => acc + p.financials.localBenchmarkNetRevenue, 0);
  const totalArbitrageGain = totalNetRealization - totalLocalBenchmarkNet;
  const overallArbitragePct = totalLocalBenchmarkNet > 0
    ? Math.round((totalArbitrageGain / totalLocalBenchmarkNet) * 1000) / 10
    : 0;

  return {
    success: true,
    summary: {
      totalAllocatedBatches,
      unassignedCount: unassignedBatches.length,
      totalQuantityQuintals,
      totalProjectedGross,
      totalTransportCost,
      totalMandiFees,
      totalUnloadingCost,
      totalSpoilageRiskLoss,
      totalNetRealization,
      totalLocalBenchmarkNet,
      totalArbitrageGain,
      overallArbitragePct,
      vehiclesUtilized: availableVehicles.filter(v => v.assignedBatches.length > 0).length,
      totalVehiclesAvailable: availableVehicles.length
    },
    allocations: planResults,
    unassigned: unassignedBatches,
    generatedAt: new Date().toISOString()
  };
}

function generateSuggestedDeparture(mandi, transitHours) {
  // Mandi auctions in India typically open at 06:00 AM to 08:30 AM
  // Aim arrival 1.5 hours before auction window to handle weighment and gate entry
  const targetArrivalHour = 6.5; // 06:30 AM
  const departureHour = targetArrivalHour - transitHours;

  let departureStr = '';
  if (departureHour < 0) {
    const prevDayHour = 24 + departureHour;
    const formatted = formatHour(prevDayHour);
    departureStr = `${formatted} (Previous Night)`;
  } else {
    departureStr = `${formatHour(departureHour)} (Early Morning)`;
  }

  const arrivalStr = `${formatHour(targetArrivalHour)} (Pre-Auction)`;
  const auctionWindow = '07:00 AM - 11:30 AM (Peak Bid)';

  return {
    departure: departureStr,
    arrival: arrivalStr,
    auctionWindow
  };
}

function formatHour(decimalHour) {
  const h = Math.floor(decimalHour);
  const m = Math.round((decimalHour - h) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m < 10 ? `0${m}` : m;
  return `${displayH}:${displayM} ${period}`;
}

function generateAllocationRationale(evalResult, mandi, vehicle, crop) {
  const parts = [];
  if (evalResult.arbitrageGain > 0) {
    parts.push(`Yields +₹${evalResult.arbitrageGain.toLocaleString('en-IN')} (+${evalResult.arbitrageGainPct}%) higher net earnings over local base mandi.`);
  } else {
    parts.push(`Local sale is recommended due to high freight distance relative to price spread.`);
  }

  if (evalResult.riskLevel === 'LOW') {
    parts.push(`Safe shelf-life window (${evalResult.totalExposureHours}h transit+queue vs ${evalResult.shelfHoursLeft}h life).`);
  } else if (evalResult.riskLevel === 'MODERATE') {
    parts.push(`Watch queue delays (${mandi.avg_queue_wait_hours}h waiting at yard). Rapid dispatch urged.`);
  }

  if (vehicle.is_refrigerated) {
    parts.push(`Reefer van ensures zero thermal spoilage loss for perishable produce.`);
  }

  return parts.join(' ');
}

module.exports = {
  calculateBatchMandiRealization,
  runLogisticsOptimization,
  QUALITY_MULTIPLIERS
};
