const fs = require('fs');

let content = fs.readFileSync('src/components/MealLoggerModal.tsx', 'utf8');

// 1. Add searchMode state
if (!content.includes('const [searchMode, setSearchMode] = useState')) {
  content = content.replace(/const \[isSearchingOnline, setIsSearchingOnline\] = useState\(false\);/, 
    "const [isSearchingOnline, setIsSearchingOnline] = useState(false);\n  const [searchMode, setSearchMode] = useState<'local' | 'online'>('local');");
}

// 2. Modify handleAddSelectedFood to clear the search bar
const handleAddRegex = /const handleAddSelectedFood = \(\) => \{[\s\S]*?setIsOpen\(false\);\s*\};/m;
if (content.match(handleAddRegex)) {
  const matchStr = content.match(handleAddRegex)[0];
  const newMatchStr = matchStr.replace('setIsOpen(false);', 
    "setIsOpen(false);\n    setSearchQuery('');\n    setOnlineResults([]);\n    setSearchMode('local');");
  content = content.replace(handleAddRegex, newMatchStr);
}

// 3. Modify the Search Input UI to include the toggle
const searchInputRegex = /<input\s*type="text"\s*placeholder="Search 80,000\+ foods, Indian cuisine, presets\.\.\."\s*value=\{searchQuery\}\s*onChange=\{\(e\) => setSearchQuery\(e\.target\.value\)\}\s*className="w-full rounded-xl border border-white\/\[0\.08\] bg-zinc-950 pl-10 pr-4 py-2\.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"\s*\/>/m;

const newSearchInput = `<input
                    type="text"
                    placeholder="Search 80,000+ foods, Indian cuisine, presets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-zinc-950 pl-10 pr-24 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center bg-zinc-900 rounded-lg p-0.5">
                    <button
                      onClick={() => setSearchMode('local')}
                      className={\`px-2 py-1 text-[10px] font-semibold rounded-md transition-all \${
                        searchMode === 'local' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'
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
                        searchMode === 'online' ? 'bg-indigo-500 text-white' : 'text-zinc-500 hover:text-zinc-300'
                      }\`}
                    >
                      <Globe className="w-3 h-3" />
                      Global
                    </button>
                  </div>`;
content = content.replace(searchInputRegex, newSearchInput);

// 4. Also automatically trigger searchOnlineFood if mode is online and query changes, but with a slight debounce
// Wait, the user said "once the internet search is toggled on", so the toggle button triggers it.
// In useEffect:
const useEffectQueryRegex = /useEffect\(\(\) => \{\s*setOnlineResults\(\[\]\);\s*\}, \[searchQuery\]\);/m;
const newUseEffectQuery = `useEffect(() => {
    setOnlineResults([]);
    if (searchMode === 'online' && searchQuery.trim().length > 2) {
      const timeoutId = setTimeout(() => searchOnlineFood(), 600);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, searchMode]);`;
content = content.replace(useEffectQueryRegex, newUseEffectQuery);

// 5. Modify the array spread in the list render: [...onlineResults, ...filteredFoods]
// And remove the manual "Can't find what you're looking for?" button since they have the toggle now.
const oldListRenderRegex = /\{searchQuery\.trim\(\)\.length > 2 && !isSearchingOnline && onlineResults\.length === 0 && \([\s\S]*?<Zap className="w-3\.5 h-3\.5" \/> Search Internet Database[\s\S]*?<\/button>\s*<\/div>\s*\)\}\s*\{filteredFoods\.length === 0 && !isSearchingOnline && onlineResults\.length === 0 && \([\s\S]*?<\/div>\s*\)\}\s*\{isSearchingOnline && \([\s\S]*?<\/div>\s*\)\}\s*\{\[\.\.\.filteredFoods, \.\.\.onlineResults\]\.map\(\(food\) => \(/m;

const newListRender = `{filteredFoods.length === 0 && !isSearchingOnline && onlineResults.length === 0 && (
                    <div className="py-8 text-center text-zinc-500 text-xs">
                      No foods matching &ldquo;{searchQuery}&rdquo;. Try the Global search or create a custom entry.
                    </div>
                  )}
                  {isSearchingOnline && (
                    <div className="flex flex-col items-center justify-center py-8 text-zinc-400 gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                      <span className="text-xs font-medium">Searching global database for "{searchQuery}"...</span>
                    </div>
                  )}
                  {(searchMode === 'online' ? [...onlineResults, ...filteredFoods] : filteredFoods).map((food) => (`

content = content.replace(oldListRenderRegex, newListRender);

fs.writeFileSync('src/components/MealLoggerModal.tsx', content);

