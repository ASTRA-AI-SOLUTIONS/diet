const fs = require('fs');

let content = fs.readFileSync('src/components/MealLoggerModal.tsx', 'utf8');

// 1. Imports
content = content.replace("import React, { useState, useMemo } from 'react';", "import React, { useState, useMemo, useEffect } from 'react';");
content = content.replace("AlertTriangle,\n} from 'lucide-react';", "AlertTriangle,\n  Globe,\n  Loader2,\n} from 'lucide-react';");

// 2. Add State for online search
const stateInjection = `  const [onlineResults, setOnlineResults] = useState<FoodItem[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  const categories = ['All', 'Indian Cuisine', 'Protein', 'Carbs', 'Fats', 'Produce', 'Dairy', 'Snacks'];`;

content = content.replace("  const categories = ['All', 'Indian Cuisine', 'Protein', 'Carbs', 'Fats', 'Produce', 'Dairy', 'Snacks'];", stateInjection);


// 3. Add useEffect and search function right after filteredFoods
const hookInjection = `  useEffect(() => {
    if (searchQuery.trim().length > 2 && filteredFoods.length === 0) {
      const delayDebounceFn = setTimeout(() => {
        searchOnlineFood(searchQuery.trim());
      }, 600);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setOnlineResults([]);
    }
  }, [searchQuery, filteredFoods.length]);

  const searchOnlineFood = async (query: string) => {
    setIsSearchingOnline(true);
    try {
      const res = await fetch(\`https://world.openfoodfacts.org/cgi/search.pl?search_terms=\${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20\`, {
        headers: { 'User-Agent': 'AstraDiet-MacroTracker/1.0' }
      });
      const data = await res.json();
      if (data.products) {
        const results: FoodItem[] = data.products
          .filter((p: any) => p.product_name && p.nutriments && p.nutriments['energy-kcal_100g'] !== undefined)
          .map((p: any) => {
            const serving = Number(p.serving_quantity) || 100;
            const unit = p.serving_quantity_unit || 'g';
            const multiplier = serving / 100;
            return {
              id: \`online_\${p._id || p.code || Math.random().toString()}\`,
              name: p.product_name + (p.brands ? \` (\${p.brands.split(',')[0]})\` : ''),
              category: 'Snacks',
              cuisine: 'Global',
              servingSize: serving,
              servingUnit: unit,
              calories: Math.round((p.nutriments['energy-kcal_100g'] || 0) * multiplier),
              protein: Number(((p.nutriments.proteins_100g || 0) * multiplier).toFixed(1)),
              carbs: Number(((p.nutriments.carbohydrates_100g || 0) * multiplier).toFixed(1)),
              fats: Number(((p.nutriments.fat_100g || 0) * multiplier).toFixed(1)),
              fiber: Number(((p.nutriments.fiber_100g || 0) * multiplier).toFixed(1)),
              defaultGrams: typeof serving === 'number' && unit === 'g' ? serving : 100,
            };
          });
        setOnlineResults(results);
      }
    } catch (err) {
      console.error("Failed to search online foods:", err);
    } finally {
      setIsSearchingOnline(false);
    }
  };`;

content = content.replace("  const handleSelectFood = (food: FoodItem) => {", hookInjection + "\n\n  const handleSelectFood = (food: FoodItem) => {");

// 4. Update the rendering of the list
const listRenderingStr = `                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {filteredFoods.length === 0 ? (
                    <div className="py-8 text-center text-zinc-500 text-xs">
                      No foods matching &ldquo;{searchQuery}&rdquo;. Try another term or create a custom entry.
                    </div>
                  ) : (
                    filteredFoods.map((food) => (`;

const newListRenderingStr = `                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
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
                  {(filteredFoods.length > 0 ? filteredFoods : onlineResults).map((food) => (`;

content = content.replace(listRenderingStr, newListRenderingStr);

// 5. Add Globe icon for online results
const globeIconInjection = `                            {food.id.startsWith('online_') && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium whitespace-nowrap flex items-center gap-1">
                                <Globe className="w-2.5 h-2.5" /> Global DB
                              </span>
                            )}
                          </div>`;

content = content.replace(`                              </span>
                            )}
                          </div>`, `                              </span>
                            )}
` + globeIconInjection);


fs.writeFileSync('src/components/MealLoggerModal.tsx', content);
console.log("Modified MealLoggerModal.tsx successfully");
