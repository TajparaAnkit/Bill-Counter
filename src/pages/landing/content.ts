// Landing page copy (English + Hindi). Layout is in LandingPage.tsx.
// Hindi keeps app terms (Invoice, GST, WhatsApp, UPI…) in English, as the app shows them.

export type Lang = 'en' | 'hi';

// One entry in the "Why myBillCounter" section: a numbered item on the left, its phone screen on the right.
export interface WhyItem {
  id: string;
  image: string; // phone-sized screenshot in public/landing/
  icon: string;
  color: string; // chip / accent colour
  chip: string;
  title: string;
  text: string;
  toast: string[]; // [title, subtitle] of the floating card next to the phone
}

const en = {
  nav: { features: 'Features', designs: 'Invoice designs', plans: 'Plans', faq: 'FAQ' },
  login: 'Login',
  trial: 'Start free trial',
  dashboard: 'Open Dashboard',
  haveAccount: 'Already have an account?',
  hero: {
    eyebrow: 'GST billing app for Indian businesses',
    title: ['Billing that gets you', 'paid faster.'],
    text: 'Create GST invoices in seconds, share them on WhatsApp with a UPI QR, remind customers who owe you, track stock and hand your CA an Excel report. All in one simple app.',
    checks: ['14-day free trial', 'No card needed', 'Works on phone & computer'],
    toastSent: ['Invoice sent on WhatsApp', 'INV-0049 · Ramesh Traders'],
    toastPaid: ['₹3,422 received', 'Paid via UPI · just now'],
  },
  strip: ['GST-ready invoices', 'WhatsApp sharing', 'UPI scan-to-pay QR', 'Stock alerts', 'Excel for your CA'],
  problems: {
    title: 'Sound *familiar*?',
    items: [
      { icon: 'fa-solid fa-pen', problem: 'Writing bills by hand and working out GST on a calculator.', fix: 'Pick the customer and items; CGST / SGST or IGST is done for you.' },
      { icon: 'fa-solid fa-phone', problem: 'Calling customers again and again for pending payments.', fix: 'One tap sends a polite WhatsApp reminder with your UPI ID.' },
      { icon: 'fa-solid fa-box-open', problem: 'Finding out an item is out of stock only when a customer asks.', fix: 'Every invoice updates stock and warns you before you run out.' },
    ],
  },
  why: {
    eyebrow: 'Why choose us',
    title: 'Why *myBillCounter* is the best billing app for small businesses',
    text: 'Everything you need to bill, collect and grow, in one simple app.',
    items: [
      { id: 'gst', image: 'phone-invoice.jpg', icon: 'fa-solid fa-file-invoice', color: '#b45309', chip: 'GST invoicing', title: 'Create GST & non-GST invoices', text: 'Bill in under a minute with auto GST (CGST + SGST or IGST), HSN / SAC codes, discounts, extra charges and your logo, bank and signature on every invoice.', toast: ['GST auto-calculated', 'CGST + SGST or IGST'] },
      { id: 'share', image: 'invoice-phone.jpg', icon: 'fa-brands fa-whatsapp', color: '#15803d', chip: 'Share & get paid', title: 'Send on WhatsApp, get paid by UPI', text: 'Share the invoice PDF on WhatsApp in one tap with a scan-to-pay UPI QR. Record full or part payments and see Paid / Partial / Overdue at a glance.', toast: ['₹3,422 received', 'Paid via UPI · just now'] },
      { id: 'collect', image: 'phone-reminders.jpg', icon: 'fa-regular fa-bell', color: '#0369a1', chip: 'Payment collection', title: 'Speed up payment collection', text: 'See who owes you and send a polite WhatsApp reminder with the amount and your UPI ID in one tap, for one invoice or a customer’s whole balance.', toast: ['Reminder sent', '₹9,727 due · Ramesh Traders'] },
      { id: 'stock', image: 'phone-stock.jpg', icon: 'fa-solid fa-boxes-stacked', color: '#7c3aed', chip: 'Inventory', title: 'Track stock in real time', text: 'Every invoice reduces stock and cancelling puts it back. Low-stock alerts tell you what to reorder; import hundreds of products from Excel.', toast: ['Low stock: Cotton Saree', 'Only 3 left, reorder now'] },
      { id: 'quote', image: 'phone-quotation.jpg', icon: 'fa-solid fa-file-signature', color: '#c2410c', chip: 'Quotations', title: 'Quote today, invoice in one click', text: 'Send a professional quotation with its own QT number and validity. When the customer agrees, convert it into a GST invoice with everything filled in.', toast: ['QT-0002 → INV-0049', 'Converted in 1 click'] },
      { id: 'reports', image: 'phone-dashboard.jpg', icon: 'fa-solid fa-chart-column', color: '#be185d', chip: 'Reports & dashboard', title: 'Get daily business reports', text: 'Sales, money received, dues and top customers on one screen. Export any period to Excel for your CA and share customer-wise statements.', toast: ['48 invoices exported', 'Excel for your CA'] },
      { id: 'catalog', image: 'catalog.jpg', icon: 'fa-solid fa-store', color: '#0f766e', chip: 'Online catalog', title: 'Sell online on WhatsApp', text: 'Share one link to a mobile catalog of your products. Customers browse and order on WhatsApp, and you can make ready-made social media posts.', toast: ['New order on WhatsApp', '“2 × Cotton Saree please”'] },
    ] as WhyItem[],
  },
  moreTitle: 'And *much more*',
  grid: [
    ['fa-solid fa-file-invoice', 'GST invoices', 'CGST, SGST, IGST, HSN and amount in words'],
    ['fa-brands fa-whatsapp', 'WhatsApp sharing', 'Invoices, quotations and statements as PDF'],
    ['fa-solid fa-qrcode', 'UPI payment QR', 'Scan-to-pay with the exact amount'],
    ['fa-regular fa-bell', 'Payment reminders', 'Ready-written WhatsApp messages'],
    ['fa-solid fa-indian-rupee-sign', 'Payment tracking', 'Full, part and overdue payments'],
    ['fa-regular fa-pen-to-square', 'Edit & cancel', 'Fix mistakes, keep invoice numbers'],
    ['fa-solid fa-file-signature', 'Quotations', 'Convert to invoice in one click'],
    ['fa-solid fa-boxes-stacked', 'Stock & alerts', 'Updated by every invoice'],
    ['fa-solid fa-file-import', 'Excel import', 'Hundreds of products at once'],
    ['fa-solid fa-book', 'Party ledger', 'Customer-wise statements'],
    ['fa-solid fa-file-excel', 'Excel for your CA', 'Invoice and item-wise sheets'],
    ['fa-solid fa-chart-column', 'Business dashboard', 'Sales, dues and top customers'],
    ['fa-solid fa-store', 'Online catalog', 'Orders on WhatsApp'],
    ['fa-solid fa-bullhorn', 'Promote products', 'Social media posts in a click'],
    ['fa-solid fa-palette', 'Invoice designs', 'Classic, Modern, Minimal, thermal'],
    ['fa-solid fa-mobile-screen', 'Phone & computer', 'Your data synced everywhere'],
  ],
  designs: {
    eyebrow: 'Invoice designs',
    title: 'Invoices that look like *your brand*',
    text: 'Classic, Modern and Minimal A4 designs in your brand colour, plus 2" and 3" receipts for thermal printers.',
    chips: ['Classic A4', 'Modern A4', 'Minimal A4', 'Thermal 3" (80 mm)', 'Thermal 2" (58 mm)'],
  },
  how: {
    title: 'Start billing in *3 steps*',
    steps: [
      ['Create your free account', 'Sign up with your business name and email. No card needed.'],
      ['Add your business & products', 'Logo, GSTIN, bank and UPI once; products one by one or from Excel.'],
      ['Send your first invoice', 'Create it in under a minute and share it on WhatsApp.'],
    ],
  },
  who: {
    title: 'Made for *every kind* of business',
    items: ['Kirana & general stores', 'Wholesalers & distributors', 'Retail & fashion', 'Hardware & electricals', 'Pharmacy', 'Services & repairs', 'Manufacturers', 'Traders'],
  },
  plans: {
    eyebrow: 'Plans',
    title: 'Start free. *Upgrade when you are ready.*',
    text: 'Every account starts with a 14-day free trial with all features.',
    contact: 'Contact us for pricing',
    trialNote: '14 days, all features',
    popular: 'Most popular',
    ctaTrial: 'Start free trial',
    ctaContact: 'Contact us',
    names: { trial: 'Free Trial', basic: 'Basic', pro: 'Pro' },
    desc: { trial: 'Try everything, free for 14 days.', basic: 'The essentials for a growing shop.', pro: 'Every feature for your business.' },
    core: 'GST invoices, WhatsApp sharing, UPI QR, payments, reminders, Excel export',
  },
  faq: {
    title: 'Questions, *answered*',
    text: 'Can’t find your answer? Write to us and we’ll reply quickly.',
    items: [
      ['Is it really free to try?', 'Yes. Every new account gets 14 days with all features. No card needed; nothing is charged automatically.'],
      ['Does it work on my phone?', 'Yes. It works in the browser on any phone, tablet or computer, and your data is the same on all of them.'],
      ['Is my data safe?', 'Your data is stored in Google’s secure cloud (Firebase) and only you can see it. We never share it.'],
      ['Are the invoices GST compliant?', 'Invoices show GSTIN, HSN / SAC, CGST + SGST or IGST by place of supply, and amount in words, like a standard tax invoice.'],
      ['Can I give my CA a report?', 'Yes. Export any period to Excel with every invoice (GSTIN, taxable amount, CGST, SGST, IGST) and an item-wise sheet.'],
      ['Can I print on a thermal printer?', 'Yes. 2" (58 mm) and 3" (80 mm) receipt designs are available, as well as A4.'],
      ['I have many products. Do I type them one by one?', 'No. Download our sample Excel, fill in your products and import them all at once, with stock and GST.'],
    ],
  },
  final: { title: 'Ready to bill smarter?', text: 'Join now and send your first GST invoice today.' },
  anywhere: {
    title: 'Run your business *from anywhere*',
    text: 'At the shop, at home or on the move, your business stays with you on every device.',
    points: [
      ['fa-solid fa-laptop', 'Works on phone, tablet and computer'],
      ['fa-solid fa-rotate', 'Real-time sync across your devices'],
      ['fa-solid fa-cloud', 'Secure cloud backup, nothing to install'],
      ['fa-solid fa-bolt', 'Invoice in a minute, even on a small screen'],
    ],
    cta: 'Sign up for free',
  },
  footer: {
    tagline: 'GST billing, made simple.',
    product: 'Product',
    account: 'Account',
    contact: 'Contact',
    rights: 'All rights reserved.',
    touch: 'Get in touch',
    email: 'Email',
    resources: 'Resources',
    sample: 'Sample products Excel',
    madeIn: 'Made in India, for Indian businesses',
  },
};

