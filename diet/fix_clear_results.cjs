const fs = require('fs');

const file1 = 'src/components/MealLoggerModal.tsx';
let content1 = fs.readFileSync(file1, 'utf8');

const hookRegex1 = /const searchOnlineFood = async \(\) => \{/;
const newHook1 = `useEffect(() => {
    setOnlineResults([]);
  }, [searchQuery]);

  const searchOnlineFood = async () => {`;
content1 = content1.replace(hookRegex1, newHook1);
fs.writeFileSync(file1, content1);

const file2 = 'src/components/FoodLibraryView.tsx';
let content2 = fs.readFileSync(file2, 'utf8');

const hookRegex2 = /const searchOnlineFood = async \(manualQuery\?: string\) => \{/;
const newHook2 = `useEffect(() => {
    setOnlineResults([]);
  }, [searchQuery]);

  const searchOnlineFood = async (manualQuery?: string) => {`;
content2 = content2.replace(hookRegex2, newHook2);
fs.writeFileSync(file2, content2);
