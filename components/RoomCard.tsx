
import React, { useState, useEffect } from 'react';
import type { Room, BoqItem, Currency } from '../types';
import ImageIcon from './icons/ImageIcon';

interface RoomCardProps {
  room: Room;
  onBoqUpdate: (updatedRoom: Room) => void;
  isLoading: boolean;
  currency: Currency;
  exchangeRate: number;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onBoqUpdate, isLoading, currency, exchangeRate }) => {
  const [editableBoq, setEditableBoq] = useState<BoqItem[]>(room.boq);

  useEffect(() => {
    setEditableBoq(room.boq);
  }, [room.boq]);

  const handleItemChange = (index: number, field: keyof BoqItem, value: string | number) => {
    const newBoq = [...editableBoq];
    const item = { ...newBoq[index] };
    
    if (field === 'quantity' || field === 'unitPrice') {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
            // For unit price, convert back to USD before storing
            item[field] = field === 'unitPrice' ? numValue / exchangeRate : numValue;
        }
    } else {
        (item[field] as string) = value as string;
    }

    newBoq[index] = item;
    setEditableBoq(newBoq);
  };
  
  const handleItemBlur = () => {
    // When focus is lost, report the change up to the parent
    onBoqUpdate({ ...room, boq: editableBoq });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency }).format(amount);
  };
  
  const roomTotal = editableBoq.reduce((total, item) => total + (item.quantity * item.unitPrice), 0) * exchangeRate;

  return (
    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
      <h3 className="text-xl font-bold text-blue-300 mb-4">{room.name}</h3>
      <p className="text-sm text-slate-400 mb-6 italic">Requirements: {room.requirements}</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
            <tr>
              <th scope="col" className="px-4 py-3">Category</th>
              <th scope="col" className="px-4 py-3">Brand</th>
              <th scope="col" className="px-4 py-3">Model</th>
              <th scope="col" className="px-4 py-3">Item Name</th>
              <th scope="col" className="px-4 py-3 text-center">Qty</th>
              <th scope="col" className="px-4 py-3 text-right">Unit Price</th>
              <th scope="col" className="px-4 py-3 text-right">Total Price</th>
              <th scope="col" className="px-4 py-3 text-center">Image</th>
            </tr>
          </thead>
          <tbody>
            {editableBoq.map((item, index) => {
              const unitPriceConverted = item.unitPrice * exchangeRate;
              const totalPriceConverted = item.quantity * unitPriceConverted;
              return (
                <tr key={`${room.id}-${item.modelNumber}-${index}`} className="border-b border-slate-700 hover:bg-slate-800">
                  <td className="px-4 py-3 font-medium">{item.category}</td>
                  <td className="px-4 py-3">{item.brand}</td>
                  <td className="px-4 py-3">{item.modelNumber}</td>
                  <td className="px-4 py-3">{item.itemName}</td>
                  <td className="px-4 py-3">
                    <input 
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        onBlur={() => handleItemBlur()}
                        disabled={isLoading}
                        className="w-16 text-center bg-slate-900 border border-slate-600 rounded-md py-1 px-2 focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                     <input 
                        type="number"
                        step="0.01"
                        value={unitPriceConverted.toFixed(2)}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        onBlur={() => handleItemBlur()}
                        disabled={isLoading}
                        className="w-28 text-right bg-slate-900 border border-slate-600 rounded-md py-1 px-2 focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(totalPriceConverted)}</td>
                  <td className="px-4 py-3 text-center">
                    {item.imageUrl ? (
                        <a href={item.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors inline-block">
                            <ImageIcon />
                        </a>
                    ) : (
                        <span className="text-slate-500">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="font-semibold text-white">
              <td colSpan={7} className="px-4 py-3 text-right text-lg">Room Total</td>
              <td className="px-4 py-3 text-right text-lg">{formatCurrency(roomTotal)}</td>
              <td className="px-4 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default RoomCard;
