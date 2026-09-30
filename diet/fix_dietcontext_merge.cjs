const fs = require('fs');

let content = fs.readFileSync('src/context/DietContext.tsx', 'utf8');

const regexMeals = /setMeals\(cloudMeals\);/g;
const replacementMeals = `setMeals((currentLocal) => {
            const merged = [...currentLocal];
            cloudMeals.forEach(cm => {
              const idx = merged.findIndex(lm => lm.id === cm.id);
              if (idx !== -1) merged[idx] = cm;
              else merged.push(cm);
            });
            return merged.filter(m => m.userId === currentUser.id);
          });`;

const regexLogs = /setDailyLogs\(cloudLogs\);/g;
const replacementLogs = `setDailyLogs((currentLocal) => {
            const merged = [...currentLocal];
            cloudLogs.forEach(cl => {
              const idx = merged.findIndex(ll => ll.date === cl.date);
              if (idx !== -1) merged[idx] = cl;
              else merged.push(cl);
            });
            return merged;
          });`;

content = content.replace(regexMeals, replacementMeals);
content = content.replace(regexLogs, replacementLogs);

fs.writeFileSync('src/context/DietContext.tsx', content);
console.log("Updated DietContext.tsx with merge logic");
