
// Fix for the safe access to resource.stats
// Adding optional chaining where needed

const renderResourceCount = (resources: FacultyResource[]) => {
  if (!resources || resources.length === 0) return "No resources";
  
  const resourceTypes = resources.reduce((acc: Record<string, number>, resource) => {
    const type = resource.type || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  
  const viewCount = resources.reduce((sum, resource) => {
    // Safely access resource.stats with optional chaining
    return sum + (resource.stats?.views || 0);
  }, 0);
  
  return (
    <div className="text-xs text-gray-500 space-y-1">
      <div>{resources.length} resources</div>
      <div>{viewCount} total views</div>
      {Object.entries(resourceTypes).map(([type, count]) => (
        <span key={type} className="mr-2">
          {count} {type}
        </span>
      ))}
    </div>
  );
};
