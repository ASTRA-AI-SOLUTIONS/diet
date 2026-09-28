const fs = require('fs');

const file = 'src/components/MealLoggerModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove the auto-trigger useEffect for search
const autoTriggerRegex = /useEffect\(\(\) => \{\s*let isActive = true;[\s\S]*?\}, \[searchQuery\]\);/;
if (content.match(autoTriggerRegex)) {
  content = content.replace(autoTriggerRegex, '');
}

// 2. Add local state for AI cache and remove getIsActive from searchOnlineFood
const searchRegex = /const searchOnlineFood = async \(query: string, getIsActive: \(\) => boolean\) => \{[\s\S]*?^\s*\};\s*$/m;
const newSearchBlock = `  const [cachedAiFoods, setCachedAiFoods] = useState<FoodItem[]>(() => {
    try {
      const saved = localStorage.getItem('astradiet_ai_cache');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const searchOnlineFood = async () => {
    const query = searchQuery.trim();
    if (query.length < 2) return;
    setIsSearchingOnline(true);
    setOnlineResults([]); // clear previous

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        alert("Please add VITE_GEMINI_API_KEY to your environment variables to use AI search.");
        return;
      }

      const prompt = \`You are a nutrition database. Return a JSON array of up to 6 best matching food items for the query: "\${query}". Each item MUST have: id (unique string), name (descriptive name), category (string), cuisine (string), servingSize (number), servingUnit (string like 'g', 'ml', 'piece'), calories (number), protein (number), carbs (number), fats (number), fiber (number), defaultGrams (number). Return ONLY a raw valid JSON array, NO markdown formatting, NO backticks.\`;

      const res = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=\${apiKey}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await res.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        let jsonText = data.candidates[0].content.parts[0].text;
        jsonText = jsonText.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
        
        try {
          const parsed = JSON.parse(jsonText);
          if (Array.isArray(parsed)) {
            const results = parsed.map(item => ({
              ...item,
              id: 'online_' + (item.id || Math.random().toString()),
              category: 'AI Global DB',
              cuisine: 'Global'
            }));
            setOnlineResults(results);
          }
        } catch (parseErr) {
          console.error("Failed to parse Gemini JSON:", parseErr, jsonText);
        }
      }
    } catch (err) {
      console.error("Failed to search with Gemini AI:", err);
    } finally {
      setIsSearchingOnline(false);
    }
  };`;

content = content.replace(/const searchOnlineFood = async \(query: string, getIsActive: \(\) => boolean\) => \{[\s\S]*?^  \};/m, newSearchBlock);


// 3. Update filteredFoods to include cachedAiFoods
const filteredFoodsRegex = /const filteredFoods = useMemo\(\(\) => \{[\s\S]*?return FOOD_DATABASE\.filter\(\(food\) => \{/m;
const newFilteredFoods = `const filteredFoods = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const combinedDB = [...FOOD_DATABASE, ...cachedAiFoods];
    return combinedDB.filter((food) => {`;
content = content.replace(filteredFoodsRegex, newFilteredFoods);

// 4. Update UI to add "Search with AI" button and save selected food to cache
const handleSelectRegex = /const handleSelectFood = \(food: FoodItem\) => \{/;
const newHandleSelect = `const handleSelectFood = (food: FoodItem) => {
    if (food.id.startsWith('online_')) {
      // Save to cache
      const exists = cachedAiFoods.find(f => f.name === food.name);
      if (!exists) {
        const updatedCache = [...cachedAiFoods, food];
        setCachedAiFoods(updatedCache);
        localStorage.setItem('astradiet_ai_cache', JSON.stringify(updatedCache));
      }
    }`;
content = content.replace(handleSelectRegex, newHandleSelect);

// 5. Update UI rendering to include the button
const listRenderingRegex = /<div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">[\s\S]*?\{\(filteredFoods\.length > 0 \? filteredFoods : onlineResults\)\.map/m;
const newListRendering = `<div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  
                  {searchQuery.trim().length > 2 && !isSearchingOnline && onlineResults.length === 0 && (
                    <div className="p-4 mb-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex flex-col items-center justify-center gap-2">
                      <span className="text-xs text-indigo-300 text-center">Can't find what you're looking for?</span>
                      <button 
                        onClick={searchOnlineFood}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-900/20"
                      >
                        <Zap className="w-3.5 h-3.5" /> Search with AI
                      </button>
                    </div>
                  )}

                  {filteredFoods.length === 0 && !isSearchingOnline && onlineResults.length === 0 && (
                    <div className="py-8 text-center text-zinc-500 text-xs">
                      No foods matching &ldquo;{searchQuery}&rdquo;. Try the AI search or create a custom entry.
                    </div>
                  )}
                  {isSearchingOnline && (
                    <div className="flex flex-col items-center justify-center py-8 text-zinc-400 gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                      <span className="text-xs font-medium">AI is calculating macros for "{searchQuery}"...</span>
                    </div>
                  )}
                  {[...filteredFoods, ...onlineResults].map`;

// Wait, the previous array was `[...filteredFoods, ...onlineResults]`. Let's just find that part.
const exactListRenderRegex = /<div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">\s*\{filteredFoods\.length === 0 && !isSearchingOnline && onlineResults\.length === 0 && \([\s\S]*?\{\[\.\.\.filteredFoods, \.\.\.onlineResults\]\.map/m;

content = content.replace(exactListRenderRegex, newListRendering);

// Fix the tags "Global DB" to "AI DB" in the UI
content = content.replace(/Global DB/g, 'AI DB');

fs.writeFileSync(file, content);
console.log('Done rewriting MealLoggerModal');

