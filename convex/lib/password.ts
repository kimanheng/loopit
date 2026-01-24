/**
 * Password Hashing Utilities
 * Uses Web Crypto API for secure password hashing
 * 
 * Security Notes:
 * - Uses PBKDF2 with SHA-256 for key derivation
 * - 100,000 iterations (OWASP recommended minimum)
 * - 128-bit salt generated with crypto.getRandomValues
 * - Returns base64 encoded hash for storage
 */

const ITERATIONS = 100000;
const KEY_LENGTH = 256;
const SALT_LENGTH = 16;

/**
 * Generate a cryptographically secure random salt
 */
function generateSalt(): Uint8Array {
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);
  return salt;
}

/**
 * Convert Uint8Array to base64 string
 */
function arrayToBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr));
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToArray(base64: string): Uint8Array {
  const binary = atob(base64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    arr[i] = binary.charCodeAt(i);
  }
  return arr;
}

/**
 * Hash a password using PBKDF2
 * @param password - Plain text password
 * @returns Hashed password in format: salt$hash (both base64 encoded)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt();
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  // Derive bits using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    KEY_LENGTH
  );

  const hashArray = new Uint8Array(derivedBits);
  const saltBase64 = arrayToBase64(salt);
  const hashBase64 = arrayToBase64(hashArray);

  // Format: salt$hash
  return `${saltBase64}$${hashBase64}`;
}

/**
 * Verify a password against a stored hash
 * @param password - Plain text password to verify
 * @param storedHash - Stored hash in format: salt$hash
 * @returns true if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [saltBase64, expectedHashBase64] = storedHash.split("$");
  
  if (!saltBase64 || !expectedHashBase64) {
    return false;
  }

  const salt = base64ToArray(saltBase64);
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  // Derive bits using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    KEY_LENGTH
  );

  const computedHash = arrayToBase64(new Uint8Array(derivedBits));
  
  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(computedHash, expectedHashBase64);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Generate a secure random token for sessions
 * @param length - Length of the token in bytes (default 32)
 * @returns Base64 encoded token
 */
export function generateSecureToken(length: number = 32): string {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return arrayToBase64(buffer);
}
