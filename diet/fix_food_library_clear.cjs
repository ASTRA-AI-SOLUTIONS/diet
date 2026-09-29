const fs = require('fs');

let content = fs.readFileSync('src/components/FoodLibraryView.tsx', 'utf8');

const handleQuickAddRegex = /const handleQuickAdd = \(food: FoodItem\) => \{[\s\S]*?toast\.success\(\`Added \$\{food\.name\} to Breakfast!\`\);\s*\};/m;

if (content.match(handleQuickAddRegex)) {
  const matchStr = content.match(handleQuickAddRegex)[0];
  const newMatchStr = matchStr.replace(/toast\.success\(.*?\);/m, 
    "$& \n    setSearchQuery('');\n    setOnlineResults([]);\n    setSearchMode('local');");
  content = content.replace(handleQuickAddRegex, newMatchStr);
}

fs.writeFileSync('src/components/FoodLibraryView.tsx', content);
