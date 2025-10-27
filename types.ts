export interface ReceiptData {
  date: string;
  stationName: string;
  totalAmount: number;
  vatAmount: number;
  netAmount: number;
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