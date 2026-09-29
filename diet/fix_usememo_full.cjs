const fs = require('fs');

function rewriteFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Find the entire useMemo block
  const useMemoRegex = /const (filteredFoods|filteredLocal) = useMemo\(\(\) => \{[\s\S]*?\}, \[searchQuery, selectedCategory\]\);/m;
  
  if (content.match(useMemoRegex)) {
    const varName = content.match(useMemoRegex)[1];
    const newUseMemo = `const ${varName} = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const combinedDB = [...cachedAiFoods, ...FOOD_DATABASE];
    
    const filtered = combinedDB.filter((f) => {
      const matchSearch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        (f.hindiName && f.hindiName.toLowerCase().includes(q)) ||
        (f.cuisine && f.cuisine.toLowerCase().includes(q)) ||
        (f.category && f.category.toLowerCase().includes(q));

      const matchCat =
        selectedCategory === 'All'
          ? true
          : selectedCategory === 'Indian Cuisine'
          ? f.category === 'Indian Cuisine' || f.cuisine === 'Indian'
          : f.category === selectedCategory;

      return matchSearch && matchCat;
    });

    if (q) {
      filtered.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Exact match highest priority
        if (aName === q && bName !== q) return -1;
        if (bName === q && aName !== q) return 1;

        // Starts with
        const aStarts = aName.startsWith(q) ? 1 : 0;
        const bStarts = bName.startsWith(q) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;

        // Length
        return aName.length - bName.length;
      });
    }

    return filtered;
  }, [searchQuery, selectedCategory]);`;
  
    content = content.replace(useMemoRegex, newUseMemo);
    fs.writeFileSync(filePath, content);
    console.log("Successfully rewrote", filePath);
  } else {
    console.log("Could not find useMemo block in", filePath);
  }
}

rewriteFile('src/components/MealLoggerModal.tsx');
rewriteFile('src/components/FoodLibraryView.tsx');
