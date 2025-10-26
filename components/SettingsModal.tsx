import React, { useState } from 'react';
import type { BaserowConfig } from '../types';

interface SettingsModalProps {
  config: BaserowConfig | null;
  onSave: (config: BaserowConfig) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ config, onSave, onClose }) => {
  const [apiUrl, setApiUrl] = useState(config?.apiUrl || 'https://api.baserow.io');
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [tableId, setTableId] = useState(config?.tableId || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ apiUrl, apiKey, tableId });
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
          <h2 id="settings-title" className="text-xl font-bold text-gray-800">Baserow Instellingen</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Sluiten">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <p className="text-gray-600 mb-6 text-sm">
          Voer je Baserow API-gegevens in om je bonnen direct op te slaan. Je vindt deze gegevens in je Baserow-account. Zorg ervoor dat de kolomnamen in je tabel overeenkomen: Datum, Tankstation, Totaal Bedrag, BTW Bedrag, Netto Bedrag.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apiUrl" className="block text-sm font-medium text-gray-700 mb-1">Baserow API URL</label>
            <input
              id="apiUrl"
              type="text"
              value={apiUrl}
              onChange={e => setApiUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
              required
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
              required
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
              required
            />
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
