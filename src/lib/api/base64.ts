const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Minimal base64 encoder for ASCII strings (site credentials), since
 * Hermes doesn't reliably provide a global btoa.
 */
export function base64Encode(input: string): string {
  let output = '';
  let i = 0;
  while (i < input.length) {
    const a = input.charCodeAt(i++);
    const b = i < input.length ? input.charCodeAt(i++) : NaN;
    const c = i < input.length ? input.charCodeAt(i++) : NaN;

    const chunk = (a << 16) | ((Number.isNaN(b) ? 0 : b) << 8) | (Number.isNaN(c) ? 0 : c);

    output += CHARS[(chunk >> 18) & 63];
    output += CHARS[(chunk >> 12) & 63];
    output += Number.isNaN(b) ? '=' : CHARS[(chunk >> 6) & 63];
    output += Number.isNaN(c) ? '=' : CHARS[chunk & 63];
  }
  return output;
}
