const fs = require('fs');
const file = 'src/components/MealLoggerModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<input\s*type="text"\s*placeholder="Search chicken breast, roti, paneer, dal, oats, avocado\.\.\."\s*value=\{searchQuery\}\s*onChange=\{\(e\) => setSearchQuery\(e\.target\.value\)\}\s*className="w-full rounded-xl border border-white\/\[0\.08\] bg-zinc-900\/90 pl-10 pr-4 py-2\.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-400 focus:outline-none"\s*\/>/m;

const replacement = `<input
                      type="text"
                      placeholder={searchMode === 'local' ? "Search chicken breast, roti, paneer..." : "Search global database..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-zinc-900/90 pl-10 pr-24 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-400 focus:outline-none"
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center bg-zinc-800 rounded-lg p-0.5">
                      <button
                        onClick={() => {
                          setSearchMode('local');
                        }}
                        className={\`px-2 py-1 text-[10px] font-semibold rounded-md transition-all \${
                          searchMode === 'local' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'
                        }\`}
                      >
                        Local
                      </button>
                      <button
                        onClick={() => {
                          setSearchMode('online');
                          if (searchQuery.trim().length > 2) searchOnlineFood();
                        }}
                        className={\`px-2 py-1 text-[10px] font-semibold rounded-md transition-all flex items-center gap-1 \${
                          searchMode === 'online' ? 'bg-indigo-500 text-white' : 'text-zinc-400 hover:text-zinc-200'
                        }\`}
                      >
                        <Globe className="w-3 h-3" />
                        Global
                      </button>
                    </div>`;

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
  console.log("Successfully fixed search bar in MealLoggerModal");
} else {
  console.log("Regex didn't match.");
}
