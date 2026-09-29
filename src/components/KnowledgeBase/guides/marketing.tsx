import React from 'react';
import { Callout, Legend, Mark, MockBtn, Path, Screen, Step } from '../kit';

export const CatalogGuide: React.FC = () => (
  <>
    <p>
      Your catalog is a public web page with all your products. Anyone with the link can browse it on their phone, without logging in, and order from you on WhatsApp.
    </p>

    <Step n={1} title="Get your catalog link">
      <ol>
        <li>
          Make sure <Path items={['Sidebar', 'Settings']} /> has your <strong>Business Name</strong>, <strong>Company Phone Number</strong> (your WhatsApp number) and a logo.
        </li>
        <li>
          Go to <strong>Products</strong> and click <strong>Share Catalog</strong>. The link is copied (“Catalog link copied!”).
        </li>
        <li>Paste it into your WhatsApp status, Instagram bio, Google Business profile or a message.</li>
      </ol>
    </Step>

    <Step n={2} title="What customers see">
      <Screen title="Your catalog (customer's phone)">
        <div className="mx-auto w-64 rounded-2xl border-4 border-slate-800 bg-white overflow-hidden">
          <div className="bg-linear-to-br from-brand-600 via-brand-500 to-blue-600 text-white p-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-white/20 grid place-items-center font-bold">D</span>
              <div>
                <div className="font-bold">Dwarkadhish Marketing</div>
                <div className="text-[10px] text-white/80">✨ Handmade with love</div>
              </div>
            </div>
            <div className="flex gap-1 text-[9px]">
              <span className="bg-white/20 rounded-full px-1.5">32 Products</span>
              <span className="bg-white/20 rounded-full px-1.5">Quick Replies</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="flex-1 text-center rounded-md bg-[#25D366] py-1 font-semibold">Chat with us on WhatsApp</span>
              <Mark n={1} />
            </div>
          </div>
          <div className="p-2 space-y-2">
            <div className="flex items-center gap-1">
              <span className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-slate-400">Search products…</span>
              <Mark n={2} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Kitty rakhi', '₹80', 'bg-rose-200'],
                ['Swastik border', '₹70', 'bg-amber-200'],
              ].map(([n, p, c], i) => (
                <div key={n} className="rounded-lg border border-slate-200 overflow-hidden">
                  <div className={`h-12 ${c}`} />
                  <div className="p-1.5">
                    <div className="font-semibold truncate">{n}</div>
                    <div className="font-bold text-slate-800">{p}</div>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="flex-1 text-center text-[9px] rounded bg-[#25D366] text-white py-0.5">Order on WhatsApp</span>
                      {i === 0 && <Mark n={3} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Screen>
      <Legend
        items={[
          [1, <>Opens a WhatsApp chat with you. It only appears when your phone number is saved in Settings.</>],
          [2, <>Customers can search your products by name.</>],
          [3, <>Sends you a ready message: <em>Hi Dwarkadhish Marketing! I&apos;m interested in &quot;Kitty rakhi&quot; (₹80). Is it available?</em></>],
        ]}
      />
      <Callout type="note">
        The catalog updates automatically. Add, edit or delete a product and the change is live. The tagline “Handmade with love” and the violet colour theme are the same for every shop at the moment.
      </Callout>
    </Step>
  </>
);

export const PromoteGuide: React.FC = () => (
  <>
    <p>
      Turn any product into a ready-to-post square image with a caption and hashtags. On the <strong>Products</strong> page, click 📣 (<em>Promote</em>) on the product&apos;s row.
    </p>

    <Step n={1} title="Check the post and caption">
      <Screen title="Promote Product">
        <div className="mx-auto max-w-md bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
          <div>
            <div className="font-bold text-slate-800">Promote Product</div>
            <div className="text-[10px] text-slate-500">Create a post for Instagram &amp; WhatsApp</div>
          </div>
          <div className="flex gap-3">
            <div className="relative w-32 h-32 shrink-0 rounded-lg bg-linear-to-br from-rose-300 to-amber-200 grid place-items-end p-2">
              <Mark n={1} className="absolute -top-2 -left-2" />
              <span className="rounded bg-white/90 px-1.5 py-0.5 font-bold text-slate-800">Kitty rakhi · ₹80</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-slate-600">
                Caption &amp; hashtags <Mark n={2} />
              </div>
              <div className="rounded-md border border-slate-300 p-2 text-[10px] leading-snug text-slate-700 h-24 overflow-hidden">
                ✨ Kitty rakhi — just ₹80!
                <br />
                Handmade with love 🧶 DM to order.
                <br />— Dwarkadhish Marketing
                <br />
                #rakhi #handmade #shopsmall
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <MockBtn icon="fa-solid fa-share-nodes" mark={3}>
              Share (Instagram, WhatsApp…)
            </MockBtn>
            <MockBtn variant="secondary" icon="fa-solid fa-download">
              Image
            </MockBtn>
            <MockBtn variant="secondary" icon="fa-regular fa-copy">
              Caption
            </MockBtn>
            <MockBtn variant="whatsapp" icon="fa-brands fa-whatsapp" mark={4}>
              WhatsApp
            </MockBtn>
          </div>
        </div>
      </Screen>
      <Legend
        items={[
          [1, <>The image is made for you from the product photo, name, price and your shop name.</>],
          [2, <>Edit the caption however you like.</>],
          [3, <><strong>On a phone</strong>: tap <strong>Share</strong> and pick Instagram or WhatsApp. The image goes with it. (This button only appears on devices that can share files.)</>],
          [4, <><strong>On a computer</strong>: click <strong>Image</strong> to download it and <strong>Caption</strong> to copy the text, then post them yourself. <strong>WhatsApp</strong> opens WhatsApp with the caption typed in.</>],
        ]}
      />
      <Callout type="note">Instagram and WhatsApp don&apos;t let any app post for you or attach an image and caption together from a computer. Downloading and pasting is the normal way.</Callout>
    </Step>
  </>
);
