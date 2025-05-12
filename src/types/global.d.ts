
import { FacultyResource } from './faculty.ts';

declare global {
  interface Window {
    sharedResources: FacultyResource[];
  }
}

export {};
