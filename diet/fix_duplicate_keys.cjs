const fs = require('fs');
let content = fs.readFileSync('src/data/foodDatabase.ts', 'utf8');

const idSet = new Set();
let match;
const idRegex = /id:\s*'([^']+)'/g;

let newContent = content.replace(idRegex, (match, p1) => {
  let newId = p1;
  let counter = 1;
  while (idSet.has(newId)) {
    newId = `${p1}_${counter}`;
    counter++;
  }
  idSet.add(newId);
  return `id: '${newId}'`;
});

fs.writeFileSync('src/data/foodDatabase.ts', newContent);
console.log("Fixed duplicate keys in FOOD_DATABASE.");
