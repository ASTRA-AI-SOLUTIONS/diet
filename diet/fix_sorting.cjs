const fs = require('fs');

function applySorting(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const regex = /return matchesSearch && matchesCat;\s*\n\s*\};\s*\);/m;
  const replacement = `return matchesSearch && matchesCat;
    });

    if (q) {
      filtered.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Exact match gets highest priority
        if (aName === q && bName !== q) return -1;
        if (bName === q && aName !== q) return 1;

        // Starts with gets second priority
        const aStarts = aName.startsWith(q) ? 1 : 0;
        const bStarts = bName.startsWith(q) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;

        // Then shortest name length
        return aName.length - bName.length;
      });
    }

    return filtered;`;

  if (content.match(regex)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(filePath, content);
    console.log("Fixed sorting in", filePath);
  } else {
    console.log("Regex not found in", filePath);
  }
}

applySorting('src/components/MealLoggerModal.tsx');
applySorting('src/components/FoodLibraryView.tsx');
