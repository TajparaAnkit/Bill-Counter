import { FaIcon } from '../shared/FaIcon';
import { Product, BillItem } from '../../types';

interface BillItemsTableProps {
  items: BillItem[];
  products: Product[];
  onItemChange: (index: number, field: keyof BillItem, value: any) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
}

/**
 * Editable line-items table for the invoice form: one row per item with a
 * product-name input (autocompletes from saved products), quantity, price, a
 * computed line total, and a remove button — plus an "Add Line Item" button.
 */
export const BillItemsTable: React.FC<BillItemsTableProps> = ({
  items,
  products,
  onItemChange,
  onAddItem,
  onRemoveItem,
}) => {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-150 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="pb-3 pr-4">Item Name / Product</th>
              <th className="pb-3 px-4 w-28">Quantity</th>
              <th className="pb-3 px-4 w-36">Price (₹)</th>
              <th className="pb-3 px-4 w-36">Total (₹)</th>
              <th className="pb-3 pl-4 w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150">
            {items.map((item, index) => (
              <tr key={index} className="align-middle">
                {/* Product name with product suggestions */}
                <td className="py-3 pr-4 relative">
                  <input
                    type="text"
                    list={`products-list-${index}`}
                    value={item.productName}
                    onChange={(e) => onItemChange(index, 'productName', e.target.value)}
                    placeholder="Enter item name or select product"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    required
                  />
                  <datalist id={`products-list-${index}`}>
                    {products.map((p) => (
                      <option key={p.id} value={p.name}>
                        ₹{p.price.toFixed(2)}
                      </option>
                    ))}
                  </datalist>
                </td>

                {/* Quantity */}
                <td className="py-3 px-4">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => onItemChange(index, 'quantity', e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-center"
                    required
                  />
                </td>

                {/* Price */}
                <td className="py-3 px-4">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.price}
                    onChange={(e) => onItemChange(index, 'price', e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    required
                  />
                </td>

                {/* Line total */}
                <td className="py-3 px-4 font-bold text-gray-700">₹{item.total.toFixed(2)}</td>

                {/* Remove */}
                <td className="py-3 pl-4 text-center">
                  <button
                    type="button"
                    onClick={() => onRemoveItem(index)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FaIcon icon="fa-solid fa-trash" size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={onAddItem}
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
      >
        <FaIcon icon="fa-solid fa-plus" size={16} />
        <span>Add Line Item</span>
      </button>
    </>
  );
};
