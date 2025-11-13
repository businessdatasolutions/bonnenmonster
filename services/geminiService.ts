
import { GoogleGenAI, Type } from "@google/genai";
import type { ReceiptData } from '../types';

const receiptSchema = {
    type: Type.OBJECT,
    properties: {
        date: { type: Type.STRING, description: 'De datum van de transactie in JJJJ-MM-DD formaat.' },
        supplierName: { type: Type.STRING, description: 'De naam van de leverancier.' },
        totalAmount: { type: Type.NUMBER, description: 'Het totale bedrag inclusief BTW.' },
        vatAmount: { type: Type.NUMBER, description: 'Het BTW-bedrag.' },
        netAmount: { type: Type.NUMBER, description: 'Het bedrag exclusief BTW (totaal - BTW).' },
        lineItems: {
            type: Type.ARRAY,
            description: 'Individuele items/regels op de bon indien aanwezig. Geef een lege array als er geen duidelijke items zijn.',
            items: {
                type: Type.OBJECT,
                properties: {
                    description: { type: Type.STRING, description: 'Naam/omschrijving van het item' },
                    quantity: { type: Type.NUMBER, description: 'Aantal stuks (optioneel)' },
                    unitPrice: { type: Type.NUMBER, description: 'Prijs per stuk (optioneel)' },
                    netAmount: { type: Type.NUMBER, description: 'Bedrag exclusief BTW voor dit item' },
                    vatAmount: { type: Type.NUMBER, description: 'BTW-bedrag voor dit item' },
                    vatRate: { type: Type.NUMBER, description: 'BTW-percentage (7, 19, 21, etc.)' },
                    totalAmount: { type: Type.NUMBER, description: 'Totaalbedrag inclusief BTW voor dit item' }
                },
                required: ['description', 'netAmount', 'vatAmount', 'totalAmount']
            }
        }
    },
    required: ['date', 'supplierName', 'totalAmount', 'vatAmount', 'netAmount'],
};

export const analyzeReceipt = async (base64ImageData: string, mimeType: string, geminiApiKey: string): Promise<ReceiptData> => {
  if (!geminiApiKey) {
    throw new Error("Gemini API-sleutel is niet ingesteld. Ga naar de instellingen om deze toe te voegen.");
  }
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  const textPart = {
    text: `Analyseer deze factuur en extraheer de volgende informatie.

    Als de bon meerdere items/regels bevat (bijvoorbeeld verschillende producten of diensten),
    extraheer dan elk item afzonderlijk met de bijbehorende bedragen per item.
    Geef voor elk item het netto bedrag, BTW-bedrag, en totaalbedrag.
    Als het BTW-percentage per item zichtbaar is, neem dat dan ook op.
    Als er geen duidelijke items zijn of het is een enkel totaalbedrag, geef dan een lege array voor lineItems.

    Geef de bedragen als numerieke waarden. Zorg ervoor dat de datum in JJJJ-MM-DD formaat is.
    Geef null terug voor velden die niet gevonden kunnen worden.`
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

    const jsonString = response.text?.trim();
    if (!jsonString) {
      throw new Error("Geen response ontvangen van Gemini AI");
    }
    const parsedData = JSON.parse(jsonString);

    // Debug log to see what Gemini returns
    console.log("📊 Gemini parsed data:", JSON.stringify(parsedData, null, 2));
    console.log("📋 Line items from Gemini:", parsedData.lineItems);

    // Add IDs and selected flag to line items for UI state management
    if (parsedData.lineItems && Array.isArray(parsedData.lineItems)) {
        console.log("✅ Processing line items - count:", parsedData.lineItems.length);
        parsedData.lineItems = parsedData.lineItems.map((item: any, index: number) => ({
            ...item,
            id: `item-${Date.now()}-${index}`, // Unique ID for React keys
            selected: true // All items selected by default
        }));
        console.log("✨ Line items after processing:", parsedData.lineItems);
    } else {
        console.log("❌ No line items found or not an array");
    }

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