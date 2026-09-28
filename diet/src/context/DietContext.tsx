import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { MealEntry, DailyLog, MealType, FoodItem } from '../types/diet';
import { MealPreset } from '../data/foodDatabase';
import { INITIAL_MEALS, INITIAL_DAILY_LOGS } from '../data/seedData';
import { formatDateToIso, getFoodReferenceGrams } from '../utils/nutritionCalculations';
import { useAuth } from './AuthContext';

interface MacroStatus {
  consumed: number;
  target: number;
  remaining: number; // 0 if exceeded
  exceeded: number;  // 0 if under or equal to target
  percentage: number;
  isExceeded: boolean;
}

export interface DayNutrientSummary {
  calories: MacroStatus;
  protein: MacroStatus;
  carbs: MacroStatus;
  fats: MacroStatus;
  fiber: MacroStatus;
  water: MacroStatus;
  mealsCount: number;
  breakfastCalories: number;
  lunchCalories: number;
  dinnerCalories: number;
  snacksCalories: number;
}

interface DietContextType {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  jumpToToday: () => void;
  nextDay: () => void;
  prevDay: () => void;
  meals: MealEntry[];
  currentDayMeals: MealEntry[];
  summary: DayNutrientSummary;
  addMeal: (entry: Omit<MealEntry, 'id' | 'userId' | 'timeLogged'>) => void;
  updateMeal: (id: string, entry: Partial<MealEntry>) => void;
  deleteMeal: (id: string) => void;
  quickAddFood: (food: FoodItem, mealType: MealType, multiplier?: number) => void;
  quickAddPreset: (preset: MealPreset, mealType: MealType) => void;
  currentDayWater: number;
  setWaterForDay: (amountMl: number) => void;
  addWaterForDay: (deltaMl: number) => void;
  exportAllData: () => string;
  importAllData: (jsonData: string) => boolean;
  clearDayMeals: () => void;
}

const STORAGE_MEALS_KEY = 'astradiet_v2_meals';
const STORAGE_DAILY_LOGS_KEY = 'astradiet_v2_daily_logs';

const DietContext = createContext<DietContextType | undefined>(undefined);

