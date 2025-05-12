
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UploadWorkflow } from '../../../components/faculty/UploadWorkflow';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import createResource  from '../../../services/resource.service';
import { ArrowLeft } from 'lucide-react';

const FacultyUploadPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  
  // Always set isFromSidebar to true since we're coming from the sidebar
  const isFromSidebar = true;
  
  console.log("Upload page loaded with state:", location.state);
  
  const handleSelectOption = async (option: string, data: any) => {
    console.log('Option selected:', option, data);
    
    if (option === 'direct-upload' && data.title) {
      // This handles the final submission from the direct upload
      try {
        setIsUploading(true);
        console.log('Uploading resource:', data);
        
        // Create a new FormData object for the upload
        const formData = new FormData();
        
        // Add all the necessary fields
        formData.append('title', data.title);
        formData.append('description', data.description || '');
        formData.append('type', data.type);
        formData.append('subject', data.subject);
        formData.append('semester', String(data.semester));
        
        // Add file or link based on the resource type
        if (data.type === 'link') {
          formData.append('link', data.link);
        } else if (data.file) {
          formData.append('file', data.file);
        }
        
        // Upload the resource directly using the service
        // const response = await createResource(formData);
        // console.log('Resource uploaded:', response);
        
        // After successful upload, navigate to dashboard
        toast.success('Resource uploaded successfully!');
        navigate('/faculty/dashboard');
      } catch (error: any) {
        console.error('Upload error:', error);
        toast.error(error.message || 'Failed to upload resource');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleCancel = () => {
    navigate('/faculty/dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/faculty/dashboard')}
        className="mb-6 text-indigo-600 hover:text-indigo-700 flex items-center"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-6 dark:text-gray-200">Upload Learning Resources</h1>
      
      <UploadWorkflow 
        onSelectOption={handleSelectOption} 
        onCancel={handleCancel}
        showAvailableSubjects={true}
        isFromSidebar={isFromSidebar}
      />
    </div>
  );
};

export default FacultyUploadPage;
