'use client';

import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
  NumberedListIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { WordCount } from '@/types';

interface RichTextEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export default function RichTextEditor({
  content,
  onContentChange,
  placeholder = 'Start writing your script...',
  autoFocus = false,
  className = '',
}: RichTextEditorProps) {
  const [wordCount, setWordCount] = useState<WordCount>({
    characters: 0,
    charactersWithoutSpaces: 0,
    words: 0,
    paragraphs: 0,
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Typography,
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: 100000,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onContentChange(html);
      
      // Calculate word count
      const text = editor.getText();
      const words = text.trim().split(/\s+/).filter(word => word.length > 0);
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      
      setWordCount({
        characters: text.length,
        charactersWithoutSpaces: text.replace(/\s/g, '').length,
        words: words.length,
        paragraphs: paragraphs.length,
      });
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4',
      },
    },
    autofocus: autoFocus,
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const estimatedReadingTime = Math.ceil(wordCount.words / 150); // Assuming 150 WPM

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded-md ${
              editor.isActive('bold') ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
            title="Bold"
          >
            <BoldIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded-md ${
              editor.isActive('italic') ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
            title="Italic"
          >
            <ItalicIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded-md ${
              editor.isActive('strike') ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
            title="Strikethrough"
          >
            <UnderlineIcon className="h-4 w-4" />
          </button>
          <div className="w-px h-6 bg-gray-300" />
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded-md ${
              editor.isActive('bulletList') ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
            title="Bullet List"
          >
            <ListBulletIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded-md ${
              editor.isActive('orderedList') ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
            title="Numbered List"
          >
            <NumberedListIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded-md ${
              editor.isActive('blockquote') ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
            title="Quote"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>Words: {wordCount.words}</span>
          <span>Reading: {formatTime(estimatedReadingTime)}</span>
        </div>
      </div>

      {/* Editor */}
      <div className="min-h-[400px]">
        <EditorContent editor={editor} />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-4 border-t bg-gray-50 text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>{wordCount.characters} characters</span>
          <span>{wordCount.paragraphs} paragraphs</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Saved</span>
        </div>
      </div>
    </div>
  );
}
