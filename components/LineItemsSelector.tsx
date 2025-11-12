import React from 'react';
import type { LineItem } from '../types';

interface LineItemsSelectorProps {
  items: LineItem[];
  onToggleItem: (itemId: string) => void;
}

const LineItemsSelector: React.FC<LineItemsSelectorProps> = ({ items, onToggleItem }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      <h3 className="text-lg font-semibold text-gray-800">Items op de bon</h3>
      <p className="text-sm text-gray-600 mb-4">
        Vink items uit die je niet wilt opslaan. De totalen worden automatisch herberekend.
      </p>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all duration-200 ${
              item.selected
                ? 'bg-green-50 border-green-300 opacity-100'
                : 'bg-gray-100 border-gray-300 opacity-60'
            }`}
          >
            <input
              type="checkbox"
              checked={item.selected}
              onChange={() => onToggleItem(item.id)}
              className="mt-1 h-5 w-5 text-primary focus:ring-2 focus:ring-primary rounded cursor-pointer"
              aria-label={`Selecteer ${item.description}`}
            />

            <div className="flex-1 min-w-0">
              <div className={`font-medium text-gray-900 ${!item.selected ? 'line-through opacity-75' : ''}`}>
                {item.description}
              </div>

              {item.quantity && item.unitPrice && (
                <div className="text-sm text-gray-600 mt-1">
                  {item.quantity}x {formatCurrency(item.unitPrice)}
                </div>
              )}

              <div className="text-sm text-gray-600 mt-2 space-y-1">
                <div>Netto: {formatCurrency(item.netAmount)}</div>
                <div>
                  BTW {item.vatRate ? `(${item.vatRate}%)` : ''}: {formatCurrency(item.vatAmount)}
                </div>
              </div>
            </div>

            <div className="text-right font-semibold text-gray-900 whitespace-nowrap">
              {formatCurrency(item.totalAmount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LineItemsSelector;
