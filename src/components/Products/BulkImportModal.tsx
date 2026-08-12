import React, { useState } from 'react';
import { FaIcon } from '../shared/FaIcon';
import { useToast } from '../../hooks/useToast';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: { name: string; price: number }[]) => Promise<void>;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [importType, setImportType] = useState<'csv' | 'json'>('json');
  const [jsonText, setJsonText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  if (!isOpen) return null;

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      parseAndImportCsv(text);
    };
    reader.readAsText(file);
  };

  const parseAndImportCsv = async (csvText: string) => {
    try {
      setIsSubmitting(true);
      const lines = csvText.split('\n').map(line => line.trim()).filter(Boolean);
      if (lines.length < 2) {
        toast.error('CSV must have a header row and at least one product.');
        setIsSubmitting(false);
        return;
      }

      // Read headers: name, price
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      const nameIndex = headers.indexOf('name');
      const priceIndex = headers.indexOf('price');

      if (nameIndex === -1 || priceIndex === -1) {
        toast.error('CSV headers must include "name" and "price".');
        setIsSubmitting(false);
        return;
      }

      const parsedItems: { name: string; price: number }[] = [];
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',').map(c => c.trim());
        const name = columns[nameIndex];
        const priceVal = parseFloat(columns[priceIndex]);

        if (!name) continue;
        if (isNaN(priceVal) || priceVal <= 0) {
          toast.error(`Invalid price on row ${i + 1}`);
          setIsSubmitting(false);
          return;
        }

        parsedItems.push({ name, price: priceVal });
      }

      if (parsedItems.length === 0) {
        toast.error('No products found to import.');
        setIsSubmitting(false);
        return;
      }

      await onImport(parsedItems);
      toast.success(`Successfully imported ${parsedItems.length} products.`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to parse CSV file.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJsonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonText.trim()) {
      toast.error('Please paste JSON data.');
      return;
    }

    try {
      setIsSubmitting(true);
      const parsed = JSON.parse(jsonText.trim());

      if (!Array.isArray(parsed)) {
        toast.error('JSON must be an array of products.');
        setIsSubmitting(false);
        return;
      }

      const validatedItems: { name: string; price: number }[] = [];
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (!item.name || typeof item.name !== 'string') {
          toast.error(`Product at index ${i} is missing a valid "name".`);
          setIsSubmitting(false);
          return;
        }
        const priceVal = Number(item.price);
        if (isNaN(priceVal) || priceVal <= 0) {
          toast.error(`Product "${item.name}" has an invalid price.`);
          setIsSubmitting(false);
          return;
        }
        validatedItems.push({ name: item.name.trim(), price: priceVal });
      }

      await onImport(validatedItems);
      toast.success(`Successfully imported ${validatedItems.length} products.`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Invalid JSON structure.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex justify-between items-center bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
          <div>
            <h2 className="text-xl font-bold">📤 Bulk Import Products</h2>
            <p className="text-xs text-blue-100 mt-1">Import multiple items instantly</p>
          </div>
          <button 
            onClick={onClose}
            className="hover:bg-white/20 p-1.5 rounded-full transition-colors text-white"
          >
            <FaIcon icon="fa-solid fa-xmark" size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Selector tabs */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setImportType('json')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                importType === 'json' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Paste JSON
            </button>
            <button
              onClick={() => setImportType('csv')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                importType === 'csv' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Upload CSV
            </button>
          </div>

          {/* JSON Text Area */}
          {importType === 'json' ? (
            <form onSubmit={handleJsonSubmit} className="space-y-4">
              <div className="bg-blue-50 text-blue-800 p-3.5 rounded-xl text-xs flex items-start space-x-2">
                <FaIcon icon="fa-solid fa-circle-info" size={16} className="mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold">Format Required:</span> An array of objects.
                  <pre className="mt-1 bg-white/50 p-2 rounded text-[10px] font-mono select-all">
{`[
  { "name": "T-Shirt", "price": 450 },
  { "name": "Coffee Mug", "price": 299 }
]`}
                  </pre>
                </div>
              </div>

              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder="Paste JSON array here..."
                rows={8}
                className="w-full p-3 border border-gray-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all"
              />

              <div className="flex space-x-3">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-1 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <FaIcon icon="fa-solid fa-spinner" size={18} className="animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <span>Import JSON</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* CSV Upload Zone */
            <div className="space-y-4">
              <div className="bg-blue-50 text-blue-800 p-3.5 rounded-xl text-xs flex items-start space-x-2">
                <FaIcon icon="fa-solid fa-circle-info" size={16} className="mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold">Format Required:</span> First line must be `name, price`. Following lines are data.
                  <pre className="mt-1 bg-white/50 p-2 rounded text-[10px] font-mono select-all">
{`name,price
T-Shirt,450
Coffee Mug,299`}
                  </pre>
                </div>
              </div>

              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-10 cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all text-center">
                <FaIcon icon="fa-solid fa-upload" size={40} className="text-gray-400 mb-2" />
                <span className="text-sm font-semibold text-gray-700">Click to upload CSV file</span>
                <span className="text-xs text-gray-400 mt-1">Accepts standard .csv UTF-8 text files</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="hidden"
                  disabled={isSubmitting}
                />
              </label>

              <button type="button" onClick={onClose} className="btn-secondary w-full py-2.5">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
