# Line Item Selection and Filtering with Dynamic Total Recalculation

**Status**: Open
**Priority**: High
**Created**: 2025-10-29

## Description

When an invoice contains multiple line items, the app should extract and display each item separately with a checkbox. Users should be able to deselect items they don't want to include. When items are deselected, all total amounts (net, VAT, and total) should be automatically recalculated and only the selected items should be saved to the database.

## Use Case

A receipt may contain both business and personal expenses. For example:
- A gas station receipt with fuel (business expense) and snacks (personal expense)
- A supermarket receipt with office supplies and personal groceries
- A restaurant bill with business lunch and personal drinks

Users need to filter out personal items before saving to the accounting system.

## Example Scenario

**Original Receipt** (from `evaluation/files/multiple-items-germany.jpeg`):

```
✓ Katjes Salzige Lakri
  Total: €2.09
  VAT: €0.14 (7%)
  Net: €1.95

✓ Super E10
  Total: €69.01
  VAT: €11.02 (19%)
  Net: €57.99

TOTALS:
Total: €71.10
VAT: €11.16
Net: €59.94
```

**After User Deselects "Katjes"**:

```
☐ Katjes Salzige Lakri (excluded)
  Total: €2.09
  VAT: €0.14 (7%)
  Net: €1.95

✓ Super E10
  Total: €69.01
  VAT: €11.02 (19%)
  Net: €57.99

RECALCULATED TOTALS:
Total: €69.01
VAT: €11.02
Net: €57.99
```

Only the selected item (Super E10) gets saved to Baserow with the recalculated totals.

## Current Implementation

The app currently extracts:
- Single aggregated totals (date, supplierName, totalAmount, vatAmount, netAmount)
- No line item breakdown
- No ability to filter items

## Proposed Solution

### 1. Data Model Changes

Update `types.ts`:

```typescript
export interface LineItem {
  id: string;                    // Unique ID for React key
  description: string;           // Item name/description
  quantity?: number;             // Quantity if available
  unitPrice?: number;            // Price per unit if available
  netAmount: number;             // Net amount for this item
  vatAmount: number;             // VAT amount for this item
  vatRate?: number;              // VAT percentage (e.g., 7, 19, 21)
  totalAmount: number;           // Total including VAT
  selected: boolean;             // User selection state
}

export interface ReceiptData {
  date: string;
  supplierName: string;
  totalAmount: number;           // Original total
  vatAmount: number;             // Original VAT
  netAmount: number;             // Original net
  lineItems?: LineItem[];        // NEW: Itemized breakdown
  // Calculated fields (based on selected items):
  selectedTotalAmount?: number;  // Recalculated total
  selectedVatAmount?: number;    // Recalculated VAT
  selectedNetAmount?: number;    // Recalculated net
}
```

### 2. Gemini AI Schema Update

Update `services/geminiService.ts`:

```typescript
const receiptSchema = {
    type: Type.OBJECT,
    properties: {
        date: { type: Type.STRING, description: 'De datum in JJJJ-MM-DD formaat.' },
        supplierName: { type: Type.STRING, description: 'De naam van de leverancier.' },
        totalAmount: { type: Type.NUMBER, description: 'Het totale bedrag inclusief BTW.' },
        vatAmount: { type: Type.NUMBER, description: 'Het totale BTW-bedrag.' },
        netAmount: { type: Type.NUMBER, description: 'Het totale bedrag exclusief BTW.' },
        lineItems: {
            type: Type.ARRAY,
            description: 'Individuele items/regels op de bon indien aanwezig',
            items: {
                type: Type.OBJECT,
                properties: {
                    description: { type: Type.STRING, description: 'Naam/omschrijving van het item' },
                    quantity: { type: Type.NUMBER, description: 'Aantal (optioneel)' },
                    unitPrice: { type: Type.NUMBER, description: 'Prijs per stuk (optioneel)' },
                    netAmount: { type: Type.NUMBER, description: 'Bedrag excl. BTW' },
                    vatAmount: { type: Type.NUMBER, description: 'BTW-bedrag' },
                    vatRate: { type: Type.NUMBER, description: 'BTW-percentage (7, 19, 21, etc.)' },
                    totalAmount: { type: Type.NUMBER, description: 'Totaal incl. BTW' }
                },
                required: ['description', 'netAmount', 'vatAmount', 'totalAmount']
            }
        }
    },
    required: ['date', 'supplierName', 'totalAmount', 'vatAmount', 'netAmount'],
};

const textPart = {
  text: `Analyseer deze factuur en extraheer de volgende informatie.
  Als de bon meerdere items/regels bevat, extraheer dan elk item afzonderlijk met de bijbehorende bedragen.
  Geef voor elk item het netto bedrag, BTW-bedrag, en totaalbedrag.
  Als het BTW-percentage per item zichtbaar is, neem dat dan ook op.
  Geef de bedragen als numerieke waarden. Zorg ervoor dat de datum in JJJJ-MM-DD formaat is.`
};
```

### 3. UI Component Changes

