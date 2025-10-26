
import { GoogleGenAI, Type } from "@google/genai";
import type { ReceiptData } from '../types';

const receiptSchema = {
    type: Type.OBJECT,
    properties: {
        date: { type: Type.STRING, description: 'De datum van de transactie in JJJJ-MM-DD formaat.' },
        stationName: { type: Type.STRING, description: 'De naam van het tankstation.' },
        totalAmount: { type: Type.NUMBER, description: 'Het totale bedrag inclusief BTW.' },
        vatAmount: { type: Type.NUMBER, description: 'Het BTW-bedrag.' },
        netAmount: { type: Type.NUMBER, description: 'Het bedrag exclusief BTW (totaal - BTW).' },
    },
    required: ['date', 'stationName', 'totalAmount', 'vatAmount', 'netAmount'],
};

export const analyzeReceipt = async (base64ImageData: string, mimeType: string): Promise<ReceiptData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const textPart = {
    text: "Analyseer deze tankbon en extraheer de volgende informatie. Geef de bedragen als numerieke waarden. Zorg ervoor dat de datum in JJJJ-MM-DD formaat is. Geef null terug voor velden die niet gevonden kunnen worden."
  };

  const imagePart = {
    inlineData: {
      mimeType: mimeType,
      data: base64ImageData,
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [textPart, imagePart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: receiptSchema,
      },
    });

    const jsonString = response.text.trim();
    const parsedData = JSON.parse(jsonString);
    
    // Validate required fields
    for (const key of receiptSchema.required) {
        if (parsedData[key] === undefined || parsedData[key] === null) {
            throw new Error(`Het veld '${key}' kon niet worden gevonden op de bon.`);
        }
    }

    return parsedData as ReceiptData;

  } catch (error) {
    console.error("Error analyzing receipt with Gemini:", error);
    throw new Error("De AI kon de gegevens van de bon niet verwerken. Probeer een duidelijkere foto.");
  }
};
