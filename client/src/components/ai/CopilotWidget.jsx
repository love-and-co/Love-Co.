import React from 'react';
import { MessageSquare } from 'lucide-react';
import { useCopilotStore } from '../../store/copilotStore';

export default function CopilotWidget() {
  const { openCopilot, isOpen } = useCopilotStore();

  if (isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 group flex items-center space-x-2">
      <span className="hidden sm:inline-block px-3 py-1.5 bg-white border border-brand-silver text-brand-mocha-900 text-xs font-mono-clinical font-semibold rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
        Chat with Sam 👋
      </span>
      <button
        onClick={() => openCopilot()}
        className="w-12 h-12 bg-brand-mocha-900 text-white hover:bg-brand-mocha border border-brand-silver rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 cursor-pointer"
        aria-label="Open Skin AI Assistant"
        title="Chat with Sam"
      >
        <MessageSquare className="w-5 h-5 text-brand-lavender-light" />
      </button>
    </div>
  );
}
