import React from 'react';
import { FaIcon } from '../shared/FaIcon';
import { Product } from '../../types';

interface ProductDetailSidebarProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailSidebar: React.FC<ProductDetailSidebarProps> = ({
  product,
  onClose,
}) => {
  if (!product) return null;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div className="fixed top-0 right-0 z-50 h-full w-80 sm:w-96 bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-350 ease-out">
        {/* Header */}
        <div className="p-6 border-b border-gray-150 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
            <FaIcon icon="fa-solid fa-box" className="text-green-500" size={20} />
            <span>Product Details</span>
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-all"
          >
            <FaIcon icon="fa-solid fa-xmark" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Image */}
          <div className="w-full h-56 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <span className="text-4xl">🧶</span>
                <span className="text-xs mt-2 font-medium">No Image Uploaded</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Product Name
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-1">
                {product.name}
              </h3>
            </div>

            <div className="flex items-center space-x-3 bg-green-50 p-4 rounded-xl border border-green-100/50">
              <div className="p-2.5 bg-green-500 rounded-lg text-white">
                <FaIcon icon="fa-solid fa-indian-rupee-sign" size={20} />
              </div>
              <div>
                <span className="text-xs font-semibold text-green-700/80 uppercase">
                  Price
                </span>
                <p className="text-2xl font-black text-green-700">
                  ₹{product.price.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <FaIcon icon="fa-solid fa-calendar" className="text-gray-400" size={20} />
              <div>
                <span className="text-xs text-gray-400 font-semibold block uppercase">
                  Date Added
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {formatDate(product.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-150">
          <button
            onClick={onClose}
            className="w-full btn-secondary text-center py-2.5"
          >
            Close Panel
          </button>
        </div>
      </div>
    </>
  );
};
