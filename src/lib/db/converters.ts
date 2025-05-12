
/**
 * Helper function to convert MongoDB documents to plain objects
 * and handle ObjectId conversions to strings
 */
export function mongoDocToPlain(doc: any) {
  if (!doc) return null;
  
  const obj = doc.toObject ? doc.toObject() : doc;
  
  // Convert _id to string if it exists
  if (obj._id) {
    obj._id = obj._id.toString();
  }
  
  // Convert any nested ObjectIds to strings
  Object.keys(obj).forEach(key => {
    if (obj[key] && obj[key].toString && typeof obj[key].toString === 'function' && key !== '_id') {
      // Check if it's likely a MongoDB ObjectId
      if (obj[key]._bsontype === 'ObjectID' || obj[key].constructor.name === 'ObjectID') {
        obj[key] = obj[key].toString();
      }
    }
    
    // Handle nested arrays
    if (Array.isArray(obj[key])) {
      obj[key] = obj[key].map((item: any) => {
        if (item && item._id) {
          return mongoDocToPlain(item);
        }
        return item;
      });
    }
    
    // Handle nested objects
    if (obj[key] && typeof obj[key] === 'object' && obj[key] !== null) {
      obj[key] = mongoDocToPlain(obj[key]);
    }
  });
  
  return obj;
}

/**
 * Convert MongoDB document arrays to plain objects
 */
export function convertDocArray(docs: any[]) {
  if (!Array.isArray(docs)) return [];
  return docs.map(doc => mongoDocToPlain(doc));
}

/**
 * Helper function to ensure all _id fields are strings
 * Used specifically for resource stats endpoint
 */
export function ensureStringIds<T extends { _id: any }>(items: any[]): T[] {
  if (!Array.isArray(items)) return [];
  
  return items.map(item => {
    const copy = { ...item };
    if (copy._id) {
      copy._id = String(copy._id);
    }
    return copy as T;
  });
}
