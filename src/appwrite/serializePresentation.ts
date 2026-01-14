const MAX_APPWRITE_DATA_LENGTH = 100000;
const COMPRESSED_PREFIX = "gz:";

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function gzipToBase64(value: string) {
  if (typeof CompressionStream === "undefined") {
    throw new Error("CompressionStream is not supported.");
  }
  const encoder = new TextEncoder();
  const stream = new Blob([encoder.encode(value)])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));
  const buffer = await new Response(stream).arrayBuffer();
  return bytesToBase64(new Uint8Array(buffer));
}

async function ungzipFromBase64(base64: string) {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("DecompressionStream is not supported.");
  }
  const bytes = base64ToBytes(base64);
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  const buffer = await new Response(stream).arrayBuffer();
  return new TextDecoder().decode(buffer);
}

export async function serializePresentation(raw: string) {
  if (raw.length <= MAX_APPWRITE_DATA_LENGTH) {
    return raw;
  }
  const compressed = await gzipToBase64(raw);
  const payload = `${COMPRESSED_PREFIX}${compressed}`;
  if (payload.length > MAX_APPWRITE_DATA_LENGTH) {
    throw new Error("Presentation is too large to save (limit 100000 chars).");
  }
  return payload;
}

export async function deserializePresentation(payload: string) {
  if (payload.startsWith(COMPRESSED_PREFIX)) {
    const base64 = payload.slice(COMPRESSED_PREFIX.length);
    return ungzipFromBase64(base64);
  }
  return payload;
}
