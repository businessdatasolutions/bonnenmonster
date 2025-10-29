export interface LineItem {
  id: string;                    // Unique ID for React key
  description: string;           // Item name/description
  quantity?: number;             // Quantity if available
  unitPrice?: number;            // Price per unit if available
  netAmount: number;             // Net amount for this item
  vatAmount: number;             // VAT amount for this item
  vatRate?: number;              // VAT percentage (e.g., 7, 19, 21)
  totalAmount: number;           // Total including VAT
  selected: boolean;             // User selection state (for UI)
}

export interface ReceiptData {
  date: string;
  supplierName: string;
  totalAmount: number;
  vatAmount: number;
  netAmount: number;
  lineItems?: LineItem[];        // Optional itemized breakdown
}

export interface AppConfig {
  apiUrl: string;
  apiKey: string;
  tableId: string;
  geminiApiKey: string;
}

export interface BaserowFileUploadResponse {
  url: string;
  thumbnails: {
    tiny?: { url: string; width: number; height: number };
    small?: { url: string; width: number; height: number };
  };
  name: string;
  size: number;
  mime_type: string;
  is_image: boolean;
  image_width?: number;
  image_height?: number;
  uploaded_at: string;
}