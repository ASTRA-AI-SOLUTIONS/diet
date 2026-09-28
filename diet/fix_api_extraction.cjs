const fs = require('fs');

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const oldFilterMap = `.filter((p: any) => p.product_name && p.nutriments && p.nutriments['energy-kcal_100g'] !== undefined)
          .map((p: any) => {
            const serving = Number(p.serving_quantity) || 100;
            const unit = p.serving_quantity_unit || 'g';
            const multiplier = serving / 100;
            return {
              id: \`online_\${p._id || p.code || Math.random().toString()}\`,
              name: p.product_name + (p.brands ? \` (\${p.brands.split(',')[0]})\` : ''),
              category: 'Snacks',
              cuisine: 'Global',
              servingSize: serving,
              servingUnit: unit,
              calories: Math.round((p.nutriments['energy-kcal_100g'] || 0) * multiplier),
              protein: Number(((p.nutriments.proteins_100g || 0) * multiplier).toFixed(1)),
              carbs: Number(((p.nutriments.carbohydrates_100g || 0) * multiplier).toFixed(1)),
              fats: Number(((p.nutriments.fat_100g || 0) * multiplier).toFixed(1)),
              fiber: Number(((p.nutriments.fiber_100g || 0) * multiplier).toFixed(1)),
              defaultGrams: typeof serving === 'number' && unit === 'g' ? serving : 100,
            };
          });`;

  const newFilterMap = `.filter((p: any) => p.product_name)
          .map((p: any) => {
            const serving = Number(p.serving_quantity) || 100;
            const unit = p.serving_quantity_unit || 'g';
            const multiplier = serving / 100;
            
            const n = p.nutriments || {};
            let kcal100 = n['energy-kcal_100g'];
            if (kcal100 === undefined || kcal100 === null) {
               kcal100 = n['energy_100g'] ? n['energy_100g'] / 4.184 : 0;
            }
            
            return {
              id: \`online_\${p._id || p.code || Math.random().toString()}\`,
              name: p.product_name + (p.brands ? \` (\${p.brands.split(',')[0]})\` : ''),
              category: 'Global DB',
              cuisine: 'Global',
              servingSize: serving,
              servingUnit: unit,
              calories: Math.round((kcal100 || 0) * multiplier),
              protein: Number(((n.proteins_100g || 0) * multiplier).toFixed(1)),
              carbs: Number(((n.carbohydrates_100g || 0) * multiplier).toFixed(1)),
              fats: Number(((n.fat_100g || 0) * multiplier).toFixed(1)),
              fiber: Number(((n.fiber_100g || 0) * multiplier).toFixed(1)),
              defaultGrams: typeof serving === 'number' && unit === 'g' ? serving : 100,
            };
          });`;

  if (content.includes(oldFilterMap)) {
    content = content.replace(oldFilterMap, newFilterMap);
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  } else {
    console.log(`Could not find target block in ${filePath}`);
  }
}

updateFile('src/components/MealLoggerModal.tsx');
updateFile('src/components/FoodLibraryView.tsx');
