const fs = require('fs');

let content = fs.readFileSync('src/components/FoodLibraryView.tsx', 'utf8');

const useEffectQueryRegex = /useEffect\(\(\) => \{\s*setOnlineResults\(\[\]\);\s*\}, \[searchQuery\]\);/m;
const newUseEffectQuery = `useEffect(() => {
    setOnlineResults([]);
    if (searchMode === 'online' && searchQuery.trim().length > 2) {
      const timeoutId = setTimeout(() => searchOnlineFood(), 600);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, searchMode]);`;

content = content.replace(useEffectQueryRegex, newUseEffectQuery);
fs.writeFileSync('src/components/FoodLibraryView.tsx', content);
