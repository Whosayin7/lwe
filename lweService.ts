import { Matrix, Vector, KeyPair, EncryptedBlock, SerializedCiphertext } from './types';

// --- Constants (Matching the Python Script) ---
const Q = 3329;   // Prime modulus
const N = 128;    // Dimension (Reduced from 256 for browser responsiveness)
const M = 256;    // Samples (Reduced from 512 for browser responsiveness)
const ERROR_RANGE = 3;

// --- Helper Functions ---

const getRandomInt = (max: number): number => {
  // Uses crypto for better randomness than Math.random()
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] % max;
};

// Returns random int in range [-range, range]
const getRandomError = (range: number): number => {
  const val = getRandomInt(range * 2 + 1);
  return val - range;
};

// Generate an m x n matrix with random values modulo q
const generateMatrix = (rows: number, cols: number, q: number): Matrix => {
  const matrix: Matrix = [];
  for (let i = 0; i < rows; i++) {
    const row: Vector = [];
    for (let j = 0; j < cols; j++) {
      row.push(getRandomInt(q));
    }
    matrix.push(row);
  }
  return matrix;
};

// Matrix x Vector multiplication (mod q)
const matVecMul = (A: Matrix, s: Vector, q: number): Vector => {
  const m = A.length;
  const n = A[0].length;
  const result: Vector = new Array(m).fill(0);

  for (let i = 0; i < m; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      sum += A[i][j] * s[j];
    }
    result[i] = ((sum % q) + q) % q; // Ensure positive modulo
  }
  return result;
};

// Vector x Vector dot product (mod q)
const vecDot = (v1: Vector, v2: Vector, q: number): number => {
  let sum = 0;
  for (let i = 0; i < v1.length; i++) {
    sum += v1[i] * v2[i];
  }
  return ((sum % q) + q) % q;
};

// Transpose Matrix x Vector multiplication (mod q) -> equivalent to A.T @ r
const matTransVecMul = (A: Matrix, r: Vector, q: number): Vector => {
  const m = A.length;
  const n = A[0].length;
  const result: Vector = new Array(n).fill(0);

  for (let j = 0; j < n; j++) {
    let sum = 0;
    for (let i = 0; i < m; i++) {
      sum += A[i][j] * r[i];
    }
    result[j] = ((sum % q) + q) % q;
  }
  return result;
};

// Vector addition (mod q)
const vecAdd = (v1: Vector, v2: Vector, q: number): Vector => {
  return v1.map((val, i) => ((val + v2[i]) % q + q) % q);
};

// --- Core LWE Functions ---

export const generateKeys = async (): Promise<KeyPair> => {
  // Use a slight delay to allow UI to update if this were heavier
  return new Promise((resolve) => {
    setTimeout(() => {
      // Secret key s (n x 1)
      const s: Vector = [];
      for (let i = 0; i < N; i++) s.push(getRandomError(ERROR_RANGE));

      // Public Matrix A (m x n)
      const A = generateMatrix(M, N, Q);

      // Error vector e (m x 1)
      const e: Vector = [];
      for (let i = 0; i < M; i++) e.push(getRandomError(ERROR_RANGE));

      // b = A*s + e
      const As = matVecMul(A, s, Q);
      const b = vecAdd(As, e, Q);

      resolve({
        pk: { A, b },
        sk: s
      });
    }, 100);
  });
};

export const encryptText = (
  pk: KeyPair['pk'], 
  plaintext: string
): { ciphertext: string, stats: any[] } => {
  const { A, b } = pk;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(plaintext);
  
  // Convert to bits
  const bits: number[] = [];
  bytes.forEach(byte => {
    for (let i = 7; i >= 0; i--) {
      bits.push((byte >> i) & 1);
    }
  });

  const blocks: EncryptedBlock[] = [];
  const stats: any[] = [];

  bits.forEach((bit, index) => {
    // r is a random binary vector (size m)
    const r: Vector = [];
    for (let i = 0; i < M; i++) r.push(getRandomInt(2));

    // u = A.T * r
    const u = matTransVecMul(A, r, Q);

    // v = b.T * r
    const v = vecDot(b, r, Q);

    // Message encoding
    const messageEncoding = bit * Math.floor(Q / 2);
    
    // v_prime = v + message_encoding
    const vPrime = (v + messageEncoding) % Q;

    blocks.push({ u, v: vPrime });

    // Collect stats for first few bits for visualization
    if (index < 20) {
      stats.push({
        bitIndex: index,
        originalBit: bit,
        vVal: v, // Noise component
        vPrime: vPrime,
        encodedVal: messageEncoding
      });
    }
  });

  // Serialize to Base64 (simulating the Python pickle + base64 logic)
  const container: SerializedCiphertext = {
    blocks,
    meta: { timestamp: Date.now(), algorithm: "LWE-Regev" }
  };
  
  const jsonStr = JSON.stringify(container);
  const base64Str = btoa(jsonStr);

  return { ciphertext: base64Str, stats };
};

export const decryptText = (sk: Vector, ciphertextBase64: string): string => {
  try {
    const jsonStr = atob(ciphertextBase64);
    const container: SerializedCiphertext = JSON.parse(jsonStr);
    const blocks = container.blocks;

    const decryptedBits: number[] = [];

    blocks.forEach(block => {
      const { u, v } = block;
      
      // s.T * u
      const sTu = vecDot(sk, u, Q);
      
      // d = v - sTu
      let d = (v - sTu) % Q;
      if (d < 0) d += Q;

      // Decision
      const halfQ = Math.floor(Q / 2);
      const quarterQ = Math.floor(Q / 4);

      // Center the value around 0
      if (d > Q - quarterQ) d -= Q;

      // Check distance from half_q
      if (Math.abs(d - halfQ) < quarterQ) {
        decryptedBits.push(1);
      } else {
        decryptedBits.push(0);
      }
    });

    // Bits to bytes
    const bytes: number[] = [];
    for (let i = 0; i < decryptedBits.length; i += 8) {
      let byteVal = 0;
      for (let j = 0; j < 8; j++) {
        if (i + j < decryptedBits.length) {
          byteVal = (byteVal << 1) | decryptedBits[i + j];
        }
      }
      bytes.push(byteVal);
    }

    const decoder = new TextDecoder();
    return decoder.decode(new Uint8Array(bytes));

  } catch (e) {
    console.error(e);
    throw new Error("Şifre çözülemedi. Geçersiz anahtar veya bozuk veri.");
  }
};