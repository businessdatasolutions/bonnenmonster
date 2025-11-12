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
  logTableId?: string; // Optional: Table ID for logging
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

export type LogActionType =
  | 'photo_upload_start'
  | 'photo_upload_success'
  | 'photo_upload_error'
  | 'gemini_analyze_start'
  | 'gemini_analyze_success'
  | 'gemini_analyze_error'
  | 'baserow_save_start'
  | 'baserow_save_success'
  | 'baserow_save_error'
  | 'app_error';

export type LogStatus = 'success' | 'error' | 'warning' | 'info';

export interface LogEntry {
  timestamp: string; // ISO 8601 format
  actionType: LogActionType;
  status: LogStatus;
  message: string;
  errorDetails?: string; // JSON stringified error object
  receiptData?: string; // Optional: JSON stringified receipt data
  userAgent: string;
}