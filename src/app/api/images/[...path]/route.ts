import { NextRequest, NextResponse } from 'next/server'
import { getStorage } from '@/lib/storage'

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params

    if (!segments || segments.length === 0) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 })
    }

    const key = segments.join('/')
    const storage = getStorage()

    const data = await storage.get(key)
    if (!data) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Determine content type from extension
    const ext = key.split('.').pop()?.toLowerCase() || ''
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream'

    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Failed to serve image:', error)
    return NextResponse.json(
      { error: 'Failed to serve image' },
      { status: 500 }
    )
  }
}
