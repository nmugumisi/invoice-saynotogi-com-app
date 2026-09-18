# Invoices

An Android invoicing app built with React Native (Expo), covering the same
functionality as the [Custom Invoices WordPress plugin](https://ngatinyore.co.zw)
in [`invoice-saynotogi-com-api`](../invoice-saynotogi-com-api): business
details, clients, payment methods, and invoices with line items, currency
conversion (ZAR/BWP), and a printable invoice layout — all stored locally on
the device.

- **App name:** Invoices
- **Package:** `com.saynotogi.invoice.app`

## Features

- **Invoices** — auto-numbered (prefix + zero-padded sequence, continuing
  from the highest existing number), line items with live subtotal/total,
  amount paid, paid/partial/unpaid status, and optional ZAR/BWP converted
  totals locked in at save time.
- **Clients** — a contact book; picking a client on an invoice snapshots
  their name/address/email/phone onto the invoice.
- **Payment methods** — reusable, orderable payment detail blocks (bank
  transfer, mobile money, etc.) to select per invoice.
- **Settings** — company logo/name/address/contact, invoice numbering
  defaults, currency symbol/code, default notes, and exchange rates (manual
  entry or fetched live from the same fallback feeds as the plugin).
- **Invoice preview** — a native rendering of the invoice matching the
  plugin's printable layout, with Print and Share-as-PDF actions.

## Tech

Expo SDK 57 + TypeScript, React Navigation (bottom tabs + native stacks),
local storage via `@react-native-async-storage/async-storage`, PDF/print via
`expo-print` + `expo-sharing`.

## Development

```bash
npm install
npm run android   # or: npm run web
```

## Building the Android app

```bash
npx expo prebuild -p android
npx eas build -p android --profile preview
```

(or `expo run:android` for a local debug build with Android Studio / an
emulator installed).
