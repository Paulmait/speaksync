'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useScripts } from '@/contexts/ScriptContext';
import RichTextEditor from '@/components/RichTextEditor';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  PlayIcon,
  ShareIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { Script } from '@/types';

export default function ScriptEditorPage() {
  const { user, loading: authLoading } = useAuth();
  const { scripts, getScript, updateScript, createScript } = useScripts();
  const router = useRouter();
  const params = useParams();
  const scriptId = params.id as string;
  
  const [script, setScript] = useState<Script | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNewScript, setIsNewScript] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (scriptId === 'new') {
      setIsNewScript(true);
      setTitle('Untitled Script');
      setContent('');
    } else if (scriptId && scripts.length > 0) {
      const foundScript = getScript(scriptId);
      if (foundScript) {
        setScript(foundScript);
        setTitle(foundScript.title);
        setContent(foundScript.content);
      } else {
        toast.error('Script not found');
        router.push('/dashboard');
      }
    }
  }, [scriptId, scripts, user, authLoading, getScript, router]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setLoading(true);
    try {
      if (isNewScript) {
        const newScript = await createScript(title, content);
        toast.success('Script created successfully');
        router.push(`/dashboard/scripts/${newScript.id}`);
      } else if (script) {
        await updateScript(script.id, { title, content });
        toast.success('Script saved successfully');
      }
    } catch (error) {
      console.error('Error saving script:', error);
      toast.error('Failed to save script');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div className="flex-1">
                <input
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  className="text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                  placeholder="Script title"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                <Cog6ToothIcon className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                <ShareIcon className="h-5 w-5" />
              </button>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                <PlayIcon className="h-4 w-4" />
                <span>Present</span>
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="mb-6">
          <RichTextEditor
            content={content}
            onContentChange={handleContentChange}
            placeholder="Start writing your script..."
            autoFocus={true}
            className="min-h-[600px]"
          />
        </div>

        {/* Auto-save indicator */}
        <div className="text-center text-sm text-gray-500">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Auto-save enabled • Last saved 2 minutes ago</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
