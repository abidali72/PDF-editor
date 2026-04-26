import { useState, useCallback, useRef } from 'react';
import { uploadPDF, getConversionStatus, downloadDOCX } from '../utils/api';
import type { ConversionJob } from '../types';

export function useConversion() {
  const [job, setJob] = useState<ConversionJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startConversion = useCallback(async (file: File) => {
    try {
      setJob({
        id: '',
        status: 'pending',
        progress: 0,
      });

      const jobId = await uploadPDF(file, (progress) => {
        setJob(prev => prev ? { ...prev, progress } : null);
      });

      setJob({
        id: jobId,
        status: 'processing',
        progress: 0,
      });

      return jobId;
    } catch (error) {
      console.error('Upload failed:', error);
      setJob({
        id: '',
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed',
      });
      throw error;
    }
  }, []);

  const pollStatus = useCallback(async (jobId: string) => {
    try {
      const status = await getConversionStatus(jobId);
      setJob(status);

      if (status.status === 'completed' || status.status === 'failed') {
        stopPolling();
      }

      return status;
    } catch (error) {
      console.error('Status check failed:', error);
      throw error;
    }
  }, []);

  const startPolling = useCallback((jobId: string, intervalMs: number = 2000) => {
    if (isPolling) return;

    setIsPolling(true);
    
    const poll = async () => {
      try {
        const status = await pollStatus(jobId);
        if (status.status === 'completed' || status.status === 'failed') {
          stopPolling();
        }
      } catch (error) {
        console.error('Polling error:', error);
        stopPolling();
      }
    };

    // Initial poll
    poll();

    // Set up interval
    pollIntervalRef.current = setInterval(poll, intervalMs);
  }, [isPolling, pollStatus]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const downloadResult = useCallback(async (jobId: string, filename: string = 'document.docx') => {
    try {
      const blob = await downloadDOCX(jobId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    stopPolling();
    setJob(null);
  }, [stopPolling]);

  return {
    job,
    isPolling,
    startConversion,
    startPolling,
    stopPolling,
    downloadResult,
    reset,
  };
}
