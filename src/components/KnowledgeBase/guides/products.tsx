import React from 'react';
import { FaIcon } from '../../shared/FaIcon';
import { Callout, Legend, Mark, MockBtn, MockCheck, MockField, MockTable, Path, Screen, Step } from '../kit';
import { SAMPLE_COLUMNS, downloadSampleProducts } from '../../../utils/sampleProducts';

const Thumb: React.FC<{ c: string }> = ({ c }) => <span className={`inline-block w-7 h-7 rounded-md ${c}`} />;

export const ProductsGuide: React.FC = () => (
  <>
    <p>
      Products you save here can be picked on invoices (price, unit and HSN fill in automatically) and appear in your online catalog. Go to <Path items={['Sidebar', 'Products']} />.
    </p>

    <Step n={1} title="Add a product">
      <p>
        Click <strong>Add Product</strong> at the top-right.
      </p>
      <Screen title="Add Product">
        <div className="mx-auto max-w-sm bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-2.5">
          <div>
            <div className="font-bold text-slate-800">Add Product</div>
            <div className="text-[10px] text-slate-500">Save product details and image</div>
          </div>
          <MockField label="Product Name" required value="EPOXY NORMAL 5 KG" />
          <div className="grid grid-cols-2 gap-2">
            <MockField label="Price (₹)" required value="1059.00" mark={1} />
            <MockField label="Unit" value="PCS" select mark={2} />
          </div>
          <MockField label="HSN / SAC Code (optional)" value="3814" mark={3} />
          <div>
            <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-slate-600">
              Product Image <Mark n={4} />
            </div>
            <div className="flex items-center gap-2">
              <span className="grid place-items-center w-14 h-14 rounded-md border-2 border-dashed border-brand-300 text-brand-600">
                <FaIcon icon="fa-solid fa-cloud-arrow-up" size={14} />
              </span>
              <span className="text-slate-400">Upload file</span>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <MockBtn variant="secondary">Cancel</MockBtn>
            <MockBtn>Save Product</MockBtn>
          </div>
        </div>
      </Screen>
      <Legend
        items={[
          [1, <>Price per unit <strong>before GST</strong>. It must be more than 0.</>],
          [2, <>Unit printed next to the quantity: PCS, KGS, GMS, LTR, MTR, BOX, SET, PKT, NOS, DOZ, HRS, SQF or BAG.</>],
          [3, <>HSN (goods) or SAC (services) code, needed on GST invoices. Leave blank if not applicable.</>],
          [4, <>Optional photo, used on the catalog and Promote posts.</>],
        ]}
      />
      <Callout type="note">
        Products don&apos;t store a GST rate. New invoice lines use the <strong>Default Tax Rate</strong> from Settings, and you can change the rate on each line.
      </Callout>
    </Step>

    <Step n={2} title="Find, view, edit or delete">
      <Screen title="Products">
        <div className="space-y-2 min-w-[560px]">
          <div className="flex items-center justify-between gap-2">
            <MockField placeholder="Search products by name..." className="w-60" mark={1} />
            <span className="flex gap-2">
              <MockBtn variant="secondary" icon="fa-solid fa-share-nodes">
                Share Catalog
              </MockBtn>
              <MockBtn variant="secondary" icon="fa-solid fa-file-import">
                Import
              </MockBtn>
              <MockBtn icon="fa-solid fa-plus">Add Product</MockBtn>
            </span>
          </div>
          <MockTable
            minW={560}
            cols={['', 'Image', 'Product Name', 'HSN', 'Price', 'Actions']}
            align={['l', 'l', 'l', 'l', 'l', 'c']}
            rows={[
              [
                <MockCheck />,
                <Thumb c="bg-amber-200" />,
                <span className="font-semibold">EPOXY NORMAL 5 KG</span>,
                '3814',
                '₹1,059 / PCS',
                <span className="flex justify-center items-center gap-2 text-slate-400">
                  <FaIcon icon="fa-solid fa-bullhorn" size={11} />
                  <FaIcon icon="fa-solid fa-eye" size={11} />
                  <FaIcon icon="fa-solid fa-pen" size={11} />
                  <FaIcon icon="fa-solid fa-trash" size={11} />
                  <Mark n={2} />
                </span>,
              ],
              [
                <MockCheck />,
                <Thumb c="bg-rose-200" />,
                <span className="font-semibold">Kitty rakhi</span>,
                '—',
                '₹80 / PCS',
                <span className="flex justify-center gap-2 text-slate-400">
                  <FaIcon icon="fa-solid fa-bullhorn" size={11} />
                  <FaIcon icon="fa-solid fa-eye" size={11} />
                  <FaIcon icon="fa-solid fa-pen" size={11} />
                  <FaIcon icon="fa-solid fa-trash" size={11} />
                </span>,
              ],
            ]}
          />
          <div className="flex justify-between text-slate-400">
            <span>32 products · Rows per page 10</span>
            <span className="flex items-center gap-1">
              Page 1 of 4 <Mark n={3} />
            </span>
          </div>
        </div>
      </Screen>
      <Legend
        items={[
          [1, <>Search by product name.</>],
          [2, <>Row icons: 📣 <strong>Promote</strong>, 👁 <strong>View Details</strong> (a side panel with image, name, price and date added), ✏️ <strong>Edit</strong> and 🗑 <strong>Delete</strong>.</>],
          [3, <>Choose 10, 20, 50 or 100 rows per page and move between pages.</>],
        ]}
      />
      <Callout type="tip">When editing, pick a new image to replace the old one. Leave it untouched to keep the current image.</Callout>
    </Step>
  </>
);

