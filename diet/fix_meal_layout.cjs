const fs = require('fs');

let content = fs.readFileSync('src/components/DailyMealsList.tsx', 'utf8');

const regex = /<div className="flex items-center justify-between">/g;
const replacement = '<div className="flex items-start sm:items-center justify-between gap-2">';
content = content.replace(regex, replacement);

const regex2 = /<div className="flex-1 pr-2">/g;
const replacement2 = '<div className="flex-1 min-w-0 pr-2">';
content = content.replace(regex2, replacement2);

const regex3 = /<div className="flex items-center gap-2">/g;
const replacement3 = '<div className="flex items-center gap-1.5 sm:gap-2 shrink-0">';
content = content.replace(regex3, replacement3);

fs.writeFileSync('src/components/DailyMealsList.tsx', content);
console.log("Fixed meal row layout");
