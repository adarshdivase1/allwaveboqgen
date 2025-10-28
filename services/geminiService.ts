
import { GoogleGenAI, Type } from "@google/genai";
import type { BoqItem } from "../types";

// FIX: Initialize GoogleGenAI with apiKey from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const boqItemSchema = {
  type: Type.OBJECT,
  properties: {
    item_code: {
      type: Type.STRING,
      description: "A unique item code or model number, e.g., 'CRES-DM-NVX-350'."
    },
    description: {
      type: Type.STRING,
      description: "A detailed description of the item."
    },
    quantity: {
      type: Type.INTEGER,
      description: "The number of units required."
    },
    unit_price: {
      type: Type.NUMBER,
      description: "Estimated price per unit in USD. Do not include currency symbols."
    },
    total_price: {
        type: Type.NUMBER,
        description: "The total price (quantity * unit_price). Do not include currency symbols."
    },
    category: {
      type: Type.STRING,
      description: "The category of the item, e.g., 'Display', 'Audio', 'Control', 'Cabling'."
    },
    notes: {
        type: Type.STRING,
        description: "Optional notes about the item, e.g., 'Requires specific firmware version'."
    }
  },
  required: ["item_code", "description", "quantity", "unit_price", "total_price", "category"]
};

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        boq: {
            type: Type.ARRAY,
            description: "The list of Bill of Quantities items.",
            items: boqItemSchema
        }
    },
    required: ["boq"]
};

const systemInstruction = `You are an expert AV (Audio-Visual) system designer. Your task is to generate a detailed Bill of Quantities (BOQ) based on user-provided requirements for a specific room.
The BOQ must be in JSON format.
Each item in the BOQ should include an item code/model number, a clear description, quantity, estimated unit price in USD, total price, and a category.
Do not include any introductory text, just return the raw JSON object.
Ensure prices are realistic market estimates.
The categories should be logical, such as 'Display', 'Audio', 'Video Conferencing', 'Control System', 'Cabling & Connectivity', 'Infrastructure', etc.
Calculate total_price accurately as quantity * unit_price.
`;

export const generateBoq = async (requirements: string): Promise<BoqItem[]> => {
  try {
    // FIX: Use ai.models.generateContent for querying GenAI with model name and prompt.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro", // Using a powerful model for this complex JSON generation task
      contents: requirements,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2, // Lower temperature for more deterministic and structured output
      },
    });

    // FIX: Directly access response.text to get the generated content.
    const jsonString = response.text;
    const result = JSON.parse(jsonString);

    if (result.boq && Array.isArray(result.boq)) {
      return result.boq as BoqItem[];
    } else {
      console.error("Generated JSON is not in the expected format:", result);
      throw new Error("Failed to generate a valid Bill of Quantities. The format was incorrect.");
    }
  } catch (error) {
    console.error("Error generating BOQ from Gemini:", error);
    // Add more specific error handling if possible
    if (error instanceof Error) {
        throw new Error(`An error occurred while communicating with the AI model: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the BOQ.");
  }
};
