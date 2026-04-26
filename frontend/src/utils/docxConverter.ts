import mammoth from 'mammoth';
import HTMLToDocx from 'html-to-docx';

/**
 * Convert DOCX file to HTML using mammoth.js
 */
export async function docxToHtml(docxArrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const result = await mammoth.convertToHtml({ arrayBuffer: docxArrayBuffer });
    
    if (result.messages.length > 0) {
      console.warn('Mammoth conversion messages:', result.messages);
    }
    
    return result.value;
  } catch (error) {
    console.error('Error converting DOCX to HTML:', error);
    throw new Error('Failed to convert DOCX to HTML');
  }
}

/**
 * Convert HTML content back to DOCX
 */
export async function htmlToDocx(html: string, title: string = 'Document'): Promise<ArrayBuffer> {
  try {
    const htmlToDocx = new HTMLToDocx();
    
    // Wrap HTML in a complete document structure
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;
    
    const blob = await htmlToDocx.convert(fullHtml);
    const arrayBuffer = await blob.arrayBuffer();
    return arrayBuffer;
  } catch (error) {
    console.error('Error converting HTML to DOCX:', error);
    throw new Error('Failed to convert HTML to DOCX');
  }
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Count words in HTML content
 */
export function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
}
