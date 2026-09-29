import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaIcon } from '../shared/FaIcon';
import { Product } from '../../types';
import { useToast } from '../../hooks/useToast';
import { Select } from '../ui/Select';
import { UNITS } from '../../utils/tax';
import { tracksStock } from '../../utils/stock';
import type { StockInput } from '../../services/db';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, price: number, file: File | null, hsn: string, unit: string, stock?: StockInput) => Promise<void>;
  product?: Product | null;
  showStock?: boolean; // Stock feature: track stock + low-stock alert fields
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  product,
  showStock = false,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [hsn, setHsn] = useState('');
  const [unit, setUnit] = useState('PCS');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackStock, setTrackStock] = useState(false);
  const [stock, setStock] = useState('');
  const [lowStock, setLowStock] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (product) {
      setName(product.name);
      setPrice(product.price.toString());
      setHsn(product.hsn || '');
      setUnit(product.unit || 'PCS');
      setImagePreview(product.imageUrl || '');
      setImageFile(null);
      setTrackStock(tracksStock(product));
      setStock(tracksStock(product) ? String(product.stock) : '');
      setLowStock(tracksStock(product) ? String(product.lowStock ?? 0) : '');
    } else {
      setTrackStock(false);
      setStock('');
      setLowStock('');
      setName('');
      setPrice('');
      setHsn('');
      setUnit('PCS');
      setImagePreview('');
      setImageFile(null);
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Product name is required');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    const stockInput: StockInput | undefined = showStock
      ? trackStock
        ? { stock: parseFloat(stock) || 0, lowStock: Math.max(0, parseFloat(lowStock) || 0) }
        : { stock: null, lowStock: null }
      : undefined;

    try {
      setIsSubmitting(true);
      await onSubmit(name.trim(), numPrice, imageFile, hsn.trim(), unit, stockInput);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4">
      <div className="flex flex-col bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="shrink-0 flex justify-between items-center bg-slate-50 border-b border-slate-200 p-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {product ? 'Edit Product' : 'Add Product'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Save product details and image</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors"
          >
            <FaIcon icon="fa-solid fa-xmark" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Product Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wireless Mouse"
              className="input-field"
              required
            />
          </div>

          <div className="grid grid-cols-[1fr_9rem] gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Unit</label>
              <Select aria-label="Unit" options={UNITS} value={unit} onChange={setUnit} className="py-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              HSN / SAC Code <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={hsn}
              onChange={(e) => setHsn(e.target.value.replace(/[^0-9A-Za-z]/g, '').slice(0, 8))}
              placeholder="e.g. 3814"
              className="input-field font-mono"
            />
            <p className="mt-1 text-xs text-slate-400">Prefilled on invoice lines when this product is picked. Leave blank if not applicable.</p>
          </div>

          {showStock && (
            <div className="rounded-lg border border-slate-200 p-3 space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={trackStock}
                  onChange={(e) => setTrackStock(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 accent-brand-600"
                />
                Track stock for this product
              </label>
              {trackStock && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="pf-stock" className="block text-xs font-semibold text-slate-600 mb-1">Current Stock</label>
                    <input id="pf-stock" type="number" step="any" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" className="input-field" />
                  </div>
                  <div>
                    <label htmlFor="pf-low" className="block text-xs font-semibold text-slate-600 mb-1">Low Stock Alert At</label>
                    <input id="pf-low" type="number" min="0" step="any" value={lowStock} onChange={(e) => setLowStock(e.target.value)} placeholder="0" className="input-field" />
                  </div>
                  <p className="col-span-2 text-xs text-slate-400">Invoices reduce stock automatically; cancelling or deleting an invoice puts it back.</p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Product Image
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-4 cursor-pointer hover:border-brand-500 hover:bg-brand-50/50 transition-all w-32 h-32 text-center group">
                <FaIcon icon="fa-solid fa-upload" size={24} className="text-slate-400 group-hover:text-brand-600 transition-colors mb-1" />
                <span className="text-xs text-slate-500 font-medium group-hover:text-brand-600 transition-colors">
                  Upload file
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {imagePreview ? (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-slate-200">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setImageFile(null);
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition-colors"
                  >
                    <FaIcon icon="fa-solid fa-xmark" size={12} />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400 font-medium">
                  No preview
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary flex-1"
            >
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
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Product</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
