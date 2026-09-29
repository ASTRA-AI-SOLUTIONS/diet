const fs = require('fs');

function applySuperSort(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Find the list mapping:
  const mapRegex = /\(searchMode === 'online' \? \[\.\.\.onlineResults, \.\.\.filteredFoods\] : filteredFoods\)/g;
  const mapRegex2 = /\(searchMode === 'online' \? \[\.\.\.onlineResults, \.\.\.filteredLocal\] : filteredLocal\)/g;

  const replacement = `(
    (() => {
      const all = searchMode === 'online' ? [...onlineResults, ...filteredFoods] : filteredFoods;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return all;

      return [...all].sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        if (aName === q && bName !== q) return -1;
        if (bName === q && aName !== q) return 1;

        const aStarts = aName.startsWith(q) ? 1 : 0;
        const bStarts = bName.startsWith(q) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;

        return aName.length - bName.length;
      });
    })()
  )`;
  
  const replacement2 = `(
    (() => {
      const all = searchMode === 'online' ? [...onlineResults, ...filteredLocal] : filteredLocal;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return all;

      return [...all].sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        if (aName === q && bName !== q) return -1;
        if (bName === q && aName !== q) return 1;

        const aStarts = aName.startsWith(q) ? 1 : 0;
        const bStarts = bName.startsWith(q) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;

        return aName.length - bName.length;
      });
    })()
  )`;

  let changed = false;
  if (content.match(mapRegex)) {
    content = content.replace(mapRegex, replacement);
    changed = true;
  }
  if (content.match(mapRegex2)) {
    content = content.replace(mapRegex2, replacement2);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log("Super sorted", filePath);
  } else {
    // If not found, let's search for how it's mapped in FoodLibraryView
    const mapLib = /const displayedFoods = searchMode === 'online' \? \[\.\.\.onlineResults, \.\.\.filteredLocal\] : filteredLocal;/;
    if (content.match(mapLib)) {
      const repLib = `const displayedFoods = (() => {
      const all = searchMode === 'online' ? [...onlineResults, ...filteredLocal] : filteredLocal;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return all;

      return [...all].sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        if (aName === q && bName !== q) return -1;
        if (bName === q && aName !== q) return 1;

        const aStarts = aName.startsWith(q) ? 1 : 0;
        const bStarts = bName.startsWith(q) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;

        return aName.length - bName.length;
      });
    })();`;
      content = content.replace(mapLib, repLib);
      fs.writeFileSync(filePath, content);
      console.log("Super sorted FoodLibraryView");
    } else {
      console.log("Not found in", filePath);
    }
  }
}

applySuperSort('src/components/MealLoggerModal.tsx');
applySuperSort('src/components/FoodLibraryView.tsx');
