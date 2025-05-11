
import { FacultyResource } from './faculty';

declare global {
  interface Window {
    sharedResources: FacultyResource[];
  }
}

export {};
