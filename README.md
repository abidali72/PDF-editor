# PDF to DOCX Editor

A modern, production-ready web application that converts uploaded PDFs to editable .docx files, provides an in-browser Word-like editor, and exports the result back to .docx or PDF.

## 📁 Project Structure

```
pdf-to-docx-editor/
├── frontend/                 # React + Vite + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.tsx    # Drag-and-drop upload component
│   │   │   └── DocEditor.tsx     # TipTap WYSIWYG editor wrapper
│   │   ├── hooks/
│   │   │   └── useConversion.ts  # Conversion state management
│   │   ├── utils/
│   │   │   ├── api.ts            # API client
│   │   │   └── docxConverter.ts  # DOCX/HTML conversion utilities
│   │   ├── types/
│   │   │   └── index.ts          # TypeScript interfaces
│   │   ├── App.tsx               # Main application component
│   │   ├── main.tsx              # Entry point
│   │   └── index.css             # Global styles
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                  # Node.js + Express backend
│   ├── server.js             # Main server with API routes
│   └── package.json
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development

1. **Install dependencies:**
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```

2. **Start the backend server:**
   ```bash
   cd backend
   npm start
   # Server runs on http://localhost:4000
   ```

3. **Start the frontend dev server:**
   ```bash
   cd frontend
   npm run dev
   # Frontend runs on http://localhost:5173 (or 3000)
   ```

4. **Open browser:** Navigate to http://localhost:5173

## 🔧 Features

### Frontend
- **Drag-and-drop file upload** with progress tracking
- **Real-time conversion status** with polling
- **Rich text editor** (TipTap) with full toolbar:
  - Bold, Italic, Underline, Strikethrough
  - Headings (H1, H2), Paragraph
  - Bullet & numbered lists
  - Tables (insert, resize)
  - Images (URL insertion)
  - Text alignment (left, center, right)
  - Undo/Redo
- **Word count** display
- **Export options**: DOCX (client-side) and PDF
- **Responsive design** for mobile/tablet/desktop
- **Privacy consent banner** with GDPR-friendly messaging

### Backend
- **Multipart file upload** with Multer
- **Async job processing** with status polling
- **Rate limiting** (10 requests/minute per IP)
- **Automatic file cleanup** after 1 hour
- **CORS configuration** for secure cross-origin requests
- **Error handling** with proper HTTP status codes
- **Health check endpoint** for monitoring

## 🔐 Security & Privacy

- ✅ Files stored temporarily (1-hour retention)
- ✅ Automatic cleanup of uploaded/converted files
- ✅ Rate limiting to prevent abuse
- ✅ File type validation (PDF only)
- ✅ File size limits (50MB max)
- ✅ HTTPS enforcement (production)
- ✅ No telemetry or data collection
- ✅ Explicit user consent before uploads

## ⚠️ Important Limitations & Production Notes

### PDF → DOCX Conversion Fidelity

**This demo uses a placeholder conversion.** For production, you MUST integrate one of these:

1. **CloudConvert API** (Recommended for high fidelity)
   - Paid service (~$9/month for 500 conversions)
   - Best quality, handles complex layouts
   - Sign up at: https://cloudconvert.com/api
   - Replace `createPlaceholderDocx()` with API call

2. **pdf2docx Python Library** (Self-hosted)
   - Free, open-source
   - Good quality for most documents
   - Requires Python installation on server
   ```bash
   pip install pdf2docx
   ```
   - Use child_process to call Python script from Node.js

3. **LibreOffice Headless** (Self-hosted)
   - Free, open-source
   - Requires LibreOffice installation
   ```bash
   libreoffice --headless --convert-to docx input.pdf
   ```

### Browser Memory Limits
- Large files (>50MB) may cause browser memory issues
- Consider implementing chunked uploads for very large files
- Client-side DOCX generation limited by available memory

### API Rate Limits
- Default: 10 requests/minute per IP
- Adjust `RATE_LIMIT_MAX` in `server.js` for your needs
- For production, use Redis-based rate limiting

### Async Processing Overhead
- Current implementation uses simple polling (2-second intervals)
- For high-traffic apps, consider:
  - WebSocket for real-time updates
  - Server-Sent Events (SSE)
  - Message queue (Bull, RabbitMQ)

## 📦 Build & Deployment

### Production Build

```bash
# Build frontend
cd frontend
npm run build
# Output: dist/ folder

# The dist folder can be served by:
# - Nginx/Apache
# - Node.js static file server
# - CDN (Vercel, Netlify, Cloudflare Pages)
```

### Docker Deployment

Create `Dockerfile` in backend folder:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4000
CMD ["npm", "start"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "4000:4000"
    environment:
      - PORT=4000
      - NODE_ENV=production
    volumes:
      - ./temp:/app/temp
  
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

### Environment Variables

**Backend (.env):**
```env
PORT=4000
NODE_ENV=production
MAX_FILE_SIZE=52428800
FILE_RETENTION_HOURS=1
CLOUDCONVERT_API_KEY=your_key_here  # If using CloudConvert
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:4000
```

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend Framework | React 18 + TypeScript | UI components, type safety |
| Build Tool | Vite | Fast development, optimized builds |
| Editor | TipTap | Extensible rich text editor |
| DOCX→HTML | Mammoth.js | Convert DOCX to editable HTML |
| HTML→DOCX | html-to-docx | Generate DOCX from HTML |
| Backend | Node.js + Express | API server |
| File Upload | Multer | Multipart form handling |
| Styling | Custom CSS | Responsive, modern design |

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/convert/pdf-to-docx` | Upload PDF for conversion |
| GET | `/api/convert/status/:jobId` | Get conversion status |
| GET | `/api/convert/download/:jobId` | Download converted DOCX |
| POST | `/api/convert/html-to-docx` | Convert HTML to DOCX |
| POST | `/api/convert/html-to-pdf` | Convert HTML to PDF |

## 🐛 Troubleshooting

### "Conversion failed" error
- Check backend logs for details
- Ensure temp directories are writable
- Verify file is a valid PDF

### CORS errors in browser
- Ensure backend CORS config matches frontend URL
- Check proxy settings in `vite.config.ts`

### File upload fails silently
- Check file size (max 50MB)
- Verify file type is PDF
- Check network tab for 413/400 errors

## 📄 License

MIT License - feel free to use in personal and commercial projects.

## 🤝 Contributing

Contributions welcome! Please ensure:
- TypeScript type safety maintained
- Tests added for new features
- Documentation updated
