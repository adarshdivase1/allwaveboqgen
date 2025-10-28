
import React, { useState, useMemo } from 'react';
import type { BoqItem, Room, Currency } from '../types';
import { formatCurrency } from '../utils/currency';
import ImageIcon from './icons/ImageIcon';
import WandIcon from './icons/WandIcon';
import DownloadIcon from './icons/DownloadIcon';

interface BoqDisplayProps {
  room: Room | undefined;
  onUpdateBoq: (updatedBoq: BoqItem[]) => void;
  onRefine: () => void;
  onExport: () => void;
  currency: Currency;
  exchangeRate: number;
  isLoading: boolean;
}

const BoqDisplay: React.FC<BoqDisplayProps> = ({ room, onUpdateBoq, onRefine, onExport, currency, exchangeRate, isLoading }) => {
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; colId: keyof BoqItem | null } | null>(null);

  const handleCellChange = (rowIndex: number, colId: keyof BoqItem, value: string | number) => {
    if (!room) return;
    const updatedBoq = room.boq.map((item, index) => {
      if (index === rowIndex) {
        // Convert back to number if the field is numeric
        const finalValue = (colId === 'quantity' || colId === 'unitPrice') ? Number(value) : value;
        return { ...item, [colId]: finalValue };
      }
      return item;
    });
    onUpdateBoq(updatedBoq);
  };
  
  const handleItemDelete = (rowIndex: number) => {
    if (!room || !window.confirm("Are you sure you want to delete this item?")) return;
    const updatedBoq = room.boq.filter((_, index) => index !== rowIndex);
    onUpdateBoq(updatedBoq);
  };
  
  const handleAddItem = () => {
    if (!room) return;
    const newItem: BoqItem = {
      category: 'New Category',
      itemName: 'New Item',
      brand: '',
      modelNumber: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      imageUrl: '',
      notes: '',
    };
    onUpdateBoq([...room.boq, newItem]);
  }

  const grandTotal = useMemo(() => {
    if (!room) return 0;
    return room.boq.reduce((sum, item) => sum + (item.quantity * item.unitPrice * exchangeRate), 0);
  }, [room, exchangeRate]);
  
  if (!room) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-800/50 p-6 rounded-lg border border-dashed border-slate-700 text-slate-400">
        <p>Select a room to view its Bill of Quantities, or generate a new one.</p>
      </div>
    );
  }

  const renderCell = (item: BoqItem, rowIndex: number, colId: keyof BoqItem) => {
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.colId === colId;
    const value = item[colId];

    if (isEditing) {
      return (
        <input
          type={typeof value === 'number' ? 'number' : 'text'}
          value={String(value)}
          onChange={(e) => handleCellChange(rowIndex, colId, e.target.value)}
          onBlur={() => setEditingCell(null)}
          autoFocus
          className="w-full bg-slate-900 text-white rounded p-1 border border-blue-500"
        />
      );
    }
    
    if (colId === 'unitPrice') {
        return formatCurrency(Number(value) * exchangeRate, currency);
    }

    return (
      <span onDoubleClick={() => setEditingCell({ rowIndex, colId })} className="block w-full h-full p-2">
        {String(value)}
      </span>
    );
  };

  const tableHeaders: { id: keyof BoqItem; label: string; }[] = [
    { id: 'category', label: 'Category' },
    { id: 'brand', label: 'Brand' },
    { id: 'modelNumber', label: 'Model' },
    { id: 'itemName', label: 'Item Name' },
    { id: 'description', label: 'Description' },
    { id: 'quantity', label: 'Qty' },
    { id: 'unitPrice', label: `Unit Price` },
    { id: 'notes', label: 'Notes' },
  ];

  return (
    <div className="bg-slate-800/50 p-2 sm:p-4 rounded-lg border border-slate-700 h-full flex flex-col">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 px-2">
        <h2 className="text-2xl font-bold text-white mb-2 sm:mb-0">BOQ for: <span className="text-blue-400">{room.name}</span></h2>
        <div className="flex items-center space-x-2">
          <button onClick={onRefine} disabled={isLoading} className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-500">
            <WandIcon /> Refine with AI
          </button>
          <button onClick={onExport} disabled={isLoading || room.boq.length === 0} className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-slate-500">
            <DownloadIcon /> Export
          </button>
        </div>
      </div>
      <div className="flex-grow overflow-auto">
        <table className="min-w-full divide-y divide-slate-700 text-sm">
          <thead className="bg-slate-900/70 sticky top-0">
            <tr>
              {tableHeaders.map(header => (
                <th key={header.id} scope="col" className="px-3 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  {header.label}
                </th>
              ))}
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Total
              </th>
               <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-slate-800 divide-y divide-slate-700">
            {room.boq.map((item, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-700/50">
                {tableHeaders.map(header => (
                  <td key={header.id} className="px-1 py-1 whitespace-normal text-slate-300 align-top">
                    {renderCell(item, rowIndex, header.id)}
                  </td>
                ))}
                <td className="px-3 py-2 whitespace-nowrap text-slate-300 align-top">
                    {formatCurrency(item.quantity * item.unitPrice * exchangeRate, currency)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-400 align-top text-center">
                    {item.imageUrl && (
                        <a href={item.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-block p-1 hover:text-blue-400" title="View reference image">
                            <ImageIcon />
                        </a>
                    )}
                    <button onClick={() => handleItemDelete(rowIndex)} className="inline-block p-1 hover:text-red-500" title="Delete item">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700 px-2">
         <button onClick={handleAddItem} disabled={isLoading} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700">
            Add Item
          </button>
          <div className="text-right">
            <p className="text-slate-400 text-sm">Grand Total</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(grandTotal, currency)}</p>
          </div>
      </div>
    </div>
  );
};

export default BoqDisplay;
