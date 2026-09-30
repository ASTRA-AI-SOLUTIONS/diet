const fs = require('fs');
let content = fs.readFileSync('src/components/ProfileModal.tsx', 'utf8');
const regex = /<input([^>]*?)className="([^"]*?)text-xs([^"]*?)"/g;
console.log(content.match(regex)?.length || 0);
