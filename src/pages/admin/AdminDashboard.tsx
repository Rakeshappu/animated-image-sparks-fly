
// This is a targeted fix for the category type error in AdminDashboard
// We'll only update the handleUpload function that creates a new resource

const handleUpload = async (data: UploadFormData) => {
  console.log('Uploading resource:', data);
  
  let fileContent = '';
  let fileName = '';
  
  if (data.file) {
    fileName = data.file.name;
    
    if (data.type !== 'link') {
      try {
        fileContent = await readFileAsBase64(data.file);
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }
  }
  
  try {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('type', data.type);
    formData.append('subject', data.subject);
    formData.append('semester', data.semester.toString());
    
    // Ensure category is one of the allowed values
    let category: 'study' | 'placement' | 'common' | undefined = undefined;
    if (data.category === 'study' || data.category === 'placement' || data.category === 'common') {
      category = data.category;
      formData.append('category', category);
    }
    
    if (data.file) {
      formData.append('file', data.file);
    }
    
    if (data.link) {
      formData.append('link', data.link);
    }
    
    const response = await api.post('/api/resources', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    const newResource: FacultyResource = {
      id: response.data.resource._id || Date.now().toString(),
      ...data,
      category,
      uploadDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      fileName: fileName,
      fileContent: fileContent,
      stats: {
        views: 0,
        likes: 0,
        comments: 0,
        downloads: 0,
        lastViewed: new Date().toISOString()
      }
    };
    
    window.sharedResources = [newResource, ...window.sharedResources];
    setResources([newResource, ...resources]);
    
    toast.success('Resource uploaded successfully!');
    setShowResourceUpload(false);
    setCurrentView('dashboard');
  } catch (error) {
    console.error('Error uploading resource:', error);
    toast.error('Failed to upload resource');
  }
};
