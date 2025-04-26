
import { useState } from 'react';
import { SubjectData, SubjectFolder } from '../../types/faculty';
import { UploadOptionSelection } from './upload/UploadOptionSelection';
import { SemesterSelection } from './upload/SemesterSelection';
import { SubjectCreationForm } from './upload/SubjectCreationForm';
import { PlacementCategorySelection } from './upload/PlacementCategorySelection';
import { ResourceUpload } from './ResourceUpload';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { createResource } from '../../services/resource.service';

type UploadOption = 'semester' | 'common' | 'placement' | 'subject-folder' | 'direct-upload';
type SemesterNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface UploadWorkflowProps {
  onSelectOption: (option: string, data?: any) => void;
  onCancel: () => void;
  showAvailableSubjects?: boolean;
}

export const UploadWorkflow = ({ 
  onSelectOption, 
  onCancel,
  showAvailableSubjects = false
}: UploadWorkflowProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'initial' | 'semester-selection' | 'subject-creation' | 'placement-category' | 'placement-upload'>('initial');
  const [selectedSemester, setSelectedSemester] = useState<SemesterNumber | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<{id: string, name: string} | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Get existing subjects
  const existingSubjects: SubjectFolder[] = window.subjectFolders || [];

  const handleInitialSelection = (option: UploadOption) => {
    if (option === 'semester') {
      setStep('semester-selection');
    } else if (option === 'subject-folder') {
      setStep('subject-creation');
    } else if (option === 'placement') {
      // For placement resources, go to placement categories
      setStep('placement-category');
    } else if (option === 'common') {
      // For common resources, skip semester selection
      onSelectOption('direct-upload', { 
        resourceType: 'common',
        subject: 'Common Resources',
        category: 'common'
      });
    } else {
      // For direct upload, pass directly to parent
      onSelectOption(option);
    }
  };

  const handleSemesterSelect = (semester: SemesterNumber) => {
    setSelectedSemester(semester);
    setStep('subject-creation');
  };

  const handlePlacementCategorySelect = (categoryId: string, categoryName: string) => {
    console.log('Selected placement category:', categoryId, categoryName);
    setSelectedCategory({ id: categoryId, name: categoryName });
    setStep('placement-upload');
  };

  const handleCreateSubjectFolders = (newSubjects: SubjectData[]) => {
    onSelectOption('create-subject-folders', { 
      semester: selectedSemester, 
      subjects: newSubjects 
    });
  };

  const handlePlacementUpload = async (data: any) => {
    try {
      setIsUploading(true);
      console.log('Submitting placement resource:', data);
      
      if (!selectedCategory) {
        toast.error('Please select a placement category first');
        return;
      }
      
      // Create a new FormData object for the upload
      const formData = new FormData();
      
      // Add all the necessary fields
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('type', data.type);
      formData.append('subject', `Placement - ${selectedCategory.name}`);
      formData.append('semester', '0');  // 0 for placement resources
      formData.append('category', 'placement');
      formData.append('placementCategory', selectedCategory.id);
      
      // Add file or link based on the resource type
      if (data.type === 'link') {
        formData.append('link', data.link);
      } else if (data.file) {
        formData.append('file', data.file);
      }
      
      // Upload the resource directly using the service
      const response = await createResource(formData);
      console.log('Placement resource created:', response);
      
      // Update shared resources in window if needed
      if (window.sharedResources && response) {
        const newResource = {
          id: response._id || response.id,
          title: data.title,
          description: data.description,
          type: data.type,
          subject: `Placement - ${selectedCategory.name}`,
          semester: 0,
          uploadDate: new Date().toISOString(),
          fileName: data.file?.name,
          fileUrl: response.fileUrl,
          stats: {
            views: 0,
            likes: 0,
            comments: 0,
            downloads: 0,
            lastViewed: new Date().toISOString()
          }
        };
        
        window.sharedResources = [newResource, ...window.sharedResources];
      }
      
      // After successful upload, navigate to dashboard
      toast.success('Placement resource uploaded successfully!');
      navigate('/faculty/dashboard');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload placement resource');
    } finally {
      setIsUploading(false);
    }
  };

  // Filter existing subjects for the selected semester
  const existingSubjectsForSemester = selectedSemester
    ? existingSubjects.filter(subject => subject.semester === selectedSemester)
    : [];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {step === 'initial' && (
        <UploadOptionSelection
          onSelectOption={handleInitialSelection}
          onCancel={onCancel}
          showAvailableSubjects={showAvailableSubjects}
          existingSubjects={existingSubjects}
        />
      )}

      {step === 'semester-selection' && (
        <SemesterSelection
          onSemesterSelect={handleSemesterSelect}
          onBack={() => setStep('initial')}
        />
      )}

      {step === 'subject-creation' && (
        <SubjectCreationForm
          selectedSemester={selectedSemester}
          onBack={() => selectedSemester ? setStep('semester-selection') : setStep('initial')}
          onSkipToUpload={() => onSelectOption('direct-upload')}
          onCreateSubjectFolders={handleCreateSubjectFolders}
          existingSubjectsForSemester={existingSubjectsForSemester}
          showAvailableSubjects={showAvailableSubjects}
        />
      )}

      {step === 'placement-category' && (
        <PlacementCategorySelection
          onCategorySelect={handlePlacementCategorySelect}
          onBack={() => setStep('initial')}
        />
      )}

      {step === 'placement-upload' && selectedCategory && (
        <div>
          <button
            onClick={() => setStep('placement-category')}
            className="mb-4 text-indigo-600 hover:text-indigo-700 flex items-center"
          >
            ← Back to Categories
          </button>
          <ResourceUpload 
            onUpload={handlePlacementUpload}
            initialSubject={`Placement - ${selectedCategory.name}`}
            initialSemester={0}
            initialCategory="placement"
            isPlacementResource={true}
            placementCategory={selectedCategory.id}
          />
        </div>
      )}
    </div>
  );
};
