import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.ts';
import { Header } from './components/layout/Header.ts';
import { Sidebar } from './components/layout/Sidebar.ts';
import { AuthPage } from './pages/auth/AuthPage.ts';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage.ts';
import { FacultyDashboard } from './pages/faculty/FacultyDashboard.ts';
import { Dashboard } from './components/dashboard/Dashboard.ts';
import { ProfilePage } from './pages/profile/ProfilePage.ts';
import StudyMaterialsPage  from './pages/study/StudyMaterialsPage.ts';
import PrivateRoute from './components/auth/PrivateRoute.ts';
import { StarredPage as StudentStarredPage } from './pages/storage/StarredPage.ts';
import { DownloadsPage } from './pages/storage/DownloadsPage.ts';
import { TrashPage as StudentTrashPage } from './pages/storage/TrashPage.ts';
import { SettingsPage as StudentSettingsPage } from './pages/settings/SettingsPage.ts';
import AdminDashboard  from './pages/admin/AdminDashboard.ts';
import PlacementResources from './pages/placement/PlacementResources.ts';
import { SubjectDetailPage } from './pages/study/SubjectDetailPage.ts';
import UsersManagement from './pages/admin/UsersManagement.ts';
import AllResources from './pages/admin/AllResources.ts';
import EligibleUSNs from './pages/admin/EligibleUSNs.ts';
import BulkSemesterUpdate from './pages/admin/BulkSemesterUpdate.ts';
import AnalyticsPage from './pages/faculty/AnalyticsPage.ts';
import { StudentsPage } from './pages/faculty/StudentsPage.ts';
import { StarredPage as FacultyStarredPage } from './pages/faculty/StarredPage.ts';
import { TrashPage as FacultyTrashPage } from './pages/faculty/TrashPage.ts';
import { SettingsPage as FacultySettingsPage } from './pages/faculty/SettingsPage.ts';

import FacultyUploadPage from './pages/faculty/upload/index.tsx';
import AdminUploadPage from './pages/admin/upload/index.tsx';
import StudentCompetitiveProgramming from './pages/competitive/StudentCompetitiveProgramming.ts';

function App() {
  const skipAuth = true;

  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
          <Routes>
            <Route 
              path="/" 
              element={
                skipAuth ? 
                <Navigate to="/dashboard" replace /> : 
                <Navigate to="/auth" replace />
              } 
            />
            
            <Route path="/auth/*" element={<AuthPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            
            <Route
              path="/dashboard"
              element={
                <PrivateRoute role="student">
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Header />
                      <Dashboard />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
           
            <Route
              path="/study-materials"
              element={
                <PrivateRoute role="student">
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Header />
                      <StudyMaterialsPage />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/study/:subject"
              element={
                <PrivateRoute role="student">
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Header />
                      <SubjectDetailPage />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/placement"
              element={
                <PrivateRoute role="student">
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Header />
                      <PlacementResources />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/starred"
              element={
                <PrivateRoute role="student">
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Header />
                      <StudentStarredPage />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/downloads"
              element={
                <PrivateRoute role="student">
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Header />
                      <DownloadsPage />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/trash"
              element={
                <PrivateRoute role="student">
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Header />
                      <StudentTrashPage />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute role="student">
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Header />
                      <StudentSettingsPage />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/faculty/dashboard"
              element={
                <PrivateRoute role="faculty">
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Header />
                      <FacultyDashboard />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/faculty/upload"
              element={
                <PrivateRoute role="faculty">
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Header />
                      <FacultyUploadPage />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/faculty/analytics"
              element={
                <PrivateRoute role="faculty">
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Header />
                      <AnalyticsPage />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/faculty/students"
              element={
                <PrivateRoute role="faculty">
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Header />
                      <StudentsPage />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/faculty/starred"
              element={
                <PrivateRoute role="faculty">
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Header />
                      <FacultyStarredPage />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/faculty/trash"
              element={
                <PrivateRoute role="faculty">
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Header />
                      <FacultyTrashPage />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/faculty/settings"
              element={
                <PrivateRoute role="faculty">
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Header />
                      <FacultySettingsPage />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/admin/dashboard"
              element={
                <PrivateRoute role="admin">
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Header />
                      <AdminDashboard />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/upload"
              element={
                <PrivateRoute role="admin">
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Header />
                      <AdminUploadPage />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <PrivateRoute role="admin">
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Header />
                      <UsersManagement />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/resources"
              element={
                <PrivateRoute role="admin">
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Header />
                      <AllResources 
                        onViewAnalytics={(resourceId) => {
                          window.location.href = `/admin/resources/${resourceId}/analytics`;
                        }}
                      />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/bulk-semester"
              element={
                <PrivateRoute role="admin">
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Header />
                      <BulkSemesterUpdate />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/trash"
              element={
                <PrivateRoute role="admin">
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Header />
                      <StudentTrashPage />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <PrivateRoute role="admin">
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Header />
                      <StudentSettingsPage />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/admin/eligible-usns"
              element={
                <PrivateRoute role="admin">
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Header />
                      <EligibleUSNs />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Header />
                      <ProfilePage />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />

            <Route
              path="/competitive-programming"
              element={
                <PrivateRoute role="student">
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Header />
                      <StudentCompetitiveProgramming />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
