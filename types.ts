export interface ReceiptData {
  date: string;
  stationName: string;
  totalAmount: number;
  vatAmount: number;
  netAmount: number;
}

export interface BaserowConfig {
  apiUrl: string;
  apiKey: string;
  tableId: string;
}
