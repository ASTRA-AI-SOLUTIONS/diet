import React, { useState, useMemo } from 'react';
import { FoodItem, MealType } from '../types/diet';
import { FOOD_DATABASE } from '../data/foodDatabase';
import { Astra3DCard } from './Astra3DCard';
import { Search, Plus, Database, Check } from 'lucide-react';

interface FoodLibraryViewProps {
  onAddFood: (food: FoodItem, mealType: MealType) => void;
}

export const FoodLibraryView: React.FC<FoodLibraryViewProps> = ({ onAddFood }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  const categories = ['All', 'Indian Cuisine', 'Protein', 'Carbs', 'Fats', 'Produce', 'Dairy', 'Snacks'];

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return FOOD_DATABASE.filter((f) => {
      const matchSearch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        (f.hindiName && f.hindiName.toLowerCase().includes(q)) ||
        (f.category && f.category.toLowerCase().includes(q)) ||
        (f.cuisine && f.cuisine.toLowerCase().includes(q));

      const matchCat =
        selectedCategory === 'All'
          ? true
          : selectedCategory === 'Indian Cuisine'
          ? f.category === 'Indian Cuisine' || f.cuisine === 'Indian'
          : f.category === selectedCategory;

      return matchSearch && matchCat;
    });
  }, [searchQuery, selectedCategory]);

  const handleQuickAdd = (food: FoodItem) => {
    onAddFood(food, selectedMealType);
    setRecentlyAddedId(food.id);
    setTimeout(() => {
      setRecentlyAddedId(null);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Database className="w-4 h-4 text-zinc-400" />
            Nutritional Reference Library
          </h2>
          <p className="text-xs text-zinc-400">
            Verified caloric values and macronutrient density per standard reference portion (including verified ICMR/IFCT Indian staples)
          </p>
        </div>

        {/* Feeding Window Quick Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-400">Add directly to:</span>
          <select
            value={selectedMealType}
            onChange={(e) => setSelectedMealType(e.target.value as MealType)}
            className="rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-100 focus:outline-none cursor-pointer"
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snacks">Snacks</option>
          </select>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Astra3DCard className="p-4" depth={6}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search food by name or hindi name (e.g. roti, paneer, dal, biryani, oats, salmon)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-zinc-900/90 pl-10 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-white/30 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-white/[0.04]'
                }`}
              >
                {cat === 'Indian Cuisine' ? '🇮🇳 Indian Cuisine' : cat}
              </button>
            ))}
          </div>
        </div>
      </Astra3DCard>

      {/* Food Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((food) => (
          <Astra3DCard
            key={food.id}
            depth={6}
            className="flex flex-col justify-between p-4"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-sm font-semibold text-zinc-100">{food.name}</h4>
                    {food.cuisine === 'Indian' && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium">
                        Indian
                      </span>
                    )}
                  </div>
                  {food.hindiName && (
                    <span className="text-[11px] text-zinc-500 block">
                      {food.hindiName}
                    </span>
                  )}
                  <span className="text-[11px] text-zinc-400">
                    {food.servingSize} {food.servingUnit}
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-zinc-100 tabular-nums bg-zinc-800/80 border border-white/[0.08] rounded-md px-2 py-0.5 whitespace-nowrap">
                  {food.calories} kcal
                </span>
              </div>

              {/* Macros Matrix */}
              <div className="grid grid-cols-3 gap-1.5 my-3 text-center text-xs font-mono">
                <div className="bg-zinc-900/80 rounded-lg p-1.5 border border-white/[0.04]">
                  <span className="text-[10px] text-zinc-500 block font-sans">Protein</span>
                  <span className="font-semibold text-emerald-400 tabular-nums">{food.protein}g</span>
                </div>
                <div className="bg-zinc-900/80 rounded-lg p-1.5 border border-white/[0.04]">
                  <span className="text-[10px] text-zinc-500 block font-sans">Carbs</span>
                  <span className="font-semibold text-amber-400 tabular-nums">{food.carbs}g</span>
                </div>
                <div className="bg-zinc-900/80 rounded-lg p-1.5 border border-white/[0.04]">
                  <span className="text-[10px] text-zinc-500 block font-sans">Fats</span>
                  <span className="font-semibold text-zinc-300 tabular-nums">{food.fats}g</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleQuickAdd(food)}
              className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                recentlyAddedId === food.id
                  ? 'bg-emerald-500 text-zinc-950 font-bold border-emerald-400'
                  : 'bg-zinc-800 text-zinc-200 border-white/[0.06] hover:bg-zinc-100 hover:text-zinc-950'
              }`}
            >
              {recentlyAddedId === food.id ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  Logged to {selectedMealType}!
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  Log to {selectedMealType}
                </>
              )}
            </button>
          </Astra3DCard>
        ))}
      </div>
    </div>
  );
};
