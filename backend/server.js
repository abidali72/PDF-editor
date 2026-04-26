import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'path';
import fs from 'fs/promises';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Configuration
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const FILE_RETENTION_HOURS = 1;

// Storage for conversion jobs (in production, use Redis or database)
const jobs = new Map();

// Temporary file storage
const TEMP_DIR = join(__dirname, 'temp');
const UPLOADS_DIR = join(TEMP_DIR, 'uploads');
const RESULTS_DIR = join(TEMP_DIR, 'results');

// Ensure directories exist
await fs.mkdir(UPLOADS_DIR, { recursive: true });
await fs.mkdir(RESULTS_DIR, { recursive: true });

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

// Rate limiting (simple in-memory implementation)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, []);
  }
  
  const requests = rateLimitStore.get(ip).filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (requests.length >= RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
  
  requests.push(now);
  rateLimitStore.set(ip, requests);
  next();
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Upload PDF for conversion
app.post('/api/convert/pdf-to-docx', rateLimit, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const jobId = uuidv4();
    const job = {
      id: jobId,
      status: 'processing',
      progress: 0,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + FILE_RETENTION_HOURS * 60 * 60 * 1000),
      inputFile: req.file.path,
      originalName: req.file.originalname,
    };

    jobs.set(jobId, job);

    // Simulate conversion process (in production, call actual conversion service)
    // For demo purposes, we'll create a simple DOCX-like structure
    simulateConversion(jobId);

    res.json({ 
      jobId, 
      message: 'File uploaded successfully. Conversion started.',
      estimatedTime: '30-60 seconds'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process file upload' });
  }
});

// Simulate PDF to DOCX conversion
async function simulateConversion(jobId) {
  const job = jobs.get(jobId);
  if (!job) return;

  try {
    // Update progress
    job.progress = 20;
    jobs.set(jobId, job);
    await sleep(500);

    job.progress = 50;
    jobs.set(jobId, job);
    await sleep(1000);

    job.progress = 80;
    jobs.set(jobId, job);
    await sleep(500);

    // Create a simple DOCX file (in production, use actual conversion library/API)
    // This is a placeholder - in real implementation, use pdf2docx, CloudConvert, etc.
    const outputPath = join(RESULTS_DIR, `${jobId}.docx`);
    
    // For demo: create a minimal valid DOCX (actually just a zip with basic structure)
    // In production, replace with actual conversion logic
    await createPlaceholderDocx(outputPath, job.originalName);

    job.progress = 100;
    job.status = 'completed';
    job.resultUrl = `/api/convert/download/${jobId}`;
    job.outputFile = outputPath;
    jobs.set(jobId, job);

    console.log(`Conversion completed for job ${jobId}`);
  } catch (error) {
    console.error(`Conversion failed for job ${jobId}:`, error);
    job.status = 'failed';
    job.error = error.message || 'Conversion failed';
    jobs.set(jobId, job);
  }
}

// Create a placeholder DOCX for demonstration
async function createPlaceholderDocx(outputPath, originalName) {
  // In production, use actual PDF to DOCX conversion:
  // Option 1: Use pdf2docx Python library via child_process
  // Option 2: Call CloudConvert API
  // Option 3: Use LibreOffice headless conversion
  
  // For this demo, we create a minimal DOCX structure
  // A real DOCX is a ZIP file containing XML files
  
  // Simple HTML content wrapped as DOCX-compatible format
  const content = `<!DOCTYPE html>
<html>
<head><title>${originalName}</title></head>
<body>
<h1>Converted Document</h1>
<p>This is a placeholder document. In production, integrate with:</p>
<ul>
<li><strong>CloudConvert API</strong> for high-fidelity conversion</li>
<li><strong>pdf2docx</strong> Python library for self-hosted conversion</li>
<li><strong>LibreOffice</strong> headless mode for server-side conversion</li>
</ul>
<p>Original file: ${originalName}</p>
<p>Conversion time: ${new Date().toISOString()}</p>
</body>
</html>`;

  // For actual implementation, use a proper DOCX generation library
  // This is just a text file with .docx extension for demo purposes
  await fs.writeFile(outputPath, content);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Get conversion status
app.get('/api/convert/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    error: job.error,
    resultUrl: job.resultUrl,
  });
});

// Download converted file
app.get('/api/convert/download/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (job.status !== 'completed') {
    return res.status(400).json({ error: 'Conversion not complete' });
  }

  if (!job.outputFile) {
    return res.status(404).json({ error: 'Output file not found' });
  }

  const fileName = basename(job.originalName, '.pdf') + '.docx';
  res.download(job.outputFile, fileName);
});

// Convert HTML to DOCX (for editor export)
app.post('/api/convert/html-to-docx', async (req, res) => {
  try {
    const { html, filename } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML content required' });
    }

    // In production, use html-to-docx library or similar
    // For demo, return the HTML which frontend will convert
    res.send(html);
  } catch (error) {
    console.error('HTML to DOCX error:', error);
    res.status(500).json({ error: 'Failed to convert HTML to DOCX' });
  }
});

// Convert HTML to PDF (for editor export)
app.post('/api/convert/html-to-pdf', async (req, res) => {
  try {
    const { html, filename } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML content required' });
    }

    // In production, use puppeteer, wkhtmltopdf, or similar
    // For demo, return an error suggesting client-side alternative
    res.status(501).json({ 
      error: 'Server-side PDF conversion not configured',
      suggestion: 'Use browser print-to-PDF functionality'
    });
  } catch (error) {
    console.error('HTML to PDF error:', error);
    res.status(500).json({ error: 'Failed to convert HTML to PDF' });
  }
});

// Cleanup old files periodically
async function cleanupOldFiles() {
  const now = Date.now();
  
  for (const [jobId, job] of jobs.entries()) {
    if (now > job.expiresAt.getTime()) {
      // Delete files
      try {
        if (job.inputFile) {
          await fs.unlink(job.inputFile).catch(() => {});
        }
        if (job.outputFile) {
          await fs.unlink(job.outputFile).catch(() => {});
        }
      } catch (error) {
        console.error(`Error cleaning up job ${jobId}:`, error);
      }
      
      // Remove from jobs map
      jobs.delete(jobId);
      console.log(`Cleaned up expired job ${jobId}`);
    }
  }
}

// Run cleanup every 15 minutes
setInterval(cleanupOldFiles, 15 * 60 * 1000);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${UPLOADS_DIR}`);
  console.log(`📁 Results directory: ${RESULTS_DIR}`);
  console.log(`⏰ File retention: ${FILE_RETENTION_HOURS} hour(s)`);
});

export default app;
