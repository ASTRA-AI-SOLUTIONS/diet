const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Extract the cachedAiFoods declaration
  const regex = /\s*const \[cachedAiFoods, setCachedAiFoods\] = useState<FoodItem\[\]>\(\(\) => \{[\s\S]*?\}\);/m;
  const match = content.match(regex);
  
  if (match) {
    const cachedStateStr = match[0];
    
    // Remove it from its current position
    content = content.replace(regex, '');
    
    // Insert it right before filteredFoods (MealLoggerModal) or filteredLocal (FoodLibraryView)
    content = content.replace(/const filteredFoods = useMemo/m, cachedStateStr + '\n  const filteredFoods = useMemo');
    content = content.replace(/const filteredLocal = useMemo/m, cachedStateStr + '\n  const filteredLocal = useMemo');
    
    fs.writeFileSync(filePath, content);
    console.log('Fixed', filePath);
  }
}

fixFile('src/components/MealLoggerModal.tsx');
fixFile('src/components/FoodLibraryView.tsx');
