# Support Multiple European VAT Rates and Categories

**Status**: Open
**Priority**: Low
**Created**: 2025-10-29

## Description

The app currently assumes a single VAT rate per invoice, but many European countries have multiple VAT rates for different goods and services. The app should be able to distinguish between different VAT tariff categories and handle invoices with multiple VAT rates.

## Background

Different European countries use different VAT systems:

- **Netherlands**: 21% (standard), 9% (reduced), 0% (zero-rated)
- **Germany**: 19% (standard), 7% (reduced)
- **Belgium**: 21% (standard), 12% (intermediate), 6% (reduced)
- **France**: 20% (standard), 10% (intermediate), 5.5% (reduced), 2.1% (super-reduced)
- **Spain**: 21% (standard), 10% (reduced), 4% (super-reduced)

Many invoices contain items with different VAT rates (e.g., food at 7% and electronics at 19% in Germany).

## Current Implementation

The app currently extracts:
- `totalAmount` (total including VAT)
- `vatAmount` (single VAT amount)
- `netAmount` (total excluding VAT)

This assumes a single VAT rate per invoice.

## Problems

1. **Single VAT Rate Assumption**: Cannot handle invoices with multiple VAT rates
2. **No Rate Detection**: Cannot identify which VAT rate was applied
3. **No Category Breakdown**: Cannot separate items by VAT category
4. **Limited Analysis**: Cannot extract itemized VAT breakdown
5. **Country Agnostic**: No awareness of country-specific VAT rules

## Example Scenarios

### Scenario 1: German Supermarket Receipt
```
Items:
- Bread (7% VAT): €2.00 net + €0.14 VAT = €2.14
- Shampoo (19% VAT): €5.00 net + €0.95 VAT = €5.95

Total net: €7.00
Total VAT (mixed): €1.09
Total: €8.09
```

### Scenario 2: Dutch Restaurant Bill
```
Items:
- Food (9% VAT): €50.00 net + €4.50 VAT = €54.50
- Drinks (21% VAT): €20.00 net + €4.20 VAT = €24.20

Total net: €70.00
Total VAT (mixed): €8.70
Total: €78.70
```

## Proposed Solution

### Option 1: VAT Breakdown Array (Recommended)

Extend the `ReceiptData` interface to support multiple VAT categories:

```typescript
export interface VATBreakdown {
  rate: number;           // VAT percentage (e.g., 19, 7, 21, 9)
  netAmount: number;      // Net amount for this category
  vatAmount: number;      // VAT amount for this category
  totalAmount: number;    // Total including VAT for this category
}

export interface ReceiptData {
  date: string;
  supplierName: string;
  country?: string;                    // NEW: Country code (NL, DE, BE, etc.)
  totalAmount: number;
  vatAmount: number;
  netAmount: number;
  vatBreakdown?: VATBreakdown[];      // NEW: Itemized VAT breakdown
}
```

### Option 2: Simple Multi-Rate Support

Keep current structure but add fields for common two-rate scenarios:

```typescript
export interface ReceiptData {
  date: string;
  supplierName: string;
  totalAmount: number;
  vatAmount: number;
  netAmount: number;
  // Optional fields for multi-rate invoices
  vatRate1?: number;      // First VAT rate (e.g., 19%)
  vatAmount1?: number;    // VAT amount at rate 1
  netAmount1?: number;    // Net amount at rate 1
  vatRate2?: number;      // Second VAT rate (e.g., 7%)
  vatAmount2?: number;    // VAT amount at rate 2
  netAmount2?: number;    // Net amount at rate 2
}
```

### Option 3: Full Itemization

Extract individual line items with their VAT rates:

```typescript
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
}

export interface ReceiptData {
  date: string;
  supplierName: string;
  totalAmount: number;
  vatAmount: number;
  netAmount: number;
  lineItems?: InvoiceLineItem[];     // NEW: Full itemization
  vatBreakdown?: VATBreakdown[];     // Aggregated VAT summary
}
```

## Gemini AI Integration Changes

Update the Gemini prompt and schema:

