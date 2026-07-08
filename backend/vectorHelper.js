import crypto from 'crypto';

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

function getSeedFromHash(data) {
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return parseInt(hash.substring(0, 8), 16);
}

/**
 * Generates a deterministic 512-dimension unit vector for any text or binary buffer.
 */
export function getPseudoEmbedding(inputTextOrBuffer) {
  let seed;
  if (Buffer.isBuffer(inputTextOrBuffer)) {
    seed = getSeedFromHash(inputTextOrBuffer);
  } else {
    const text = (inputTextOrBuffer || '').toLowerCase().trim();
    seed = getSeedFromHash(text);
  }

  const rand = mulberry32(seed);
  const vector = [];
  let sumSq = 0;
  for (let i = 0; i < 512; i++) {
    const val = rand() * 2 - 1; // Range: [-1.0, 1.0]
    vector.push(val);
    sumSq += val * val;
  }
  const norm = Math.sqrt(sumSq) || 1;
  return vector.map(v => v / norm);
}

/**
 * Calculates the cosine similarity between two vectors.
 */
export function cosineSimilarity(v1, v2) {
  if (!v1 || !v2 || v1.length !== v2.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < v1.length; i++) {
    dotProduct += v1[i] * v2[i];
    normA += v1[i] * v1[i];
    normB += v2[i] * v2[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
