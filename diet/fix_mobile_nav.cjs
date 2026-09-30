const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf8');

const importRegex = /import \{\s*Calendar,\s*ChevronLeft,\s*ChevronRight,\s*\} from 'lucide-react';/;
const newImports = `import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  UtensilsCrossed,
  LineChart,
  LibraryBig,
  Settings
} from 'lucide-react';`;

appContent = appContent.replace(importRegex, newImports);

const bottomNavJSX = `
      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/95 backdrop-blur-md border-t border-white/[0.08] px-2 py-2 pb-safe flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setActiveSection('dashboard')}
          className={\`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer \${activeSection === 'dashboard' ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-500 hover:text-zinc-300'}\`}
        >
          <LayoutDashboard className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button
          onClick={() => setActiveSection('meals')}
          className={\`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer \${activeSection === 'meals' ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-500 hover:text-zinc-300'}\`}
        >
          <UtensilsCrossed className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Meals</span>
        </button>
        
        {/* Floating Action Button for Log Meal in Mobile */}
        <div className="relative -top-5">
          <button
            onClick={() => handleOpenMealLogger('breakfast')}
            className="flex items-center justify-center w-12 h-12 bg-white text-zinc-950 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </button>
        </div>

        <button
          onClick={() => setActiveSection('analytics')}
          className={\`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer \${activeSection === 'analytics' ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-500 hover:text-zinc-300'}\`}
        >
          <LineChart className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Trends</span>
        </button>
        <button
          onClick={() => setActiveSection('database')}
          className={\`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer \${activeSection === 'database' ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-500 hover:text-zinc-300'}\`}
        >
          <LibraryBig className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Library</span>
        </button>
      </div>
`;

// Insert it right before the Modals
const modalRegex = /\{\/\* Modals \*\/\}/;
appContent = appContent.replace(modalRegex, bottomNavJSX + '\n      {/* Modals */}');

// Update main container to have pb-24 on mobile so content isn't hidden by bottom bar
const mainRegex = /<main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 space-y-6">/;
const mainReplacement = `<main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 pb-24 md:pb-6 space-y-6">`;
appContent = appContent.replace(mainRegex, mainReplacement);

fs.writeFileSync('src/App.tsx', appContent);
console.log("Updated App.tsx with mobile bottom nav");
