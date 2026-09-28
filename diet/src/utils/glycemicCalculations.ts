import { MealType } from '../types/diet';

export interface GlycemicFactorAnalysis {
  name: string;
  effect: string;
  badge: string;
  type: 'delay' | 'blunt' | 'accelerate' | 'caution';
  detail: string;
}

export interface GlycemicCurvePoint {
  minute: number;
  timeLabel: string;
  glucoseRiseMgDl: number;
  absoluteEstimatedGlucose: number; // baseline + rise
  phase: 'splanchnic_digestion' | 'optimal_workout' | 'sustained_fuel' | 'baseline';
  phaseLabel: string;
}

export interface WorkoutWindowRecommendation {
  startTime: string; // e.g. "14:15"
  endTime: string;   // e.g. "16:00"
  startMinutesFromMeal: number;
  endMinutesFromMeal: number;
  readinessRating: 'optimal' | 'moderate' | 'suboptimal';
  headline: string;
  heavyLiftingWindow: string;
  hiitCardioWindow: string;
  guidance: string[];
}

export interface GlycemicProfile {
  mealTime: string; // e.g. "12:30"
  baselineGlucose: number; // e.g. 88 mg/dL
  estimatedPeakMinutes: number; // e.g. 65 minutes
  estimatedPeakTime: string; // e.g. "13:35"
  peakGlucoseRiseMgDl: number; // e.g. +34 mg/dL
  peakEstimatedGlucose: number; // e.g. 122 mg/dL
  glycemicImpactCategory: 'Low / Sustained' | 'Moderate Steady' | 'Pronounced Spike' | 'Minimal Glycemic Impact';
  digestionSpeed: 'Rapid Clearance' | 'Moderate Controlled' | 'Slow & Prolonged';
  netCarbs: number;
  factors: GlycemicFactorAnalysis[];
  curve: GlycemicCurvePoint[];
  workoutWindow: WorkoutWindowRecommendation;
  reactiveHypoRisk: boolean;
  reactiveHypoTime?: string;
  hydrationTip: string;
}

/**
 * Format minutes offset from base time "HH:MM" into formatted "HH:MM" or "H:MM AM/PM"
 */
export function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  if (!timeStr || !timeStr.includes(':')) {
    const now = new Date();
    timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }
  const [hStr, mStr] = timeStr.split(':');
  let hours = parseInt(hStr, 10);
  let minutes = parseInt(mStr, 10);

  if (isNaN(hours)) hours = 12;
  if (isNaN(minutes)) minutes = 0;

  const totalMinutes = (hours * 60 + minutes + Math.round(minutesToAdd)) % (24 * 60);
  const positiveMinutes = totalMinutes < 0 ? totalMinutes + 24 * 60 : totalMinutes;

  const newH = Math.floor(positiveMinutes / 60);
  const newM = positiveMinutes % 60;

  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

