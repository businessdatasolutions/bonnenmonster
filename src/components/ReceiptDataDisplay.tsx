import React, { useState } from 'react';
import type { ReceiptData, LineItem } from '../types';
import { CheckIcon, ResetIcon, SaveIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';
import LineItemsSelector from './LineItemsSelector';

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

  // Initialize line items with selection state
  const [lineItems, setLineItems] = useState<LineItem[]>(() => {
    if (data.lineItems && data.lineItems.length > 0) {
      return data.lineItems.map((item, index) => ({
        ...item,
        id: item.id || `item-${index}`, // Ensure ID exists
        selected: true // All items selected by default
      }));
    }
    return [];
  });

  // Calculate totals based on selected items
  const calculateSelectedTotals = () => {
    // If no line items, use original totals
    if (lineItems.length === 0) {
      return {
        totalAmount: data.totalAmount,
        vatAmount: data.vatAmount,
        netAmount: data.netAmount
      };
    }

    const selectedItems = lineItems.filter(item => item.selected);

    // Prevent all items being deselected
    if (selectedItems.length === 0) {
      return {
        totalAmount: data.totalAmount,
        vatAmount: data.vatAmount,
        netAmount: data.netAmount
      };
    }

    return {
      totalAmount: selectedItems.reduce((sum, item) => sum + item.totalAmount, 0),
      vatAmount: selectedItems.reduce((sum, item) => sum + item.vatAmount, 0),
      netAmount: selectedItems.reduce((sum, item) => sum + item.netAmount, 0)
    };
  };

  const selectedTotals = calculateSelectedTotals();
  const selectedItemsCount = lineItems.filter(item => item.selected).length;
  const hasLineItems = lineItems.length > 0;

  // Handle item selection toggle
  const handleToggleItem = (itemId: string) => {
    setLineItems(prev => {
      const newItems = prev.map(item =>
        item.id === itemId ? { ...item, selected: !item.selected } : item
      );

      // Prevent deselecting all items
      const selectedCount = newItems.filter(item => item.selected).length;
      if (selectedCount === 0) {
        return prev; // Return unchanged if trying to deselect last item
      }

      return newItems;
    });
  };

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
    // Prevent saving with no items selected
    if (hasLineItems && selectedItemsCount === 0) {
      setSaveError('Selecteer minimaal één item om op te slaan.');
      return;
    }

    setSaveState('loading');
    setSaveError(null);
    try {
      // Create modified data with selected items and recalculated totals
      const dataToSave: ReceiptData = {
        ...data,
        totalAmount: selectedTotals.totalAmount,
        vatAmount: selectedTotals.vatAmount,
        netAmount: selectedTotals.netAmount,
        lineItems: hasLineItems ? lineItems.filter(item => item.selected) : undefined
      };

      await onSaveToBaserow(dataToSave);
      setSaveState('success');
      // Keep success state permanent - no reset to prevent duplicate saves
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
        <DataItem label="Leverancier" value={data.supplierName} />

        {/* Show original totals only if no line items, otherwise they're shown in recalculated section */}
        {!hasLineItems && (
          <>
            <DataItem label="Bedrag incl. BTW" value={formatCurrency(data.totalAmount)} isAmount />
            <DataItem label="BTW" value={formatCurrency(data.vatAmount)} isAmount />
            <DataItem label="Bedrag ex. BTW" value={formatCurrency(data.netAmount)} isAmount />
          </>
        )}
      </div>

      {/* Line Items Selector - only show if items exist */}
      {hasLineItems && (
        <>
          <LineItemsSelector
            items={lineItems}
            onToggleItem={handleToggleItem}
          />

          {/* Recalculated Totals Display */}
          <div className="bg-blue-50 p-4 rounded-lg shadow-inner mb-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center justify-between">
              <span>Herberekende Totalen</span>
              <span className="text-sm font-normal text-gray-600">
                {selectedItemsCount} van {lineItems.length} items geselecteerd
              </span>
            </h3>
            <div className="space-y-2">
              <DataItem label="Bedrag incl. BTW" value={formatCurrency(selectedTotals.totalAmount)} isAmount />
              <DataItem label="BTW" value={formatCurrency(selectedTotals.vatAmount)} isAmount />
              <DataItem label="Bedrag ex. BTW" value={formatCurrency(selectedTotals.netAmount)} isAmount />
            </div>
            {selectedItemsCount < lineItems.length && (
              <p className="text-xs text-gray-600 mt-3 italic">
                Deze bedragen zijn herberekend op basis van de geselecteerde items.
              </p>
            )}
          </div>
        </>
      )}

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
