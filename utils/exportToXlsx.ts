
import * as XLSX from 'xlsx';
import type { BoqItem, ClientDetails, Room } from '../types';
import { formatCurrency } from './currency';

export const exportToXlsx = (
    activeRoom: Room,
    clientDetails: ClientDetails,
    currency: 'USD' | 'EUR' | 'GBP' | 'INR',
    exchangeRate: number
) => {
    // 1. Prepare data
    const boqData = activeRoom.boq.map(item => ({
        'Category': item.category,
        'Item Code / Model': item.item_code,
        'Description': item.description,
        'Qty': item.quantity,
        'Unit Price': item.unit_price * exchangeRate,
        'Total Price': item.total_price * exchangeRate,
        'Notes': item.notes || '',
    }));

    const total = boqData.reduce((sum, item) => sum + item['Total Price'], 0);
    const formattedTotal = formatCurrency(total, currency);

    // 2. Create worksheet
    const ws = XLSX.utils.json_to_sheet([]);
    
    // 3. Add headers and client details
    XLSX.utils.sheet_add_aoa(ws, [['Project Name:', clientDetails.projectName]], { origin: 'A1' });
    XLSX.utils.sheet_add_aoa(ws, [['Client Name:', clientDetails.clientName]], { origin: 'A2' });
    XLSX.utils.sheet_add_aoa(ws, [['Prepared By:', clientDetails.preparedBy]], { origin: 'A3' });
    XLSX.utils.sheet_add_aoa(ws, [['Date:', clientDetails.date]], { origin: 'A4' });
    XLSX.utils.sheet_add_aoa(ws, [[`${activeRoom.name} - Bill of Quantities`]], { origin: 'A6' });

    // 4. Add BOQ data
    XLSX.utils.sheet_add_json(ws, boqData, { origin: 'A8', skipHeader: false });

    // 5. Add total
    const totalRow = boqData.length + 9;
    XLSX.utils.sheet_add_aoa(ws, [['', '', '', '', 'Grand Total:', formattedTotal]], { origin: `A${totalRow}` });

    // 6. Set column widths
    ws['!cols'] = [
        { wch: 20 }, // Category
        { wch: 25 }, // Item Code
        { wch: 50 }, // Description
        { wch: 5 },  // Qty
        { wch: 15 }, // Unit Price
        { wch: 15 }, // Total Price
        { wch: 30 }, // Notes
    ];

    // 7. Create workbook and download
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeRoom.name);

    XLSX.writeFile(wb, `${clientDetails.projectName} - ${activeRoom.name} BOQ.xlsx`);
};
