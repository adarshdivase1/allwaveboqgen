
import { GoogleGenAI, Type } from '@google/genai';
import type { BoqItem, ClientDetails, Room } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
// Fix: Use a recommended model for complex JSON generation
const model = 'gemini-2.5-pro';

const boqItemSchema = {
  type: Type.OBJECT,
  properties: {
    category: { type: Type.STRING, description: 'e.g., Display, Audio, Control, Cable' },
    itemName: { type: Type.STRING, description: 'Specific name of the item.' },
    brand: { type: Type.STRING, description: 'Manufacturer of the item.' },
    modelNumber: { type: Type.STRING, description: 'Model number of the item.' },
    description: { type: Type.STRING, description: 'Brief technical description of the item.' },
    quantity: { type: Type.INTEGER, description: 'Number of units required.' },
    unitPrice: { type: Type.NUMBER, description: 'Estimated price per unit in USD.' },
    imageUrl: { type: Type.STRING, description: 'A placeholder URL for an image of the product. Should be an empty string.' },
    notes: { type: Type.STRING, description: 'Any specific notes about this item for the installation.' },
  },
  required: ['category', 'itemName', 'brand', 'modelNumber', 'description', 'quantity', 'unitPrice'],
};

const roomSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'A descriptive name for the room, e.g., "Main Boardroom" or "Huddle Space 1".' },
    requirements: { type: Type.STRING, description: 'A summary of the user requirements for this room.' },
    boq: {
      type: Type.ARRAY,
      items: boqItemSchema,
    },
  },
  required: ['name', 'requirements', 'boq'],
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    rooms: {
      type: Type.ARRAY,
      description: 'An array of room objects, each containing a Bill of Quantities.',
      items: roomSchema,
    },
  },
  required: ['rooms'],
};

const systemInstruction = `You are an expert Audio-Visual (AV) system designer and estimator. Your task is to generate a detailed Bill of Quantities (BOQ) based on user-provided room requirements.

Guidelines:
1.  **Analyze Requirements:** Carefully read the user's request to understand the room's purpose, size, capacity, and desired functionality (e.g., video conferencing, wireless presentation, control system type).
2.  **Select Appropriate Equipment:** Choose realistic, commercially available AV equipment from well-known brands (e.g., Crestron, Extron, Shure, Biamp, Samsung, LG, Barco, Poly, Cisco). Specify exact model numbers where possible.
3.  **Structure the BOQ:**
    *   Organize items into logical categories: Display, Audio, Video Conferencing, Control, Cabling & Infrastructure, Accessories.
    *   For each item, provide all the required fields: category, brand, model number, item name, description, quantity, and an estimated unit price in USD.
    *   Include all necessary auxiliary items: mounts, cables (HDMI, USB, CAT6), faceplates, power strips, and racks. Assume standard cable lengths unless specified.
4.  **Pricing:** Provide realistic, estimated retail prices in USD. These are for budget purposes only.
5.  **JSON Output:** Format the entire output as a single JSON object that strictly adheres to the provided schema. Do not include any text, explanations, or markdown formatting outside of the JSON structure.
6.  **Multiple Rooms:** If the user describes multiple rooms, create a separate room object with its own BOQ for each one in the 'rooms' array. If only one room is described, the 'rooms' array should contain a single object.
7.  **Budget Constraint:** If a budget is provided, try to select equipment that fits within the budget while still meeting the core requirements. Add a note if the requirements cannot be met within the budget.
`;


export const generateBoqFromRequirements = async (requirements: string, clientDetails: ClientDetails): Promise<Room[]> => {
  let userPrompt = `Client Requirements:\n${requirements}`;
  if (clientDetails.budget) {
      userPrompt += `\n\nThe client has an approximate budget of $${clientDetails.budget} for this room/project. Please select equipment that aligns with this budget.`
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.2,
      },
    });

    // Fix: Correctly extract text from response
    const jsonText = response.text.trim();
    console.log("Gemini Raw Response:", jsonText);
    const parsedJson = JSON.parse(jsonText);
    
    if (parsedJson && parsedJson.rooms) {
        // Add a unique ID to each room
        return parsedJson.rooms.map((room: Omit<Room, 'id'>) => ({
            ...room,
            id: `room-${Date.now()}-${Math.random()}`
        }));
    } else {
        throw new Error('Invalid JSON structure received from AI.');
    }
  } catch (error) {
    console.error("Error generating BOQ:", error);
    if (error instanceof Error && error.message.includes('JSON')) {
        throw new Error("The AI returned a response that was not valid JSON. Please try refining your request.");
    }
    throw new Error("Failed to generate Bill of Quantities. The AI model may be temporarily unavailable.");
  }
};

export const refineBoq = async (existingRooms: Room[], refinementPrompt: string): Promise<Room[]> => {
    const prompt = `Given the existing Bill of Quantities (BOQ) below, please apply the following refinement: "${refinementPrompt}".

Existing BOQ:
${JSON.stringify(existingRooms, null, 2)}

Please return the full, updated BOQ in the exact same JSON format as the input. Only modify the items as requested in the refinement prompt. For example, if asked to change a brand, find the relevant items and update their 'brand', 'modelNumber', 'itemName', and 'unitPrice' fields accordingly. If asked to add an item, append it to the correct room's 'boq' array.
`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction, // Reuse the same system instruction
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                temperature: 0.1,
            },
        });

        // Fix: Correctly extract text from response
        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);
        
        if (parsedJson && parsedJson.rooms) {
             // Preserve original room IDs
             return parsedJson.rooms.map((newRoom: Omit<Room, 'id'>, index: number) => ({
                ...newRoom,
                id: existingRooms[index]?.id || `room-${Date.now()}-${Math.random()}`
            }));
        } else {
            throw new Error('Invalid JSON structure received from AI during refinement.');
        }
    } catch (error) {
        console.error("Error refining BOQ:", error);
        throw new Error("Failed to refine the Bill of Quantities.");
    }
};
