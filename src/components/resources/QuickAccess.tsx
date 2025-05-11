
import { Briefcase, Code, BookOpen, Book, FileText, Users, Award, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const quickAccessItems = [
  {
    title: 'Placement Preparation',
    icon: <Briefcase className="h-6 w-6" />,
    description: 'Interview prep, resume tips, and more',
    color: 'bg-purple-100 text-purple-600',
    path: '/placement',
    content: [
      { icon: <FileText size={16} />, title: 'Resume Templates', link: '/placement' },
      { icon: <Users size={16} />, title: 'Interview Questions', link: '/placement' },
      { icon: <Award size={16} />, title: 'Company Profiles', link: '/placement' },
      { icon: <Monitor size={16} />, title: 'Mock Interviews', link: '/placement' }
    ]
  },
  {
    title: 'Competitive Programming',
    icon: <Code className="h-6 w-6" />,
    description: 'Practice problems and solutions',
    color: 'bg-blue-100 text-blue-600',
    path: '/competitive-programming',
    content: [
      { icon: <Book size={16} />, title: 'Algorithm Tutorials', link: '/competitive-programming?tab=algorithms' },
      { icon: <FileText size={16} />, title: 'Practice Problems', link: '/competitive-programming?tab=problems' },
      { icon: <Award size={16} />, title: 'Contests', link: '/competitive-programming?tab=contests' },
      { icon: <Code size={16} />, title: 'Coding Resources', link: '/competitive-programming?tab=resources' }
    ]
  },
  {
    title: 'Study Materials',
    icon: <BookOpen className="h-6 w-6" />,
    description: 'Notes, presentations, and guides',
    color: 'bg-green-100 text-green-600',
    path: '/study-materials',
    content: []
  }
];

export const QuickAccess = () => {
  const navigate = useNavigate();
  
  const handleItemClick = (path: string) => {
    console.log("Navigating to:", path);
    navigate(path);
  };
  
  const handleContentClick = (link: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Navigating to content:", link);
    navigate(link);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {quickAccessItems.map((item) => (
        <div
          key={item.title}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all cursor-pointer"
          onClick={() => handleItemClick(item.path)}
        >
          <div className={`${item.color} p-3 rounded-full w-fit mb-4`}>
            {item.icon}
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h3>
          <p className="text-sm text-gray-600">{item.description}</p>
          
          {item.content.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <ul className="space-y-2">
                {item.content.slice(0, 2).map((contentItem, idx) => (
                  <li 
                    key={idx}
                    className="flex items-center text-sm py-1.5 px-2 hover:bg-gray-50 rounded-md transition-colors"
                    onClick={(e) => handleContentClick(contentItem.link, e)}
                  >
                    <span className="mr-2 text-indigo-500">{contentItem.icon}</span>
                    <span className="text-gray-700">{contentItem.title}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 text-center">
                <button 
                  className="px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-full text-xs font-medium transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(item.path);
                  }}
                >
                  View All Resources
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default QuickAccess;