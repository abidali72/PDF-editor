import React, { useState, useCallback } from 'react';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelected,
  isUploading,
  uploadProgress,
  error,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        onFileSelected(file);
      } else {
        alert('Please upload a PDF file');
      }
    }
  }, [onFileSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelected(files[0]);
    }
  }, [onFileSelected]);

  return (
    <div className="upload-zone">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`upload-zone ${isDragActive ? 'drag-active' : ''}`}
      >
        <div className="upload-icon">📄</div>
        <h2>Upload PDF Document</h2>
        <p>Drag and drop your PDF here, or click to browse</p>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Maximum file size: 50MB • Supported format: PDF
        </p>
        
        {!isUploading && (
          <label className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            Choose PDF File
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </label>
        )}
      </div>

      {isUploading && (
        <div style={{ marginTop: '2rem' }}>
          <p>Uploading... {uploadProgress}%</p>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="error-message" style={{ marginTop: '1rem' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};
