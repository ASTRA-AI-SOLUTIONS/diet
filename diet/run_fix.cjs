const fs = require('fs');

function fixInputs(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  
  // Replace text-xs on inputs/selects with text-base md:text-xs
  content = content.replace(/<input([^>]*?)className="([^"]*?)text-xs([^"]*?)"/g, '<input$1className="$2text-base md:text-xs$3"');
  content = content.replace(/<select([^>]*?)className="([^"]*?)text-xs([^"]*?)"/g, '<select$1className="$2text-base md:text-xs$3"');
  
  fs.writeFileSync(filepath, content);
}

['src/components/MealLoggerModal.tsx', 'src/components/AuthView.tsx', 'src/components/ProfileModal.tsx', 'src/components/DataBackupModal.tsx'].forEach(fixInputs);
console.log("Fixed iOS input zoom for text-xs");
