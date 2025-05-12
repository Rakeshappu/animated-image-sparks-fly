
import { FacultyResource, SubjectFolder } from './faculty';

declare global {
  interface Window {
    subjectFolders?: SubjectFolder[];
    sharedResources?: FacultyResource[];
  }
}

export {};
