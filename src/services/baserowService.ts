import type { ReceiptData, AppConfig } from '../types';

export const saveToBaserow = async (data: ReceiptData, config: AppConfig): Promise<void> => {
  const { apiUrl, apiKey, tableId } = config;

  // Map our data to match typical Baserow field names.
  // Assumes Baserow table has columns named: 'Datum', 'Tankstation', 'Totaal Bedrag', 'BTW Bedrag', 'Netto Bedrag'
  const rowData = {
    // Baserow's date field expects ISO 8601 format (YYYY-MM-DD), which Gemini already provides.
    'Datum': data.date, 
    'Tankstation': data.stationName,
    'Totaal Bedrag': data.totalAmount,
    'BTW Bedrag': data.vatAmount,
    'Netto Bedrag': data.netAmount,
  };

  const endpoint = `${apiUrl}/api/database/rows/table/${tableId}/?user_field_names=true`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rowData),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error("Baserow API Error:", errorBody);
      throw new Error(`Fout bij opslaan in Baserow: ${errorBody.detail || response.statusText}`);
    }

  } catch (error) {
    console.error("Error saving to Baserow:", error);
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error("Kon geen verbinding maken met de Baserow API.");
  }
};
