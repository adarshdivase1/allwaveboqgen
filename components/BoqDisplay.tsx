
import React, { useState, useEffect } from 'react';
import type { BoqItem, Room, ClientDetails, Currency } from '../types';
import { formatCurrency, fetchExchangeRates } from '../utils/currency';
import { exportToXlsx } from '../utils/exportToXlsx';
import CurrencySelector from './CurrencySelector';
import DownloadIcon from './icons/DownloadIcon';
import ImageIcon from './icons/ImageIcon';

interface BoqDisplayProps {
  activeRoom: Room | null;
  clientDetails: ClientDetails;
}

const BoqDisplay: React.FC<BoqDisplayProps> = ({ activeRoom, clientDetails }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
  const [exchangeRates, setExchangeRates] = useState<Record<Currency, number> | null>(null);

  useEffect(() => {
    const getRates = async () => {
      const rates = await fetchExchangeRates();
      setExchangeRates(rates);
    };
    getRates();
  }, []);

  if (!activeRoom || !activeRoom.boq.length) {
    return (
      <div className="text-center py-20 bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-700">
        <ImageIcon />
        <h3 className="mt-2 text-lg font-medium text-white">No Bill of Quantities Generated</h3>
        <p className="mt-1 text-sm text-slate-400">Complete the requirements for a room to generate a BOQ.</p>
      </div>
    );
  }

  const exchangeRate = exchangeRates ? exchangeRates[selectedCurrency] : 1;
  const total = activeRoom.boq.reduce((sum, item) => sum + item.total_price, 0);
  const convertedTotal = total * exchangeRate;

  const handleExport = () => {
    if (activeRoom && clientDetails.projectName) {
      exportToXlsx(activeRoom, clientDetails, selectedCurrency, exchangeRate);
    } else {
      alert("Please provide a Project Name before exporting.");
    }
  };

  return (
    <div className="bg-slate-800/50 p-4 sm:p-6 rounded-lg border border-slate-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold text-white">
          Bill of Quantities for: <span className="text-blue-400">{activeRoom.name}</span>
        </h2>
        <div className="flex items-center gap-4">
          <CurrencySelector
            selectedCurrency={selectedCurrency}
            onCurrencyChange={setSelectedCurrency}
            disabled={!exchangeRates}
          />
          <button
            onClick={handleExport}
            disabled={!clientDetails.projectName}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-green-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
            title={!clientDetails.projectName ? "Enter a Project Name to enable export" : "Export to XLSX"}
          >
            <DownloadIcon />
            Export
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-900/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Category</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Item Code</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Description</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Qty</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Unit Price</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Total Price</th>
            </tr>
          </thead>
          <tbody className="bg-slate-800 divide-y divide-slate-700">
            {activeRoom.boq.map((item, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{item.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-400">{item.item_code}</td>
                <td className="px-6 py-4 text-sm text-slate-200">{item.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-200">{item.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-200">{formatCurrency(item.unit_price * exchangeRate, selectedCurrency)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-white">{formatCurrency(item.total_price * exchangeRate, selectedCurrency)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-900/50">
            <tr>
              <td colSpan={5} className="px-6 py-3 text-right text-md font-bold text-white uppercase">Grand Total</td>
              <td className="px-6 py-3 text-right text-md font-bold text-white">{formatCurrency(convertedTotal, selectedCurrency)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default BoqDisplay;