export const DietProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateToIso(new Date()));

  const [meals, setMeals] = useState<MealEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MEALS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback
    }
    return INITIAL_MEALS;
  });

  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DAILY_LOGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback
    }
    return INITIAL_DAILY_LOGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MEALS_KEY, JSON.stringify(meals));
    } catch (e) {
      console.error('Error saving meals', e);
    }
  }, [meals]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_DAILY_LOGS_KEY, JSON.stringify(dailyLogs));
    } catch (e) {
      console.error('Error saving daily logs', e);
    }
  }, [dailyLogs]);

  const jumpToToday = () => {
    setSelectedDate(formatDateToIso(new Date()));
  };

  const nextDay = () => {
    const current = new Date(`${selectedDate}T12:00:00`);
    current.setDate(current.getDate() + 1);
    setSelectedDate(formatDateToIso(current));
  };

  const prevDay = () => {
    const current = new Date(`${selectedDate}T12:00:00`);
    current.setDate(current.getDate() - 1);
    setSelectedDate(formatDateToIso(current));
  };

  // Filter meals for the active user on selected date
  const currentDayMeals = useMemo(() => {
    if (!currentUser) return [];
    return meals.filter(
      (m) => m.userId === currentUser.id && m.date === selectedDate
    );
  }, [meals, currentUser, selectedDate]);

  // Current day water
  const currentDayWater = useMemo(() => {
    const log = dailyLogs.find((l) => l.date === selectedDate);
    return log ? log.waterMl : 0;
  }, [dailyLogs, selectedDate]);

  const setWaterForDay = (amountMl: number) => {
    const clamped = Math.max(0, Math.min(10000, Math.round(amountMl)));
    setDailyLogs((prev) => {
      const existing = prev.find((l) => l.date === selectedDate);
      if (existing) {
        return prev.map((l) =>
          l.date === selectedDate ? { ...l, waterMl: clamped } : l
        );
      } else {
        return [...prev, { date: selectedDate, waterMl: clamped }];
      }
    });
  };

  const addWaterForDay = (deltaMl: number) => {
    setWaterForDay(currentDayWater + deltaMl);
  };

  // Calculations for summary: Consumed vs Target vs Remaining vs Exceeded
  const summary: DayNutrientSummary = useMemo(() => {
    const targets = currentUser?.targets || {
      calories: 2000,
      protein: 150,
      carbs: 200,
      fats: 65,
      water: 2500,
      fiber: 30,
    };

    let totalCal = 0;
    let totalProt = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;
    let bCal = 0;
    let lCal = 0;
    let dCal = 0;
    let sCal = 0;

    for (const m of currentDayMeals) {
      totalCal += m.calories || 0;
      totalProt += m.protein || 0;
      totalCarbs += m.carbs || 0;
      totalFat += m.fats || 0;
      totalFiber += m.fiber || 0;

      if (m.mealType === 'breakfast') bCal += m.calories || 0;
      else if (m.mealType === 'lunch') lCal += m.calories || 0;
      else if (m.mealType === 'dinner') dCal += m.calories || 0;
      else if (m.mealType === 'snacks') sCal += m.calories || 0;
    }

    const calcStatus = (consumed: number, target: number): MacroStatus => {
      const diff = consumed - target;
      const isExceeded = diff > 0;
      const remaining = isExceeded ? 0 : Math.max(0, target - consumed);
      const exceeded = isExceeded ? diff : 0;
      const percentage = target > 0 ? Math.round((consumed / target) * 100) : 0;

      return {
        consumed: Math.round(consumed * 10) / 10,
        target: Math.round(target),
        remaining: Math.round(remaining * 10) / 10,
        exceeded: Math.round(exceeded * 10) / 10,
        percentage,
        isExceeded,
      };
    };

    return {
      calories: calcStatus(totalCal, targets.calories),
      protein: calcStatus(totalProt, targets.protein),
      carbs: calcStatus(totalCarbs, targets.carbs),
      fats: calcStatus(totalFat, targets.fats),
      fiber: calcStatus(totalFiber, targets.fiber),
      water: calcStatus(currentDayWater, targets.water),
      mealsCount: currentDayMeals.length,
      breakfastCalories: Math.round(bCal),
      lunchCalories: Math.round(lCal),
      dinnerCalories: Math.round(dCal),
      snacksCalories: Math.round(sCal),
    };
  }, [currentUser, currentDayMeals, currentDayWater]);

  const addMeal = (entry: Omit<MealEntry, 'id' | 'userId' | 'timeLogged'>) => {
    if (!currentUser) return;
    const now = new Date();
    const timeLogged = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newMeal: MealEntry = {
      ...entry,
      id: `meal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: currentUser.id,
      timeLogged,
    };

    setMeals((prev) => [...prev, newMeal]);
  };

  const updateMeal = (id: string, entry: Partial<MealEntry>) => {
    setMeals((prev) => prev.map((m) => (m.id === id ? { ...m, ...entry } : m)));
  };

  const deleteMeal = (id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  };

  const quickAddFood = (food: FoodItem, mealType: MealType, multiplier = 1) => {
    if (!currentUser) return;
    const refGrams = getFoodReferenceGrams(food);
    const calculatedGrams = Math.round(refGrams * multiplier);
    addMeal({
      date: selectedDate,
      mealType,
      foodName: food.name,
      servings: multiplier,
      servingUnit: food.servingUnit,
      grams: calculatedGrams,
      calories: Math.round(food.calories * multiplier),
      protein: Math.round(food.protein * multiplier * 10) / 10,
      carbs: Math.round(food.carbs * multiplier * 10) / 10,
      fats: Math.round(food.fats * multiplier * 10) / 10,
      fiber: Math.round(food.fiber * multiplier * 10) / 10,
    });
  };

  const quickAddPreset = (preset: MealPreset, mealType: MealType) => {
    if (!currentUser) return;
    addMeal({
      date: selectedDate,
      mealType,
      foodName: preset.name,
      servings: 1,
      servingUnit: 'preset combo',
      grams: 300,
      calories: preset.calories,
      protein: preset.protein,
      carbs: preset.carbs,
      fats: preset.fats,
      fiber: preset.fiber,
    });
  };

  const clearDayMeals = () => {
    if (!currentUser) return;
    setMeals((prev) =>
      prev.filter((m) => !(m.userId === currentUser.id && m.date === selectedDate))
    );
  };

  const exportAllData = () => {
    const data = {
      exportTimestamp: new Date().toISOString(),
      meals,
      dailyLogs,
    };
    return JSON.stringify(data, null, 2);
  };

  const importAllData = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed.meals)) {
        setMeals(parsed.meals);
      }
      if (Array.isArray(parsed.dailyLogs)) {
        setDailyLogs(parsed.dailyLogs);
      }
      return true;
    } catch {
      return false;
    }
  };

  return (
    <DietContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        jumpToToday,
        nextDay,
        prevDay,
        meals,
        currentDayMeals,
        summary,
        addMeal,
        updateMeal,
        deleteMeal,
        quickAddFood,
        quickAddPreset,
        currentDayWater,
        setWaterForDay,
        addWaterForDay,
        exportAllData,
        importAllData,
        clearDayMeals,
      }}
    >
      {children}
    </DietContext.Provider>
  );
};

export const useDiet = () => {
  const context = useContext(DietContext);
  if (!context) {
    throw new Error('useDiet must be used within a DietProvider');
  }
  return context;
};
