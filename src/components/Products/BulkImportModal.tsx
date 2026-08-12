import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import { FaIcon } from '../shared/FaIcon';
import { useToast } from '../../hooks/useToast';
import { uploadImageToCloudinary } from '../../services/db';

interface ImportItem {
  name: string;
  price: number;
  imageUrl?: string;
}

// Carries the filename pulled from the sheet's local path, used only to match
// picked image files. Stripped out before the item is sent to onImport().
interface ParsedRow extends ImportItem {
  imageFileName?: string;
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: ImportItem[]) => Promise<void>;
}

const normalizeHeader = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '').trim();

const parsePrice = (value: unknown): number | null => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.\-]/g, '').trim();
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const findHeaderValue = (row: Record<string, unknown>, aliases: string[]) => {
  const normalizedRow = Object.entries(row).reduce<Record<string, unknown>>((acc, [key, value]) => {
    acc[normalizeHeader(key)] = value;
    return acc;
  }, {});

  for (const alias of aliases) {
    if (normalizedRow[alias] !== undefined) return normalizedRow[alias];
  }

  return undefined;
};

const isLocalFilePath = (value: string): boolean => {
  return /^[a-zA-Z]:|^\/|\\/.test(value.trim());
};

// Pull just the filename out of any path: "C:\pics\tshirt.jpg" -> "tshirt.jpg".
const extractFileName = (value: string): string => {
  const parts = value.trim().split(/[\\/]/);
  return parts[parts.length - 1] || '';
};

