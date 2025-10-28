
import React, { useState } from 'react';
import type { Room, BoqItem, ClientDetails, Currency } from '../types';
import { exportToXlsx } from '../utils/exportToXlsx';
import DownloadIcon from './icons/DownloadIcon';
import WandIcon from './icons/WandIcon';
import RoomCard from './RoomCard';
import RefineModal from './RefineModal';

interface BoqDisplayProps {
  rooms: Room[];
  clientDetails: ClientDetails;
  onBoqUpdate: (updatedRooms: Room[]) => void;
  onRefine: (refinementPrompt: string) => Promise<void>;
  isLoading: boolean;
  currency: Currency;
  exchangeRate: number;
}

const BoqDisplay: React.FC<BoqDisplayProps> = ({ rooms, clientDetails, onBoqUpdate, onRefine, isLoading, currency, exchangeRate }) => {
  const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);

  const handleBoqChange = (roomId: string, updatedBoq: BoqItem[]) => {
    const updatedRooms = rooms.map(room => 
      room.id === roomId ? { ...room, boq: updatedBoq } : room
    );
    onBoqUpdate(updatedRooms);
  };
  
  const handleRefineSubmit = async (prompt: string) => {
    await onRefine(prompt);
    setIsRefineModalOpen(false); // Close modal after submission
  }

  const grandTotal = rooms.reduce((total, room) => {
    const roomTotal = room.boq.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    return total + roomTotal;
  }, 0) * exchangeRate;

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold text-white">Generated Bill of Quantities</h2>
          <p className="text-slate-400">Review, edit, and export the generated BOQ.</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right">
                <p className="text-sm text-slate-400">Grand Total</p>
                <p className="text-2xl font-bold text-green-400">{currencyFormatter.format(grandTotal)}</p>
            </div>
          <button
            onClick={() => setIsRefineModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 disabled:bg-slate-500"
          >
            <WandIcon /> Refine with AI
          </button>
          <button
            onClick={() => exportToXlsx(rooms, clientDetails, currency, exchangeRate)}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-green-500"
          >
            <DownloadIcon /> Export to XLSX
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {rooms.map(room => (
          <RoomCard
            key={room.id}
            room={room}
            onBoqChange={handleBoqChange}
            currency={currency}
            exchangeRate={exchangeRate}
          />
        ))}
      </div>

      <RefineModal
        isOpen={isRefineModalOpen}
        onClose={() => setIsRefineModalOpen(false)}
        onSubmit={handleRefineSubmit}
        isLoading={isLoading}
      />
    </div>
  );
};

export default BoqDisplay;
