
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UploadWorkflow } from '../../../components/faculty/UploadWorkflow';
import { toast } from 'react-hot-toast';
import { createResource, createSubjectFolders } from '../../../services/resource.service';

const UploadPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isFromSidebar = location.state?.isFromSidebar || false;
  
  // Output debug information
  useEffect(() => {
    console.log('Upload page loaded with isFromSidebar:', isFromSidebar);
  }, [isFromSidebar]);

  const handleUploadOption = async (option: string, data?: any) => {
    try {
      if (option === 'direct-upload') {
        // For direct resource upload
        const formData = new FormData();
        
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('type', data.type);
        formData.append('subject', data.subject);
        formData.append('semester', String(data.semester));
        
        if (data.type === 'link') {
          formData.append('link', data.link);
        } else if (data.file) {
          formData.append('file', data.file);
        }
        
        const response = await createResource(formData);
        console.log('Resource created:', response);
        
        toast.success('Resource uploaded successfully!');
        navigate('/faculty/dashboard');
      } 
      else if (option === 'create-subject-folders') {
        // For creating subject folders
        const { semester, subjects } = data;
        
        const response = await createSubjectFolders(semester, subjects);
        console.log('Subject folders created:', response);
        
        toast.success('Subject folders created successfully!');
        navigate('/faculty/dashboard');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Upload failed');
    }
  };

  const handleCancel = () => {
    navigate('/faculty/dashboard');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upload Resources</h1>
      
      <UploadWorkflow 
        onSelectOption={handleUploadOption}
        onCancel={handleCancel}
        showAvailableSubjects={true}
        isFromSidebar={isFromSidebar}
      />
    </div>
  );
};

export default UploadPage;