Create new component `components/LineItemsSelector.tsx`:

```typescript
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

  return (
    <div className="space-y-2 mb-4">
      <h3 className="text-lg font-semibold text-gray-800">Items op de bon</h3>
      <p className="text-sm text-gray-600">
        Vink items uit die je niet wilt opslaan. De totalen worden automatisch herberekend.
      </p>

      {items.map((item) => (
        <div
          key={item.id}
          className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
            item.selected
              ? 'bg-green-50 border-green-300'
              : 'bg-gray-100 border-gray-300 opacity-60'
          }`}
        >
          <input
            type="checkbox"
            checked={item.selected}
            onChange={() => onToggleItem(item.id)}
            className="mt-1 h-5 w-5 text-primary focus:ring-primary"
          />

          <div className="flex-1">
            <div className="font-medium text-gray-900">{item.description}</div>
            {item.quantity && item.unitPrice && (
              <div className="text-sm text-gray-600">
                {item.quantity}x {formatCurrency(item.unitPrice)}
              </div>
            )}
            <div className="text-sm text-gray-600 mt-1">
              Netto: {formatCurrency(item.netAmount)} +
              BTW {item.vatRate ? `(${item.vatRate}%)` : ''}: {formatCurrency(item.vatAmount)} =
              Totaal: {formatCurrency(item.totalAmount)}
            </div>
          </div>

          <div className="text-right font-semibold text-gray-900">
            {formatCurrency(item.totalAmount)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LineItemsSelector;
```

### 4. Update ReceiptDataDisplay Component

Modify `components/ReceiptDataDisplay.tsx`:

```typescript
// Add state for line items
const [lineItems, setLineItems] = useState<LineItem[]>(
  data.lineItems?.map((item, index) => ({
    ...item,
    id: `item-${index}`,
    selected: true
  })) || []
);

// Calculate totals based on selected items
const calculateSelectedTotals = () => {
  const selected = lineItems.filter(item => item.selected);

  if (selected.length === 0 || lineItems.length === 0) {
    return {
      totalAmount: data.totalAmount,
      vatAmount: data.vatAmount,
      netAmount: data.netAmount
    };
  }

  return {
    totalAmount: selected.reduce((sum, item) => sum + item.totalAmount, 0),
    vatAmount: selected.reduce((sum, item) => sum + item.vatAmount, 0),
    netAmount: selected.reduce((sum, item) => sum + item.netAmount, 0)
  };
};

const selectedTotals = calculateSelectedTotals();

// Toggle item selection
const handleToggleItem = (itemId: string) => {
  setLineItems(prev =>
    prev.map(item =>
      item.id === itemId ? { ...item, selected: !item.selected } : item
    )
  );
};

// Update save handler to use selected totals and items
const handleSave = async () => {
  setSaveState('loading');
  setSaveError(null);
  try {
    const dataToSave = {
      ...data,
      totalAmount: selectedTotals.totalAmount,
      vatAmount: selectedTotals.vatAmount,
      netAmount: selectedTotals.netAmount,
      lineItems: lineItems.filter(item => item.selected)
    };
    await onSaveToBaserow(dataToSave);
    setSaveState('success');
  } catch (error: any) {
    setSaveState('error');
    setSaveError(error.message || 'Onbekende fout opgetreden.');
  }
};
```

Add to render:

```typescript
{lineItems.length > 0 && (
  <LineItemsSelector
    items={lineItems}
    onToggleItem={handleToggleItem}
  />
)}

{lineItems.length > 0 && (
  <div className="bg-blue-50 p-4 rounded-lg mb-4">
    <h3 className="font-semibold text-gray-800 mb-2">
      Herberekende totalen ({lineItems.filter(i => i.selected).length} van {lineItems.length} items geselecteerd)
    </h3>
    <div className="space-y-1 text-sm">
      <DataItem label="Bedrag incl. BTW" value={formatCurrency(selectedTotals.totalAmount)} isAmount />
      <DataItem label="BTW" value={formatCurrency(selectedTotals.vatAmount)} isAmount />
      <DataItem label="Bedrag ex. BTW" value={formatCurrency(selectedTotals.netAmount)} isAmount />
    </div>
  </div>
)}
```

### 5. Baserow Integration

Update `services/baserowService.ts` to optionally save line items:

```typescript
const rowData: Record<string, any> = {
  'Datum': data.date,
  'Leverancier': data.supplierName,
  'Totaal Bedrag': data.totalAmount,
  'BTW Bedrag': data.vatAmount,
  'Netto Bedrag': data.netAmount,
};

// If line items exist and user made selections, use recalculated values
if (data.lineItems && data.lineItems.length > 0) {
  const selectedItems = data.lineItems.filter(item => item.selected);
  rowData['Items'] = selectedItems.map(item => item.description).join(', ');
  rowData['Aantal Items'] = selectedItems.length;
}

// Add photo if uploaded successfully
if (uploadedPhotoData) {
  rowData['Photo'] = uploadedPhotoData;
}
```

## Test Data

Test files are available in `evaluation/files/`:

- `multiple-items-germany.jpeg` + `multiple-items-germany.md`
  - 2 items with different VAT rates (7% and 19%)
  - Total: €71.10, VAT: €11.16, Net: €59.94

Additional test scenarios to create:
- Single item receipt (backward compatibility)
- 3+ items with same VAT rate
- Items with quantity and unit price
- Receipt with unclear item breakdown

## Files to Modify

1. **types.ts** - Add LineItem interface and update ReceiptData
2. **src/types.ts** - Mirror changes
3. **components/LineItemsSelector.tsx** - NEW component for item selection
4. **src/components/LineItemsSelector.tsx** - Mirror component
5. **components/ReceiptDataDisplay.tsx** - Add line item display and recalculation logic
6. **src/components/ReceiptDataDisplay.tsx** - Mirror changes
7. **services/geminiService.ts** - Update schema and prompt for line items
8. **src/services/geminiService.ts** - Mirror changes
9. **services/baserowService.ts** - Add line items to saved data
10. **src/services/baserowService.ts** - Mirror changes

## Acceptance Criteria

- [ ] Gemini extracts individual line items when present on invoice
- [ ] Each line item displays with a checkbox (checked by default)
- [ ] User can toggle checkbox to deselect items
- [ ] Totals automatically recalculate when items are toggled
- [ ] Recalculated totals show prominently before save
- [ ] Only selected items are saved to Baserow
- [ ] Saved totals match selected items (not original totals)
- [ ] Backward compatible: invoices without line items work as before
- [ ] Visual distinction between selected and deselected items
- [ ] User cannot deselect all items (at least 1 required)
- [ ] VAT rates per item are displayed when available
- [ ] Item quantities and unit prices shown when available

## UI/UX Considerations

### Visual Design
- **Selected items**: Green background, green border, opacity 100%
- **Deselected items**: Gray background, gray border, opacity 60%, strikethrough text
- **Checkboxes**: Large (20px), easy to tap on mobile
- **Totals summary**: Highlighted box showing recalculated amounts
- **Item count**: Show "X of Y items selected"

### User Flow
1. Upload/capture receipt
2. Gemini analyzes and extracts line items
3. Items display with all checked by default
4. User unchecks personal/unwanted items
5. Totals update in real-time
6. User reviews recalculated amounts
7. User saves (only selected items go to Baserow)

### Edge Cases
- **No line items extracted**: Show regular totals view (current behavior)
- **All items deselected**: Disable save button, show warning
- **Single item**: Still show checkbox for consistency
- **Unclear item breakdown**: Gemini may not extract items; fall back to totals only

## Benefits

1. **Expense Separation**: Filter business vs. personal expenses
2. **Flexibility**: Choose which items to track
3. **Accuracy**: Only save relevant expenses to accounting system
4. **Transparency**: See exactly what's being saved
5. **VAT Management**: Better handling of mixed VAT rates
6. **Audit Trail**: Know which items were included/excluded

## Technical Considerations

- **State management**: Line items need local state for checkboxes
- **Performance**: Recalculate totals on every toggle (should be fast for typical receipt sizes)
- **Validation**: Ensure at least one item selected before save
- **Rounding**: Handle decimal precision in recalculations
- **Gemini accuracy**: Line item extraction may not always work perfectly
- **Backward compatibility**: Must handle receipts without line items gracefully

## Testing Plan

1. **Unit Tests**:
   - Total recalculation logic
   - Item toggle functionality
   - Edge cases (0 items, 1 item, all deselected)

2. **Integration Tests**:
   - Gemini extraction of line items
   - Baserow save with filtered items
   - UI checkbox interactions

3. **Manual Tests**:
   - Test with `evaluation/files/multiple-items-germany.jpeg`
   - Test with single-item receipts
   - Test with unclear/unstructured receipts
   - Test on mobile (checkbox size, tap targets)

## Priority Justification

**High Priority** because:
- Essential for business expense tracking
- Common use case (mixed business/personal receipts)
- Significant value add over current functionality
- Enables proper expense categorization
- Required for accurate accounting

## Related Issues

- Issue #004: Support Multiple European VAT Rates (complementary feature)
- Future: Add expense categories/tags to line items
- Future: Save item-level data to separate Baserow table
- Future: Support for discount/tax line items

## Additional Context

This feature transforms the app from a simple "scan & save" tool into a proper expense management system. The ability to filter items before saving is crucial for businesses that need to separate personal and business expenses on the same receipt.

## Implementation Notes

### Phase 1: Core Functionality
- Extract line items with Gemini
- Display items with checkboxes
- Recalculate totals
- Save filtered data

### Phase 2: Enhanced UX
- Animations for selection changes
- Undo/redo for selections
- "Select All" / "Deselect All" buttons
- Item search/filter for long receipts

### Phase 3: Advanced Features
- Expense categories per item
- Split items across multiple categories
- Linked Baserow table for line items
- Export selected items to PDF/CSV
