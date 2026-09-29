import * as XLSX from 'xlsx';
import { UNITS } from './tax';
import { BRAND_NAME } from '../config/brand';

// The downloadable "sample bulk product import" Excel (Products → Import and the Help Center).
// The first sheet is the one the importer reads, so users can fill it in and upload it as is.
// Column names must stay in step with the aliases in BulkImportModal.tsx.

export const SAMPLE_COLUMNS: { header: string; required: boolean; example: string; notes: string }[] = [
  { header: 'name', required: true, example: 'Cotton T-Shirt', notes: 'Product name as it should appear on invoices. Rows without a name are skipped.' },
  { header: 'price', required: true, example: '450', notes: 'Selling price per unit in ₹, before GST. Numbers only (450 or 450.50). Rows without a price above 0 are skipped.' },
  { header: 'unit', required: false, example: 'PCS', notes: `Unit of measure. Default PCS. Common: ${UNITS.slice(0, 10).join(', ')}.` },
  { header: 'hsn', required: false, example: '6109', notes: 'HSN / SAC code (digits). Printed on GST invoices.' },
  { header: 'gst', required: false, example: '5', notes: 'GST rate in % used when the product is added to an invoice: 0, 5, 12, 18 or 28.' },
  { header: 'stock', required: false, example: '100', notes: 'Opening stock. Fill it to track stock for this product; leave blank to not track stock.' },
  { header: 'low_stock', required: false, example: '10', notes: 'Low-stock alert level. The product shows as "low stock" at or below this number. Used only with stock.' },
  {
    header: 'image',
    required: false,
    example: 'https://example.com/tshirt.jpg',
    notes: 'Either an https:// image link, or a file name like tshirt.jpg. For file names, pick the image files in "Upload Product Images" before uploading the sheet; they are matched by file name.',
  },
];

const SAMPLE_ROWS: (string | number)[][] = [
  ['Cotton T-Shirt', 450, 'PCS', '6109', 5, 100, 10, 'https://example.com/tshirt.jpg'],
  ['Steel Water Bottle 1L', 349, 'PCS', '7323', 18, 40, 5, 'bottle.jpg'],
  ['Basmati Rice', 95, 'KGS', '1006', 5, 250, 25, ''],
  ['Wall Paint 20L', 3200, 'LTR', '3209', 18, '', '', ''],
  ['Installation Service', 500, 'NOS', '998729', 18, '', '', ''],
];

export const buildSampleWorkbook = () => {
  const wb = XLSX.utils.book_new();

  const products = XLSX.utils.aoa_to_sheet([SAMPLE_COLUMNS.map((c) => c.header), ...SAMPLE_ROWS]);
  products['!cols'] = [{ wch: 26 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 6 }, { wch: 8 }, { wch: 10 }, { wch: 34 }];
  XLSX.utils.book_append_sheet(wb, products, 'Products');

  const help = XLSX.utils.aoa_to_sheet([
    ['How to use this file'],
    ['1. Replace the sample rows in the "Products" sheet with your products (keep the first row: the column names).'],
    ['2. Only "name" and "price" are required. Leave any other cell blank if you don\'t need it.'],
    ['3. In the app: Products → Import → (optional) Upload Product Images → upload this file.'],
    ['4. Save as .xlsx, .xls or .csv. Only the first sheet is imported.'],
    [],
    ['Column', 'Required?', 'Example', 'What to enter'],
    ...SAMPLE_COLUMNS.map((c) => [c.header, c.required ? 'Required' : 'Optional', c.example, c.notes]),
  ]);
  help['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 30 }, { wch: 110 }];
  XLSX.utils.book_append_sheet(wb, help, 'Instructions');
  return wb;
};

export const SAMPLE_FILE_NAME = `${BRAND_NAME.replace(/\s+/g, '-')}-Sample-Products.xlsx`;

export const downloadSampleProducts = () => XLSX.writeFile(buildSampleWorkbook(), SAMPLE_FILE_NAME);
