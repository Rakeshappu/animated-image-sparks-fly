
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

import { 
  BarChart2, 
  Users, 
  Settings, 
  FolderOpen, 
  Upload, 
  Star, 
  Trash, 
  Menu, 
  X,
  FileText,
  ShieldCheck,
  Database,
  GraduationCap
} from 'lucide-react';

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogoClick = () => {
    if (user?.role === 'faculty') {
      navigate('/faculty/dashboard');
    } else if (user?.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      const toggleBtn = document.getElementById('sidebar-toggle');
      
      if (sidebar && 
          !sidebar.contains(event.target as Node) && 
          toggleBtn && 
          !toggleBtn.contains(event.target as Node) &&
          window.innerWidth < 768) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const StudentLinks = () => (
    <>
      <SidebarLink icon={<FolderOpen />} text="My Files" path="/dashboard" active={isActive('/dashboard')} />
      <SidebarLink icon={<FileText />} text="Study Materials" path="/study-materials" active={isActive('/study-materials')} />
      <SidebarLink icon={<Star />} text="Starred" path="/starred" active={isActive('/starred')} />
      {/* Trash link removed for students */}
    </>
  );

  const FacultyLinks = () => (
    <>
      <SidebarLink icon={<FolderOpen />} text="My Resources" path="/faculty/dashboard" active={isActive('/faculty/dashboard')} />
      <SidebarLink 
        icon={<Upload />} 
        text="Upload" 
        path="/faculty/upload" 
        active={isActive('/faculty/upload')} 
        isUpload={true}
      />
      <SidebarLink icon={<BarChart2 />} text="Analytics" path="/faculty/analytics" active={isActive('/faculty/analytics')} />
      <SidebarLink icon={<Trash />} text="Trash" path="/faculty/trash" active={isActive('/faculty/trash')} />
    </>
  );

  const AdminLinks = () => (
    <>
      <SidebarLink icon={<ShieldCheck />} text="Dashboard" path="/admin/dashboard" active={isActive('/admin/dashboard')} />
      <SidebarLink icon={<Upload />} text="Upload Content" path="/admin/upload" active={isActive('/admin/upload')} />
      <SidebarLink icon={<Users />} text="Manage Users" path="/admin/users" active={isActive('/admin/users')} />
      <SidebarLink icon={<Database />} text="All Resources" path="/admin/resources" active={isActive('/admin/resources')} />
      <SidebarLink icon={<GraduationCap />} text="Eligible USNs" path="/admin/eligible-usns" active={isActive('/admin/eligible-usns')} />
      <SidebarLink icon={<Trash />} text="Trash" path="/admin/trash" active={isActive('/admin/trash')} />
    </>
  );

  const getLinksByRole = () => {
    if (user?.role === 'faculty') {
      return <FacultyLinks />;
    } else if (user?.role === 'admin') {
      return <AdminLinks />;
    } else {
      return <StudentLinks />;
    }
  };

  const getRoleLabel = () => {
    if (user?.role === 'faculty') {
      return 'Faculty Tools';
    } else if (user?.role === 'admin') {
      return 'Admin Controls';
    } else {
      return 'Learning Resources';
    }
  };

  return (
    <>
      <button 
        id="sidebar-toggle"
        className="md:hidden fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 p-2 rounded-md shadow-md"
        onClick={toggleSidebar}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      
      <aside 
        id="sidebar"
        className={`bg-white dark:bg-gray-800 shadow-lg fixed inset-y-0 left-0 z-40 transition-transform duration-300 
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 md:static md:w-64 min-h-screen`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div onClick={handleLogoClick} className="flex items-center space-x-3 cursor-pointer">
            <div className="relative flex items-center justify-center w-10 h-9 rounded-full text-white shadow-lg">
              <span><img src="/uploads/cropped.png" alt="logo" className="h-13 w-18"/></span>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">VersatileShare</h2>
          </div>
          <button 
            className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            onClick={toggleSidebar}
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="p-4">
          <div className="space-y-6">
            <div>
              <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {getRoleLabel()}
              </h3>
              <div className="mt-2 space-y-1">
                {getLinksByRole()}
              </div>
            </div>
            
            <div>
              <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Settings
              </h3>
              <div className="mt-2 space-y-1">
                <SidebarLink 
                  icon={<Settings />} 
                  text="Settings" 
                  path={user?.role === 'faculty' ? '/faculty/settings' : 
                        user?.role === 'admin' ? '/admin/settings' : '/settings'} 
                  active={isActive('/settings') || isActive('/faculty/settings') || isActive('/admin/settings')} 
                />
              </div>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
};

interface SidebarLinkProps { 
  icon: React.ReactNode; 
  text: string; 
  path: string;
  active: boolean;
  isUpload?: boolean;
}

const SidebarLink = ({ 
  icon, 
  text, 
  path, 
  active,
  isUpload = false
}: SidebarLinkProps) => {
  const navigate = useNavigate();
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isUpload) {
      e.preventDefault();
      navigate(path, { state: { isFromSidebar: true } });
    }
  };

  return (
    <Link
      to={path}
      state={{ isFromSidebar: isUpload }}
      onClick={handleClick}
      className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
        active 
          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
          : 'text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400'
      }`}
    >
      <span className={active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}>{icon}</span>
      <span>{text}</span>
    </Link>
  );
};

export default Sidebar;
