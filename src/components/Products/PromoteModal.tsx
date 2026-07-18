import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaIcon } from '../shared/FaIcon';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { getBusinessProfile } from '../../services/db';
import { generatePromoImage, buildPromoCaption } from '../../utils/promoImage';
import { Product } from '../../types';

interface PromoteModalProps {
  product: Product | null;
  onClose: () => void;
}

export const PromoteModal: React.FC<PromoteModalProps> = ({ product, onClose }) => {
  const toast = useToast();
  const { user } = useAuth();

  const [shopName, setShopName] = useState('');
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [generating, setGenerating] = useState(false);
  // True only when this device can actually share the image file (basically mobile).
  const [canShareImage, setCanShareImage] = useState(false);

  // Load the seller's shop name once (for the caption + image overlay).
  useEffect(() => {
    if (!user) return;
    getBusinessProfile(user.uid)
      .then((p) => setShopName(p?.businessName || ''))
      .catch(() => setShopName(''));
  }, [user]);

  // (Re)generate the caption + promo image whenever the product or shop name changes.
  useEffect(() => {
    if (!product) return;
    setCaption(buildPromoCaption(product.name, product.price, shopName));
    setGenerating(true);
    setImageUrl(null);
    generatePromoImage({
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      shopName,
    })
      .then(({ dataUrl, blob }) => {
        setImageUrl(dataUrl);
        setImageBlob(blob);
        // Can this device share the actual image file? (true on mobile, false on most desktops)
        let ok = false;
        if (blob && typeof navigator.share === 'function' && (navigator as any).canShare) {
          try {
            const f = new File([blob], 'promo.png', { type: 'image/png' });
            ok = (navigator as any).canShare({ files: [f] });
          } catch {
            ok = false;
          }
        }
        setCanShareImage(ok);
      })
      .catch((err) => console.error('Promo image failed:', err))
      .finally(() => setGenerating(false));
  }, [product, shopName]);

  if (!product) return null;

  // Share the actual image via the native sheet. The button is only shown when
  // canShareImage is true, so this path is reliable (mobile Instagram/WhatsApp).
  const handleShare = async () => {
    if (!imageBlob) return;
    const file = new File([imageBlob], 'promo.png', { type: 'image/png' });
    try {
      await navigator.share({ text: caption, files: [file] } as ShareData);
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        console.warn('Web Share failed:', err);
      }
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `promo-${product.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`;
    a.click();
    toast.success('Image downloaded — post it on Instagram!');
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      toast.success('Caption copied!');
    } catch {
      toast.error('Could not copy — select the text manually.');
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(caption)}`, '_blank');
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="flex flex-col bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="shrink-0 flex justify-between items-center bg-gray-50 border-b border-gray-150 p-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FaIcon icon="fa-solid fa-bullhorn" className="text-purple-600" size={18} />
              Promote Product
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Create a post for Instagram &amp; WhatsApp</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
          >
            <FaIcon icon="fa-solid fa-xmark" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Generated image preview */}
          <div className="rounded-xl overflow-hidden border border-gray-150 bg-gray-50 aspect-square max-w-xs mx-auto flex items-center justify-center">
            {generating || !imageUrl ? (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <FaIcon icon="fa-solid fa-spinner" className="animate-spin" size={28} />
                <span className="text-xs font-medium">Creating your post…</span>
              </div>
            ) : (
              <img src={imageUrl} alt="Promo preview" className="w-full h-full object-cover" />
            )}
          </div>

          {/* Caption + hashtags */}
          <div>
            <label className="text-sm font-semibold text-gray-700">Caption &amp; hashtags</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={6}
              className="mt-1 w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 focus:bg-white transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">Edit freely, then share or copy.</p>
          </div>

          {/* Honest note about Instagram */}
          <div className="bg-blue-50 text-blue-800 p-3 rounded-xl text-xs flex items-start gap-2">
            <FaIcon icon="fa-solid fa-circle-info" size={14} className="mt-0.5 shrink-0" />
            <span>
              Instagram doesn't allow apps to post for you. On mobile, tap <strong>Share</strong> and pick
              Instagram/WhatsApp. On desktop, <strong>Download</strong> the image and <strong>Copy</strong> the caption, then paste them into Instagram.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0 border-t border-gray-150 p-4 space-y-2.5">
          {canShareImage && (
            <button
              onClick={handleShare}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
            >
              <FaIcon icon="fa-solid fa-share-nodes" size={16} />
              <span>Share (Instagram, WhatsApp…)</span>
            </button>
          )}
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={handleDownload}
              disabled={!imageUrl}
              className="btn-secondary flex flex-col items-center justify-center gap-1 py-2.5 text-xs disabled:opacity-50"
            >
              <FaIcon icon="fa-solid fa-download" size={16} />
              <span>Image</span>
            </button>
            <button
              onClick={handleCopyCaption}
              className="btn-secondary flex flex-col items-center justify-center gap-1 py-2.5 text-xs"
            >
              <FaIcon icon="fa-solid fa-copy" size={16} />
              <span>Caption</span>
            </button>
            <button
              onClick={handleWhatsApp}
              className="flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-semibold rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
            >
              <FaIcon icon="fa-brands fa-whatsapp" size={16} />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
