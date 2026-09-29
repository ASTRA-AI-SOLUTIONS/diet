const fs = require('fs');

function rewriteMemo(filePath, filterVar, matchStr) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const regex = new RegExp(`const combinedDB = \\[\\.\\.\\.cachedAiFoods, \\.\\.\\.FOOD_DATABASE\\];\\s*return combinedDB\\.filter\\(\\(${filterVar}\\) => \\{[\\s\\S]*?return ${matchStr};\\s*\\}\\);\\s*\\}, \\[searchQuery, selectedCategory\\]\\);`, 'm');
  
  const replacement = `const combinedDB = [...cachedAiFoods, ...FOOD_DATABASE];
    const filtered = combinedDB.filter((${filterVar}) => {
      const qLower = searchQuery.toLowerCase().trim();
      const ${matchStr.split(' && ')[0]} =
        !qLower ||
        ${filterVar}.name.toLowerCase().includes(qLower) ||
        (${filterVar}.hindiName && ${filterVar}.hindiName.toLowerCase().includes(qLower)) ||
        (${filterVar}.cuisine && ${filterVar}.cuisine.toLowerCase().includes(qLower)) ||
        (${filterVar}.category && ${filterVar}.category.toLowerCase().includes(qLower));

      const ${matchStr.split(' && ')[1]} =
        selectedCategory === 'All'
          ? true
          : selectedCategory === 'Indian Cuisine'
          ? ${filterVar}.category === 'Indian Cuisine' || ${filterVar}.cuisine === 'Indian'
          : ${filterVar}.category === selectedCategory;

      return ${matchStr};
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        if (aName === q && bName !== q) return -1;
        if (bName === q && aName !== q) return 1;

        const aStarts = aName.startsWith(q) ? 1 : 0;
        const bStarts = bName.startsWith(q) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;

        return aName.length - bName.length;
      });
    }
    
    return filtered;
  }, [searchQuery, selectedCategory]);`;

  if (content.match(regex)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(filePath, content);
    console.log("Rewrote useMemo in", filePath);
  } else {
    console.log("Regex missed in", filePath);
    // Let's try to find it by just replacing the block manually
  }
}

