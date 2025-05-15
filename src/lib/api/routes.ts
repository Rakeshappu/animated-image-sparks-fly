//src\lib\api\routes.ts
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    ME: '/api/auth/me',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh-token',
    VERIFY_EMAIL: '/api/auth/verify-email',
    VERIFY_OTP: '/api/auth/verify-otp',
    SEND_OTP: '/api/auth/send-otp',
    RESEND_VERIFICATION: '/api/auth/resend-verification',
    GOOGLE: '/api/auth/google',
    ADMIN_CHECK: '/api/auth/admin-check',
    DEBUG_TOKEN: '/api/auth/debug-token'
  },
  USER: {
    PROFILE: '/api/user/profile',
    ACTIVITY: '/api/user/activity',
    SEARCH_HISTORY: '/api/user/search-history',
    NOTIFICATIONS: '/api/user/notifications',
    PASSWORD: '/api/user/password',
    SECURITY: '/api/user/security',
    STATS: '/api/user/stats',
  },
  ADMIN: {
    ELIGIBLE_USNS: '/api/admin/eligible-usns',
    BULK_ELIGIBLE_USNS: '/api/admin/eligible-usns/bulk',
    DELETE_ELIGIBLE_USN: (id: string) => `/api/admin/eligible-usns/${id}`,
    USERS: '/api/admin/users',
  },
  RESOURCES: {
    LIST: '/api/resources',
    FACULTY: '/api/resources/faculty',
    CREATE: '/api/resources',
    PLACEMENT: '/api/resources/placement',
    GET: (id: string) => `/api/resources/${id}`,
    UPDATE: (id: string) => `/api/resources/${id}`,
    DELETE: (id: string) => `/api/resources/${id}`,
    STATS: '/api/resources/stats',
    LIKE: (id: string) => `/api/resources/${id}/like`,
    LIKE_STATUS: (id: string) => `/api/resources/${id}/like-status`,
    COMMENTS: (id: string) => `/api/resources/${id}/comments`,
    ANALYTICS: (id: string) => `/api/resources/${id}/analytics`,
  },
  STORAGE: {
    PRESIGNED: '/api/upload/presigned',
  },
  SEARCH: {
    QUERY: '/api/search',
  },
  SUBJECT_FOLDERS: {
    LIST: '/api/subject-folders',
    CREATE: '/api/subject-folders',
  },
  SYSTEM: {
    SERVICES_STATUS: '/api/system/services-status',
  },
};
