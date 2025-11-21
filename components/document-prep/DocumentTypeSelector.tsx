'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { DOCUMENT_REQUIREMENTS } from '@/lib/config/document-requirements';
import type { DocumentCategory } from '@/lib/config/document-requirements';

interface DocumentTypeSelectorProps {
  selectedType: DocumentCategory | null;
  onSelect: (type: DocumentCategory) => void;
}

export function DocumentTypeSelector({ selectedType, onSelect }: DocumentTypeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter documents based on search query
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) {
      return DOCUMENT_REQUIREMENTS;
    }

    const query = searchQuery.toLowerCase();
    return DOCUMENT_REQUIREMENTS.filter(doc =>
      doc.name.toLowerCase().includes(query) ||
      doc.description.toLowerCase().includes(query) ||
      doc.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Group documents by category
  const groupedDocuments = useMemo(() => {
    const groups: Record<string, typeof DOCUMENT_REQUIREMENTS> = {};
    filteredDocuments.forEach(doc => {
      if (!groups[doc.category]) {
        groups[doc.category] = [];
      }
      groups[doc.category]!.push(doc);
    });
    return groups;
  }, [filteredDocuments]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2"
          size={18}
          style={{ color: 'hsl(var(--muted-foreground))' }}
        />
        <input
          type="text"
          placeholder="Search document types..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
          style={{
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          }}
        />
      </div>

      {/* Document Cards by Category */}
      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
        {Object.entries(groupedDocuments).map(([category, docs]) => (
          <div key={category}>
            <h4 className="text-sm font-semibold mb-3 px-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {category}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {docs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => onSelect(doc.id)}
                  className="flex items-start gap-3 p-4 rounded-lg border text-left transition-all hover:shadow-md focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: selectedType === doc.id
                      ? 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)'
                      : 'hsl(var(--background))',
                    borderColor: selectedType === doc.id
                      ? 'hsl(var(--primary))'
                      : 'hsl(var(--border))',
                  }}
                >
                  <span className="text-2xl flex-shrink-0">{doc.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-sm mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                      {doc.name}
                    </h5>
                    <p className="text-xs line-clamp-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {doc.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                        backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)',
                        color: 'hsl(var(--primary))',
                      }}>
                        {doc.files.length} files
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {filteredDocuments.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              No documents found matching "{searchQuery}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

