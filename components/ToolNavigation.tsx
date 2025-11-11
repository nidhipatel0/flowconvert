'use client';

export type ToolCategory = 'all' | 'image' | 'pdf' | 'ocr' | 'signature' | 'document';

interface ToolCategoryItem {
  id: ToolCategory;
  label: string;
  icon: string;
  description: string;
}

const toolCategories: ToolCategoryItem[] = [
  {
    id: 'all',
    label: 'All Tools',
    icon: '🎯',
    description: 'Show everything',
  },
  {
    id: 'image',
    label: 'Images',
    icon: '🖼️',
    description: 'Convert & edit',
  },
  {
    id: 'pdf',
    label: 'PDF',
    icon: '📄',
    description: 'Merge & organize',
  },
  {
    id: 'ocr',
    label: 'OCR',
    icon: '🔍',
    description: 'Extract text',
  },
  {
    id: 'signature',
    label: 'Sign',
    icon: '✍️',
    description: 'E-signatures',
  },
  {
    id: 'document',
    label: 'Documents',
    icon: '📝',
    description: 'Office files',
  },
];

interface ToolNavigationProps {
  selectedTool: string;
  onSelectTool: (tool: ToolCategory) => void;
}

export function ToolNavigation({ selectedTool, onSelectTool }: ToolNavigationProps) {
  return (
    <div className="rounded-xl bg-white shadow-md border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-900">
          Tools & Features
        </h2>
        <span className="text-xs text-gray-500 font-medium">
          Select a category to filter
        </span>
      </div>

      {/* Tool Categories Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {toolCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectTool(category.id)}
            className={`relative rounded-xl p-4 transition-all duration-200 ${
              selectedTool === category.id
                ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-400 shadow-md'
                : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            {/* Icon */}
            <div className="text-3xl mb-2 text-center">
              {category.icon}
            </div>

            {/* Label */}
            <div className="text-center">
              <p className={`font-semibold text-sm mb-0.5 ${
                selectedTool === category.id ? 'text-indigo-900' : 'text-gray-900'
              }`}>
                {category.label}
              </p>
              <p className={`text-xs ${
                selectedTool === category.id ? 'text-indigo-600' : 'text-gray-500'
              }`}>
                {category.description}
              </p>
            </div>

            {/* Selection indicator */}
            {selectedTool === category.id && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
