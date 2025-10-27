import type { ReceiptData, AppConfig, BaserowFileUploadResponse } from '../types';

/**
 * Upload a photo file to Baserow
 * @param file - The image file to upload
 * @param config - Baserow API configuration
 * @returns Upload response with file metadata
 */
export const uploadPhotoToBaserow = async (
  file: File,
  config: AppConfig
): Promise<BaserowFileUploadResponse> => {
  const { apiUrl, apiKey } = config;

  const formData = new FormData();
  formData.append('file', file);

  const endpoint = `${apiUrl}/api/user-files/upload-file/`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ detail: response.statusText }));
      console.error("Baserow File Upload Error:", errorBody);
      throw new Error(`Fout bij uploaden foto: ${errorBody.detail || response.statusText}`);
    }

    const uploadedFile: BaserowFileUploadResponse = await response.json();
    return uploadedFile;

  } catch (error) {
    console.error("Error uploading photo to Baserow:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Kon foto niet uploaden naar Baserow.");
  }
};

export const saveToBaserow = async (
  data: ReceiptData,
  config: AppConfig,
  photoFile?: File
): Promise<void> => {
  const { apiUrl, apiKey, tableId } = config;

  // Upload photo first if provided
  let uploadedPhotoData = null;
  if (photoFile) {
    try {
      const uploadResponse = await uploadPhotoToBaserow(photoFile, config);
      // Baserow file field expects an array of objects with the file metadata
      uploadedPhotoData = [{
        name: uploadResponse.name,
        // Include other metadata that Baserow expects
      }];
    } catch (error) {
      console.error("Photo upload failed, continuing without photo:", error);
      // Continue saving receipt data even if photo upload fails
    }
  }

  // Map our data to match typical Baserow field names.
  // Assumes Baserow table has columns named: 'Datum', 'Tankstation', 'Totaal Bedrag', 'BTW Bedrag', 'Netto Bedrag', 'Photo'
  const rowData: Record<string, any> = {
    // Baserow's date field expects ISO 8601 format (YYYY-MM-DD), which Gemini already provides.
    'Datum': data.date,
    'Tankstation': data.stationName,
    'Totaal Bedrag': data.totalAmount,
    'BTW Bedrag': data.vatAmount,
    'Netto Bedrag': data.netAmount,
  };

  // Add photo if uploaded successfully
  if (uploadedPhotoData) {
    rowData['Photo'] = uploadedPhotoData;
  }

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