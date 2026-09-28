const fs = require('fs');
const file = 'src/components/FoodLibraryView.tsx';
let content = fs.readFileSync(file, 'utf8');

const autoTriggerRegex = /useEffect\(\(\) => \{\s*let isActive = true;[\s\S]*?\}, \[searchQuery, searchMode\]\);/;
if (content.match(autoTriggerRegex)) {
  content = content.replace(autoTriggerRegex, '');
}

const searchRegex = /const searchOnlineFood = async \(query: string, getIsActive: \(\) => boolean\) => \{[\s\S]*?^\s*\};\s*$/m;
const newSearchBlock = `  const [cachedAiFoods, setCachedAiFoods] = useState<FoodItem[]>(() => {
    try {
      const saved = localStorage.getItem('astradiet_ai_cache');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const searchOnlineFood = async (manualQuery?: string) => {
    const query = (manualQuery || searchQuery).trim();
    if (query.length < 2) return;
    setIsSearchingOnline(true);
    setOnlineResults([]);

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

content = content.replace(searchRegex, newSearchBlock);

const filteredFoodsRegex = /const filteredLocal = useMemo\(\(\) => \{[\s\S]*?return FOOD_DATABASE\.filter\(\(food\) => \{/m;
const newFilteredFoods = `const filteredLocal = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const combinedDB = [...FOOD_DATABASE, ...cachedAiFoods];
    return combinedDB.filter((food) => {`;
content = content.replace(filteredFoodsRegex, newFilteredFoods);


const handleAddRegex = /const handleQuickAdd = \(food: FoodItem\) => \{/;
const newHandleAdd = `const handleQuickAdd = (food: FoodItem) => {
    if (food.id.startsWith('online_')) {
      const exists = cachedAiFoods.find(f => f.name === food.name);
      if (!exists) {
        const updatedCache = [...cachedAiFoods, food];
        setCachedAiFoods(updatedCache);
        localStorage.setItem('astradiet_ai_cache', JSON.stringify(updatedCache));
      }
    }`;
content = content.replace(handleAddRegex, newHandleAdd);

// Fix manual call in UI
content = content.replace(/searchOnlineFood\(searchQuery, \(\) => true\);/g, 'searchOnlineFood(searchQuery);');

fs.writeFileSync(file, content);
console.log('Done rewriting FoodLibraryView');
