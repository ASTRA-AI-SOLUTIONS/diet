import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDiet } from '../context/DietContext';
import { FoodItem, MealType } from '../types/diet';
import { FOOD_DATABASE, POPULAR_MEAL_PRESETS, MealPreset } from '../data/foodDatabase';
import {
  calculateMealGlycemicProfile,
  formatTimeTo12Hour,
} from '../utils/glycemicCalculations';
import { getFoodReferenceGrams } from '../utils/nutritionCalculations';
import {
  X,
  Search,
  Plus,
  Flame,
  Check,
  Info,
  Clock,
  Zap,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Globe,
  Loader2,
} from 'lucide-react';

interface MealLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMealType?: MealType;
}

export const MealLoggerModal: React.FC<MealLoggerModalProps> = ({
  isOpen,
  onClose,
  initialMealType = 'breakfast',
}) => {
  const { addMeal, summary, selectedDate } = useDiet();

  const [activeTab, setActiveTab] = useState<'database' | 'presets' | 'custom'>('database');
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Optional Meal Consumption Time
  const [specifyTime, setSpecifyTime] = useState(false);
  const [mealTimeInput, setMealTimeInput] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  // Selected food for portion configuration
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [multiplier, setMultiplier] = useState<string | number>(1);
  const [customGrams, setCustomGrams] = useState<string | number>(100);

  // Custom entry form
  const [customName, setCustomName] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFats, setCustomFats] = useState('');
  const [customFiber, setCustomFiber] = useState('');
  const [customServingUnit, setCustomServingUnit] = useState('serving');

  // Reset or initialize when modal opens or initialMealType changes
  React.useEffect(() => {
    if (isOpen) {
      setMealType(initialMealType);
      setSelectedFood(null);
      setMultiplier(1);
      const now = new Date();
      setMealTimeInput(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
    }
  }, [isOpen, initialMealType]);

  const [onlineResults, setOnlineResults] = useState<FoodItem[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  const categories = ['All', 'Indian Cuisine', 'Protein', 'Carbs', 'Fats', 'Produce', 'Dairy', 'Snacks'];

  const filteredFoods = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return FOOD_DATABASE.filter((food) => {
      const matchesSearch =
        !q ||
        food.name.toLowerCase().includes(q) ||
        (food.hindiName && food.hindiName.toLowerCase().includes(q)) ||
        (food.cuisine && food.cuisine.toLowerCase().includes(q)) ||
        (food.category && food.category.toLowerCase().includes(q));

      const matchesCat =
        selectedCategory === 'All'
          ? true
          : selectedCategory === 'Indian Cuisine'
          ? food.category === 'Indian Cuisine' || food.cuisine === 'Indian'
          : food.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    let isActive = true;
    if (searchQuery.trim().length > 2) {
      setIsSearchingOnline(true);
      const delayDebounceFn = setTimeout(() => {
        if (isActive) searchOnlineFood(searchQuery.trim(), () => isActive);
      }, 500);
      return () => {
        isActive = false;
        clearTimeout(delayDebounceFn);
      };
    } else {
      setOnlineResults([]);
      setIsSearchingOnline(false);
    }
  }, [searchQuery]);

  const searchOnlineFood = async (query: string, getIsActive: () => boolean) => {
    try {
      // Fetch both Indian-prioritized results and Global results simultaneously
      const [indiaRes, globalRes] = await Promise.all([
        fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&countries_tags_en=india&search_simple=1&action=process&json=1&page_size=15`, {
          headers: { 'User-Agent': 'AstraDiet-MacroTracker/1.0' }
        }),
        fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`, {
          headers: { 'User-Agent': 'AstraDiet-MacroTracker/1.0' }
        })
      ]);

      const indiaData = await indiaRes.json();
      const globalData = await globalRes.json();

      let combinedProducts: any[] = [];
      const seenIds = new Set();

      // Add Indian results first
      if (indiaData.products) {
        indiaData.products.forEach((p: any) => {
          if (p.product_name && !seenIds.has(p._id || p.code)) {
            seenIds.add(p._id || p.code);
            combinedProducts.push(p);
          }
        });
      }

      // Append Global results
      if (globalData.products) {
        globalData.products.forEach((p: any) => {
          if (p.product_name && !seenIds.has(p._id || p.code)) {
            seenIds.add(p._id || p.code);
            combinedProducts.push(p);
          }
        });
      }

      if (combinedProducts.length > 0) {
        const results: FoodItem[] = combinedProducts
          .map((p: any) => {
            const serving = Number(p.serving_quantity) || 100;
            const unit = p.serving_quantity_unit || 'g';
            const multiplier = serving / 100;
            
            const n = p.nutriments || {};
            let kcal100 = n['energy-kcal_100g'];
            if (kcal100 === undefined || kcal100 === null) {
               kcal100 = n['energy_100g'] ? n['energy_100g'] / 4.184 : 0;
            }
            
            return {
              id: `online_${p._id || p.code || Math.random().toString()}`,
              name: p.product_name + (p.brands ? ` (${p.brands.split(',')[0]})` : ''),
              category: 'Global DB',
              cuisine: 'Global',
              servingSize: serving,
              servingUnit: unit,
              calories: Math.round((kcal100 || 0) * multiplier),
              protein: Number(((n.proteins_100g || 0) * multiplier).toFixed(1)),
              carbs: Number(((n.carbohydrates_100g || 0) * multiplier).toFixed(1)),
              fats: Number(((n.fat_100g || 0) * multiplier).toFixed(1)),
              fiber: Number(((n.fiber_100g || 0) * multiplier).toFixed(1)),
              defaultGrams: typeof serving === 'number' && unit === 'g' ? serving : 100,
            };
          });
        if (getIsActive()) {
          setOnlineResults(results);
        }
      }
    } catch (err) {
      console.error("Failed to search online foods:", err);
    } finally {
      if (getIsActive()) {
        setIsSearchingOnline(false);
      }
    }
  };

  const handleSelectFood = (food: FoodItem) => {
    const refGrams = getFoodReferenceGrams(food);
    setSelectedFood(food);
    setMultiplier(1);
    setCustomGrams(refGrams);
  };

  const handleMultiplierIncrement = (delta: number) => {
    const current = typeof multiplier === 'number' ? multiplier : parseFloat(String(multiplier)) || 1;
    const next = Math.max(0.1, Math.round((current + delta) * 100) / 100);
    setMultiplier(next);
    if (selectedFood) {
      const refGrams = getFoodReferenceGrams(selectedFood);
      setCustomGrams(Math.round(refGrams * next));
    }
  };

  // Live computed values: entered grams directly overrides reference catalogue weight
  const preview = useMemo(() => {
    if (!selectedFood) return null;
    const refGrams = getFoodReferenceGrams(selectedFood);
    const parsedGrams = typeof customGrams === 'number' ? customGrams : parseFloat(String(customGrams));
    const activeGrams = !isNaN(parsedGrams) && parsedGrams > 0 ? parsedGrams : refGrams;

    const factor = refGrams > 0 ? activeGrams / refGrams : 1;
    const cal = Math.round(selectedFood.calories * factor);
    const p = Math.round(selectedFood.protein * factor * 10) / 10;
    const c = Math.round(selectedFood.carbs * factor * 10) / 10;
    const f = Math.round(selectedFood.fats * factor * 10) / 10;
    const fib = Math.round(selectedFood.fiber * factor * 10) / 10;
    const totalGrams = Math.round(activeGrams);
    const multiplierDisplay = Math.round(factor * 100) / 100;

    // Projected totals
    const projectedCal = summary.calories.consumed + cal;
    const calDiff = summary.calories.target - projectedCal;

    return {
      calories: cal,
      protein: p,
      carbs: c,
      fats: f,
      fiber: fib,
      totalGrams,
      refGrams,
      multiplierDisplay,
      projectedCal,
      calDiff,
      willExceed: projectedCal > summary.calories.target,
    };
  }, [selectedFood, customGrams, summary]);

  // Real-time Glycemic Profile calculation when time is enabled
  const liveGlycemicProfile = useMemo(() => {
    if (!specifyTime) return null;

    if (activeTab === 'database' && preview) {
      return calculateMealGlycemicProfile({
        mealTime: mealTimeInput,
        carbs: preview.carbs,
        protein: preview.protein,
        fats: preview.fats,
        fiber: preview.fiber,
        calories: preview.calories,
        grams: preview.totalGrams,
        foodName: selectedFood?.name,
      });
    } else if (activeTab === 'custom') {
      const c = Number(customCarbs) || 0;
      const p = Number(customProtein) || 0;
      const f = Number(customFats) || 0;
      const fib = Number(customFiber) || 0;
      const cal = Number(customCalories) || (c * 4 + p * 4 + f * 9);
      if (c === 0 && p === 0 && f === 0) return null;

      return calculateMealGlycemicProfile({
        mealTime: mealTimeInput,
        carbs: c,
        protein: p,
        fats: f,
        fiber: fib,
        calories: cal,
        grams: 150,
        foodName: customName || 'Custom Food',
      });
    }
    return null;
  }, [
    specifyTime,
    mealTimeInput,
    activeTab,
    preview,
    customGrams,
    selectedFood,
    customCarbs,
    customProtein,
    customFats,
    customFiber,
    customCalories,
    customName,
  ]);

  const handleAddSelectedFood = () => {
    if (!selectedFood || !preview) return;

    addMeal({
      date: selectedDate,
      mealType,
      foodName: selectedFood.name,
      servings: preview.multiplierDisplay,
      servingUnit: selectedFood.servingUnit,
      grams: preview.totalGrams,
      calories: preview.calories,
      protein: preview.protein,
      carbs: preview.carbs,
      fats: preview.fats,
      fiber: preview.fiber,
      mealTime: specifyTime ? mealTimeInput : undefined,
    });

    setSelectedFood(null);
    onClose();
  };

  const handleAddPreset = (preset: MealPreset) => {
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
      mealTime: specifyTime ? mealTimeInput : undefined,
    });
    onClose();
  };

  const handleAddCustomMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const cal = Number(customCalories) || 0;
    const p = Number(customProtein) || 0;
    const c = Number(customCarbs) || 0;
    const f = Number(customFats) || 0;
    const fib = Number(customFiber) || 0;

    addMeal({
      date: selectedDate,
      mealType,
      foodName: customName.trim(),
      servings: 1,
      servingUnit: customServingUnit.trim() || 'serving',
      grams: 150,
      calories: cal,
      protein: p,
      carbs: c,
      fats: f,
      fiber: fib,
      mealTime: specifyTime ? mealTimeInput : undefined,
    });

    // Reset
    setCustomName('');
    setCustomCalories('');
    setCustomProtein('');
    setCustomCarbs('');
    setCustomFats('');
    setCustomFiber('');
    onClose();
  };

  const handleSetNow = () => {
    const now = new Date();
    setMealTimeInput(
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111114] text-zinc-100 shadow-2xl"
          >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Flame className="w-4 h-4 text-zinc-400" />
                Log Nutrition Intake
              </h3>
              <p className="text-xs text-zinc-400">
                Search verified foods, adjust portions, and model postprandial glycemic surge
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Meal Type & Timing Selector Bar */}
          <div className="bg-zinc-900/60 border-b border-white/[0.06] px-6 py-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Target Window:
              </span>
              <div className="flex items-center gap-1 p-1 bg-zinc-950/80 rounded-xl border border-white/[0.06]">
                {(['breakfast', 'lunch', 'dinner', 'snacks'] as MealType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setMealType(type)}
                    className={`px-3 py-1 text-xs font-semibold capitalize rounded-lg transition-all cursor-pointer ${
                      mealType === type
                        ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Meal Consumption Time Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.04]">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={specifyTime}
                  onChange={(e) => setSpecifyTime(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  Specify consumption time (models Blood Glucose &amp; Mileage Window)
                </span>
              </label>

              {specifyTime && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 flex-wrap"
                >
                  <input
                    type="text"
                    placeholder="e.g. 13:30 or 1:30 PM"
                    value={mealTimeInput}
                    onChange={(e) => setMealTimeInput(e.target.value)}
                    className="w-36 rounded-lg border border-white/[0.1] bg-zinc-950 px-2.5 py-1 text-xs font-mono font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={handleSetNow}
                    className="rounded-lg border border-white/[0.06] bg-zinc-800 px-2 py-1 text-[11px] text-zinc-300 hover:text-white hover:bg-zinc-700 cursor-pointer active:scale-95"
                    title="Set to Current Time"
                  >
                    Current
                  </button>
                  {mealTimeInput && (
                    <button
                      type="button"
                      onClick={() => setMealTimeInput('')}
                      className="rounded-lg border border-white/[0.06] bg-zinc-800/80 px-2 py-1 text-[11px] text-zinc-400 hover:text-rose-400 hover:bg-zinc-700 cursor-pointer active:scale-95"
                      title="Clear Time"
                    >
                      Clear
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex border-b border-white/[0.06] px-6 pt-3 gap-6 text-xs font-medium text-zinc-400">
            <button
              onClick={() => setActiveTab('database')}
              className={`pb-2.5 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'database'
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent hover:text-zinc-200'
              }`}
            >
              Food Database
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`pb-2.5 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'presets'
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent hover:text-zinc-200'
              }`}
            >
              Curated Presets & Thalis
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`pb-2.5 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'custom'
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent hover:text-zinc-200'
              }`}
            >
              Custom Food Entry
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeTab === 'database' && (
              <>
                {/* Search Bar & Category Filters */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search chicken breast, roti, paneer, dal, oats, avocado..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-zinc-900/90 pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-400 focus:outline-none"
                    />
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors cursor-pointer text-xs ${
                          selectedCategory === cat
                            ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                            : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-white/[0.04]'
                        }`}
                      >
                        {cat === 'Indian Cuisine' ? '🇮🇳 Indian Cuisine' : cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Food Detail / Portion Scaling Drawer */}
                {selectedFood && preview && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-white/[0.12] bg-zinc-900/90 p-4 shadow-lg space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          Portion Calibration:
                        </span>
                        <h4 className="text-sm font-bold text-white">{selectedFood.name}</h4>
                        {selectedFood.hindiName && (
                          <span className="text-[11px] text-zinc-400 block">{selectedFood.hindiName}</span>
                        )}
                        <p className="text-[11px] text-zinc-500">
                          Base Serving: {selectedFood.servingSize} {selectedFood.servingUnit}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedFood(null)}
                        className="text-zinc-400 hover:text-white text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Portion Controls: Multiplier & Grams */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-950/70 p-3 rounded-lg border border-white/[0.06]">
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">
                          Servings ({selectedFood.servingUnit || 'portion'})
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleMultiplierIncrement(-0.25)}
                            className="h-8 w-8 rounded-lg bg-zinc-800 text-white font-bold hover:bg-zinc-700 cursor-pointer active:scale-95"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            step="any"
                            value={multiplier}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMultiplier(val);
                              if (val !== '' && selectedFood) {
                                const m = parseFloat(val);
                                if (!isNaN(m) && m > 0) {
                                  const refGrams = getFoodReferenceGrams(selectedFood);
                                  setCustomGrams(Math.round(refGrams * m));
                                }
                              }
                            }}
                            onBlur={() => {
                              if (multiplier === '' || Number(multiplier) <= 0) {
                                setMultiplier(1);
                                if (selectedFood) {
                                  setCustomGrams(getFoodReferenceGrams(selectedFood));
                                }
                              }
                            }}
                            className="w-20 text-center font-mono font-bold text-xs bg-zinc-900 border border-white/[0.08] rounded-lg py-1.5 text-white focus:outline-none focus:border-zinc-400"
                          />
                          <button
                            type="button"
                            onClick={() => handleMultiplierIncrement(0.25)}
                            className="h-8 w-8 rounded-lg bg-zinc-800 text-white font-bold hover:bg-zinc-700 cursor-pointer active:scale-95"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] text-zinc-300 font-medium">
                            Net Weighed Weight (g / ml)
                          </label>
                          <span className="text-[10px] text-emerald-400 font-mono">
                            Overrides catalogue
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="any"
                            value={customGrams}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomGrams(val);
                              if (val !== '' && selectedFood) {
                                const g = parseFloat(val);
                                if (!isNaN(g) && g > 0) {
                                  const refGrams = getFoodReferenceGrams(selectedFood);
                                  if (refGrams > 0) {
                                    setMultiplier(Math.round((g / refGrams) * 100) / 100);
                                  }
                                }
                              }
                            }}
                            onBlur={() => {
                              if (customGrams === '' || Number(customGrams) <= 0) {
                                if (selectedFood) {
                                  setCustomGrams(getFoodReferenceGrams(selectedFood));
                                  setMultiplier(1);
                                } else {
                                  setCustomGrams(100);
                                }
                              }
                            }}
                            className="w-24 text-center font-mono font-bold text-xs bg-zinc-900 border border-white/[0.08] rounded-lg py-1.5 text-white focus:border-emerald-500 focus:outline-none"
                          />
                          <span className="text-xs text-zinc-400">g</span>
                        </div>
                      </div>
                    </div>

                    {/* Total Weight Summary */}
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 -mt-2">
                      <span>Catalogue Ref: {selectedFood.servingSize} {selectedFood.servingUnit} ({preview.refGrams}g)</span>
                      <span className="font-mono text-zinc-200 font-semibold">
                        Logged: <span className="text-emerald-400">{preview.totalGrams}g</span> ({preview.multiplierDisplay}×)
                      </span>
                    </div>

                    {/* Calculated Macros Preview */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="rounded-lg bg-zinc-950/80 p-2 border border-white/[0.06]">
                        <span className="text-[10px] text-zinc-500 block">Calories</span>
                        <span className="font-mono text-base font-extrabold text-white tabular-nums">
                          {preview.calories}
                        </span>
                        <span className="text-[10px] text-zinc-500 block">kcal</span>
                      </div>
                      <div className="rounded-lg bg-zinc-950/80 p-2 border border-white/[0.06]">
                        <span className="text-[10px] text-zinc-500 block">Protein</span>
                        <span className="font-mono text-base font-bold text-emerald-400 tabular-nums">
                          {preview.protein}g
                        </span>
                      </div>
                      <div className="rounded-lg bg-zinc-950/80 p-2 border border-white/[0.06]">
                        <span className="text-[10px] text-zinc-500 block">Carbs</span>
                        <span className="font-mono text-base font-bold text-amber-400 tabular-nums">
                          {preview.carbs}g
                        </span>
                      </div>
                      <div className="rounded-lg bg-zinc-950/80 p-2 border border-white/[0.06]">
                        <span className="text-[10px] text-zinc-500 block">Fats</span>
                        <span className="font-mono text-base font-bold text-zinc-300 tabular-nums">
                          {preview.fats}g
                        </span>
                      </div>
                    </div>

                    {/* REAL-TIME GLYCEMIC & WORKOUT TIMING MODELING (When time specified) */}
                    {specifyTime && liveGlycemicProfile && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-emerald-500/20 bg-emerald-950/15 p-3.5 space-y-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                          <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                            <Activity className="w-4 h-4 text-emerald-400" />
                            <span>Glycemic &amp; Mileage Telemetry</span>
                            <span className="text-[10px] font-normal text-zinc-400 font-mono">
                              ({formatTimeTo12Hour(mealTimeInput)})
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-white/[0.08] text-zinc-300">
                            {liveGlycemicProfile.glycemicImpactCategory}
                          </span>
                        </div>

                        {/* Peak & Mileage Window Highlights */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="bg-zinc-900/90 rounded-lg p-2.5 border border-white/[0.06]">
                            <span className="text-[10px] uppercase font-mono text-zinc-400 block mb-0.5">
                              Estimated Glucose Peak
                            </span>
                            <div className="font-mono text-xs font-bold text-white">
                              +{liveGlycemicProfile.peakGlucoseRiseMgDl} mg/dL rise at{' '}
                              <span className="text-emerald-300">{liveGlycemicProfile.estimatedPeakTime}</span>
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                              ~{liveGlycemicProfile.estimatedPeakMinutes} mins postprandial
                            </span>
                          </div>

                          <div className="bg-zinc-900/90 rounded-lg p-2.5 border border-white/[0.06]">
                            <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold block mb-0.5 flex items-center gap-1">
                              <Zap className="w-3 h-3 text-amber-400" />
                              Prime Mileage Window
                            </span>
                            <div className="font-mono text-xs font-bold text-emerald-400">
                              {liveGlycemicProfile.workoutWindow.startTime} – {liveGlycemicProfile.workoutWindow.endTime}
                            </div>
                            <span className="text-[10px] text-zinc-400 block mt-0.5">
                              Peak glycogen availability &amp; clear stomach
                            </span>
                          </div>
                        </div>

                        {/* Modulating Factors Summary */}
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] uppercase font-semibold text-zinc-400 block">
                            Physiological Buffering Factors Factored:
                          </span>
                          <div className="flex flex-wrap gap-1.5 text-[10px]">
                            {liveGlycemicProfile.factors.map((f, i) => (
                              <span
                                key={i}
                                className={`px-2 py-0.5 rounded border font-mono ${
                                  f.type === 'caution'
                                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                                    : 'bg-zinc-900 border-white/[0.06] text-zinc-300'
                                }`}
                              >
                                {f.name}: {f.badge}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Projected Target Impact Callout */}
                    <div
                      className={`flex items-center gap-2 rounded-lg p-2.5 text-xs ${
                        preview.willExceed
                          ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      }`}
                    >
                      <Info className="w-4 h-4 shrink-0" />
                      <span>
                        {preview.willExceed
                          ? `Adding this meal will exceed your daily target by ${Math.abs(preview.calDiff)} kcal.`
                          : `After logging: ${preview.projectedCal} / ${summary.calories.target} kcal (${preview.calDiff} kcal remaining).`}
                      </span>
                    </div>

                    {/* Confirm Button */}
                    <button
                      onClick={handleAddSelectedFood}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-100 text-zinc-950 hover:bg-white py-2.5 font-bold transition-all cursor-pointer text-xs shadow-sm"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      Add to {mealType.toUpperCase()} ({preview.calories} kcal
                      {specifyTime && ` · ${mealTimeInput}`})
                    </button>
                  </motion.div>
                )}

                {/* Food List */}
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {filteredFoods.length === 0 && !isSearchingOnline && onlineResults.length === 0 && (
                    <div className="py-8 text-center text-zinc-500 text-xs">
                      No foods matching &ldquo;{searchQuery}&rdquo;. Try another term or create a custom entry.
                    </div>
                  )}
                  {isSearchingOnline && (
                    <div className="flex flex-col items-center justify-center py-8 text-zinc-400 gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                      <span className="text-xs font-medium">Searching global database for "{searchQuery}"...</span>
                    </div>
                  )}
                  {[...filteredFoods, ...onlineResults].map((food) => (
                      <div
                        key={food.id}
                        onClick={() => handleSelectFood(food)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          selectedFood?.id === food.id
                            ? 'bg-zinc-800 border-white/30 text-white'
                            : 'bg-zinc-900/60 border-white/[0.04] hover:bg-zinc-800/60 hover:border-white/[0.1] text-zinc-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-medium text-white">{food.name}</span>
                            {food.cuisine === 'Indian' && (
                              <span className="text-[10px] px-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium">
                                Indian
                              </span>
                            )}
                            {food.id.startsWith('online_') && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium whitespace-nowrap flex items-center gap-1">
                                <Globe className="w-2.5 h-2.5" /> Global DB
                              </span>
                            )}
                          </div>
                          {food.hindiName && (
                            <span className="text-[11px] text-zinc-500 block">{food.hindiName}</span>
                          )}
                          <div className="text-[11px] text-zinc-400 font-mono">
                            {food.servingSize} {food.servingUnit} ·{' '}
                            <span className="text-emerald-400">P: {food.protein}g</span> ·{' '}
                            <span className="text-amber-400">C: {food.carbs}g</span> ·{' '}
                            <span className="text-zinc-300">F: {food.fats}g</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-white tabular-nums bg-zinc-800/80 px-2 py-0.5 rounded border border-white/[0.06]">
                            {food.calories} kcal
                          </span>
                          <span className="rounded-lg bg-zinc-800 px-2 py-1 text-xs text-zinc-300 font-medium hover:bg-zinc-100 hover:text-zinc-950 transition-colors">
                            Select
                          </span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </>
            )}

            {/* PRESETS TAB */}
            {activeTab === 'presets' && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400">
                  Quickly log pre-balanced athlete meals, Indian thalis, and fitness bowls
                  {specifyTime && ` at ${formatTimeTo12Hour(mealTimeInput)}`}:
                </p>
                {POPULAR_MEAL_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-white/[0.06] bg-zinc-900/60 hover:bg-zinc-800/50 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{preset.name}</h4>
                        <span className={`text-[10px] font-mono rounded px-1.5 py-0.5 border ${
                          preset.category === 'Indian Fitness'
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                            : 'bg-zinc-800 border-white/[0.08] text-zinc-400'
                        }`}>
                          {preset.category}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">{preset.description}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs font-mono">
                        <span className="text-white font-bold">{preset.calories} kcal</span>
                        <span className="text-emerald-400">P: {preset.protein}g</span>
                        <span className="text-amber-400">C: {preset.carbs}g</span>
                        <span className="text-zinc-300">F: {preset.fats}g</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddPreset(preset)}
                      className="shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-100 text-zinc-950 font-semibold text-xs hover:bg-white transition-colors cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      Add to {mealType}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* CUSTOM ENTRY TAB */}
            {activeTab === 'custom' && (
              <form onSubmit={handleAddCustomMeal} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Meal / Food Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grandma's Moong Dal Tadka, Paneer Bhurji with Roti..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-zinc-900/90 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-zinc-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Calories (kcal) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="450"
                      value={customCalories}
                      onChange={(e) => setCustomCalories(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-zinc-900/90 px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="35"
                      value={customProtein}
                      onChange={(e) => setCustomProtein(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-zinc-900/90 px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Carbs (g)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="45"
                      value={customCarbs}
                      onChange={(e) => setCustomCarbs(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-zinc-900/90 px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Fats (g)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="12"
                      value={customFats}
                      onChange={(e) => setCustomFats(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-zinc-900/90 px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Dietary Fiber (g, optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="5"
                      value={customFiber}
                      onChange={(e) => setCustomFiber(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-zinc-900/90 px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Serving Descriptor
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1 bowl, 250g, 2 rotis"
                      value={customServingUnit}
                      onChange={(e) => setCustomServingUnit(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-zinc-900/90 px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Glycemic Preview in Custom Tab if Time enabled */}
                {specifyTime && liveGlycemicProfile && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/15 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                        Predicted Glycemic Impact:
                      </span>
                      <span className="font-mono text-emerald-400">
                        Peak: {liveGlycemicProfile.estimatedPeakTime} (+{liveGlycemicProfile.peakGlucoseRiseMgDl} mg/dL)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Mileage Window: <strong>{liveGlycemicProfile.workoutWindow.startTime} – {liveGlycemicProfile.workoutWindow.endTime}</strong></span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-zinc-100 text-zinc-950 hover:bg-white py-2.5 font-bold transition-all text-xs cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  Log Custom Food Entry {specifyTime && `(${mealTimeInput})`}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
