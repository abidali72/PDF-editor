export interface ConversionJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  resultUrl?: string;
}

export interface FileUploadState {
  file: File | null;
  uploadProgress: number;
  isUploading: boolean;
  error: string | null;
}

export interface EditorState {
  htmlContent: string;
  isDirty: boolean;
  wordCount: number;
}
