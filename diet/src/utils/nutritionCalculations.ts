import { ActivityLevel, DietGoal, Gender, MacroTargets } from '../types/diet';

export function calculateBMR(gender: Gender, weightKg: number, heightCm: number, age: number): number {
  if (gender === 'male') {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
  } else if (gender === 'female') {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
  } else {
    // Average
    const male = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    const female = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    return Math.round((male + female) / 2);
  }
}

export function getActivityMultiplier(level: ActivityLevel): number {
  switch (level) {
    case 'sedentary':
      return 1.2;
    case 'light':
      return 1.375;
    case 'moderate':
      return 1.55;
    case 'very_active':
      return 1.725;
    case 'athlete':
      return 1.9;
    default:
      return 1.4;
  }
}

export function calculateTDEE(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number,
  activityLevel: ActivityLevel
): number {
  const bmr = calculateBMR(gender, weightKg, heightCm, age);
  const mult = getActivityMultiplier(activityLevel);
  return Math.round(bmr * mult);
}

export function calculateTargetCalories(tdee: number, goal: DietGoal): number {
  switch (goal) {
    case 'weight_loss':
      return Math.max(1200, Math.round(tdee - 500));
    case 'mild_loss':
      return Math.max(1200, Math.round(tdee - 250));
    case 'maintenance':
      return Math.round(tdee);
    case 'lean_bulk':
      return Math.round(tdee + 250);
    case 'muscle_gain':
      return Math.round(tdee + 450);
    case 'keto':
      return Math.max(1200, Math.round(tdee - 300));
    default:
      return Math.round(tdee);
  }
}

export function calculateMacrosFromPercentages(
  calories: number,
  proteinPct: number,
  carbsPct: number,
  fatsPct: number,
  weightKg: number
): MacroTargets {
  // Protein: 4 kcal/g, Carbs: 4 kcal/g, Fat: 9 kcal/g
  const protein = Math.round((calories * (proteinPct / 100)) / 4);
  const carbs = Math.round((calories * (carbsPct / 100)) / 4);
  const fats = Math.round((calories * (fatsPct / 100)) / 9);
  
  // Water recommendation: approx 35ml per kg of bodyweight
  const water = Math.round(Math.max(2000, weightKg * 35));
  
  // Fiber recommendation: approx 14g per 1000 kcal
  const fiber = Math.round((calories / 1000) * 14);

  return {
    calories,
    protein,
    carbs,
    fats,
    water,
    fiber,
  };
}

export function getRecommendedSplit(goal: DietGoal): { proteinPct: number; carbsPct: number; fatsPct: number } {
  switch (goal) {
    case 'weight_loss':
    case 'mild_loss':
      // Higher protein for muscle sparing
      return { proteinPct: 35, carbsPct: 35, fatsPct: 30 };
    case 'muscle_gain':
    case 'lean_bulk':
      // High protein, abundant carbs for fuel
      return { proteinPct: 30, carbsPct: 45, fatsPct: 25 };
    case 'keto':
      // Low carb, high fat
      return { proteinPct: 25, carbsPct: 5, fatsPct: 70 };
    case 'maintenance':
    default:
      // Balanced
      return { proteinPct: 30, carbsPct: 40, fatsPct: 30 };
  }
}

export function formatDateToIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Extracts the single standard reference portion weight in grams (or ml) for a catalogue food item.
 * For example:
 * - Fresh Banana: servingSize: 1, servingUnit: "medium (118g)" -> returns 118
 * - Whole Egg: servingSize: 1, servingUnit: "large egg (50g)" -> returns 50
 * - Bread: servingSize: 1, servingUnit: "slice (40g)" -> returns 40
 * - Chicken: servingSize: 100, servingUnit: "g" -> returns 100
 * - Oats: servingSize: 50, servingUnit: "g (1/2 cup)" -> returns 50
 */
export function getFoodReferenceGrams(food: {
  servingUnit?: string;
  servingSize?: number;
  defaultGrams?: number;
}): number {
  if (food.defaultGrams && food.defaultGrams > 0) {
    return food.defaultGrams;
  }
  // If food has servingSize in grams (e.g. 100g, 50g, 140g)
  if (typeof food.servingSize === 'number' && food.servingSize > 1) {
    return food.servingSize;
  }
  // If food is piece/serving-based (servingSize === 1), check for grams in servingUnit
  if (food.servingUnit) {
    const match = food.servingUnit.match(/(?:~|\(|\b)(\d+(?:\.\d+)?)\s*(?:g|ml)\b/i);
    if (match && parseFloat(match[1]) > 0) {
      return parseFloat(match[1]);
    }
  }
  return 100;
}
