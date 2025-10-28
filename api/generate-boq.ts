import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

// IMPORTANT: Set the GEMINI_API_KEY environment variable in your Vercel project settings.
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey });
const model = 'gemini-2.5-pro';

// Re-define schemas on the server-side
const boqItemSchema = {
  type: Type.OBJECT,
  properties: {
    category: { type: Type.STRING },
    itemName: { type: Type.STRING },
    brand: { type: Type.STRING },
    modelNumber: { type: Type.STRING },
    description: { type: Type.STRING },
    quantity: { type: Type.INTEGER },
    unitPrice: { type: Type.NUMBER },
    imageUrl: { type: Type.STRING },
    notes: { type: Type.STRING },
  },
  required: ['category', 'itemName', 'brand', 'modelNumber', 'description', 'quantity', 'unitPrice', 'notes', 'imageUrl'],
};

const roomSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    requirements: { type: Type.STRING },
    boq: { type: Type.ARRAY, items: boqItemSchema },
  },
  required: ['name', 'requirements', 'boq'],
};

const responseSchema = {
  type: Type.OBJECT,
  properties: { rooms: { type: Type.ARRAY, items: roomSchema } },
  required: ['rooms'],
};

// The same powerful system instruction
const systemInstruction = `You are an expert, AVIXA CTS-D certified AV Design Engineer. Your task is to generate a detailed, logically sound, and complete Bill of Quantities (BOQ) based on user-provided requirements. You must adhere to AVIXA standards.

**CRITICAL RULES:**
1.  **Product Selection:** You MUST select specific, real-world, commercially available products from reputable AV brands (Crestron, QSC, Shure, Biamp, Panasonic, Christie, Barco, Poly, Bose, etc.). Provide exact **brand** and **modelNumber**.
2.  **Logical System Design:** The system MUST be complete and functional.
    *   **Audio:** For large rooms like auditoriums, specify a front-of-house (FOH) point-source or line array system for primary audio, not just ceiling speakers. Include subwoofers if music/video playback is required.
    *   **Control:** If the system is complex (video conferencing, multiple sources), you MUST specify a touch panel (e.g., Crestron TSW-1070). A simple keypad is inadequate. If the user asks for a keypad, override it and explain why in the 'notes'.
    *   **Completeness:** Include ALL necessary auxiliary items: correctly sized racks (e.g., 42U for complex systems), power management (PDU, sequencer), mounts, rack shelves, bulk cabling, and connectors.
3.  **Pricing:** Provide realistic, estimated retail prices in USD for budgeting.
4.  **Image URL:** Find a stable, public URL for an image of the product, prioritizing manufacturer or major retailer websites.
5.  **Justify Choices:** Use the 'notes' field to explain key design decisions, especially when correcting a user's request (e.g., "Note: A touch panel is required for this level of control as per AVIXA best practices.").
6.  **Budget Constraint:** If a budget is provided, make product selections to meet it. Justify cost-saving choices in the 'notes' field (e.g., "Note: Selected a more budget-friendly projector to align with the provided budget.").
7.  **JSON Output:** Format the entire output as a single JSON object that strictly adheres to the provided schema. Do not include any text, explanations, or markdown formatting outside of the JSON structure.
`;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { requirements, clientDetails } = req.body;

  if (!requirements || !clientDetails) {
    return res.status(400).json({ error: 'Missing requirements or clientDetails in request body' });
  }

  let userPrompt = `Client Requirements:\n${requirements}`;
  if (clientDetails.budget) {
    userPrompt += `\n\nThe client has an approximate budget of $${clientDetails.budget} for this room/project. Please select equipment that aligns with this budget.`;
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

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);
    
    if (parsedJson && parsedJson.rooms) {
        const roomsWithIds = parsedJson.rooms.map((room: any) => ({
            ...room,
            id: `room-${Date.now()}-${Math.random()}`
        }));
        res.status(200).json({ rooms: roomsWithIds });
    } else {
        throw new Error('Invalid JSON structure received from AI.');
    }
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: 'Failed to generate Bill of Quantities from the AI model.' });
  }
}
