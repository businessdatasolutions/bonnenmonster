import React, { useState } from 'react';
import type { ReceiptData } from '../types';
import { CheckIcon, ResetIcon, SaveIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';

interface ReceiptDataDisplayProps {
  data: ReceiptData;
  onReset: () => void;
  onSaveToBaserow: (data: ReceiptData) => Promise<void>;
  isBaserowConfigured: boolean;
}

type SaveState = 'idle' | 'loading' | 'success' | 'error';

const ReceiptDataDisplay: React.FC<ReceiptDataDisplayProps> = ({ data, onReset, onSaveToBaserow, isBaserowConfigured }) => {
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('nl-NL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const handleSave = async () => {
    setSaveState('loading');
    setSaveError(null);
    try {
      await onSaveToBaserow(data);
      setSaveState('success');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch (error: any) {
      setSaveState('error');
      setSaveError(error.message || 'Onbekende fout opgetreden.');
    }
  };

  const getSaveButtonContent = () => {
    switch(saveState) {
      case 'loading':
        return <><LoadingSpinner /> Opslaan...</>;
      case 'success':
        return <><CheckIcon /> Opgeslagen!</>;
      case 'error':
        return 'Opslaan Mislukt';
      default:
        return <><SaveIcon /> Opslaan in Baserow</>;
    }
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Geëxtraheerde Gegevens</h2>
      <div className="space-y-3 bg-gray-50 p-6 rounded-lg shadow-inner">
        <DataItem label="Datum" value={formatDate(data.date)} />
        <DataItem label="Tankstation" value={data.stationName} />
        <DataItem label="Bedrag incl. BTW" value={formatCurrency(data.totalAmount)} isAmount />
        <DataItem label="BTW" value={formatCurrency(data.vatAmount)} isAmount />
        <DataItem label="Bedrag ex. BTW" value={formatCurrency(data.netAmount)} isAmount />
      </div>

      {!isBaserowConfigured && (
        <div className="mt-4 text-center text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg">
          Configureer Baserow via het instellingen-icoon (tandwiel) in de header om de gegevens op te slaan.
        </div>
      )}

      {saveState === 'error' && (
         <div className="mt-4 text-center text-sm text-red-700 bg-red-100 p-3 rounded-lg">
           <strong>Fout:</strong> {saveError}
         </div>
      )}
      
      <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
        <button 
          onClick={handleSave} 
          disabled={saveState === 'loading' || saveState === 'success'}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-lg transition-colors duration-200
            ${saveState === 'success' ? 'bg-green-600' : ''}
            ${saveState === 'error' ? 'bg-red-600 hover:bg-red-700' : ''}
            ${saveState !== 'error' && saveState !== 'success' ? 'bg-primary hover:bg-primary-hover' : ''}
            text-white disabled:opacity-75`}
        >
          {getSaveButtonContent()}
        </button>
        <button onClick={onReset} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors duration-200">
          <ResetIcon /> Nieuwe Bon
        </button>
      </div>
    </div>
  );
};

interface DataItemProps {
  label: string;
  value: string;
  isAmount?: boolean;
}

const DataItem: React.FC<DataItemProps> = ({ label, value, isAmount = false }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
    <span className="text-gray-600 font-medium">{label}</span>
    <span className={`font-semibold ${isAmount ? 'font-mono text-gray-900' : 'text-primary'}`}>{value}</span>
  </div>
);

export default ReceiptDataDisplay;
