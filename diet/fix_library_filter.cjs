const fs = require('fs');
const file = 'src/components/FoodLibraryView.tsx';
let content = fs.readFileSync(file, 'utf8');

const filteredFoodsRegex = /const filteredLocal = useMemo\(\(\) => \{[\s\S]*?return FOOD_DATABASE\.filter\(\(f\) => \{/m;
const newFilteredFoods = `const filteredLocal = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const combinedDB = [...FOOD_DATABASE, ...cachedAiFoods];
    return combinedDB.filter((f) => {`;
content = content.replace(filteredFoodsRegex, newFilteredFoods);
fs.writeFileSync(file, content);
