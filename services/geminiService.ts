// IMPORTANT: In a production environment, all API calls should be made from a secure backend.
// This service now calls our own serverless API endpoints, which then securely call the Gemini API.

import type { Room, ClientDetails } from '../types';

async function handleApiResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'An unknown API error occurred.' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data.rooms;
}

export const generateBoqFromRequirements = async (requirements: string, clientDetails: ClientDetails): Promise<Room[]> => {
  const response = await fetch('/api/generate-boq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requirements, clientDetails }),
  });
  return handleApiResponse(response);
};

export const refineBoq = async (existingRooms: Room[], refinementPrompt: string): Promise<Room[]> => {
    const response = await fetch('/api/refine-boq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ existingRooms, refinementPrompt }),
    });
    return handleApiResponse(response);
};
