const fs = require('fs');

function fixInputs(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  
  // Replace text-sm on inputs with text-base
  content = content.replace(/<input([^>]*?)className="([^"]*?)text-sm([^"]*?)"/g, '<input$1className="$2text-base md:text-sm$3"');
  
  fs.writeFileSync(filepath, content);
}

['src/components/MealLoggerModal.tsx', 'src/components/AuthView.tsx', 'src/components/ProfileModal.tsx', 'src/components/DataBackupModal.tsx'].forEach(fixInputs);
console.log("Fixed iOS input zoom");
