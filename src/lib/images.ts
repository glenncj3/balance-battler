import sharp from 'sharp'

export interface ProcessedImage {
  original: Buffer
  thumbnailLg: Buffer
  thumbnailSm: Buffer
  format: 'png' | 'jpeg'
}

export function detectFormat(
  buffer: Buffer
): 'png' | 'jpeg' | 'pdf' | 'unknown' {
  if (buffer.length < 4) return 'unknown'

  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'png'
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg'
  }

  // PDF: %PDF (25 50 44 46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return 'pdf'
  }

  return 'unknown'
}

export function isPdf(buffer: Buffer): boolean {
  return detectFormat(buffer) === 'pdf'
}

export async function generateThumbnail(
  imageBuffer: Buffer,
  width: number
): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(width, undefined, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer()
}

export async function processImage(
  imageBuffer: Buffer,
  _filename: string
): Promise<ProcessedImage> {
  const detected = detectFormat(imageBuffer)

  let format: 'png' | 'jpeg'
  if (detected === 'png') {
    format = 'png'
  } else if (detected === 'jpeg') {
    format = 'jpeg'
  } else {
    // Default to jpeg for unknown formats
    format = 'jpeg'
  }

  const [thumbnailLg, thumbnailSm] = await Promise.all([
    generateThumbnail(imageBuffer, 400),
    generateThumbnail(imageBuffer, 80),
  ])

  return {
    original: imageBuffer,
    thumbnailLg,
    thumbnailSm,
    format,
  }
}
