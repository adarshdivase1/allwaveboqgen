
import React from 'react';
import type { Room, BoqItem, Currency } from '../types';

interface RoomCardProps {
  room: Room;
  onBoqChange: (roomId: string, updatedBoq: BoqItem[]) => void;
  currency: Currency;
  exchangeRate: number;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onBoqChange, currency, exchangeRate }) => {

  const handleItemChange = (index: number, field: keyof BoqItem, value: any) => {
    const updatedBoq = [...room.boq];
    const itemToUpdate = { ...updatedBoq[index] };
    
    // Ensure numeric fields are numbers
    if (field === 'quantity' || field === 'unitPrice') {
        const numValue = Number(value);
        // If it's unit price, we need to convert it back to USD before saving
        itemToUpdate[field] = field === 'unitPrice' ? numValue / exchangeRate : numValue;
    } else {
        itemToUpdate[field] = value;
    }

    updatedBoq[index] = itemToUpdate;
    onBoqChange(room.id, updatedBoq);
  };

  const handleDeleteItem = (index: number) => {
    const updatedBoq = room.boq.filter((_, i) => i !== index);
    onBoqChange(room.id, updatedBoq);
  };

  const roomTotal = room.boq.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * exchangeRate;

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
      <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">{room.name}</h3>
        <div className="text-lg font-semibold text-blue-400">
            Total: {currencyFormatter.format(roomTotal)}
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm text-slate-400 mb-4">
          <span className="font-semibold text-slate-300">Requirements Summary: </span>
          {room.requirements}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
              <tr>
                <th scope="col" className="px-4 py-3">Category</th>
                <th scope="col" className="px-4 py-3">Item Name</th>
                <th scope="col" className="px-4 py-3">Brand & Model</th>
                <th scope="col" className="px-4 py-3 text-center">Qty</th>
                <th scope="col" className="px-4 py-3 text-right">Unit Price</th>
                <th scope="col" className="px-4 py-3 text-right">Total Price</th>
                <th scope="col" className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {room.boq.map((item, index) => {
                  const unitPriceConverted = item.unitPrice * exchangeRate;
                  const totalPrice = item.quantity * unitPriceConverted;
                  return (
                    <tr key={`${room.id}-${index}`} className="border-b border-slate-700 hover:bg-slate-800">
                      <td className="px-4 py-2">{item.category}</td>
                      <td className="px-4 py-2 font-medium text-white">{item.itemName}</td>
                      <td className="px-4 py-2">{item.brand} {item.modelNumber}</td>
                      <td className="px-4 py-2 text-center">
                        <input 
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-16 bg-slate-900 border border-slate-600 rounded text-center py-1"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">{currencyFormatter.format(unitPriceConverted)}</td>
                      <td className="px-4 py-2 text-right font-semibold">{currencyFormatter.format(totalPrice)}</td>
                      <td className="px-4 py-2 text-center">
                        <button onClick={() => handleDeleteItem(index)} className="text-red-500 hover:text-red-400 font-medium">
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
