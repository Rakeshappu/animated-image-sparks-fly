import { FacultyResource } from './faculty.js';

declare global {
  interface Window {
    sharedResources: FacultyResource[];
  }

  namespace ReactHotToast {
    interface Toast {
      error: (message: string, options?: any) => string;
      success: (message: string, options?: any) => string;
      warning: (message: string, options?: any) => string;
      info: (message: string, options?: any) => string;
    }
  }
}

declare module 'react-hot-toast' {
  const toast: any;
  export default toast;
}

export {};