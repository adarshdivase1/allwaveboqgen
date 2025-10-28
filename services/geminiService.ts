
import { GoogleGenAI, Type } from "@google/genai";
import type { Room, ClientDetails } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

// Fix: Initialize GoogleGenAI with a named apiKey parameter.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
// Fix: Use a model that is suitable for complex JSON generation as per guidelines.
const model = 'gemini-2.5-pro';

// Define the JSON schema for a single Bill of Quantities item
const boqItemSchema = {
  type: Type.OBJECT,
  properties: {
    category: { type: Type.STRING, description: 'A high-level category for the item (e.g., Display, Audio, Control, Cable, Rack & Power).' },
    itemName: { type: Type.STRING, description: 'A descriptive name for the item.' },
    brand: { type: Type.STRING, description: 'The manufacturer of the item (e.g., Crestron, Shure, Samsung, Extron).' },
    modelNumber: { type: Type.STRING, description: 'The specific model number of the item.' },
    description: { type: Type.STRING, description: 'A detailed description of the item and its purpose in the system.' },
    quantity: { type: Type.INTEGER, description: 'The number of units required.' },
    unitPrice: { type: Type.NUMBER, description: 'The estimated price per unit in United States Dollars (USD).' },
    imageUrl: { type: Type.STRING, description: 'A URL to a representative image of the item. Can be an empty string if not available.' },
    notes: { type: Type.STRING, description: 'Any additional notes or considerations for this item. Can be an empty string.' },
  },
  required: ['category', 'itemName', 'brand', 'modelNumber', 'description', 'quantity', 'unitPrice']
};

// Define the JSON schema for a single Room, which contains a BOQ
const roomSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, description: 'A unique identifier for the room, can be a short name like "boardroom-1".' },
    name: { type: Type.STRING, description: 'The name of the room, e.g., "Main Boardroom".' },
    requirements: { type: Type.STRING, description: 'A summary of the requirements provided for this room.' },
    boq: {
      type: Type.ARRAY,
      description: 'The list of Bill of Quantities items for this room.',
      items: boqItemSchema
    }
  },
  required: ['id', 'name', 'requirements', 'boq']
};

// Define the overall response schema, which is an array of rooms
const responseSchema = {
  type: Type.ARRAY,
  items: roomSchema
};

const generationConfig = {
    responseMimeType: "application/json",
    responseSchema: responseSchema,
};

const systemInstruction = `You are an expert AV (Audio-Visual) system designer. Your task is to generate or refine a detailed Bill of Quantities (BOQ).
The output must be a JSON array of Room objects. Each room should have a detailed BOQ list.
For each item in the BOQ, provide a category, brand, model number, description, quantity, estimated unit price in USD, an image URL if possible, and any relevant notes.
Use professional-grade, commonly available AV equipment. Prioritize creating a complete, functional system.
If the requirements describe multiple rooms, create a separate Room object for each. If it's one room, the array will contain one object.
Ensure prices are realistic market estimates in USD.`;


export const generateBoqFromRequirements = async (requirements: string, clientDetails: ClientDetails): Promise<Room[]> => {
  const prompt = `
    Generate a Bill of Quantities based on the following information.

    Client & Project Details for context:
    - Project Name: ${clientDetails.projectName || 'N/A'}
    - Client Name: ${clientDetails.clientName || 'N/A'}
    - Location: ${clientDetails.location || 'N/A'}
    - Target Budget: ${clientDetails.budget ? `$${clientDetails.budget}` : 'Not specified'}
    - Key Comments: ${clientDetails.keyComments || 'N/A'}

    User Requirements:
    ---
    ${requirements}
    ---

    Generate the BOQ now.
  `;

  try {
    // Fix: Use ai.models.generateContent to call the Gemini API as per guidelines.
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            ...generationConfig,
            systemInstruction,
        },
    });

    // Fix: Extract text response directly from response.text property.
    const jsonText = response.text.trim();
    const generatedRooms = JSON.parse(jsonText) as Room[];
    return generatedRooms;

  } catch (error) {
    console.error("Error generating BOQ:", error);
    throw new Error("Failed to generate BOQ. The model may have returned an invalid response. Please try again.");
  }
};


export const refineBoq = async (rooms: Room[], refinementPrompt: string): Promise<Room[]> => {
    const prompt = `
        Refine the existing Bill of Quantities (BOQ) based on the user's request below.

        User's refinement request:
        ---
        ${refinementPrompt}
        ---

        Current BOQ in JSON format:
        ---
        ${JSON.stringify(rooms, null, 2)}
        ---

        Please apply the requested changes and return the complete, updated BOQ.
        The output must be a valid JSON array of Room objects, strictly adhering to the provided schema.
        Do not omit any fields. If you change a brand or model, update the price, description, and other relevant fields accordingly.
        Ensure the final BOQ represents a complete and functional system.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                ...generationConfig,
                systemInstruction,
            },
        });

        const jsonText = response.text.trim();
        const refinedRooms = JSON.parse(jsonText) as Room[];
        return refinedRooms;

    } catch (error) {
        console.error("Error refining BOQ:", error);
        throw new Error("Failed to refine BOQ. The model may have returned an invalid response. Please try again with a clearer prompt.");
    }
};
