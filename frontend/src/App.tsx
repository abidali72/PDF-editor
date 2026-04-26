import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { DocEditor } from './components/DocEditor';
import { useConversion } from './hooks/useConversion';
import { docxToHtml, htmlToDocx, downloadBlob, countWords } from './utils/docxConverter';
import { api } from './utils/api';

function App() {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showConsent, setShowConsent] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const {
    job,
    startConversion,
    startPolling,
    downloadResult,
    reset: resetConversion,
  } = useConversion();

  const handleFileSelected = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setFileName(file.name.replace('.pdf', ''));

    try {
      // Start conversion
      const jobId = await startConversion(file);
      
      // Start polling for status
      startPolling(jobId);
      
      setStatusMessage('Converting PDF to DOCX... This may take a moment.');
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
      setIsUploading(false);
    }
  }, [startConversion, startPolling]);

  // Poll for completion and convert to HTML
  React.useEffect(() => {
    if (job?.status === 'completed' && job.resultUrl) {
      // Download the converted DOCX and convert to HTML
      fetch(job.resultUrl)
        .then(res => res.arrayBuffer())
        .then(arrayBuffer => docxToHtml(arrayBuffer))
        .then(html => {
          setHtmlContent(html);
          setIsUploading(false);
          setStatusMessage('Document ready for editing!');
        })
        .catch(error => {
          console.error('Failed to process converted document:', error);
          setUploadError('Failed to process converted document');
          setIsUploading(false);
        });
    } else if (job?.status === 'failed') {
      setUploadError(job.error || 'Conversion failed');
      setIsUploading(false);
    }
  }, [job]);

  const handleContentChange = useCallback((html: string) => {
    setHtmlContent(html);
  }, []);

  const handleExportDOCX = useCallback(async () => {
    try {
      setStatusMessage('Generating DOCX file...');
      const arrayBuffer = await htmlToDocx(htmlContent, fileName || 'document');
      const blob = new Blob([arrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      downloadBlob(blob, `${fileName || 'document'}.docx`);
      setStatusMessage('DOCX downloaded successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      setStatusMessage('Failed to export DOCX');
    }
  }, [htmlContent, fileName]);

  const handleExportPDF = useCallback(async () => {
    try {
      setStatusMessage('Converting to PDF...');
      // Use backend for HTML to PDF conversion
      const response = await api.post('/convert/html-to-pdf', {
        html: htmlContent,
        filename: fileName || 'document',
      }, { responseType: 'blob' });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      downloadBlob(blob, `${fileName || 'document'}.pdf`);
      setStatusMessage('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF export failed:', error);
      // Fallback: suggest printing to PDF
      setStatusMessage('PDF conversion unavailable. Try printing to PDF from your browser.');
    }
  }, [htmlContent, fileName]);

  const handleReset = useCallback(() => {
    resetConversion();
    setHtmlContent('');
    setFileName('');
    setUploadError(null);
    setStatusMessage('');
  }, [resetConversion]);

  const wordCount = countWords(htmlContent);

  return (
    <div className="app-container">
      <header className="header">
        <h1>📝 PDF to DOCX Editor</h1>
        <div>
          {htmlContent && (
            <button className="btn btn-secondary" onClick={handleReset}>
              Start New Document
            </button>
          )}
        </div>
      </header>

      <main className="main-content">
        {!htmlContent ? (
          <FileUpload
            onFileSelected={handleFileSelected}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            error={uploadError}
          />
        ) : (
          <>
            {statusMessage && (
              <div className={`success-message ${statusMessage.includes('Failed') ? 'error-message' : ''}`}>
                {statusMessage}
              </div>
            )}

            <DocEditor
              htmlContent={htmlContent}
              onContentChange={handleContentChange}
            />

            <div className="editor-actions">
              <span className="word-count">
                Words: {wordCount}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleExportDOCX}
                  disabled={!htmlContent}
                >
                  📥 Export DOCX
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleExportPDF}
                  disabled={!htmlContent}
                >
                  📕 Export PDF
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {showConsent && (
        <div className="consent-banner">
          <div className="consent-content">
            <h3>🔒 Privacy & Data Security</h3>
            <p>
              Uploaded files are processed securely and automatically deleted after 1 hour. 
              We do not store or share your documents. By using this service, you consent 
              to temporary processing of your files for conversion purposes.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowConsent(false)}>
            I Understand
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
