
import { GoogleGenAI, Type } from "@google/genai";
import type { BoqItem } from '../types';

// This check is for the developer to ensure they have set up their environment correctly.
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}
// Fix: Initialize the GoogleGenAI client with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const boqItemSchema = {
  type: Type.OBJECT,
  properties: {
    category: { type: Type.STRING, description: "The category of the item (e.g., Display, Audio, Control)." },
    itemName: { type: Type.STRING, description: "The generic name of the item (e.g., 4K Professional Display)." },
    brand: { type: Type.STRING, description: "The manufacturer or brand of the item (e.g., Samsung, Crestron)." },
    modelNumber: { type: Type.STRING, description: "The specific model number of the item (e.g., LH75QMBEBGCX/ZA)." },
    description: { type: Type.STRING, description: "A detailed description of the item and its purpose in the system." },
    quantity: { type: Type.INTEGER, description: "The number of units required." },
    unitPrice: { type: Type.NUMBER, description: "The estimated price per unit in USD. Do not include currency symbols." },
    imageUrl: { type: Type.STRING, description: "A URL to a representative image of the product. Can be an empty string if not found." },
    notes: { type: Type.STRING, description: "Any additional notes or considerations for this item. Can be an empty string." },
  },
  required: ["category", "itemName", "brand", "modelNumber", "description", "quantity", "unitPrice"],
};

const boqSchema = {
  type: Type.ARRAY,
  items: boqItemSchema,
};

const systemInstruction = `You are an expert Audio/Visual (AV) system designer. Your task is to generate a detailed Bill of Quantities (BOQ) based on the user's room requirements.
- The output MUST be a valid JSON array of objects, strictly adhering to the provided schema.
- For each item, provide a well-known brand and a realistic model number.
- Ensure quantities are appropriate for the specified room size and purpose.
- Unit prices should be realistic, in USD, and represented as a number (e.g., 1500.00).
- The description should explain why the item is chosen for this setup.
- If a budget is provided, try to select components that fit within the budget, prioritizing core functionality.
- Do not include any introductory text, closing remarks, or any content outside of the JSON array itself. The response must start with '[' and end with ']'.`;

export const generateBoq = async (requirements: string): Promise<BoqItem[]> => {
  try {
    // Fix: Call the Gemini API to generate content with the specified model, contents, and configuration.
    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro", // Using a more capable model for complex structured output
        contents: requirements,
        config: {
            responseMimeType: "application/json",
            responseSchema: boqSchema,
            temperature: 0.2, // Lower temperature for more predictable, structured output
            systemInstruction
        },
    });

    // Fix: Extract and parse the JSON response from the API.
    const jsonText = response.text.trim();
    const boq = JSON.parse(jsonText) as BoqItem[];
    // Basic validation
    if (!Array.isArray(boq)) {
      throw new Error("AI response is not a valid array.");
    }
    return boq;
  } catch (error) {
    console.error("Error generating BOQ:", error);
    // Try to parse Gemini's error for a more user-friendly message
    if (error instanceof Error && (error.message.includes('JSON') || error.message.includes('parsing'))) {
       throw new Error("The AI failed to generate a valid BOQ structure. Please try refining your request.");
    }
    throw new Error("An unexpected error occurred while generating the BOQ. Please try again.");
  }
};

export const refineBoq = async (currentBoq: BoqItem[], refinementPrompt: string): Promise<BoqItem[]> => {
    const prompt = `Given the following existing Bill of Quantities (BOQ) in JSON format:
\`\`\`json
${JSON.stringify(currentBoq, null, 2)}
\`\`\`

Please apply the following refinement: "${refinementPrompt}"

Return the complete, updated BOQ as a single JSON array, adhering to the original schema. Do not include any text other than the JSON array itself.`;
    
    // Fix: Reuse the generateBoq function with the new combined prompt for refinement.
    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: boqSchema,
            temperature: 0.2,
            systemInstruction
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as BoqItem[];
}
