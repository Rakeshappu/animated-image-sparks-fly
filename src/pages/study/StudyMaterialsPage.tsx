
import { useState, useEffect } from 'react';
import { LocalSearch } from '../../components/search/LocalSearch';
import { SubjectFolder } from '../../components/study/SubjectFolder';
import { StudyMaterialsHeader } from '../../components/study/StudyMaterialsHeader';
import { groupBySemester, groupBySubject } from '../../utils/studyUtils';
import { FacultyResource } from '../../types/faculty';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Book } from 'lucide-react';
import { checkDatabaseConnection } from '../../services/resource.service';
import { MongoDBStatusBanner } from '../../components/auth/MongoDBStatusBanner';

export const StudyMaterialsPage = () => {
  const { user } = useAuth();
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'alphabetical'>('recent');
  const [resources, setResources] = useState<FacultyResource[]>([]);
  const [filteredResources, setFilteredResources] = useState<FacultyResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableSemesters, setAvailableSemesters] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8]);
  const [dbStatus, setDbStatus] = useState<any>(null);
  
  // Check MongoDB connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const status = await checkDatabaseConnection();
        setDbStatus(status);
        console.log('MongoDB connection status in Study Materials:', status);
      } catch (err) {
        console.error('Failed to check DB connection:', err);
      }
    };
    
    checkConnection();
    
    // Check connection status every 30 seconds
    const intervalId = setInterval(checkConnection, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Poll for updates to get the latest resources
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    // Initialize shared resources if it doesn't exist
    if (typeof window !== 'undefined') {
      if (!window.sharedResources) {
        window.sharedResources = [];
      }
      
      // Set initial resources
      setResources([...window.sharedResources]);
      setFilteredResources([...window.sharedResources]);
      
      // Set up polling to check for updates
      const intervalId = setInterval(() => {
        if (window.sharedResources) {
          setResources([...window.sharedResources]);
          setFilteredResources([...window.sharedResources]);
        }
      }, 2000);
      
      return () => {
        clearInterval(intervalId);
        clearTimeout(timer);
      };
    }
    
    return () => clearTimeout(timer);
  }, []);
  
  // Restrict available semesters for students based on their current semester
  useEffect(() => {
    if (user) {
      // If user is admin or faculty, allow all semesters
      if (user.role === 'admin' || user.role === 'faculty') {
        setAvailableSemesters([1, 2, 3, 4, 5, 6, 7, 8]);
      } else {
        // For students, only allow their current semester
        // Assuming user has a semester field or we're using 1 as default
        const userSemester = user.semester || 1;
        setAvailableSemesters([userSemester]);
        setSelectedSemester(userSemester);
      }
    }
  }, [user]);
  
  // Handle search results
  const handleSearchResults = (results: FacultyResource[]) => {
    setFilteredResources(results);
  };
  
  // Group resources by semester
  const resourcesBySemester = groupBySemester(filteredResources);
  
  // Get resources for selected semester
  const semesterResources = resourcesBySemester[selectedSemester] || [];
  
  // Group by subject for the selected semester
  const subjectGroups = groupBySubject(semesterResources);
  
  // Sort subjects alphabetically
  const sortedSubjects = Object.keys(subjectGroups).sort();
  
  // Handle semester change - only if the semester is available for the user
  const handleSemesterChange = (semester: number) => {
    if (availableSemesters.includes(semester)) {
      setSelectedSemester(semester);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <motion.div 
      className="p-6 bg-gray-50 min-h-screen"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* MongoDB Status Banner - always show it */}
      <MongoDBStatusBanner status={dbStatus} />
      
      <motion.div variants={itemVariants} className="mb-6">
        <LocalSearch 
          resources={resources} 
          onSearchResults={handleSearchResults}
          placeholder="Search your semester resources..."
        />
      </motion.div>
      
      <motion.div variants={itemVariants} className="mb-8">
        <StudyMaterialsHeader 
          selectedSemester={selectedSemester} 
          onSemesterChange={handleSemesterChange}
          sortBy={sortBy}
          onSortChange={(sort) => setSortBy(sort as 'recent' | 'popular' | 'alphabetical')}
          availableSemesters={availableSemesters}
        />
      </motion.div>
      
      <motion.div 
        variants={itemVariants}
        className="flex items-center mb-6 bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500"
      >
        <Book className="h-6 w-6 text-indigo-600 mr-3" />
        <h2 className="text-xl font-semibold text-gray-800">
          Semester {selectedSemester} Learning Materials
        </h2>
      </motion.div>
      
      {sortedSubjects.length === 0 ? (
        <motion.div 
          className="bg-white rounded-lg shadow p-12 text-center text-gray-500"
          variants={itemVariants}
        >
          <div className="bg-indigo-50 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4">
            <Book className="h-10 w-10 text-indigo-500" />
          </div>
          <p className="text-xl font-medium mb-2">No resources available for Semester {selectedSemester}</p>
          <p className="text-gray-500">Check back later or ask your faculty to upload resources.</p>
        </motion.div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
        >
          {sortedSubjects.map((subject) => (
            <motion.div key={subject} variants={itemVariants}>
              <SubjectFolder 
                subject={subject}
                resources={subjectGroups[subject]}
                sortBy={sortBy}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default StudyMaterialsPage;
