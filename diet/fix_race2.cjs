const fs = require('fs');
function fixRaceCondition(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const oldEffect = `  useEffect(() => {
    if (searchMode === 'online' && searchQuery.trim().length > 2) {
      const delayDebounceFn = setTimeout(() => {
        searchOnlineFood(searchQuery.trim());
      }, 600);

      return () => clearTimeout(delayDebounceFn);
    } else if (searchMode === 'online' && searchQuery.trim().length <= 2) {
      setOnlineResults([]);
    }
  }, [searchQuery, searchMode]);`;

  const newEffect = `  useEffect(() => {
    let isActive = true;
    if (searchMode === 'online' && searchQuery.trim().length > 2) {
      setIsSearchingOnline(true);
      const delayDebounceFn = setTimeout(() => {
        if (isActive) searchOnlineFood(searchQuery.trim(), () => isActive);
      }, 500);

      return () => {
        isActive = false;
        clearTimeout(delayDebounceFn);
      };
    } else if (searchMode === 'online' && searchQuery.trim().length <= 2) {
      setOnlineResults([]);
      setIsSearchingOnline(false);
    }
  }, [searchQuery, searchMode]);`;

  if (content.includes(oldEffect)) content = content.replace(oldEffect, newEffect);

  const oldSearch = `  const searchOnlineFood = async (query: string) => {
    setIsSearchingOnline(true);
    try {`;
  const newSearch = `  const searchOnlineFood = async (query: string, getIsActive: () => boolean) => {
    try {`;
  if (content.includes(oldSearch)) content = content.replace(oldSearch, newSearch);

  const oldSetState = `        setOnlineResults(results);
      }
    } catch (err) {
      console.error("Failed to search online foods:", err);
    } finally {
      setIsSearchingOnline(false);
    }`;
  const newSetState = `        if (getIsActive()) {
          setOnlineResults(results);
        }
      }
    } catch (err) {
      console.error("Failed to search online foods:", err);
    } finally {
      if (getIsActive()) setIsSearchingOnline(false);
    }`;
  if (content.includes(oldSetState)) content = content.replace(oldSetState, newSetState);

  fs.writeFileSync(filePath, content);
  console.log(`Fixed race condition in ${filePath}`);
}
fixRaceCondition('src/components/FoodLibraryView.tsx');
