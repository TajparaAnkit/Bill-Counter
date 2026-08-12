import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaIcon } from '../shared/FaIcon';
import { Product } from '../../types';
import { useToast } from '../../hooks/useToast';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, price: number, file: File | null) => Promise<void>;
  product?: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  product,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (product) {
      setName(product.name);
      setPrice(product.price.toString());
      setImagePreview(product.imageUrl || '');
      setImageFile(null);
    } else {
      setName('');
      setPrice('');
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

    try {
      setIsSubmitting(true);
      await onSubmit(name.trim(), numPrice, imageFile);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="flex flex-col bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="shrink-0 flex justify-between items-center bg-gray-50 border-b border-gray-150 p-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {product ? 'Edit Product' : 'Add Product'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Save product details and image</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
          >
            <FaIcon icon="fa-solid fa-xmark" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
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
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Product Image
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all w-32 h-32 text-center group">
                <FaIcon icon="fa-solid fa-upload" size={24} className="text-gray-400 group-hover:text-blue-600 transition-colors mb-1" />
                <span className="text-xs text-gray-500 font-medium group-hover:text-blue-600 transition-colors">
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
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-150">
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
                <div className="w-32 h-32 rounded-xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-400 font-medium">
                  No preview
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 border-t border-gray-150 pt-4">
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