const buildParsedItems = (rows: Array<Record<string, unknown>>): ParsedRow[] => {
  const parsedItems: ParsedRow[] = [];

  rows.forEach((row) => {
    const name = String(findHeaderValue(row, ['name', 'productname', 'title']) || '').trim();
    const priceValue = parsePrice(findHeaderValue(row, ['price', 'amount', 'unitprice', 'cost']));
    const imageValue = String(findHeaderValue(row, ['image', 'imageurl', 'img', 'photo', 'picture', 'link']) || '').trim();

    if (!name) return;
    if (!priceValue || priceValue <= 0) return;

    // An http(s) URL can be used directly. A local disk path can't be read by the
    // browser — but we keep its filename so we can match a picked image to it.
    const isLocal = imageValue && isLocalFilePath(imageValue);
    const imageUrl = imageValue && !isLocal ? imageValue : undefined;
    const imageFileName = isLocal ? extractFileName(imageValue) : undefined;

    parsedItems.push({
      name,
      price: priceValue,
      imageUrl,
      imageFileName,
    });
  });

  return parsedItems;
};

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const toast = useToast();

  if (!isOpen) return null;

  const handleImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length) {
      setSelectedImages(Array.from(files));
      toast.success(`Selected ${files.length} image(s)`);
    }
  };

  // Upload every picked image to Cloudinary, keyed by lowercase filename.
  // Returns the URL map plus any upload failures so the caller can report them.
  const createImageUrlMap = async (
    imageFiles: File[]
  ): Promise<{ urlMap: Record<string, string>; failures: string[] }> => {
    const urlMap: Record<string, string> = {};
    const failures: string[] = [];
    let uploaded = 0;

    for (const file of imageFiles) {
      try {
        toast.success(`Uploading image ${uploaded + 1}/${imageFiles.length}...`);
        const url = await uploadImageToCloudinary(file);
        urlMap[file.name.toLowerCase()] = url;
        uploaded++;
      } catch (err) {
        // Surface the real reason so failures aren't silent.
        const code = (err as { code?: string })?.code || (err as Error)?.message || 'unknown error';
        console.error(`Failed to upload ${file.name}:`, err);
        toast.error(`Upload failed for "${file.name}" — ${code}`);
        failures.push(file.name);
      }
    }

    return { urlMap, failures };
  };

  // Find the uploaded image for a product. Preferred match: the exact filename
  // taken from the sheet's local path (e.g. "C:\pics\tshirt.jpg" -> "tshirt.jpg").
  // Fallback: match a picked file whose name resembles the product name.
  const matchImageToProduct = (item: ParsedRow, imageUrlMap: Record<string, string>): string | undefined => {
    // 1) Exact filename from the sheet's image column.
    if (item.imageFileName) {
      const exact = imageUrlMap[item.imageFileName.toLowerCase()];
      if (exact) return exact;
    }

    // 2) Fall back to matching the picked filename against the product name.
    const normalizedName = item.name.toLowerCase().replace(/\s+/g, '');
    for (const [filename, url] of Object.entries(imageUrlMap)) {
      const filenamePart = filename.split('.')[0].toLowerCase().replace(/\s+/g, '');
      if (filenamePart === normalizedName || filename.toLowerCase().includes(normalizedName)) {
        return url;
      }
    }
    return undefined;
  };

  // Handles .xlsx, .xls AND .csv — XLSX.read parses all of them.
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    try {
      setIsSubmitting(true);
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '', raw: false });

      if (!rows.length) {
        toast.error('The file is empty.');
        return;
      }

      let parsedItems = buildParsedItems(rows);
      if (!parsedItems.length) {
        toast.error('No valid products found. Make sure the sheet has "name" and "price" columns.');
        return;
      }

      // If the user picked image files, upload them and match to products by name.
      if (selectedImages.length > 0) {
        toast.success(`Uploading ${selectedImages.length} image(s) to Cloudinary...`);
        const { urlMap } = await createImageUrlMap(selectedImages);

        const unmatched: string[] = [];
        parsedItems = parsedItems.map((item) => {
          const matched = matchImageToProduct(item, urlMap);
          // Flag products that expected a local image but got no match.
          if (!matched && item.imageFileName) unmatched.push(item.name);
          return { ...item, imageUrl: matched || item.imageUrl };
        });

        if (unmatched.length) {
          toast.error(
            `No image matched for: ${unmatched.slice(0, 5).join(', ')}${unmatched.length > 5 ? '…' : ''}. ` +
            `Make sure the picked file names exactly match the filenames in your sheet.`
          );
        }
      }

      // Drop the internal imageFileName field — onImport only wants name/price/imageUrl.
      const itemsToImport: ImportItem[] = parsedItems.map(({ name, price, imageUrl }) => ({
        name,
        price,
        imageUrl,
      }));

      await onImport(itemsToImport);
      toast.success(`Successfully imported ${parsedItems.length} product(s).`);
      setSelectedImages([]);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to read the file. Please check the format and try again.');
    } finally {
      setIsSubmitting(false);
      // Reset so re-selecting the same file still fires onChange.
      input.value = '';
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="flex flex-col bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="shrink-0 flex justify-between items-center bg-gray-50 border-b border-gray-150 p-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Bulk Import Products</h2>
            <p className="text-sm text-slate-500 mt-0.5">Import multiple items instantly</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
          >
            <FaIcon icon="fa-solid fa-xmark" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Image Picker Section */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaIcon icon="fa-solid fa-image" size={18} className="text-green-600" />
              <h3 className="font-semibold text-green-800 text-sm">Optional: Upload Product Images</h3>
            </div>
            <p className="text-xs text-green-700 mb-3">
              Select the actual image files. They upload to Cloudinary and are matched to products by the <span className="font-semibold">filename in your sheet's image column</span> (e.g. a row with <span className="font-mono bg-white px-1 py-0.5 rounded">C:\pics\tshirt.jpg</span> matches the picked file <span className="font-mono bg-white px-1 py-0.5 rounded">tshirt.jpg</span>). No image column? It falls back to matching the product name.
            </p>
            <label className="flex items-center gap-3 p-3 bg-white border-2 border-dashed border-green-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50/50 transition-all">
              <FaIcon icon="fa-solid fa-images" size={20} className="text-green-600 shrink-0" />
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-gray-700">
                  {selectedImages.length > 0 ? `${selectedImages.length} image(s) selected` : 'Click to select images'}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">JPG, PNG, WebP supported</div>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageFilesChange}
                className="hidden"
                disabled={isSubmitting}
              />
            </label>
            {selectedImages.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedImages([])}
                className="mt-2 text-xs text-green-600 hover:text-green-700 font-medium"
              >
                Clear selection
              </button>
            )}
          </div>

          <div className="bg-blue-50 text-blue-800 p-3.5 rounded-xl text-xs flex items-start space-x-2">
            <FaIcon icon="fa-solid fa-circle-info" size={16} className="mt-0.5 shrink-0" />
            <div>
              <span className="font-bold">Supported format:</span> A sheet with columns named <span className="font-semibold">name</span>, <span className="font-semibold">price</span>, and optionally <span className="font-semibold">image</span> (an http/https URL — local file paths are ignored).
              <pre className="mt-1 bg-white/50 p-2 rounded text-[10px] font-mono select-all">
{`name,price,image
T-Shirt,450,https://example.com/tshirt.jpg
Coffee Mug,299,`}
              </pre>
            </div>
          </div>

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-10 cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all text-center">
            <FaIcon icon={isSubmitting ? 'fa-solid fa-spinner' : 'fa-solid fa-upload'} size={40} className={`text-gray-400 mb-2 ${isSubmitting ? 'animate-spin' : ''}`} />
            <span className="text-sm font-semibold text-gray-700">
              {isSubmitting ? 'Importing...' : 'Click to upload Excel or CSV file'}
            </span>
            <span className="text-xs text-gray-400 mt-1">Supports .xlsx, .xls, and .csv files</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              disabled={isSubmitting}
            />
          </label>

          <button type="button" onClick={onClose} disabled={isSubmitting} className="btn-secondary w-full py-2.5">
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
