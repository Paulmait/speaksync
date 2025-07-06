import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRightIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { legalDocumentService } from '../services/legalDocumentService';
import { LegalDocument } from '../types/legalDocuments';

interface LegalDocumentsProps {
  className?: string;
}

interface DocumentModalProps {
  document: LegalDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

const DocumentModal: React.FC<DocumentModalProps> = ({ document, isOpen, onClose }) => {
  if (!isOpen || !document) return null;

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp * 1000); // Convert from Unix timestamp
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{document.name}</h2>
              <p className="text-sm text-gray-600">
                Version {document.version} • Effective {formatDate(document.effectiveDate)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6 overflow-y-auto">
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: document.content }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const LegalDocuments: React.FC<LegalDocumentsProps> = ({ className = '' }) => {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get cached documents first
      const cachedData = localStorage.getItem('legal_documents_cache');
      if (cachedData) {
        const cache = JSON.parse(cachedData);
        const cacheTime = new Date(cache.timestamp);
        const now = new Date();
        const hoursSinceCached = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceCached < 24) { // Use cache if less than 24 hours old
          setDocuments(cache.documents);
          setLoading(false);
        }
      }

      // Fetch fresh documents
      const activeDocuments = await legalDocumentService.getAllActiveDocuments();
      
      // Convert markdown content to HTML for display
      const documentsWithHtml = activeDocuments.map((doc: LegalDocument) => ({
        ...doc,
        content: markdownToHtml(doc.content)
      }));
      
      setDocuments(documentsWithHtml);
      
      // Cache the documents
      localStorage.setItem('legal_documents_cache', JSON.stringify({
        documents: documentsWithHtml,
        timestamp: new Date().toISOString()
      }));
      
    } catch (err) {
      console.error('Failed to load legal documents:', err);
      setError('Failed to load legal documents. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const markdownToHtml = (markdown: string): string => {
    // Basic markdown to HTML conversion
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/^\*(.*)\*/gim, '<em>$1</em>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<h|<li|<\/)/gm, '<p>')
      .replace(/(?<!>)$/gm, '</p>')
      .replace(/<p><\/p>/g, '')
      .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')
      .replace(/\n/g, '<br>');
  };

  const handleDocumentClick = (document: LegalDocument) => {
    setSelectedDocument(document);
    setModalOpen(true);
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp * 1000); // Convert from Unix timestamp
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDocumentIcon = () => {
    return <DocumentTextIcon className="w-5 h-5" />;
  };

  const getDocumentDescription = (name: string) => {
    if (name.toLowerCase().includes('privacy')) {
      return 'Learn how we collect, use, and protect your personal information';
    } else if (name.toLowerCase().includes('terms')) {
      return 'Terms and conditions for using SpeakSync services';
    } else if (name.toLowerCase().includes('ai') || name.toLowerCase().includes('disclaimer')) {
      return 'Important information about our AI features and limitations';
    } else {
      return 'Legal document';
    }
  };

  if (loading && documents.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading legal documents...</p>
        </div>
      </div>
    );
  }

  if (error && documents.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <DocumentTextIcon className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadDocuments}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="space-y-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Legal Documents</h1>
          <p className="text-gray-600">
            Important legal information about using SpeakSync
          </p>
        </div>

        <div className="grid gap-4 md:gap-6">
          {documents.map((document) => (
            <div
              key={document.id}
              className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => handleDocumentClick(document)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0 text-blue-600">
                      {getDocumentIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {document.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        {getDocumentDescription(document.name)}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Version {document.version}</span>
                        <span>•</span>
                        <span>Effective {formatDate(document.effectiveDate)}</span>
                        {document.updatedAt && document.updatedAt !== document.createdAt && (
                          <>
                            <span>•</span>
                            <span>Updated {formatDate(document.updatedAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {documents.length === 0 && !loading && (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No legal documents available</p>
          </div>
        )}
      </div>

      <DocumentModal
        document={selectedDocument}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default LegalDocuments;
