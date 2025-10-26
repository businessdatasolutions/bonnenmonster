import React, { useState } from 'react';
import type { AppConfig } from '../types';

interface SettingsModalProps {
  config: AppConfig | null;
  onSave: (config: AppConfig) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ config, onSave, onClose }) => {
  const [geminiApiKey, setGeminiApiKey] = useState(config?.geminiApiKey || '');
  const [apiUrl, setApiUrl] = useState(config?.apiUrl || 'https://api.baserow.io');
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [tableId, setTableId] = useState(config?.tableId || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ apiUrl, apiKey, tableId, geminiApiKey });
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-md m-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="settings-title" className="text-xl font-bold text-gray-800">Instellingen</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Sluiten">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="border-b pb-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Gemini AI</h3>
            <p className="text-gray-600 mb-2 text-sm">
              Voer je Google AI API-sleutel in om de bon-analyse te activeren.
            </p>
            <div>
              <label htmlFor="geminiApiKey" className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
              <input
                id="geminiApiKey"
                type="password"
                value={geminiApiKey}
                onChange={e => setGeminiApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                placeholder="******************"
                required
              />
               <p className="text-xs text-gray-500 mt-1">
                Verkrijg een gratis sleutel via <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Google AI Studio</a>.
              </p>
            </div>
          </div>

          <div>
             <h3 className="text-lg font-semibold text-gray-700 mb-2">Baserow (Optioneel)</h3>
             <p className="text-gray-600 mb-4 text-sm">
              Voer je Baserow-gegevens in om je bonnen op te slaan. Zorg dat kolomnamen overeenkomen: Datum, Tankstation, Totaal Bedrag, BTW Bedrag, Netto Bedrag.
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="apiUrl" className="block text-sm font-medium text-gray-700 mb-1">Baserow API URL</label>
                <input
                  id="apiUrl"
                  type="text"
                  value={apiUrl}
                  onChange={e => setApiUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">Database Token (API Key)</label>
                <input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  placeholder="******************"
                />
              </div>
              <div>
                <label htmlFor="tableId" className="block text-sm font-medium text-gray-700 mb-1">Table ID</label>
                <input
                  id="tableId"
                  type="text"
                  value={tableId}
                  onChange={e => setTableId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  placeholder="bv. 12345"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" className="bg-primary text-white font-bold py-2 px-5 rounded-lg hover:bg-primary-hover transition-colors duration-200">
              Opslaan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
