'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useScripts } from '@/contexts/ScriptContext';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  PlusIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ScriptsPage() {
  const { user, loading: authLoading } = useAuth();
  const { scripts, loading: scriptsLoading, deleteScript } = useScripts();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'updatedAt' | 'wordCount'>('updatedAt');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

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

  const filteredScripts = scripts
    .filter(script =>
      script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      script.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'wordCount':
          return (b.wordCount || 0) - (a.wordCount || 0);
        case 'updatedAt':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

  const handleDeleteScript = async (scriptId: string, scriptTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${scriptTitle}"?`)) {
      try {
        await deleteScript(scriptId);
        toast.success('Script deleted successfully');
      } catch (error) {
        console.error('Error deleting script:', error);
        toast.error('Failed to delete script');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Scripts</h1>
              <p className="text-gray-600 mt-2">
                Manage your teleprompter scripts and create new content.
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard/scripts/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>New Script</span>
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search scripts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="updatedAt">Recently Updated</option>
                <option value="title">Title A-Z</option>
                <option value="wordCount">Word Count</option>
              </select>
              <FunnelIcon className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Scripts Grid */}
        {scriptsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading scripts...</p>
          </div>
        ) : filteredScripts.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No scripts found' : 'No scripts yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Get started by creating your first teleprompter script.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => router.push('/dashboard/scripts/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Create Your First Script
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScripts.map((script) => (
              <div
                key={script.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 mr-2">
                      {script.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs flex-shrink-0 ${
                      script.syncStatus === 'synced' 
                        ? 'bg-green-100 text-green-800'
                        : script.syncStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : script.syncStatus === 'conflict'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {script.syncStatus}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-500 space-y-1 mb-4">
                    <div>Updated {formatDate(script.updatedAt)}</div>
                    <div className="flex items-center space-x-4">
                      <span>{script.wordCount || 0} words</span>
                      <span>{formatDuration(script.estimatedDuration || 0)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => router.push(`/dashboard/scripts/${script.id}`)}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                        title="View"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/scripts/${script.id}`)}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteScript(script.id, script.title)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => router.push(`/dashboard/scripts/${script.id}`)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Open →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
