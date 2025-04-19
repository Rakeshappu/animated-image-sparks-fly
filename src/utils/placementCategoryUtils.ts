// Standard placement categories used throughout the application
export const placementCategories = [
    { id: 'aptitude', name: 'Aptitude', description: 'Quantitative, logical and verbal reasoning' },
    { id: 'dsa', name: 'Data Structures & Algorithms', description: 'Programming problems and solutions' },
    { id: 'oops', name: 'Object-Oriented Programming', description: 'OOP concepts and implementations' },
    { id: 'os', name: 'Operating Systems', description: 'OS concepts and interview questions' },
    { id: 'cn', name: 'Computer Networks', description: 'Networking principles and protocols' },
    { id: 'dbms', name: 'Database Management', description: 'SQL, DBMS concepts and normalization' },
    { id: 'interview', name: 'Interview Preparation', description: 'Mock interviews and tips' },
    { id: 'hr', name: 'HR Interview', description: 'HR questions and best practices' },
    { id: 'resume', name: 'Resume Building', description: 'Resume templates and tips' },
    { id: 'technical', name: 'Technical Skills', description: 'Language-specific and technical skills' },
    { id: 'soft-skills', name: 'Soft Skills', description: 'Communication and interpersonal skills' },
    { id: 'general', name: 'General Resources', description: 'General placement preparation materials' },
    { id: 'companies', name: 'Company Profiles', description: 'Information about companies and their recruitment process' },
    { id: 'preparation', name: 'Preparation Roadmaps', description: 'Structured plans for placement preparation' },
    { id: 'placement-tips', name: 'Placement Tips', description: 'Expert advice for placement success' }
  ];
  
  // Get category name from id
  export const getCategoryNameById = (categoryId: string): string => {
    const category = placementCategories.find(cat => cat.id === categoryId);
    return category ? category.name : 'General Resources';
  };
  
  // Get category by id
  export const getCategoryById = (categoryId: string) => {
    return placementCategories.find(cat => cat.id === categoryId) || placementCategories[placementCategories.length - 1];
  };
  
  // Get all available category ids
  export const getAllCategoryIds = (): string[] => {
    return placementCategories.map(cat => cat.id);
  };
  
  // Normalize category ID for consistent usage
  export const normalizeCategoryId = (id: string): string => {
    if (!id) return 'general';
    
    // Convert spaces to hyphens, remove special characters, and make lowercase
    return id.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };
  
  // Verify if a category ID is valid
  export const isValidCategoryId = (id: string): boolean => {
    if (!id) return false;
    return placementCategories.some(cat => cat.id === id);
  };
  
  // Get standardized category from any format
  export const getStandardizedCategory = (category: string): string => {
    if (!category) return 'general';
    
    // Try direct match first
    if (isValidCategoryId(category)) return category;
    
    // Try normalized version
    const normalized = normalizeCategoryId(category);
    if (isValidCategoryId(normalized)) return normalized;
    
    // Create mapping for common variations
    const categoryMappings: Record<string, string> = {
      'interview-preparation': 'interview',
      'interview-prep': 'interview',
      'resume-building': 'resume',
      'resume-template': 'resume',
      'technical-skill': 'technical',
      'company-profile': 'companies',
      'company-information': 'companies',
      'general-resource': 'general',
      'placement-tip': 'placement-tips',
      'soft-skill': 'soft-skills',
      'hr-interview': 'hr',
      'roadmap': 'preparation',
      'preparation-roadmap': 'preparation',
      'data-structure': 'dsa',
      'algorithm': 'dsa',
      'operating-system': 'os',
      'computer-network': 'cn',
      'database': 'dbms'
    };
    
    // Try mapping
    if (categoryMappings[normalized]) {
      return categoryMappings[normalized];
    }
    
    // Try to match by name (case insensitive)
    const matchByName = placementCategories.find(
      cat => cat.name.toLowerCase() === category.toLowerCase()
    );
    if (matchByName) return matchByName.id;
    
    // Check if the category is a prefix or contains similar words to any valid category
    for (const validCategory of placementCategories) {
      if (
        validCategory.id.includes(normalized) || 
        normalized.includes(validCategory.id) ||
        validCategory.name.toLowerCase().includes(category.toLowerCase()) ||
        category.toLowerCase().includes(validCategory.name.toLowerCase())
      ) {
        return validCategory.id;
      }
    }
    
    // Default fallback
    return 'general';
  };
  