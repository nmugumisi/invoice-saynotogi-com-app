# Invoices

An Android invoicing app built with React Native (Expo). It is the mobile
front end for the Custom Invoices WordPress plugin in
[`invoice-saynotogi-com-api`](../invoice-saynotogi-com-api) — invoices,
clients, payment methods and business settings all live on that site and are
read and written over its REST API, so the app and wp-admin show the same
data at all times.

- **App name:** Invoices
- **Package:** `com.saynotogi.invoice.app`

## Setup

There is none, by design: no sign-in, no connect screen, nothing for the
user to enter. The backend URL and API key are build-time constants in
`src/config.ts`, and the same key ships inside the plugin, so installing the
plugin and installing the app is the whole story.

`src/config.ts` is git-ignored because this repo is public and that key
grants full read/write access to invoice and client data. Copy
`src/config.example.ts` to `src/config.ts` and fill in the key from the
plugin's `includes/ci-api-key.php` before building.

## Features

- **Invoices** — auto-numbered (prefix + zero-padded sequence, continuing
  from the highest existing number), line items with live subtotal/total,
  amount paid, paid/partial/unpaid status, and optional ZAR/BWP converted
  totals locked in at save time.
- **Clients** — a contact book; picking a client on an invoice snapshots
  their name/address/email/phone onto the invoice.
- **Payment methods** — reusable, orderable payment detail blocks (bank
  transfer, mobile money, etc.) to select per invoice.
- **Settings** — business details, invoice numbering defaults, currency,
  default notes, and exchange rates. Rates are fetched by the site itself
  (`POST /settings/fetch-rates`), so the app never calls a third-party
  service directly.
- **Invoice preview** — a native rendering of the invoice matching the
  plugin's printable layout, with Print and Share-as-PDF actions.

Lists refresh when a screen regains focus and support pull-to-refresh, so
edits made in wp-admin or on another device show up without any action.

## Tech

Expo SDK 57 + TypeScript, React Navigation (bottom tabs + native stacks),
PDF/print via `expo-print` + `expo-sharing`. No on-device database — the
site is the single source of truth.

## Development

```bash
npm install
npm run android   # or: npm run web
```

## Building the Android app

```bash
npx expo prebuild -p android
cd android && ./gradlew assembleRelease
```

The APK lands in `android/app/build/outputs/apk/release/`. A debug build
(`assembleDebug`) does **not** embed the JS bundle and will hang on the
splash screen unless Metro is running — use the release build for a
standalone install.
