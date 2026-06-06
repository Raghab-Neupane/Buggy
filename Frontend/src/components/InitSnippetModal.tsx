import React from "react";

type InitSnippetModalProps = {
  snippet: { import: string; init: { endpoint: string } } | null;
  onClose: () => void;
};

export const InitSnippetModal: React.FC<InitSnippetModalProps> = ({ snippet, onClose }) => {
  if (!snippet) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-11/12 max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4">Initialize npmpackagebuggy</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`import { init } from 'npmpackagebuggy'}

init({
  endpoint: "${snippet.init.endpoint}"
});`}
        </pre>
      </div>
    </div>
  );
};