```typescript
const receiptSchema = {
    type: Type.OBJECT,
    properties: {
        date: { type: Type.STRING },
        supplierName: { type: Type.STRING },
        country: { type: Type.STRING, description: 'Landcode (NL, DE, BE, FR, etc.)' },
        totalAmount: { type: Type.NUMBER },
        vatAmount: { type: Type.NUMBER },
        netAmount: { type: Type.NUMBER },
        vatBreakdown: {
            type: Type.ARRAY,
            description: 'BTW-categorieën indien er meerdere tarieven zijn',
            items: {
                type: Type.OBJECT,
                properties: {
                    rate: { type: Type.NUMBER, description: 'BTW-percentage (bijv. 19, 7, 21)' },
                    netAmount: { type: Type.NUMBER },
                    vatAmount: { type: Type.NUMBER },
                    totalAmount: { type: Type.NUMBER }
                }
            }
        }
    },
    required: ['date', 'supplierName', 'totalAmount', 'vatAmount', 'netAmount'],
};

const textPart = {
  text: `Analyseer deze factuur en extraheer de volgende informatie.
  Let op verschillende BTW-tarieven (zoals 19% en 7% in Duitsland, of 21% en 9% in Nederland).
  Als de factuur meerdere BTW-tarieven bevat, splits deze dan op in vatBreakdown.
  Geef de bedragen als numerieke waarden. Zorg ervoor dat de datum in JJJJ-MM-DD formaat is.`
};
```

## Baserow Integration Changes

Add new columns to Baserow table:
- `Land` (country code)
- `BTW Breakdown` (JSON or text field for multiple rates)
- `BTW Tarief 1` (first VAT rate)
- `BTW Tarief 2` (second VAT rate)
- Or create a linked table for VAT breakdown items

## UI Changes

Update `ReceiptDataDisplay.tsx` to show:
- Country if detected
- VAT breakdown table when multiple rates present
- Expandable section for detailed VAT information

Example UI:
```
Datum: 29-10-2025
Leverancier: REWE (Deutschland)
Land: DE

Bedrag incl. BTW: €8.09
BTW (totaal): €1.09
Bedrag ex. BTW: €7.00

[Expand: BTW Details]
  7% BTW:  €2.00 netto + €0.14 BTW = €2.14
  19% BTW: €5.00 netto + €0.95 BTW = €5.95
```

## Files to Modify

1. **types.ts** - Add VATBreakdown interface
2. **src/types.ts** - Mirror changes
3. **services/geminiService.ts** - Update schema and prompt
4. **src/services/geminiService.ts** - Mirror changes
5. **services/baserowService.ts** - Map VAT breakdown to Baserow fields
6. **src/services/baserowService.ts** - Mirror changes
7. **components/ReceiptDataDisplay.tsx** - Add VAT breakdown display
8. **src/components/ReceiptDataDisplay.tsx** - Mirror changes

## Acceptance Criteria

- [ ] App can detect and extract multiple VAT rates from a single invoice
- [ ] Country code is extracted when visible on invoice
- [ ] VAT breakdown is displayed in UI when multiple rates present
- [ ] Baserow receives VAT breakdown data
- [ ] Backward compatible: single-rate invoices still work as before
- [ ] VAT totals match overall invoice totals
- [ ] Support at least 2-3 VAT rates per invoice
- [ ] Works for major EU countries (DE, NL, BE, FR, ES)

## Testing Scenarios

1. Single VAT rate invoice (current functionality)
2. German receipt with 7% and 19% VAT
3. Dutch receipt with 9% and 21% VAT
4. Belgian receipt with 6%, 12%, and 21% VAT
5. Invoice with only one VAT rate but rate is specified
6. Invoice where VAT breakdown is not clearly visible

## Benefits

- More accurate data extraction for EU invoices
- Better financial reporting and analysis
- Support for diverse business types (retail, hospitality, etc.)
- International usability across Europe
- Detailed tax documentation for accounting

## Considerations

- Gemini AI accuracy for complex VAT breakdowns
- Performance impact of extracting more detailed data
- UI complexity for displaying multiple VAT rates
- Baserow schema migration for existing data
- Optional vs. required field handling
- Backward compatibility with existing receipts

## Priority Justification

**Low Priority** because:
- Current app works for simple invoices (most common case)
- Most invoices contain a single VAT rate
- Not blocking basic functionality
- Nice-to-have for advanced use cases
- Can be implemented incrementally when needed

## Related Issues

- Consider adding line item extraction (#005 - future)
- Consider currency detection for multi-currency support (#006 - future)
- Consider expense category classification (#007 - future)

## Additional Context

This enhancement will make the app significantly more useful for businesses operating across Europe, especially in retail, hospitality, and e-commerce sectors where multiple VAT rates are common.
