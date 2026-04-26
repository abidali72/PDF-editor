import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextAlign } from '@tiptap/extension-text-align';

interface DocEditorProps {
  htmlContent: string;
  onContentChange: (html: string) => void;
}

export const DocEditor: React.FC<DocEditorProps> = ({
  htmlContent,
  onContentChange,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Image,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: htmlContent,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none max-w-none',
      },
    },
  });

  useEffect(() => {
    if (editor && htmlContent !== editor.getHTML()) {
      editor.commands.setContent(htmlContent);
    }
  }, [htmlContent, editor]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="editor-container">
      <div className="editor-toolbar">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`}
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`toolbar-btn ${editor.isActive('underline') ? 'active' : ''}`}
          title="Underline"
        >
          U
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`toolbar-btn ${editor.isActive('strike') ? 'active' : ''}`}
          title="Strikethrough"
        >
          S
        </button>
        
        <span style={{ width: '1px', background: '#e2e8f0', margin: '0 0.5rem' }} />
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleParagraph().run()}
          className={`toolbar-btn ${editor.isActive('paragraph') ? 'active' : ''}`}
          title="Paragraph"
        >
          ¶
        </button>
        
        <span style={{ width: '1px', background: '#e2e8f0', margin: '0 0.5rem' }} />
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
          title="Numbered List"
        >
          1. List
        </button>
        
        <span style={{ width: '1px', background: '#e2e8f0', margin: '0 0.5rem' }} />
        
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className="toolbar-btn"
          title="Undo"
          disabled={!editor.can().undo()}
        >
          ↶ Undo
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className="toolbar-btn"
          title="Redo"
          disabled={!editor.can().redo()}
        >
          ↷ Redo
        </button>
        
        <span style={{ width: '1px', background: '#e2e8f0', margin: '0 0.5rem' }} />
        
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('Enter image URL:');
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
          className="toolbar-btn"
          title="Insert Image"
        >
          🖼️ Image
        </button>
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
          }}
          className="toolbar-btn"
          title="Insert Table"
        >
          📊 Table
        </button>
        
        <span style={{ width: '1px', background: '#e2e8f0', margin: '0 0.5rem' }} />
        
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`toolbar-btn ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`}
          title="Align Left"
        >
          ⬅ Left
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`toolbar-btn ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`}
          title="Align Center"
        >
          ⬆ Center
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`toolbar-btn ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`}
          title="Align Right"
        >
          ➡ Right
        </button>
      </div>
      
      <div className="editor-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