type Copy = typeof en;

const hi: Copy = {
  nav: { features: 'फ़ीचर', designs: 'Invoice डिज़ाइन', plans: 'प्लान', faq: 'सवाल-जवाब' },
  login: 'Login',
  trial: 'फ़्री ट्रायल शुरू करें',
  dashboard: 'Dashboard खोलें',
  haveAccount: 'पहले से अकाउंट है?',
  hero: {
    eyebrow: 'भारतीय बिज़नेस के लिए GST बिलिंग ऐप',
    title: ['बिलिंग जो दिलाए', 'पेमेंट जल्दी।'],
    text: 'सेकंडों में GST Invoice बनाएँ, UPI QR के साथ WhatsApp पर भेजें, बकाया वाले कस्टमर को रिमाइंडर दें, स्टॉक ट्रैक करें और CA को Excel रिपोर्ट दें। सब एक आसान ऐप में।',
    checks: ['14 दिन फ़्री ट्रायल', 'कार्ड की ज़रूरत नहीं', 'फ़ोन और कंप्यूटर दोनों पर'],
    toastSent: ['Invoice WhatsApp पर भेजा', 'INV-0049 · Ramesh Traders'],
    toastPaid: ['₹3,422 मिल गए', 'UPI से पेमेंट · अभी'],
  },
  strip: ['GST-ready Invoice', 'WhatsApp शेयरिंग', 'UPI स्कैन-टू-पे QR', 'स्टॉक अलर्ट', 'CA के लिए Excel'],
  problems: {
    title: 'क्या आपके साथ भी *ऐसा होता है*?',
    items: [
      { icon: 'fa-solid fa-pen', problem: 'हाथ से बिल लिखना और कैलकुलेटर से GST निकालना।', fix: 'कस्टमर और आइटम चुनें; CGST / SGST या IGST अपने-आप लगता है।' },
      { icon: 'fa-solid fa-phone', problem: 'बकाया पेमेंट के लिए बार-बार कस्टमर को फ़ोन करना।', fix: 'एक टैप में आपके UPI ID के साथ विनम्र WhatsApp रिमाइंडर।' },
      { icon: 'fa-solid fa-box-open', problem: 'माल खत्म होने का पता तब चलना जब कस्टमर माँगे।', fix: 'हर Invoice से स्टॉक अपडेट होता है और पहले ही अलर्ट मिलता है।' },
    ],
  },
  why: {
    eyebrow: 'हमें क्यों चुनें',
    title: 'छोटे बिज़नेस के लिए *myBillCounter* ही सबसे अच्छा बिलिंग ऐप क्यों है',
    text: 'बिल बनाने, पेमेंट लेने और बिज़नेस बढ़ाने के लिए सब कुछ, एक आसान ऐप में।',
    items: [
      { id: 'gst', image: 'phone-invoice.jpg', icon: 'fa-solid fa-file-invoice', color: '#b45309', chip: 'GST बिलिंग', title: 'GST और नॉन-GST Invoice बनाएँ', text: 'एक मिनट में बिल: अपने-आप GST (CGST + SGST या IGST), HSN / SAC कोड, डिस्काउंट, एक्स्ट्रा चार्ज, और हर Invoice पर आपका लोगो, बैंक और सिग्नेचर।', toast: ['GST अपने-आप', 'CGST + SGST या IGST'] },
      { id: 'share', image: 'invoice-phone.jpg', icon: 'fa-brands fa-whatsapp', color: '#15803d', chip: 'भेजें और पेमेंट पाएँ', title: 'WhatsApp पर भेजें, UPI से पेमेंट पाएँ', text: 'स्कैन-टू-पे UPI QR के साथ Invoice PDF एक टैप में WhatsApp पर भेजें। पूरा या आंशिक पेमेंट दर्ज करें और Paid / Partial / Overdue तुरंत देखें।', toast: ['₹3,422 मिल गए', 'UPI से पेमेंट · अभी'] },
      { id: 'collect', image: 'phone-reminders.jpg', icon: 'fa-regular fa-bell', color: '#0369a1', chip: 'पेमेंट वसूली', title: 'पेमेंट जल्दी वसूलें', text: 'देखें किसका बकाया है और एक टैप में रकम व UPI ID के साथ विनम्र WhatsApp रिमाइंडर भेजें, एक Invoice या कस्टमर के पूरे बैलेंस के लिए।', toast: ['रिमाइंडर भेजा', '₹9,727 बाकी · Ramesh Traders'] },
      { id: 'stock', image: 'phone-stock.jpg', icon: 'fa-solid fa-boxes-stacked', color: '#7c3aed', chip: 'इन्वेंटरी', title: 'स्टॉक रियल-टाइम में ट्रैक करें', text: 'हर Invoice से स्टॉक घटता है और कैंसिल करने पर वापस आता है। लो-स्टॉक अलर्ट बताता है क्या मँगाना है; Excel से सैकड़ों Products Import करें।', toast: ['लो स्टॉक: Cotton Saree', 'सिर्फ़ 3 बचे, अभी मँगाएँ'] },
      { id: 'quote', image: 'phone-quotation.jpg', icon: 'fa-solid fa-file-signature', color: '#c2410c', chip: 'कोटेशन', title: 'आज कोटेशन, 1 क्लिक में Invoice', text: 'अपने QT नंबर और वैलिडिटी के साथ प्रोफ़ेशनल कोटेशन भेजें। कस्टमर माने तो सब कुछ भरा हुआ GST Invoice बनाएँ।', toast: ['QT-0002 → INV-0049', '1 क्लिक में बदला'] },
      { id: 'reports', image: 'phone-dashboard.jpg', icon: 'fa-solid fa-chart-column', color: '#be185d', chip: 'रिपोर्ट और Dashboard', title: 'रोज़ की बिज़नेस रिपोर्ट', text: 'सेल, मिली रकम, बकाया और टॉप कस्टमर एक स्क्रीन पर। CA के लिए किसी भी समय का Excel Export करें और कस्टमर-वार स्टेटमेंट शेयर करें।', toast: ['48 Invoice Export', 'CA के लिए Excel'] },
      { id: 'catalog', image: 'catalog.jpg', icon: 'fa-solid fa-store', color: '#0f766e', chip: 'ऑनलाइन कैटलॉग', title: 'WhatsApp पर ऑनलाइन बेचें', text: 'अपने Products के मोबाइल कैटलॉग का एक लिंक शेयर करें। कस्टमर देखें और WhatsApp पर ऑर्डर करें, और आप तैयार सोशल मीडिया पोस्ट बनाएँ।', toast: ['WhatsApp पर नया ऑर्डर', '“2 × Cotton Saree चाहिए”'] },
    ],
  },
  moreTitle: 'और भी *बहुत कुछ*',
  grid: [
    ['fa-solid fa-file-invoice', 'GST Invoice', 'CGST, SGST, IGST, HSN और शब्दों में रकम'],
    ['fa-brands fa-whatsapp', 'WhatsApp शेयरिंग', 'Invoice, कोटेशन और स्टेटमेंट PDF'],
    ['fa-solid fa-qrcode', 'UPI पेमेंट QR', 'सही रकम के साथ स्कैन-टू-पे'],
    ['fa-regular fa-bell', 'पेमेंट रिमाइंडर', 'तैयार WhatsApp मैसेज'],
    ['fa-solid fa-indian-rupee-sign', 'पेमेंट ट्रैकिंग', 'पूरा, आंशिक और ओवरड्यू'],
    ['fa-regular fa-pen-to-square', 'एडिट और कैंसिल', 'गलती सुधारें, नंबर वही रहें'],
    ['fa-solid fa-file-signature', 'कोटेशन', '1 क्लिक में Invoice'],
    ['fa-solid fa-boxes-stacked', 'स्टॉक और अलर्ट', 'हर Invoice से अपडेट'],
    ['fa-solid fa-file-import', 'Excel Import', 'सैकड़ों Products एक साथ'],
    ['fa-solid fa-book', 'पार्टी लेजर', 'कस्टमर-वार स्टेटमेंट'],
    ['fa-solid fa-file-excel', 'CA के लिए Excel', 'Invoice और आइटम-वार शीट'],
    ['fa-solid fa-chart-column', 'बिज़नेस Dashboard', 'सेल, बकाया और टॉप कस्टमर'],
    ['fa-solid fa-store', 'ऑनलाइन कैटलॉग', 'WhatsApp पर ऑर्डर'],
    ['fa-solid fa-bullhorn', 'Product प्रमोशन', 'एक क्लिक में सोशल पोस्ट'],
    ['fa-solid fa-palette', 'Invoice डिज़ाइन', 'Classic, Modern, Minimal, थर्मल'],
    ['fa-solid fa-mobile-screen', 'फ़ोन और कंप्यूटर', 'हर जगह एक जैसा डेटा'],
  ],
  designs: {
    eyebrow: 'Invoice डिज़ाइन',
    title: 'Invoice जो दिखे *आपके ब्रांड* जैसा',
    text: 'आपके ब्रांड रंग में Classic, Modern और Minimal A4 डिज़ाइन, साथ में थर्मल प्रिंटर के लिए 2" और 3" रसीद।',
    chips: ['Classic A4', 'Modern A4', 'Minimal A4', 'Thermal 3" (80 mm)', 'Thermal 2" (58 mm)'],
  },
  how: {
    title: '*3 स्टेप* में बिलिंग शुरू करें',
    steps: [
      ['फ़्री अकाउंट बनाएँ', 'बिज़नेस के नाम और ईमेल से साइन-अप करें। कार्ड की ज़रूरत नहीं।'],
      ['बिज़नेस और Products जोड़ें', 'लोगो, GSTIN, बैंक और UPI एक बार; Products एक-एक करके या Excel से।'],
      ['पहला Invoice भेजें', 'एक मिनट में बनाएँ और WhatsApp पर भेजें।'],
    ],
  },
  who: {
    title: '*हर तरह* के बिज़नेस के लिए',
    items: ['किराना और जनरल स्टोर', 'होलसेलर और डिस्ट्रीब्यूटर', 'रिटेल और फ़ैशन', 'हार्डवेयर और इलेक्ट्रिकल', 'फ़ार्मेसी', 'सर्विस और रिपेयर', 'मैन्युफ़ैक्चरर', 'ट्रेडर'],
  },
  plans: {
    eyebrow: 'प्लान',
    title: 'फ़्री में शुरू करें। *जब चाहें अपग्रेड करें।*',
    text: 'हर अकाउंट सभी फ़ीचर के साथ 14 दिन के फ़्री ट्रायल से शुरू होता है।',
    contact: 'कीमत के लिए संपर्क करें',
    trialNote: '14 दिन, सभी फ़ीचर',
    popular: 'सबसे लोकप्रिय',
    ctaTrial: 'फ़्री ट्रायल शुरू करें',
    ctaContact: 'संपर्क करें',
    names: { trial: 'फ़्री ट्रायल', basic: 'Basic', pro: 'Pro' },
    desc: { trial: '14 दिन तक सब कुछ फ़्री में आज़माएँ।', basic: 'बढ़ती दुकान के लिए ज़रूरी फ़ीचर।', pro: 'आपके बिज़नेस के लिए हर फ़ीचर।' },
    core: 'GST Invoice, WhatsApp शेयरिंग, UPI QR, पेमेंट, रिमाइंडर, Excel Export',
  },
  faq: {
    title: 'आपके सवाल, *हमारे जवाब*',
    text: 'जवाब नहीं मिला? हमें लिखें, हम जल्दी जवाब देंगे।',
    items: [
      ['क्या सच में फ़्री में आज़मा सकते हैं?', 'हाँ। हर नए अकाउंट को सभी फ़ीचर के साथ 14 दिन मिलते हैं। कार्ड की ज़रूरत नहीं; अपने-आप कोई पैसा नहीं कटता।'],
      ['क्या यह मेरे फ़ोन पर चलेगा?', 'हाँ। यह किसी भी फ़ोन, टैबलेट या कंप्यूटर के ब्राउज़र में चलता है, और हर जगह आपका डेटा एक जैसा रहता है।'],
      ['क्या मेरा डेटा सुरक्षित है?', 'आपका डेटा Google के सुरक्षित क्लाउड (Firebase) में रहता है और सिर्फ़ आप देख सकते हैं। हम इसे किसी से शेयर नहीं करते।'],
      ['क्या Invoice GST के हिसाब से सही हैं?', 'Invoice पर GSTIN, HSN / SAC, place of supply के हिसाब से CGST + SGST या IGST, और शब्दों में रकम होती है, जैसे एक सामान्य टैक्स Invoice।'],
      ['क्या मैं CA को रिपोर्ट दे सकता हूँ?', 'हाँ। किसी भी समय का Excel Export करें: हर Invoice (GSTIN, taxable, CGST, SGST, IGST) और आइटम-वार शीट।'],
      ['क्या थर्मल प्रिंटर पर प्रिंट होगा?', 'हाँ। 2" (58 mm) और 3" (80 mm) रसीद डिज़ाइन उपलब्ध हैं, साथ में A4 भी।'],
      ['मेरे पास बहुत Products हैं। क्या एक-एक करके डालने होंगे?', 'नहीं। हमारा sample Excel डाउनलोड करें, Products भरें और स्टॉक व GST के साथ सब एक बार में Import करें।'],
    ],
  },
  final: { title: 'स्मार्ट बिलिंग के लिए तैयार?', text: 'अभी जुड़ें और आज ही पहला GST Invoice भेजें।' },
  anywhere: {
    title: '*कहीं से भी* बिज़नेस चलाएँ',
    text: 'दुकान पर, घर पर या सफ़र में, आपका बिज़नेस हर डिवाइस पर आपके साथ।',
    points: [
      ['fa-solid fa-laptop', 'फ़ोन, टैबलेट और कंप्यूटर पर चलता है'],
      ['fa-solid fa-rotate', 'सभी डिवाइस पर तुरंत सिंक'],
      ['fa-solid fa-cloud', 'सुरक्षित क्लाउड बैकअप, कुछ इंस्टॉल नहीं करना'],
      ['fa-solid fa-bolt', 'छोटी स्क्रीन पर भी एक मिनट में Invoice'],
    ],
    cta: 'फ़्री में साइन-अप करें',
  },
  footer: {
    tagline: 'GST बिलिंग, आसान।',
    product: 'प्रोडक्ट',
    account: 'अकाउंट',
    contact: 'संपर्क',
    rights: 'सर्वाधिकार सुरक्षित।',
    touch: 'संपर्क करें',
    email: 'ईमेल',
    resources: 'संसाधन',
    sample: 'Sample products Excel',
    madeIn: 'भारत में बना, भारतीय बिज़नेस के लिए',
  },
};

export const COPY: Record<Lang, Copy> = { en, hi };
