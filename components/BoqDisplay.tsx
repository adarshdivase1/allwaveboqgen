
import React, { useState } from 'react';
import type { Room, ClientDetails, Currency } from '../types';
import RoomCard from './RoomCard';
import RefineModal from './RefineModal';
import { exportToXlsx } from '../utils/exportToXlsx';
import DownloadIcon from './icons/DownloadIcon';
import WandIcon from './icons/WandIcon';
import LoaderIcon from './icons/LoaderIcon';

interface BoqDisplayProps {
  rooms: Room[];
  clientDetails: ClientDetails;
  onBoqUpdate: (updatedRooms: Room[]) => void;
  onRefine: (refinementPrompt: string) => void;
  isLoading: boolean;
  currency: Currency;
  exchangeRate: number;
}

const BoqDisplay: React.FC<BoqDisplayProps> = ({
  rooms,
  clientDetails,
  onBoqUpdate,
  onRefine,
  isLoading,
  currency,
  exchangeRate
}) => {
  const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);

  const handleRoomUpdate = (updatedRoom: Room) => {
    const updatedRooms = rooms.map(room => room.id === updatedRoom.id ? updatedRoom : room);
    onBoqUpdate(updatedRooms);
  };
  
  const handleRefineSubmit = (prompt: string) => {
    onRefine(prompt);
    setIsRefineModalOpen(false);
  };

  const grandTotal = rooms.reduce((total, room) => {
    const roomTotal = room.boq.reduce((roomSum, item) => roomSum + (item.quantity * item.unitPrice), 0);
    return total + roomTotal;
  }, 0) * exchangeRate;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
        <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
          <h2 className="text-2xl font-bold text-white">Generated Bill of Quantities</h2>
          <div className="flex space-x-3">
              <button
                onClick={() => setIsRefineModalOpen(true)}
                disabled={isLoading}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 disabled:bg-slate-500 disabled:cursor-not-allowed"
              >
                {isLoading ? <><LoaderIcon />Refining...</> : <><WandIcon />Refine with AI</>}
              </button>
              <button
                onClick={() => exportToXlsx(rooms, clientDetails, currency, exchangeRate)}
                disabled={isLoading || rooms.length === 0}
                className="inline-flex items-center justify-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-300 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 disabled:opacity-50"
              >
                <DownloadIcon />
                Export to Excel
              </button>
          </div>
        </div>
        
        <div className="space-y-8">
            {rooms.map(room => (
              <RoomCard 
                key={room.id}
                room={room}
                onBoqUpdate={handleRoomUpdate}
                isLoading={isLoading}
                currency={currency}
                exchangeRate={exchangeRate}
              />
            ))}
        </div>

        <div className="mt-8 pt-4 border-t border-slate-700 flex justify-end">
            <div className="text-right">
                <p className="text-slate-400 text-lg">Project Grand Total</p>
                <p className="text-white text-3xl font-bold">{formatCurrency(grandTotal)}</p>
            </div>
        </div>
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
