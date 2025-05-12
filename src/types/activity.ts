export interface Activity {
  _id: string;
  type: 'view' | 'download' | 'upload' | 'like' | 'comment' | 'share';
  timestamp: string;
  message: string;
  resource?: {
    _id: string;
    title: string;
    subject?: string;
    stats?: {
      views?: number;
      downloads?: number;
      likes?: number;
      comments?: number;
    };
    category?: string;
  };
}

export interface ActivityDocument {
  _id: any;
  type: string;
  timestamp: Date;
  message: string;
  resource: any;
}
