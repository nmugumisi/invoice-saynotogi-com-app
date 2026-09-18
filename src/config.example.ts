/**
 * Copy this file to src/config.ts and fill in the key.
 *
 * The app talks to exactly one backend — there is no connect screen and
 * nothing for the user to enter. The key must match the one bundled with
 * the Custom Invoices plugin on that site (includes/ci-api-key.php).
 *
 * src/config.ts is git-ignored: this repo is public, and the key grants
 * full read/write access to invoices, clients, and payment details.
 */
export const API_BASE_URL = 'https://example.com';
export const API_KEY = 'PASTE_THE_KEY_BUNDLED_WITH_THE_PLUGIN';
