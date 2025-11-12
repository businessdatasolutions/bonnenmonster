import type { ReceiptData, AppConfig, BaserowFileUploadResponse, LogEntry } from '../types';

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
      // Baserow file field expects an array of objects with complete file metadata
      uploadedPhotoData = [{
        name: uploadResponse.name,
        url: uploadResponse.url,
        thumbnails: uploadResponse.thumbnails,
        size: uploadResponse.size,
        mime_type: uploadResponse.mime_type,
        is_image: uploadResponse.is_image,
        image_width: uploadResponse.image_width,
        image_height: uploadResponse.image_height,
        uploaded_at: uploadResponse.uploaded_at
      }];
    } catch (error) {
      console.error("Photo upload failed, continuing without photo:", error);
      // Continue saving receipt data even if photo upload fails
    }
  }

  // Map our data to match typical Baserow field names.
  // Assumes Baserow table has columns named: 'Datum', 'Leverancier', 'Totaal Bedrag', 'BTW Bedrag', 'Netto Bedrag', 'Photo'
  const rowData: Record<string, any> = {
    // Baserow's date field expects ISO 8601 format (YYYY-MM-DD), which Gemini already provides.
    'Datum': data.date,
    'Leverancier': data.supplierName,
    'Totaal Bedrag': data.totalAmount,
    'BTW Bedrag': data.vatAmount,
    'Netto Bedrag': data.netAmount,
  };

  // Add line items information if present
  if (data.lineItems && data.lineItems.length > 0) {
    const selectedItems = data.lineItems.filter(item => item.selected);
    // Save comma-separated list of item descriptions
    rowData['Items'] = selectedItems.map(item => item.description).join(', ');
    // Save count of selected items
    rowData['Aantal Items'] = selectedItems.length;

    // Optional: Save detailed line items as JSON string for advanced reporting
    // Uncomment if you create a "Line Items Detail" long text field in Baserow
    // rowData['Line Items Detail'] = JSON.stringify(selectedItems);
  }

  // Add photo if uploaded successfully
  if (uploadedPhotoData) {
    rowData['Photo'] = uploadedPhotoData;
  }

  const endpoint = `${apiUrl}/api/database/rows/table/${tableId}/?user_field_names=true`;

  // Debug logging
  console.log("Saving to Baserow with data:", JSON.stringify(rowData, null, 2));
  console.log("Endpoint:", endpoint);

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
      console.error("Full error body:", JSON.stringify(errorBody, null, 2));

      // Extract detailed error information from various possible error properties
      const errorMessage = errorBody.error
        || errorBody.detail
        || errorBody.message
        || JSON.stringify(errorBody);

      throw new Error(`Fout bij opslaan in Baserow: ${errorMessage}`);
    }

  } catch (error) {
    console.error("Error saving to Baserow:", error);
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error("Kon geen verbinding maken met de Baserow API.");
  }
};

/**
 * Log an event/action to Baserow logging table
 * @param logEntry - The log entry data
 * @param config - Baserow API configuration (must include logTableId)
 * @returns Promise that resolves when log is saved (or rejects silently)
 */
export const logToBaserow = async (
  logEntry: LogEntry,
  config: AppConfig
): Promise<void> => {
  // Skip if no log table configured
  if (!config.logTableId) {
    return;
  }

  const { apiUrl, apiKey, logTableId } = config;

  // Map log entry to Baserow field names
  // Assumes Baserow table has columns: 'Timestamp', 'Action Type', 'Status', 'Message', 'Error Details', 'Receipt Data', 'User Agent'
  const rowData: Record<string, any> = {
    'Timestamp': logEntry.timestamp,
    'Action Type': logEntry.actionType,
    'Status': logEntry.status,
    'Message': logEntry.message,
    'User Agent': logEntry.userAgent,
  };

  // Add optional fields if present
  if (logEntry.errorDetails) {
    rowData['Error Details'] = logEntry.errorDetails;
  }
  if (logEntry.receiptData) {
    rowData['Receipt Data'] = logEntry.receiptData;
  }

  const endpoint = `${apiUrl}/api/database/rows/table/${logTableId}/?user_field_names=true`;

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
      // Silently fail logging - don't block the main application
      console.warn("Failed to log to Baserow:", response.status, response.statusText);
    }
  } catch (error) {
    // Silently fail logging - don't block the main application
    console.warn("Error logging to Baserow:", error);
  }
};