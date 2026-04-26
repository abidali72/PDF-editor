import axios from 'axios';

const API_BASE_URL = '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes for large file conversions
});

// Upload PDF for conversion
export async function uploadPDF(file: File, onProgress?: (progress: number) => void): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/convert/pdf-to-docx', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });

  return response.data.jobId;
}

// Poll conversion status
export async function getConversionStatus(jobId: string) {
  const response = await api.get(`/convert/status/${jobId}`);
  return response.data;
}

// Download converted DOCX
export async function downloadDOCX(jobId: string): Promise<Blob> {
  const response = await api.get(`/convert/download/${jobId}`, {
    responseType: 'blob',
  });
  return response.data;
}

// Convert HTML to DOCX (client-side alternative)
export async function convertHtmlToDocx(html: string, filename: string): Promise<Blob> {
  const response = await api.post('/convert/html-to-docx', { html, filename });
  return new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

// Health check
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await api.get('/health');
    return response.status === 200;
  } catch {
    return false;
  }
}
