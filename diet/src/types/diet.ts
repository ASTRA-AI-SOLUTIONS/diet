export type Gender = 'male' | 'female' | 'other';

export type ActivityLevel = 
  | 'sedentary'      // Little or no exercise
  | 'light'          // Exercise 1-3 times/week
  | 'moderate'       // Exercise 3-5 times/week
  | 'very_active'    // Hard exercise 6-7 times/week
  | 'athlete';       // Very hard exercise, physical job or 2x/day training

export type DietGoal = 
  | 'weight_loss'    // ~20% deficit
  | 'mild_loss'      // ~10% deficit
  | 'maintenance'    // TDEE
  | 'lean_bulk'      // ~10% surplus
  | 'muscle_gain'    // ~15-20% surplus
  | 'keto';          // High fat, low carb

export interface MacroTargets {
  calories: number;
  protein: number; // in grams
  carbs: number;   // in grams
  fats: number;    // in grams
  water: number;   // in ml
  fiber: number;   // in grams
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  goal: DietGoal;
  dietaryPreferences: string[];
  macroSplit: {
    proteinPct: number;
    carbsPct: number;
    fatsPct: number;
  };
  targets: MacroTargets;
  passcode?: string;
  createdAt: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface FoodItem {
  id: string;
  name: string;
  category: 'Indian Cuisine' | 'Protein' | 'Carbs' | 'Fats' | 'Produce' | 'Dairy' | 'Snacks' | 'Custom' | string;
  cuisine?: 'Indian' | 'Global' | string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  defaultGrams?: number;
  hindiName?: string;
}

export interface MealEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  foodName: string;
  servings: number;
  servingUnit: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  timeLogged: string;
  mealTime?: string; // Optional user-specified consumption time (e.g. "12:30")
}

export interface DailyLog {
  date: string;
  waterMl: number;
  notes?: string;
}

export interface DaySummary {
  consumedCalories: number;
  consumedProtein: number;
  consumedCarbs: number;
  consumedFats: number;
  consumedFiber: number;
  waterMl: number;
}