export const BulkImportGuide: React.FC = () => (
  <>
    <p>
      Add many products in one go from an Excel (.xlsx, .xls) or CSV file. Open <Path items={['Products', 'Import']} />.
    </p>

    <Step n={1} title="Download the sample Excel">
      <p>Start from our ready-made file: it has the right column names, five example rows and an Instructions sheet.</p>
      <button
        type="button"
        onClick={downloadSampleProducts}
        className="my-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm cursor-pointer"
      >
        <FaIcon icon="fa-solid fa-file-excel" size={15} />
        Download sample Excel
      </button>
      <p>
        The same button is in <Path items={['Products', 'Import']} />. Replace the example rows with your products, keep the first row (the column names) and save.
      </p>
    </Step>

    <Step n={2} title="Fill in the columns">
      <p>
        Only <code>name</code> and <code>price</code> are required. Leave any other cell empty if you don&apos;t need it:
      </p>
      <div className="my-3 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[560px] text-left text-[12px] border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500">
              {['Column', 'Required?', 'Example', 'What to enter'].map((h) => (
                <th key={h} className="px-3 py-2 font-semibold border-b border-slate-200">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE_COLUMNS.map((c) => (
              <tr key={c.header} className="align-top border-b border-slate-100 last:border-0">
                <td className="px-3 py-2 whitespace-nowrap">
                  <code>{c.header}</code>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{c.required ? <strong>Required</strong> : 'Optional'}</td>
                <td className="px-3 py-2 font-mono text-[11px] break-all">{c.example}</td>
                <td className="px-3 py-2 text-slate-600">{c.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-3">
        <li>
          Other column names also work: <em>productname</em> / <em>title</em> for name, <em>amount</em> / <em>cost</em> for price, <em>uom</em> for unit, <em>sac</em> for hsn,{' '}
          <em>tax</em> / <em>gst rate</em> for gst, <em>opening stock</em> for stock, <em>reorder level</em> for low_stock.
        </li>
        <li>Rows with no name, or a price of 0, are skipped.</li>
        <li>
          Filling <code>stock</code> turns on stock tracking for that product (see <em>Track stock &amp; low-stock alerts</em>).
        </li>
      </ul>
    </Step>

    <Step n={3} title="Add photos from your computer (optional)">
      <Screen title="Bulk Import Products">
        <div className="mx-auto max-w-md bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
          <div>
            <div className="font-bold text-slate-800">Bulk Import Products</div>
            <div className="text-[10px] text-slate-500">Import multiple products instantly</div>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              Optional: Upload Product Images <Mark n={1} />
            </div>
            <div className="mt-2 rounded-md border-2 border-dashed border-emerald-300 bg-white py-3 text-center text-emerald-700">
              <FaIcon icon="fa-solid fa-images" size={14} /> 3 image(s) selected
            </div>
            <div className="text-[10px] text-emerald-700 mt-1">JPG, PNG, WebP supported</div>
          </div>
          <div className="rounded-lg border-2 border-dashed border-brand-300 bg-brand-50/40 py-5 text-center">
            <FaIcon icon="fa-solid fa-file-excel" size={18} className="text-brand-600" />
            <div className="font-semibold text-slate-700 mt-1 flex items-center justify-center gap-1.5">
              Click to upload Excel or CSV file <Mark n={2} />
            </div>
            <div className="text-[10px] text-slate-400">Supports .xlsx, .xls, and .csv files</div>
          </div>
        </div>
      </Screen>
      <Legend
        items={[
          [1, <>Pick the photo files <strong>first</strong>. A photo is matched to the row whose <code>image</code> cell has the same file name (e.g. <code>mug.jpg</code>). If there&apos;s no image column, it matches the product name.</>],
          [2, <>Then choose your spreadsheet. The import starts straight away. You&apos;ll see “Successfully imported N item(s)”.</>],
        ]}
      />
      <Callout type="note">
        A browser can&apos;t read a path like <code>C:\photos\mug.jpg</code> written in the sheet. That&apos;s why you pick the photos in the green box.
      </Callout>
    </Step>

    <Step n={4} title="If something goes wrong">
      <ul>
        <li>
          <strong>“No valid products found”</strong>: check that the first row has <code>name</code> and <code>price</code> headings, or start again from the sample Excel.
        </li>
        <li>
          <strong>“No image matched for: …”</strong>: the file name in the sheet and the picked photo don&apos;t match exactly (including .jpg / .png).
        </li>
        <li>
          Imported the wrong file? Use <em>Delete many products at once</em> to clean up.
        </li>
      </ul>
    </Step>
  </>
);

export const BulkDeleteGuide: React.FC = () => (
  <>
    <Step n={1} title="Select and delete">
      <Screen title="Products → selection bar">
        <div className="space-y-2 min-w-[440px]">
          <div className="flex items-center justify-between rounded-lg bg-brand-50 border border-brand-200 px-3 py-2">
            <span className="font-semibold text-brand-800 flex items-center gap-1.5">
              3 selected <Mark n={2} />
            </span>
            <span className="flex items-center gap-2">
              <MockBtn variant="ghost">Clear</MockBtn>
              <MockBtn variant="danger" icon="fa-solid fa-trash" mark={3}>
                Delete Selected
              </MockBtn>
            </span>
          </div>
          <MockTable
            minW={440}
            cols={[
              <span className="flex items-center gap-1">
                <MockCheck on /> <Mark n={1} />
              </span>,
              'Product Name',
              'Price',
            ]}
            rows={[
              [<MockCheck on />, 'Kitty rakhi', '₹80 / PCS'],
              [<MockCheck on />, 'Flower hairclip', '₹60 / PCS'],
              [<MockCheck on />, 'Morpankh rakhi', '₹90 / PCS'],
            ]}
          />
        </div>
      </Screen>
      <Legend
        items={[
          [1, <>Tick rows one by one, or tick the box in the header to select everything <strong>on this page</strong>.</>],
          [2, <>The bar shows how many are selected. <strong>Clear</strong> unticks all.</>],
          [3, <><strong>Delete Selected</strong> and confirm.</>],
        ]}
      />
      <Callout type="warning">Deleted products can&apos;t be restored. Old invoices are not affected: they keep the item names and prices they were made with.</Callout>
    </Step>
  </>
);

// ---------------------------------------------------------------------------
// Track stock
// ---------------------------------------------------------------------------
export const StockGuide: React.FC = () => (
  <>
    <p>
      Turn on stock for the products you want to count. Every invoice then takes the sold quantity out of stock, and the app warns you before you run out.
    </p>

    <Step n={1} title="Turn on stock for a product">
      <p>
        Add or edit a product (<Path items={['Products', 'Add Product']} />) and tick <strong>Track stock for this product</strong>.
      </p>
      <Screen title="Edit Product">
        <div className="min-w-[380px] rounded-lg border border-slate-200 p-3 space-y-3">
          <MockCheck on label={<span className="font-semibold text-slate-700">Track stock for this product</span>} />
          <div className="grid grid-cols-2 gap-3">
            <MockField label="Current Stock" value="40" mark={1} />
            <MockField label="Low Stock Alert At" value="10" mark={2} />
          </div>
        </div>
      </Screen>
      <Legend
        items={[
          [1, <>How many you have right now. Change this number any time to correct your count (for example after a stock check or new purchase).</>],
          [2, <>When stock falls to this number or below, the product is flagged as <strong>low stock</strong>.</>],
        ]}
      />
      <Callout type="tip">Products without stock tracking work exactly as before; you can mix both.</Callout>
    </Step>

    <Step n={2} title="Stock moves with your invoices">
      <MockTable
        minW={420}
        cols={['You…', 'Stock']}
        rows={[
          ['Save an invoice for 4 bottles', <span className="font-semibold text-rose-600">− 4</span>],
          ['Edit it to 10 bottles', <span className="font-semibold text-rose-600">− 6 more</span>],
          ['Cancel or delete the invoice', <span className="font-semibold text-emerald-600">+ 10 back</span>],
          ['Restore a cancelled invoice', <span className="font-semibold text-rose-600">− 10 again</span>],
          ['Save a quotation', <span className="text-slate-500">no change</span>],
        ]}
      />
      <p className="mt-3">
        In the invoice editor you see <strong>In stock: 40</strong> under the quantity. If the line asks for more than you have, it turns red:{' '}
        <strong className="text-rose-600">Only 3 in stock</strong>. You can still save (for example if the goods just arrived), and stock goes below zero.
      </p>
    </Step>

    <Step n={3} title="See what is running low">
      <ul className="list-disc pl-5 space-y-1">
        <li>
          The <strong>Stock</strong> column on the Products page shows the count; low items are red with a <FaIcon icon="fa-solid fa-triangle-exclamation" size={10} /> sign.
        </li>
        <li>
          Click <strong>Low stock (N)</strong> above the table to list only those products.
        </li>
        <li>
          The <strong>Dashboard</strong> shows a red “N products are low on stock” bar; click it to open that list.
        </li>
      </ul>
    </Step>
  </>
);
