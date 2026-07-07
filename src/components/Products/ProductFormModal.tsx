import React, { useState, useEffect } from 'react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex justify-between items-center bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
          <h2 className="text-xl font-bold">
            {product ? '🧶 Edit Product' : '🧶 Add Product'}
          </h2>
          <button 
            onClick={onClose}
            className="hover:bg-white/20 p-1.5 rounded-full transition-colors"
          >
            <FaIcon icon="fa-solid fa-xmark" size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Product Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Handmade Crochet Coaster"
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
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-green-500 hover:bg-green-50/50 transition-all w-32 h-32 text-center group">
                <FaIcon icon="fa-solid fa-upload" size={24} className="text-gray-400 group-hover:text-green-600 transition-colors mb-1" />
                <span className="text-xs text-gray-500 font-medium group-hover:text-green-600 transition-colors">
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

          {/* Actions */}
          <div className="flex space-x-3 pt-3">
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
    </div>
  );
};
