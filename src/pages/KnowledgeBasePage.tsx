import React, { useMemo, useState } from 'react';
import { Layout } from '../components/shared/Layout';
import { FaIcon } from '../components/shared/FaIcon';

interface Article {
  id: string;
  category: string;
  icon: string;
  title: string;
  summary: string;
  keywords: string;
  // Rendered content as an array of blocks.
  body: React.ReactNode;
}

const ARTICLES: Article[] = [
  {
    id: 'getting-started',
    category: 'Getting Started',
    icon: 'fa-solid fa-rocket',
    title: 'Setting up your account',
    summary: 'Register, log in, and configure your business profile.',
    keywords: 'register login google sign in account business profile onboarding',
    body: (
      <>
        <p>Create an account with your email &amp; business name, or use <strong>Sign in with Google</strong> for one-click access.</p>
        <ol>
          <li>Go to <strong>Register</strong> and enter your email, password, and business name.</li>
          <li>Log in with those credentials (or Google).</li>
          <li>Open <strong>Settings</strong> and fill in your business details — these appear on every invoice.</li>
        </ol>
        <p className="tip">💡 Your business name, address, phone, UPI ID, and invoice notes from Settings are printed on invoices and PDFs.</p>
      </>
    ),
  },
  {
    id: 'products-manage',
    category: 'Products',
    icon: 'fa-solid fa-box',
    title: 'Adding & editing items',
    summary: 'Create items with images, edit them, and preview details.',
    keywords: 'item add edit image price update preview sidebar delete search',
    body: (
      <>
        <p>Manage your catalog from the <strong>Products</strong> page.</p>
        <ul>
          <li><strong>Add Product</strong> — enter a name, price, unit (PCS, KGS…), an optional <strong>HSN / SAC code</strong>, and optionally upload an image. Unit and HSN are prefilled on invoice lines.</li>
          <li><strong>Edit</strong> — click the pencil icon. Uploading a new image replaces the old one; leaving it blank keeps the existing image.</li>
          <li><strong>Preview</strong> — click the eye icon to open a slide-out panel on the right with the item's full details.</li>
          <li><strong>Search &amp; paginate</strong> — filter by name and page through large catalogs.</li>
        </ul>
        <p className="tip">💡 Product images are hosted on Cloudinary, so they load fast and work on your live site with no extra setup.</p>
      </>
    ),
  },
  {
    id: 'products-bulk-import',
    category: 'Products',
    icon: 'fa-solid fa-file-import',
    title: 'Bulk import from Excel / CSV',
    summary: 'Import many products at once from a spreadsheet, with images.',
    keywords: 'bulk import excel xlsx csv spreadsheet upload images cloudinary filename match',
    body: (
      <>
        <p>Use <strong>Import</strong> on the Products page to add many products from a spreadsheet in one go.</p>
        <p><strong>1. Prepare your sheet</strong> with columns named <code>name</code>, <code>price</code>, and optionally <code>image</code>:</p>
        <pre>{`name,price,image
T-Shirt,450,https://example.com/tshirt.jpg
Coffee Mug,299,
Water Bottle,199,`}</pre>
        <p><strong>2. For images on your computer</strong> — a browser can't read local paths like <code>C:\pics\mug.jpg</code>. Instead:</p>
        <ul>
          <li>Click the green <strong>Upload Product Images</strong> box and select the actual image files.</li>
          <li>They upload to Cloudinary and are matched to items by the <strong>filename in your sheet's image column</strong> (e.g. a row pointing to <code>mug.jpg</code> matches the picked file <code>mug.jpg</code>). If there's no image column, it falls back to matching the item name.</li>
        </ul>
        <p><strong>3. Upload the .xlsx / .csv</strong> — items are created, with images attached where matched.</p>
        <p className="tip">💡 Column headers are flexible: <code>name</code>/<code>productname</code>/<code>title</code>, <code>price</code>/<code>amount</code>/<code>cost</code>, <code>image</code>/<code>imageurl</code>/<code>link</code>.</p>
      </>
    ),
  },
  {
    id: 'products-bulk-delete',
    category: 'Products',
    icon: 'fa-solid fa-trash-can',
    title: 'Bulk delete items',
    summary: 'Select multiple items and remove them together.',
    keywords: 'bulk delete remove multiple select checkbox select all items',
    body: (
      <>
        <ul>
          <li>Tick the checkbox on each item row, or use the header checkbox to <strong>select all on the page</strong>.</li>
          <li>A blue action bar appears showing how many are selected.</li>
          <li>Click <strong>Delete Selected</strong> and confirm — all chosen items are removed at once.</li>
        </ul>
        <p className="tip">⚠️ Deletion is permanent and cannot be undone.</p>
      </>
    ),
  },
  {
    id: 'catalog',
    category: 'Marketing & Sharing',
    icon: 'fa-solid fa-store',
    title: 'Your shareable storefront catalog',
    summary: 'Share a public product catalog link on Instagram/WhatsApp.',
    keywords: 'catalog storefront share link public whatsapp instagram order shop',
    body: (
      <>
        <p>Turn your items into a public, mobile-friendly shop page you can share anywhere.</p>
        <ul>
          <li>On the <strong>Products</strong> page, click <strong>Share Catalog</strong> — your public link is copied.</li>
          <li>Paste it in your Instagram bio or WhatsApp status. Anyone can open it (no login) and browse your items with images and prices.</li>
          <li>Each item shows an <strong>Order on WhatsApp</strong> button with a ready-made message.</li>
        </ul>
        <p className="tip">💡 Set your <strong>Phone</strong> (WhatsApp number) and <strong>Business Name</strong> in Settings so the catalog shows your shop and the order buttons work.</p>
      </>
    ),
  },
  {
    id: 'promote',
    category: 'Marketing & Sharing',
    icon: 'fa-solid fa-bullhorn',
    title: 'Promote an item',
    summary: 'Create a marketing image + caption to post on social media.',
    keywords: 'promote marketing post instagram whatsapp caption hashtags image share social',
    body: (
      <>
        <p>Click the <strong>📣 Promote</strong> icon on any item to create a ready-to-post marketing graphic.</p>
        <ul>
          <li>An <strong>Instagram-square image</strong> is generated automatically (your item photo + shop name + price).</li>
          <li>A <strong>caption with hashtags</strong> is written for you — edit it however you like.</li>
          <li><strong>On a phone:</strong> tap <strong>Share</strong> to send it straight to Instagram/WhatsApp.</li>
          <li><strong>On a computer:</strong> tap <strong>Download</strong> for the image and <strong>Copy</strong> the caption, then post them manually.</li>
        </ul>
        <p className="tip">ℹ️ Instagram &amp; WhatsApp don't let apps post for you, or attach an image and caption together — so you download and paste. This is normal for every app.</p>
      </>
    ),
  },
  {
    id: 'customers',
    category: 'Customers',
    icon: 'fa-solid fa-users',
    title: 'Managing customers & suppliers',
    summary: 'Keep a directory of parties with GSTIN, PAN, addresses and credit terms.',
    keywords: 'party party supplier add edit phone email address gstin pan billing shipping credit period limit opening balance directory contacts',
    body: (
      <>
        <p>The <strong>Customers</strong> page (sidebar → General → Customers) is your customer and supplier directory. <strong>Add Customer</strong> opens a full-page form with:</p>
        <ul>
          <li><strong>General details</strong> — name, mobile, email, opening balance (to collect / to pay).</li>
          <li><strong>GSTIN &amp; PAN</strong> — validated formats; PAN is auto-filled from a valid GSTIN.</li>
          <li><strong>Party type</strong> (Customer or Supplier) and an optional category.</li>
          <li><strong>Billing and shipping addresses</strong> — tick &ldquo;Same as Billing address&rdquo; to reuse one.</li>
          <li><strong>Credit period &amp; credit limit</strong> — the credit period becomes the default payment terms on new invoices.</li>
        </ul>
        <p className="tip">💡 Selecting a party on an invoice snapshots their details onto that bill, so later edits to the party do not rewrite old invoices.</p>
      </>
    ),
  },
  {
    id: 'bills-create',
    category: 'Bills & Invoices',
    icon: 'fa-solid fa-file-invoice',
    title: 'Creating a GST invoice',
    summary: 'Full-page invoice editor: Bill To / Ship To, HSN, per-item tax, CGST/SGST, charges, round-off and payment.',
    keywords: 'bill invoice create sales bill to ship to place of supply prefix number date due payment terms vehicle hsn unit quantity price discount tax gst cgst sgst igst additional charges round off notes terms bank qr received balance preview',
    body: (
      <>
        <p>Click <strong>Create Sales Invoice</strong> in the sidebar or on the Sales Invoices page to open the invoice editor. Use <strong>Edit Mode</strong> to fill it in and <strong>Preview Mode</strong> to see the finished invoice before saving.</p>
        <ul>
          <li><strong>Bill To</strong> — pick a saved party (search by name, phone or GSTIN) or type a one-time party name. Their address, GSTIN and PAN are copied onto the invoice. Use <em>Edit Details</em> (or the <em>+ Add GSTIN</em> / <em>+ Add PAN</em> links) to fill or correct them for this invoice only.</li>
          <li><strong>Ship To</strong> — defaults to the party&apos;s shipping address; use <em>Change Shipping Address</em> to override.</li>
          <li><strong>Invoice details</strong> — prefix, editable invoice number (duplicates are blocked), invoice date, payment terms in days with an auto-calculated due date, and vehicle number.</li>
          <li><strong>Place of Supply</strong> — compared with your business state (Settings): same state splits tax into <strong>CGST + SGST</strong>, a different state applies <strong>IGST</strong>.</li>
          <li><strong>Items</strong> — name (auto-fills from your products), optional description, <strong>HSN</strong>, quantity with unit, price, per-item discount (₹ or %), and per-item GST rate. The amount column includes tax.</li>
          <li><strong>Totals</strong> — add <em>Additional Charges</em> (delivery, packing…), a bill-level discount, and <em>Auto Round Off</em> or a manual round-off.</li>
          <li><strong>Payment</strong> — enter the amount received and method, or tick <em>Mark as fully paid</em>. The balance is stored with the bill.</li>
          <li><strong>Extras</strong> — toggle Notes, Terms &amp; Conditions (prefilled from Settings), Bank Account details and the UPI Payment QR on the printed invoice.</li>
        </ul>
        <p className="tip">💡 Older invoices created before this editor still open and print exactly as they did.</p>
      </>
    ),
  },
  {
    id: 'bills-pdf-qr',
    category: 'Bills & Invoices',
    icon: 'fa-solid fa-file-pdf',
    title: 'PDF export & payment QR',
    summary: 'Download print-ready invoices with a UPI payment QR code.',
    keywords: 'pdf export download print a4 qr upi payment code invoice',
    body: (
      <>
        <ul>
          <li>Open any invoice to preview it, then <strong>Download PDF</strong> — a clean, print-ready A4 document.</li>
          <li>Invoices show a QR code. Set your <strong>UPI ID</strong> in Settings and the QR becomes a real <strong>scan-to-pay</strong> code for parties.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'payments',
    category: 'Payments',
    icon: 'fa-solid fa-indian-rupee-sign',
    title: 'Tracking payments',
    summary: 'Mark invoices paid, partial, or unpaid and record the method.',
    keywords: 'payment status paid partial unpaid amount method cash upi card bank',
    body: (
      <>
        <p>Each invoice tracks a payment status:</p>
        <ul>
          <li><strong>Paid</strong>, <strong>Partial</strong>, or <strong>Unpaid</strong> — with the amount paid recorded.</li>
          <li>Record how it was paid: <strong>Cash, UPI, Card, Bank</strong>, or Other.</li>
        </ul>
        <p className="tip">💡 Partial payments keep the remaining balance visible so you know what's still owed.</p>
      </>
    ),
  },
  {
    id: 'dashboard',
    category: 'Dashboard',
    icon: 'fa-solid fa-gauge-high',
    title: 'Sales dashboard',
    summary: 'See your key business metrics at a glance.',
    keywords: 'dashboard metrics sales revenue overview stats analytics',
    body: (
      <>
        <p>The <strong>Dashboard</strong> summarizes your business — sales totals and key metrics — so you can track performance at a glance.</p>
      </>
    ),
  },
  {
    id: 'settings',
    category: 'Settings',
    icon: 'fa-solid fa-gear',
    title: 'Manage Business & invoice settings',
    summary: 'Your business identity, logo, signature and everything printed on invoices.',
    keywords: 'settings manage business profile logo signature address phone email city pincode state upi invoice notes terms prefix tax gst gstin pan business type industry registration msme website bank account ifsc',
    body: (
      <>
        <p><strong>Settings → Manage Business</strong> holds your company identity. Everything here is printed on your invoices in place of the app name:</p>
        <ul>
          <li><strong>Logo &amp; Signature</strong> — upload images; the logo sits top-left on invoices and the signature above &ldquo;Authorised Signature for &lt;your business&gt;&rdquo;. Without a logo the Bill Counter mark is used.</li>
          <li><strong>Business name, phone, company e-mail, billing address, city, pincode, state</strong> — the seller block on every invoice.</li>
          <li><strong>Are you GST Registered?</strong> — Yes shows your GSTIN on invoices (state and PAN auto-fill from it); No hides it.</li>
          <li><strong>PAN, Business Type (multi-select), Industry Type, Registration Type</strong> — stored on your profile.</li>
          <li><strong>Add Business Details</strong> — extra lines like MSME number or website, printed under your address.</li>
        </ul>
        <p>Further sections control invoice defaults:</p>
        <ul>
          <li><strong>UPI ID</strong> — powers the scan-to-pay QR code.</li>
          <li><strong>Invoice prefix</strong> — e.g. <code>INV</code> → <code>INV-0001</code>.</li>
          <li><strong>Business state</strong> — used with an invoice&apos;s Place of Supply to decide CGST+SGST vs IGST.</li>
          <li><strong>Tax / GST</strong> — optionally enable a default tax rate and GSTIN (the state is guessed from the GSTIN).</li>
          <li><strong>Bank account</strong> — holder, bank, account number, IFSC and branch, printed when &ldquo;Add Bank Account&rdquo; is on for an invoice.</li>
          <li><strong>Default Terms &amp; Conditions</strong> — prefilled into every new invoice and editable per bill.</li>
        </ul>
      </>
    ),
  },
];

const CATEGORY_ORDER = [
  'Getting Started',
  'Products',
  'Marketing & Sharing',
  'Customers',
  'Bills & Invoices',
  'Payments',
  'Dashboard',
  'Settings',
];

export const KnowledgeBasePage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>('getting-started');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ARTICLES;
    return ARTICLES.filter((a) =>
      `${a.title} ${a.summary} ${a.keywords} ${a.category}`.toLowerCase().includes(q)
    );
  }, [search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Article[]>();
    filtered.forEach((a) => {
      if (!map.has(a.category)) map.set(a.category, []);
      map.get(a.category)!.push(a);
    });
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      articles: map.get(c)!,
    }));
  }, [filtered]);

  return (
    <Layout>
      <div className="space-y-6 animate-slide-up">
        {/* Hero */}
        <div className="rounded-lg bg-brand-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <FaIcon icon="fa-solid fa-book-open" size={22} />
            <h1 className="text-xl font-bold">Knowledge Base</h1>
          </div>
          <p className="mt-2 text-brand-100 text-sm max-w-2xl">
            Learn how every feature works — from adding products and bulk importing, to invoices, payments, and settings.
          </p>

          {/* Search */}
          <div className="relative mt-5 max-w-xl">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FaIcon icon="fa-solid fa-magnifying-glass" size={16} className="text-brand-400" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search help articles..."
              className="w-full pl-11 pr-4 py-3 rounded-lg bg-white text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
            />
          </div>
        </div>

        {/* Articles grouped by category */}
        {grouped.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-10 text-center text-gray-500">
            No articles match “{search}”. Try a different term.
          </div>
        ) : (
          grouped.map(({ category, articles }) => (
            <section key={category} className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                {category}
              </h2>
              <div className="space-y-3">
                {articles.map((a) => {
                  const isOpen = openId === a.id;
                  return (
                    <div
                      key={a.id}
                      className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenId(isOpen ? null : a.id)}
                        className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50/60 transition-colors"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                          <FaIcon icon={a.icon} size={18} />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-semibold text-gray-800">{a.title}</span>
                          <span className="block text-sm text-gray-500 truncate">{a.summary}</span>
                        </span>
                        <FaIcon
                          icon="fa-solid fa-chevron-down"
                          size={14}
                          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {isOpen && (
                        <div className="kb-article px-5 pb-5 pt-1 text-sm text-gray-700 leading-relaxed border-t border-gray-100">
                          {a.body}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </Layout>
  );
};
