const fs = require('fs');

function updateToOpenFoodFacts(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const oldSearch = /const searchOnlineFood = async \(\w*\) => \{[\s\S]*?^\s*\};\s*$/m;

  const newSearch = `const searchOnlineFood = async (manualQuery?: string) => {
    const query = (manualQuery || searchQuery).trim();
    if (query.length < 2) return;
    setIsSearchingOnline(true);
    setOnlineResults([]);

    try {
      // Fetch both Indian-prioritized results and Global results simultaneously
      const [indiaRes, globalRes] = await Promise.all([
        fetch(\`https://world.openfoodfacts.org/cgi/search.pl?search_terms=\${encodeURIComponent(query)}&countries_tags_en=india&search_simple=1&action=process&json=1&page_size=15\`, {
          headers: { 'User-Agent': 'AstraDiet-MacroTracker/1.0' }
        }).catch(() => null),
        fetch(\`https://world.openfoodfacts.org/cgi/search.pl?search_terms=\${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20\`, {
          headers: { 'User-Agent': 'AstraDiet-MacroTracker/1.0' }
        }).catch(() => null)
      ]);

      const indiaData = indiaRes ? await indiaRes.json().catch(() => ({})) : {};
      const globalData = globalRes ? await globalRes.json().catch(() => ({})) : {};

      let combinedProducts: any[] = [];
      const seenIds = new Set();

      if (indiaData.products) {
        indiaData.products.forEach((p: any) => {
          if (p.product_name && !seenIds.has(p._id || p.code)) {
            seenIds.add(p._id || p.code);
            combinedProducts.push(p);
          }
        });
      }

      if (globalData.products) {
        globalData.products.forEach((p: any) => {
          if (p.product_name && !seenIds.has(p._id || p.code)) {
            seenIds.add(p._id || p.code);
            combinedProducts.push(p);
          }
        });
      }

      if (combinedProducts.length > 0) {
        const results = combinedProducts.map((p: any) => {
          const kcal =
            p.nutriments?.['energy-kcal_100g'] ||
            (p.nutriments?.energy_100g ? Math.round(p.nutriments.energy_100g / 4.184) : 0);
          
          return {
            id: 'online_' + (p._id || p.code),
            name: (p.product_name || 'Unknown Food') + (p.brands ? \` (\${p.brands})\` : ''),
            category: 'Global DB',
            cuisine: 'Global',
            servingSize: 100,
            servingUnit: 'g',
            calories: kcal,
            protein: p.nutriments?.proteins_100g || 0,
            carbs: p.nutriments?.carbohydrates_100g || 0,
            fats: p.nutriments?.fat_100g || 0,
            fiber: p.nutriments?.fiber_100g || 0,
          };
        }).filter((f) => f.calories > 0);

        setOnlineResults(results);
      }
    } catch (err) {
      console.error("Failed to search online:", err);
    } finally {
      setIsSearchingOnline(false);
    }
  };`;

  content = content.replace(oldSearch, newSearch);
  
  // Replace button text
  content = content.replace(/Search with AI/g, 'Search Internet Database');
  content = content.replace(/AI DB/g, 'Global DB');
  content = content.replace(/AI is calculating macros for/g, 'Searching global database for');

  fs.writeFileSync(filePath, content);
}

updateToOpenFoodFacts('src/components/MealLoggerModal.tsx');
updateToOpenFoodFacts('src/components/FoodLibraryView.tsx');
