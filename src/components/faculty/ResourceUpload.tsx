
import { useState, useEffect } from 'react';
import { Upload, FileText } from 'lucide-react';
import { UploadFormData, SubjectFolder } from '../../types/faculty';
import { toast } from 'react-hot-toast';

interface ResourceUploadProps {
  onUpload: (data: UploadFormData) => Promise<void>;
  initialSubject?: string;
  initialSemester?: number;
  initialCategory?: 'common' | 'study' | 'placement';
  isPlacementResource?: boolean;
  placementCategory?: string;
}

export const ResourceUpload = ({ 
  onUpload, 
  initialSubject, 
  initialSemester, 
  initialCategory,
  isPlacementResource = false,
  placementCategory
}: ResourceUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number>(
    initialSemester !== undefined ? initialSemester : 1
  );
  const [semesterSubjects, setSemesterSubjects] = useState<SubjectFolder[]>([]);
  
  const [formData, setFormData] = useState<UploadFormData>({
    title: '',
    description: '',
    type: 'document',
    subject: initialSubject || '',
    semester: initialSemester !== undefined ? initialSemester : 1,
    file: undefined,
    link: '',
    category: initialCategory || 'study',
    placementCategory: placementCategory
  });

  // This effect runs when the selectedSemester changes
  useEffect(() => {
    if (isPlacementResource) {
      return;
    }
    
    const allSubjectFolders = window.subjectFolders || [];
    
    const filteredSubjects = allSubjectFolders.filter(
      (folder: SubjectFolder) => folder.semester === selectedSemester
    );
    
    setSemesterSubjects(filteredSubjects);
    
    if (formData.semester !== selectedSemester) {
      setFormData(prev => ({
        ...prev,
        semester: selectedSemester,
        subject: initialSubject || ''
      }));
    }
  }, [selectedSemester, formData.semester, isPlacementResource, initialSubject]);

  // Initialize selectedSemester based on initialSemester
  useEffect(() => {
    if (initialSemester !== undefined) {
      console.log("Setting semester from prop:", initialSemester);
      setSelectedSemester(initialSemester);
      setFormData(prev => ({
        ...prev,
        semester: initialSemester
      }));
    }
  }, [initialSemester]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setFormData({ ...formData, file });
    }
  };
  
  const handleSemesterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSemester = Number(e.target.value);
    console.log("Changing semester to:", newSemester);
    setSelectedSemester(newSemester);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setError(null);

    try {
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }

      if (!isPlacementResource && (!formData.subject || !formData.subject.trim())) {
        throw new Error('Subject is required');
      }

      if (formData.type === 'link' && !formData.link) {
        throw new Error('URL is required for link resources');
      }

      if (formData.type !== 'link' && !formData.file) {
        throw new Error('File is required');
      }

      const dataToUpload = {
        ...formData,
        semester: isPlacementResource ? 0 : selectedSemester,
        category: (isPlacementResource ? 'placement' : (formData.category || 'study')) as 'common' | 'study' | 'placement',
        placementCategory: isPlacementResource ? placementCategory : undefined,
        subject: formData.subject || ''  // Ensure subject is not undefined
      };

      console.log("Submitting data:", dataToUpload);
      await onUpload(dataToUpload);
      
      setFormData({
        title: '',
        description: '',
        type: 'document',
        subject: initialSubject || '',
        semester: isPlacementResource ? 0 : selectedSemester,
        file: undefined,
        link: '',
        category: initialCategory || 'study',
        placementCategory: placementCategory
      });
      setFileName(null);
      
      toast.success('Resource uploaded successfully!');
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload resource';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        {isPlacementResource ? 'Upload Placement Resource' : 'Upload Resource'}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title*
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resource Type*
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="document">Document</option>
              <option value="video">Video</option>
              <option value="note">Note</option>
              <option value="link">Link</option>
            </select>
          </div>
          
          {!isPlacementResource && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester*
              </label>
              <select
                name="semester"
                value={selectedSemester}
                onChange={handleSemesterChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>
          )}
          
          {isPlacementResource ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category*
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                readOnly
                className="w-full p-2 border border-gray-300 bg-gray-50 rounded-md"
              />
              <input
                type="hidden"
                name="category"
                value="placement"
              />
              <input
                type="hidden"
                name="semester"
                value="0"
              />
              <input
                type="hidden"
                name="placementCategory"
                value={placementCategory}
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject*
              </label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Select a subject</option>
                {semesterSubjects.length > 0 ? (
                  semesterSubjects.map((folder, index) => (
                    <option key={index} value={folder.name}>
                      {folder.name} ({folder.lecturerName})
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No subjects available for this semester</option>
                )}
              </select>
              
              {semesterSubjects.length === 0 && !isPlacementResource && (
                <p className="mt-1 text-sm text-gray-500">
                  No subjects available. Please create subject folders first.
                </p>
              )}
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        {formData.type === 'link' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL*
            </label>
            <input
              type="url"
              name="link"
              value={formData.link}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required={formData.type === 'link'}
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File Upload*
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                {fileName ? (
                  <div className="flex items-center justify-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="ml-2 text-sm text-gray-600">{fileName}</p>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, DOCX, PPTX, MP4, etc. up to 50MB
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUploading || (!isPlacementResource && semesterSubjects.length === 0 && !formData.subject)}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              isUploading || (!isPlacementResource && semesterSubjects.length === 0 && !formData.subject) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isUploading ? 'Uploading...' : 'Upload Resource'}
          </button>
        </div>
      </form>
    </div>
  );
};
