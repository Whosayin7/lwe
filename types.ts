// Matrix is a list of rows, where each row is a list of numbers
export type Matrix = number[][];
export type Vector = number[];

export interface KeyPair {
  pk: {
    A: Matrix; // Public Matrix (m x n)
    b: Vector; // Public Vector (m)
  };
  sk: Vector; // Secret Vector (n)
}

export interface EncryptedBlock {
  u: Vector;
  v: number;
}

export interface SerializedCiphertext {
  blocks: EncryptedBlock[];
  meta: {
    timestamp: number;
    algorithm: "LWE-Regev";
  };
}

// Stats for visualization
export interface EncryptionStats {
  bitIndex: number;
  originalBit: number;
  uSum: number;
  vVal: number;
  vPrime: number; // The final encrypted scalar
  noise: number; // The random noise added
}
