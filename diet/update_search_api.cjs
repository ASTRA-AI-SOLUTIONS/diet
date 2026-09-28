const fs = require('fs');

function updateSearchAPI(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const oldSearch = `  const searchOnlineFood = async (query: string, getIsActive: () => boolean) => {
    try {
      const res = await fetch(\`https://world.openfoodfacts.org/cgi/search.pl?search_terms=\${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20\`, {
        headers: { 'User-Agent': 'AstraDiet-MacroTracker/1.0' }
      });
      const data = await res.json();
      if (data.products) {
        const results: FoodItem[] = data.products
          .filter((p: any) => p.product_name)
          .map((p: any) => {`;

  const newSearch = `  const searchOnlineFood = async (query: string, getIsActive: () => boolean) => {
    try {
      // Fetch both Indian-prioritized results and Global results simultaneously
      const [indiaRes, globalRes] = await Promise.all([
        fetch(\`https://world.openfoodfacts.org/cgi/search.pl?search_terms=\${encodeURIComponent(query)}&countries_tags_en=india&search_simple=1&action=process&json=1&page_size=15\`, {
          headers: { 'User-Agent': 'AstraDiet-MacroTracker/1.0' }
        }),
        fetch(\`https://world.openfoodfacts.org/cgi/search.pl?search_terms=\${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20\`, {
          headers: { 'User-Agent': 'AstraDiet-MacroTracker/1.0' }
        })
      ]);

      const indiaData = await indiaRes.json();
      const globalData = await globalRes.json();

      let combinedProducts = [];
      const seenIds = new Set();

      // Add Indian results first
      if (indiaData.products) {
        indiaData.products.forEach((p: any) => {
          if (p.product_name && !seenIds.has(p._id || p.code)) {
            seenIds.add(p._id || p.code);
            combinedProducts.push(p);
          }
        });
      }

      // Append Global results
      if (globalData.products) {
        globalData.products.forEach((p: any) => {
          if (p.product_name && !seenIds.has(p._id || p.code)) {
            seenIds.add(p._id || p.code);
            combinedProducts.push(p);
          }
        });
      }

      if (combinedProducts.length > 0) {
        const results: FoodItem[] = combinedProducts
          .map((p: any) => {`;

  if (content.includes(oldSearch)) {
    content = content.replace(oldSearch, newSearch);
    fs.writeFileSync(filePath, content);
    console.log(`Updated search API in ${filePath}`);
  } else {
    console.log(`Could not find oldSearch block in ${filePath}`);
  }
}

updateSearchAPI('src/components/MealLoggerModal.tsx');
updateSearchAPI('src/components/FoodLibraryView.tsx');