export function formatTimeTo12Hour(timeStr: string): string {
  if (!timeStr || !timeStr.includes(':')) return timeStr || '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return timeStr;

  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Comprehensive physiological glycemic & gastric absorption modeling engine
 */
export function calculateMealGlycemicProfile(params: {
  mealTime?: string;
  carbs: number;
  protein: number;
  fats: number;
  fiber?: number;
  calories?: number;
  grams?: number;
  foodName?: string;
}): GlycemicProfile {
  const {
    mealTime = '12:00',
    carbs = 0,
    protein = 0,
    fats = 0,
    fiber = 0,
    calories = carbs * 4 + protein * 4 + fats * 9,
    grams = 250,
  } = params;

  const netCarbs = Math.max(0, carbs - (fiber || 0));
  const safeCalories = Math.max(calories, netCarbs * 4 + protein * 4 + fats * 9);
  const baselineGlucose = 88; // standard healthy fasting/interprandial baseline (mg/dL)

  // 1. BASELINE GLYCEMIC RISE FROM CARBS
  // In isolation, each 10g of net carb elevates blood glucose by ~18-24 mg/dL in active individuals.
  let rawGlucoseRise = netCarbs > 0 ? Math.min(95, netCarbs * 1.6) : 5;

  // Initial peak arrival without buffers: ~35-40 minutes for rapid carbs
  let peakMinutes = 35;

  const factors: GlycemicFactorAnalysis[] = [];

  // 2. FIBER MATRIX & VISCOSITY FACTOR
  // Soluble/insoluble fiber forms an intestinal boundary layer, delaying alpha-amylase action
  if (fiber > 0 && carbs > 0) {
    const fiberRatio = fiber / carbs;
    if (fiberRatio >= 0.25 || fiber >= 8) {
      const delay = Math.min(35, Math.round(fiber * 2.8));
      const bluntPct = Math.min(35, Math.round(fiberRatio * 60));
      peakMinutes += delay;
      rawGlucoseRise *= 1 - bluntPct / 100;
      factors.push({
        name: 'Viscous Fiber Gel Matrix',
        badge: `+${delay}m peak delay · -${bluntPct}% spike`,
        type: 'delay',
        effect: 'Forms a viscous barrier in the small intestine, slowing enzymatic carbohydrate breakdown and smoothing glucose flux.',
        detail: `${fiber}g dietary fiber blunts insulin surge and sustains release.`,
      });
    } else if (fiber >= 3) {
      const delay = Math.min(20, Math.round(fiber * 2));
      const bluntPct = Math.min(20, Math.round(fiberRatio * 40));
      peakMinutes += delay;
      rawGlucoseRise *= 1 - bluntPct / 100;
      factors.push({
        name: 'Fiber Moderation',
        badge: `+${delay}m peak delay`,
        type: 'delay',
        effect: 'Moderates absorption rate, preventing an acute glycemic spike.',
        detail: `${fiber}g fiber slows gastric passage.`,
      });
    }
  }

  // 3. PROTEIN CO-INGESTION & INCRETIN (GLP-1 / GIP) STIMULATION
  // Amino acids stimulate early incretin secretion from L-cells, promoting first-phase insulin before glucose peak
  if (protein >= 15) {
    const proteinRatio = netCarbs > 0 ? protein / netCarbs : 2;
    const bluntPct = Math.min(30, Math.round(Math.min(proteinRatio, 1.5) * 20));
    const delay = Math.min(25, Math.round(protein * 0.45));
    peakMinutes += delay;
    rawGlucoseRise *= 1 - bluntPct / 100;

    factors.push({
      name: 'Protein Incretin Stimulation (GLP-1/GIP)',
      badge: `+${delay}m delay · -${bluntPct}% peak`,
      type: 'blunt',
      effect: 'Triggers early cephalic and gut incretin release, priming insulin sensitivity and muscle amino uptake.',
      detail: `${protein}g protein stimulates steady peripheral glucose uptake.`,
    });
  }

  // 4. DIETARY FAT & CHOLECYSTOKININ (CCK) GASTRIC BRAKE
  // Fat entering the duodenum stimulates CCK and PYY, substantially slowing gastric motility ("ileal brake")
  if (fats >= 10) {
    const delay = Math.min(45, Math.round(fats * 1.5));
    const bluntPct = Math.min(28, Math.round(fats * 0.7));
    peakMinutes += delay;
    rawGlucoseRise *= 1 - bluntPct / 100;

    factors.push({
      name: 'Lipid-Induced CCK Gastric Brake',
      badge: `+${delay}m digestion deceleration`,
      type: 'delay',
      effect: 'Fats stimulate cholecystokinin release in the duodenum, substantially extending gastric emptying time and prolonging energy release.',
      detail: `${fats}g dietary fat prevents glycemic spikes and provides multi-hour fuel.`,
    });
  }

  // 5. TOTAL MEAL VOLUME & CALORIC LOAD
  if (safeCalories >= 600 || grams >= 400) {
    const volDelay = Math.min(30, Math.round((safeCalories - 500) / 35));
    peakMinutes += volDelay;
    factors.push({
      name: 'Digestive Mass & Caloric Density',
      badge: `+${volDelay}m prolonged gastric transit`,
      type: 'delay',
      effect: 'Large caloric volume takes longer for mechanical churning and pyloric outflow, postponing optimal mileage.',
      detail: `${safeCalories} kcal total meal mass demands extended splanchnic circulation.`,
    });
  }

  // Bound peak rise and peak minutes
  const peakRise = Math.max(4, Math.round(rawGlucoseRise));
  const finalPeakMinutes = Math.min(130, Math.max(30, Math.round(peakMinutes)));
  const peakEstimatedGlucose = baselineGlucose + peakRise;

  // Categorize Glycemic Impact
  let glycemicImpactCategory: GlycemicProfile['glycemicImpactCategory'] = 'Low / Sustained';
  if (netCarbs < 10) {
    glycemicImpactCategory = 'Minimal Glycemic Impact';
  } else if (peakRise <= 25) {
    glycemicImpactCategory = 'Low / Sustained';
  } else if (peakRise <= 45) {
    glycemicImpactCategory = 'Moderate Steady';
  } else {
    glycemicImpactCategory = 'Pronounced Spike';
  }

  // Digestion Speed Category
  let digestionSpeed: GlycemicProfile['digestionSpeed'] = 'Moderate Controlled';
  if (finalPeakMinutes <= 45) {
    digestionSpeed = 'Rapid Clearance';
  } else if (finalPeakMinutes >= 75) {
    digestionSpeed = 'Slow & Prolonged';
  }

  // Reactive Hypoglycemia Risk (Crash)
  // Occurs if net carbs are high (>40g) while protein and fats are low, causing sudden spike and rapid drop below baseline
  const isHighCarb = netCarbs >= 40;
  const isLowBuffer = protein < 15 && fats < 8 && fiber < 4;
  const reactiveHypoRisk = isHighCarb && isLowBuffer;
  const reactiveHypoTime = reactiveHypoRisk
    ? addMinutesToTime(mealTime, finalPeakMinutes + 55)
    : undefined;

  if (reactiveHypoRisk) {
    factors.push({
      name: 'Reactive Hypoglycemia Risk (Sugar Slump)',
      badge: '⚠️ Post-Meal Dip Risk',
      type: 'caution',
      effect: 'High rapid carbohydrates with low buffering fat/protein/fiber may cause rapid insulin secretion, followed by an energy dip ~90m post-meal.',
      detail: 'If training during this dip, consume a small 15g complex carbohydrate or amino acid buffer.',
    });
  }

  // 6. GENERATE HOURLY CURVE (0 to 240 mins)
  const curve: GlycemicCurvePoint[] = [];
  const durationMinutes = 240;
  const step = 15;

  // Workout Window calculations
  // Splanchnic clearance:
  // Light meals (e.g. <300 kcal, low fat): ready in 35-45 mins
  // Moderate meals: ready in 50-70 mins
  // Heavy/high fat meals: ready in 75-100 mins
  const splanchnicRestMinutes = Math.min(
    95,
    Math.max(30, Math.round(25 + (fats * 1.4) + (safeCalories / 45)))
  );

  // Peak training window:
  // Starts right around when gastric fullness settles and circulating glucose is elevated
  const workoutStartMinutes = splanchnicRestMinutes;
  // Ends when glucose returns near baseline and glycogen uptake rate tapers off
  const workoutEndMinutes = Math.min(
    220,
    Math.max(workoutStartMinutes + 45, Math.round(finalPeakMinutes + 65 + (fats * 1.5)))
  );

  for (let m = 0; m <= durationMinutes; m += step) {
    const timeLabel = addMinutesToTime(mealTime, m);

    // Physiological gamma/skewed bell curve model for postprandial glucose
    let relativeRise = 0;
    if (m <= finalPeakMinutes) {
      // Ascending absorption limb
      const ratio = m / finalPeakMinutes;
      relativeRise = peakRise * Math.pow(ratio, 1.4);
    } else {
      // Descending clearance limb
      const descentMinutes = m - finalPeakMinutes;
      // clearance rate is slower if fat and fiber are present
      const halfLife = 45 + fats * 1.8 + fiber * 1.5;
      const decay = Math.exp(-descentMinutes / halfLife);

      if (reactiveHypoRisk && descentMinutes >= 45 && descentMinutes <= 90) {
        // dip below baseline
        relativeRise = -8 * Math.sin(((descentMinutes - 45) / 45) * Math.PI);
      } else {
        relativeRise = Math.max(0, peakRise * decay);
      }
    }

    relativeRise = Math.round(relativeRise * 10) / 10;
    const absoluteEstimatedGlucose = Math.round((baselineGlucose + relativeRise) * 10) / 10;

    let phase: GlycemicCurvePoint['phase'] = 'baseline';
    let phaseLabel = 'Resting Baseline';

    if (m < workoutStartMinutes) {
      phase = 'splanchnic_digestion';
      phaseLabel = 'Digestive Transit (Avoid Heavy Lifting)';
    } else if (m >= workoutStartMinutes && m <= workoutEndMinutes) {
      phase = 'optimal_workout';
      phaseLabel = '⚡ Optimal Mileage Window (Peak Muscular Energy)';
    } else if (m > workoutEndMinutes && relativeRise > 5) {
      phase = 'sustained_fuel';
      phaseLabel = 'Sustained Metabolic Burn';
    } else {
      phase = 'baseline';
      phaseLabel = 'Baseline Return';
    }

    curve.push({
      minute: m,
      timeLabel,
      glucoseRiseMgDl: relativeRise,
      absoluteEstimatedGlucose,
      phase,
      phaseLabel,
    });
  }

  // 7. WORKOUT RECOMMENDATIONS
  const startTime = addMinutesToTime(mealTime, workoutStartMinutes);
  const endTime = addMinutesToTime(mealTime, workoutEndMinutes);
  const heavyLiftingTime = addMinutesToTime(mealTime, Math.max(workoutStartMinutes + 15, finalPeakMinutes));
  const hiitCardioTime = addMinutesToTime(mealTime, Math.max(workoutStartMinutes + 30, workoutEndMinutes - 20));

  const guidance: string[] = [];

  if (fats >= 22) {
    guidance.push(
      `High fat content (${fats}g) slows gastric clearance. Allow at least ${splanchnicRestMinutes} minutes before heavy squats, deadlifts, or sprinting to prevent reflux.`
    );
  } else if (netCarbs >= 50 && protein >= 25) {
    guidance.push(
      `Excellent anabolic primer! Prime muscle glycogen availability peaks between ${formatTimeTo12Hour(startTime)} and ${formatTimeTo12Hour(endTime)}.`
    );
  } else if (netCarbs < 15) {
    guidance.push(
      `Low carbohydrate meal: Energy will be sustained via beta-oxidation and amino acids rather than acute glucose surges. Great for steady-state cardio or fat adaptation.`
    );
  }

  if (reactiveHypoRisk) {
    guidance.push(
      `⚠️ Potential reactive dip around ${formatTimeTo12Hour(reactiveHypoTime!)}. Keep hydration high or begin mileage before the 90-minute mark to utilize active glucose.`
    );
  } else {
    guidance.push(
      `Cellular glucose flux remains elevated and muscle pump potential is elevated during ${formatTimeTo12Hour(startTime)} - ${formatTimeTo12Hour(endTime)}.`
    );
  }

  const workoutWindow: WorkoutWindowRecommendation = {
    startTime: formatTimeTo12Hour(startTime),
    endTime: formatTimeTo12Hour(endTime),
    startMinutesFromMeal: workoutStartMinutes,
    endMinutesFromMeal: workoutEndMinutes,
    readinessRating:
      fats > 30 ? 'moderate' : netCarbs >= 30 && protein >= 20 ? 'optimal' : 'optimal',
    headline: `Prime Mileage Window: ${formatTimeTo12Hour(startTime)} – ${formatTimeTo12Hour(endTime)}`,
    heavyLiftingWindow: `Best ~${formatTimeTo12Hour(heavyLiftingTime)} (Stomach 75% cleared, maximum amino/glucose availability)`,
    hiitCardioWindow: `Best ~${formatTimeTo12Hour(hiitCardioTime)} (Complete gastric lightness for mileage)`,
    guidance,
  };

  const hydrationTip = `Hydrate with 350-500ml water during the ${splanchnicRestMinutes}m digestion phase to accelerate nutrient delivery to muscle fibers.`;

  return {
    mealTime,
    baselineGlucose,
    estimatedPeakMinutes: finalPeakMinutes,
    estimatedPeakTime: formatTimeTo12Hour(addMinutesToTime(mealTime, finalPeakMinutes)),
    peakGlucoseRiseMgDl: peakRise,
    peakEstimatedGlucose,
    glycemicImpactCategory,
    digestionSpeed,
    netCarbs: Math.round(netCarbs * 10) / 10,
    factors,
    curve,
    workoutWindow,
    reactiveHypoRisk,
    reactiveHypoTime: reactiveHypoTime ? formatTimeTo12Hour(reactiveHypoTime) : undefined,
    hydrationTip,
  };
}
