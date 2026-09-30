const fs = require('fs');

function updateModal(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');

  // Fix outer container
  const outerRegex = /className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black\/60 backdrop-blur-sm"/g;
  const outerReplacement = 'className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/60 backdrop-blur-sm"';
  content = content.replace(outerRegex, outerReplacement);

  const outerRegex2 = /className="fixed inset-0 z-\[60\] flex items-center justify-center p-4 bg-black\/80 backdrop-blur-sm"/g;
  const outerReplacement2 = 'className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:p-4 bg-black/80 backdrop-blur-sm"';
  content = content.replace(outerRegex2, outerReplacement2);

  // Fix inner container
  const innerRegex = /className="relative w-full max-w-2xl bg-\[\#09090b\] rounded-2xl shadow-2xl border border-white\/\[0\.08\] overflow-hidden flex flex-col max-h-\[90vh\]"/g;
  const innerReplacement = 'className="relative w-full max-w-2xl bg-[#09090b] rounded-t-3xl md:rounded-2xl shadow-2xl border border-white/[0.08] overflow-hidden flex flex-col h-[95vh] md:h-auto md:max-h-[90vh]"';
  content = content.replace(innerRegex, innerReplacement);

  const innerRegex3 = /className="relative w-full max-w-xl bg-\[\#09090b\] rounded-2xl shadow-2xl border border-white\/\[0\.08\] overflow-hidden flex flex-col max-h-\[90vh\]"/g;
  const innerReplacement3 = 'className="relative w-full max-w-xl bg-[#09090b] rounded-t-3xl md:rounded-2xl shadow-2xl border border-white/[0.08] overflow-hidden flex flex-col h-[90vh] md:h-auto md:max-h-[90vh]"';
  content = content.replace(innerRegex3, innerReplacement3);

  // ProfileModal is max-w-md
  const innerRegex4 = /className="relative w-full max-w-md bg-\[\#09090b\] rounded-2xl shadow-2xl border border-white\/\[0\.08\] overflow-hidden flex flex-col max-h-\[90vh\]"/g;
  const innerReplacement4 = 'className="relative w-full max-w-md bg-[#09090b] rounded-t-3xl md:rounded-2xl shadow-2xl border border-white/[0.08] overflow-hidden flex flex-col h-[90vh] md:h-auto md:max-h-[90vh]"';
  content = content.replace(innerRegex4, innerReplacement4);

  fs.writeFileSync(filepath, content);
}

['src/components/MealLoggerModal.tsx', 'src/components/MealGlycemicModal.tsx', 'src/components/ProfileModal.tsx', 'src/components/DataBackupModal.tsx'].forEach(updateModal);
console.log("Updated modals for mobile bottom sheet style");
