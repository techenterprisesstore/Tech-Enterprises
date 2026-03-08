/**
 * ImageKit Upload Service — Signed Upload (uses private key)
 *
 * Generates HMAC-SHA1 signature using the browser Web Crypto API.
 * Requires in .env:
 *   VITE_IMAGEKIT_PUBLIC_KEY   — from ImageKit Dashboard → Settings → API Keys
 *   VITE_IMAGEKIT_PRIVATE_KEY  — from ImageKit Dashboard → Settings → API Keys
 *   VITE_IMAGEKIT_URL_ENDPOINT — e.g. https://ik.imagekit.io/yourID
 *
 * NOTE: The private key is included in the client bundle.
 * This is acceptable for admin-only tools but should not be used in public-facing apps.
 */

const IMAGEKIT_PUBLIC_KEY = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
const IMAGEKIT_PRIVATE_KEY = import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY;
const IMAGEKIT_URL_ENDPOINT = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;

/**
 * Generate HMAC-SHA1 signature using the Web Crypto API.
 * ImageKit signature = HMAC-SHA1(token + expire, privateKey), hex-encoded.
 */
async function generateSignature(privateKey, token, expire) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(privateKey);
  const message = encoder.encode(token + expire);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Upload a file to ImageKit using a signed request.
 * @param {File} file - The file to upload.
 * @param {string} folder - Destination folder on ImageKit (e.g. 'products', 'categories', 'banners').
 * @returns {Promise<string>} - The public CDN URL of the uploaded image.
 */
export const uploadToImageKit = async (file, folder = 'uploads') => {
  if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
    throw new Error(
      'ImageKit is not fully configured. Please set VITE_IMAGEKIT_PUBLIC_KEY, ' +
      'VITE_IMAGEKIT_PRIVATE_KEY, and VITE_IMAGEKIT_URL_ENDPOINT in your .env file.'
    );
  }

  // Generate auth parameters
  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 2400; // valid for 40 minutes
  const signature = await generateSignature(IMAGEKIT_PRIVATE_KEY, token, expire);

  const fileName = `${Date.now()}_${file.name}`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', fileName);
  formData.append('publicKey', IMAGEKIT_PUBLIC_KEY);
  formData.append('token', token);
  formData.append('expire', String(expire));
  formData.append('signature', signature);
  formData.append('folder', `/${folder}`);
  formData.append('useUniqueFileName', 'false');

  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsed;
    try { parsed = JSON.parse(errorText); } catch { parsed = null; }
    throw new Error(
      `ImageKit upload failed (${response.status}): ${parsed?.message || errorText}`
    );
  }

  const result = await response.json();

  if (!result.url) {
    throw new Error('ImageKit upload succeeded but no URL was returned.');
  }

  return result.url;
};
