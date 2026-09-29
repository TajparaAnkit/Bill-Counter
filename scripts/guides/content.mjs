// Text for the shareable feature guide images (see generate.mjs).
// Each guide: `shot` picks the screenshot recipe, `en` / `hi` hold the copy.
// Button and menu names stay in English in Hindi too, because that is what the app shows.

export const LABELS = {
  en: { guide: 'User Guide', where: 'Where to find it', steps: 'How to use it', help: 'Need help?', helpHint: 'Open Help Center (?) in the app' },
  hi: { guide: 'यूज़र गाइड', where: 'कहाँ मिलेगा', steps: 'कैसे इस्तेमाल करें', help: 'मदद चाहिए?', helpHint: 'ऐप में Help Center (?) खोलें' },
};

export const GUIDES = [
  {
    id: 'welcome',
    shot: 'dashboard',
    en: {
      title: 'Welcome to myBillCounter',
      subtitle: 'GST invoices, payments, stock and reports: your whole business in one place.',
      where: 'Open the app and log in',
      steps: [
        'Sign up with your business name, email and a password.',
        'Add your business details, logo and GSTIN under Settings.',
        'Add your products and customers (or import them from Excel).',
        'Create your first invoice and share it on WhatsApp.',
      ],
    },
    hi: {
      title: 'myBillCounter में आपका स्वागत है',
      subtitle: 'GST Invoice, पेमेंट, स्टॉक और रिपोर्ट: पूरा बिज़नेस एक ही जगह।',
      where: 'ऐप खोलें और Login करें',
      steps: [
        'अपने बिज़नेस का नाम, ईमेल और पासवर्ड से साइन-अप करें।',
        'Settings में बिज़नेस की जानकारी, लोगो और GSTIN भरें।',
        'अपने Products और Customers जोड़ें (या Excel से Import करें)।',
        'पहला Invoice बनाएँ और WhatsApp पर भेजें।',
      ],
    },
  },
  {
    id: 'create-invoice',
    shot: 'invoiceForm',
    en: {
      title: 'Create a GST invoice',
      subtitle: 'Party, items, GST and total in under a minute.',
      where: 'Top bar → New Invoice',
      steps: [
        'Click New Invoice and pick your customer (or type a new name).',
        'Add items: price, HSN and GST fill in from your product list.',
        'Add discount, charges or money received if needed.',
        'Click Save Sales Invoice. CGST/SGST or IGST is worked out for you.',
      ],
    },
    hi: {
      title: 'GST Invoice बनाएँ',
      subtitle: 'पार्टी, आइटम, GST और टोटल, एक मिनट में।',
      where: 'ऊपर → New Invoice',
      steps: [
        'New Invoice पर क्लिक करें और कस्टमर चुनें (या नया नाम लिखें)।',
        'आइटम जोड़ें: कीमत, HSN और GST अपने-आप भर जाते हैं।',
        'ज़रूरत हो तो डिस्काउंट, चार्ज या मिली हुई रकम डालें।',
        'Save Sales Invoice दबाएँ। CGST/SGST या IGST अपने-आप लगता है।',
      ],
    },
  },
  {
    id: 'share-invoice',
    shot: 'invoiceView',
    en: {
      title: 'Share invoices on WhatsApp',
      subtitle: 'A professional PDF with your logo and a scan-to-pay UPI QR.',
      where: 'Sales Invoices → click the invoice number',
      steps: [
        'Open any invoice from Sales Invoices.',
        'Click Share to send the PDF on WhatsApp.',
        'Or click Download PDF to print or email it.',
        'Your customer scans the QR on the invoice to pay by UPI.',
      ],
    },
    hi: {
      title: 'WhatsApp पर Invoice भेजें',
      subtitle: 'आपके लोगो और UPI QR के साथ प्रोफ़ेशनल PDF।',
      where: 'Sales Invoices → Invoice नंबर पर क्लिक करें',
      steps: [
        'Sales Invoices से कोई भी Invoice खोलें।',
        'Share दबाकर PDF WhatsApp पर भेजें।',
        'या Download PDF से प्रिंट या ईमेल करें।',
        'कस्टमर Invoice पर QR स्कैन करके UPI से पेमेंट करता है।',
      ],
    },
  },
  {
    id: 'payments',
    shot: 'recordPayment',
    en: {
      title: 'Record full & part payments',
      subtitle: 'Always know what each customer has paid and what is still due.',
      where: 'Open an invoice → Record Payment',
      steps: [
        'Open the invoice and click Record Payment.',
        'Enter the amount, date and mode (Cash, UPI, Card, Bank).',
        'Paid in instalments? Record each payment when it comes.',
        'The status changes to Partial or Paid automatically.',
      ],
    },
    hi: {
      title: 'पूरा या आंशिक पेमेंट दर्ज करें',
      subtitle: 'हर कस्टमर ने कितना दिया और कितना बाकी है, हमेशा पता रहे।',
      where: 'Invoice खोलें → Record Payment',
      steps: [
        'Invoice खोलें और Record Payment पर क्लिक करें।',
        'रकम, तारीख और तरीका (Cash, UPI, Card, Bank) भरें।',
        'किश्तों में पेमेंट? हर बार आने पर दर्ज करें।',
        'स्टेटस अपने-आप Partial या Paid हो जाता है।',
      ],
    },
  },
  {
    id: 'reminders',
    shot: 'reminder',
    en: {
      title: 'Payment reminders on WhatsApp',
      subtitle: 'Collect dues faster with a polite, ready-written message.',
      where: 'Sales Invoices or Customers → 🔔 bell',
      steps: [
        'Find an unpaid invoice (or a customer with a balance).',
        'Click the bell icon.',
        'WhatsApp opens with the amount, invoice number and your UPI ID.',
        'Check the message and press Send.',
      ],
    },
    hi: {
      title: 'WhatsApp पर पेमेंट रिमाइंडर',
      subtitle: 'तैयार, विनम्र मैसेज से बकाया जल्दी वसूलें।',
      where: 'Sales Invoices या Customers → 🔔 घंटी',
      steps: [
        'कोई बकाया Invoice (या बैलेंस वाला कस्टमर) ढूँढें।',
        'घंटी वाले आइकन पर क्लिक करें।',
        'WhatsApp में रकम, Invoice नंबर और आपका UPI ID लिखा मिलेगा।',
        'मैसेज देखें और Send दबाएँ।',
      ],
    },
  },
  {
    id: 'edit-cancel',
    shot: 'rowMenu',
    en: {
      title: 'Edit or cancel an invoice',
      subtitle: 'Fix mistakes without breaking your invoice numbers.',
      where: 'Sales Invoices → ⋯ on the invoice row',
      steps: [
        'Click ⋯ on the invoice row.',
        'Edit: change anything, the invoice number stays the same.',
        'Cancel invoice: keeps the number, removes it from totals and puts stock back.',
        'Changed your mind? Use Restore invoice.',
      ],
    },
    hi: {
      title: 'Invoice एडिट या कैंसिल करें',
      subtitle: 'Invoice नंबर बिगाड़े बिना गलती सुधारें।',
      where: 'Sales Invoices → Invoice की लाइन पर ⋯',
      steps: [
        'Invoice की लाइन पर ⋯ पर क्लिक करें।',
        'Edit: कुछ भी बदलें, Invoice नंबर वही रहता है।',
        'Cancel invoice: नंबर बना रहता है, टोटल से हट जाता है और स्टॉक वापस आता है।',
        'मन बदल गया? Restore invoice दबाएँ।',
      ],
    },
  },
  {
    id: 'export',
    shot: 'export',
    en: {
      title: 'Export invoices to Excel',
      subtitle: 'Send your CA a complete sales list in one click.',
      where: 'Sales Invoices → Export',
      steps: [
        'Pick a period: Last 30 / 90 / 365 Days or All Time.',
        'Optional: choose a tab (Paid, Unpaid…) or search.',
        'Click Export to download the Excel file.',
        'It has every invoice with GSTIN, CGST/SGST/IGST and totals, plus an item-wise sheet.',
      ],
    },
    hi: {
      title: 'Invoice Excel में Export करें',
      subtitle: 'एक क्लिक में अपने CA को पूरी सेल्स लिस्ट भेजें।',
      where: 'Sales Invoices → Export',
      steps: [
        'समय चुनें: Last 30 / 90 / 365 Days या All Time।',
        'चाहें तो टैब (Paid, Unpaid…) या सर्च चुनें।',
        'Export दबाकर Excel फ़ाइल डाउनलोड करें।',
        'इसमें हर Invoice का GSTIN, CGST/SGST/IGST और टोटल, साथ में आइटम-वार शीट होती है।',
      ],
    },
  },
  {
    id: 'quotations',
    shot: 'quotation',
    en: {
      title: 'Quotations → Invoice',
      subtitle: 'Send a price quote, then bill it with one click.',
      where: 'Sidebar → Quotations',
      steps: [
        'Click Create Quotation and add the party and items.',
        'Save and share the PDF (titled QUOTATION) on WhatsApp.',
        'When the customer agrees, click Convert to Invoice.',
        'Everything is copied into a new invoice. Just check and save.',
      ],
    },
    hi: {
      title: 'Quotation → Invoice',
      subtitle: 'कोटेशन भेजें, फिर एक क्लिक में बिल बनाएँ।',
      where: 'साइडबार → Quotations',
      steps: [
        'Create Quotation दबाएँ, पार्टी और आइटम जोड़ें।',
        'Save करें और PDF (QUOTATION) WhatsApp पर भेजें।',
        'कस्टमर मान जाए तो Convert to Invoice दबाएँ।',
        'सब कुछ नए Invoice में आ जाता है, बस चेक करके Save करें।',
      ],
    },
  },
  {
    id: 'stock',
    shot: 'stock',
    en: {
      title: 'Track stock & low-stock alerts',
      subtitle: 'Invoices reduce stock automatically. Never run out by surprise.',
      where: 'Products → Add / Edit Product',
      steps: [
        'Edit a product and tick Track stock.',
        'Enter the current stock and the low-stock alert level.',
        'Every invoice reduces stock; cancelling puts it back.',
        'Use the Low stock filter to see what to reorder.',
      ],
    },
    hi: {
      title: 'स्टॉक और लो-स्टॉक अलर्ट',
      subtitle: 'Invoice से स्टॉक अपने-आप घटता है। माल कभी अचानक खत्म नहीं होगा।',
      where: 'Products → Add / Edit Product',
      steps: [
        'Product एडिट करें और Track stock पर टिक करें।',
        'अभी का स्टॉक और अलर्ट की लिमिट भरें।',
        'हर Invoice से स्टॉक घटता है; कैंसिल करने पर वापस आता है।',
        'Low stock फ़िल्टर से देखें क्या दोबारा मँगाना है।',
      ],
    },
  },
  {
    id: 'customers',
    shot: 'statement',
    en: {
      title: 'Customers & party statement',
      subtitle: 'Every customer’s invoices, payments and balance on one page.',
      where: 'Customers → customer name',
      steps: [
        'Add customers with phone, GSTIN, address and credit period.',
        'Click a customer to see their statement (ledger).',
        'Pick a period to see invoices, payments and running balance.',
        'Download, print or share the statement on WhatsApp.',
      ],
    },
    hi: {
      title: 'कस्टमर और पार्टी स्टेटमेंट',
      subtitle: 'हर कस्टमर के Invoice, पेमेंट और बैलेंस एक पेज पर।',
      where: 'Customers → कस्टमर का नाम',
      steps: [
        'फ़ोन, GSTIN, पता और क्रेडिट दिन के साथ कस्टमर जोड़ें।',
        'कस्टमर पर क्लिक करके उसका स्टेटमेंट (लेजर) देखें।',
        'समय चुनें: Invoice, पेमेंट और चलता बैलेंस दिखेगा।',
        'स्टेटमेंट डाउनलोड, प्रिंट या WhatsApp पर शेयर करें।',
      ],
    },
  },
  {
    id: 'products',
    shot: 'products',
    en: {
      title: 'Add products or import from Excel',
      subtitle: 'Your price list ready on every invoice.',
      where: 'Sidebar → Products',
      steps: [
        'Click Add Product: name, price, unit, HSN and a photo.',
        'Many products? Click Import, download the sample Excel, fill it in and upload it.',
        'Picked on an invoice, the price, HSN and GST fill in by themselves.',
        'Search, edit or delete products any time.',
      ],
    },
    hi: {
      title: 'Products जोड़ें या Excel से Import करें',
      subtitle: 'हर Invoice पर आपकी रेट लिस्ट तैयार।',
      where: 'साइडबार → Products',
      steps: [
        'Add Product दबाएँ: नाम, कीमत, यूनिट, HSN और फ़ोटो।',
        'ज़्यादा Products? Import दबाएँ, sample Excel डाउनलोड करें, भरें और अपलोड करें।',
        'Invoice में चुनते ही कीमत, HSN और GST अपने-आप भरते हैं।',
        'कभी भी सर्च, एडिट या डिलीट करें।',
      ],
    },
  },
  {
    id: 'catalog',
    shot: 'catalog',
    en: {
      title: 'Your online catalog',
      subtitle: 'A shop page with your products. Customers order on WhatsApp.',
      where: 'Products → Share Catalog',
      steps: [
        'Click Share Catalog to copy your shop link.',
        'Share it on WhatsApp, Instagram or your status.',
        'Customers see your products and prices, no app or login needed.',
        'They tap Order on WhatsApp to message you directly.',
      ],
    },
    hi: {
      title: 'आपका ऑनलाइन कैटलॉग',
      subtitle: 'आपके Products वाला शॉप पेज। कस्टमर WhatsApp पर ऑर्डर करें।',
      where: 'Products → Share Catalog',
      steps: [
        'Share Catalog दबाकर अपनी शॉप का लिंक कॉपी करें।',
        'WhatsApp, Instagram या स्टेटस पर शेयर करें।',
        'कस्टमर बिना ऐप या लॉगिन के Products और कीमतें देखते हैं।',
        'Order on WhatsApp दबाकर सीधे आपको मैसेज करते हैं।',
      ],
    },
  },
  {
    id: 'promote',
    shot: 'promote',
    en: {
      title: 'Promote a product',
      subtitle: 'A ready-made social media post with caption and hashtags.',
      where: 'Products → 📣 icon',
      steps: [
        'Click the 📣 icon on any product.',
        'A square post with the photo, price and your shop name is made for you.',
        'Edit the caption and hashtags if you like.',
        'Share, download the image or copy the caption.',
      ],
    },
    hi: {
      title: 'Product का प्रमोशन करें',
      subtitle: 'कैप्शन और हैशटैग के साथ तैयार सोशल मीडिया पोस्ट।',
      where: 'Products → 📣 आइकन',
      steps: [
        'किसी भी Product पर 📣 आइकन दबाएँ।',
        'फ़ोटो, कीमत और शॉप के नाम वाली पोस्ट अपने-आप बनती है।',
        'चाहें तो कैप्शन और हैशटैग बदलें।',
        'शेयर करें, इमेज डाउनलोड करें या कैप्शन कॉपी करें।',
      ],
    },
  },
  {
    id: 'dashboard',
    shot: 'dashboard',
    en: {
      title: 'Your business at a glance',
      subtitle: 'Sales, money received, dues and top customers in one screen.',
      where: 'Sidebar → Dashboard',
      steps: [
        'See sales, received and outstanding for any period.',
        'Check overdue invoices and remind customers in one click.',
        'Find your top customers and best-selling products.',
        'Watch the GST summary and low-stock alerts.',
      ],
    },
    hi: {
      title: 'बिज़नेस एक नज़र में',
      subtitle: 'सेल, मिली रकम, बकाया और टॉप कस्टमर एक स्क्रीन पर।',
      where: 'साइडबार → Dashboard',
      steps: [
        'किसी भी समय की सेल, मिली रकम और बकाया देखें।',
        'ओवरड्यू Invoice देखें और एक क्लिक में रिमाइंडर भेजें।',
        'अपने टॉप कस्टमर और सबसे ज़्यादा बिकने वाले Products जानें।',
        'GST समरी और लो-स्टॉक अलर्ट पर नज़र रखें।',
      ],
    },
  },
  {
    id: 'settings',
    shot: 'settings',
    en: {
      title: 'Set up your business',
      subtitle: 'Your name, logo, GSTIN, bank and UPI on every invoice.',
      where: 'Sidebar → Settings',
      steps: [
        'Add your business name, address, phone and GSTIN.',
        'Upload your logo and signature.',
        'Add your UPI ID for the scan-to-pay QR, and bank details.',
        'Set your invoice prefix, GST rate and terms, then Save Changes.',
      ],
    },
    hi: {
      title: 'अपना बिज़नेस सेट करें',
      subtitle: 'हर Invoice पर आपका नाम, लोगो, GSTIN, बैंक और UPI।',
      where: 'साइडबार → Settings',
      steps: [
        'बिज़नेस का नाम, पता, फ़ोन और GSTIN भरें।',
        'अपना लोगो और सिग्नेचर अपलोड करें।',
        'QR के लिए UPI ID और बैंक की जानकारी जोड़ें।',
        'Invoice prefix, GST रेट और शर्तें सेट करें, फिर Save Changes दबाएँ।',
      ],
    },
  },
  {
    id: 'templates',
    shot: 'templatePicker',
    en: {
      title: 'Choose your invoice design',
      subtitle: 'Classic, Modern, Minimal, or a thermal receipt for your shop printer.',
      where: 'Settings → Invoice Template',
      steps: [
        'Open Settings and scroll to Invoice Template.',
        'Pick a design: Classic, Modern, Minimal, or Thermal 3" / 2".',
        'For Modern or Minimal, pick your brand colour.',
        'Click Save Changes. Every invoice and quotation PDF uses it.',
      ],
    },
    hi: {
      title: 'अपना Invoice डिज़ाइन चुनें',
      subtitle: 'Classic, Modern, Minimal, या दुकान के प्रिंटर के लिए थर्मल रसीद।',
      where: 'Settings → Invoice Template',
      steps: [
        'Settings खोलें और Invoice Template तक स्क्रॉल करें।',
        'डिज़ाइन चुनें: Classic, Modern, Minimal या Thermal 3" / 2"।',
        'Modern या Minimal के लिए अपना ब्रांड रंग चुनें।',
        'Save Changes दबाएँ। हर Invoice और Quotation PDF इसी में बनेगी।',
      ],
    },
  },
];
