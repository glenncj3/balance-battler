import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface StorageProvider {
  put(key: string, data: Buffer, contentType: string): Promise<string>
  get(key: string): Promise<Buffer | null>
  delete(key: string): Promise<void>
  deletePrefix(prefix: string): Promise<void>
  getPublicUrl(key: string): string
}

export class SupabaseStorageProvider implements StorageProvider {
  private client: SupabaseClient
  private bucket: string

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    this.bucket = process.env.SUPABASE_STORAGE_BUCKET || 'cardrank'

    if (!url || !key) {
      throw new Error(
        'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
      )
    }

    this.client = createClient(url, key)
  }

  async put(key: string, data: Buffer, contentType: string): Promise<string> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(key, data, {
        contentType,
        upsert: true,
      })

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`)
    }

    return this.getPublicUrl(key)
  }

  async get(key: string): Promise<Buffer | null> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .download(key)

    if (error) {
      return null
    }

    const arrayBuffer = await data.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  async delete(key: string): Promise<void> {
    await this.client.storage.from(this.bucket).remove([key])
  }

  async deletePrefix(prefix: string): Promise<void> {
    // List all files under the prefix, then delete them in batches
    const { data: files } = await this.client.storage
      .from(this.bucket)
      .list(prefix, { limit: 1000 })

    if (files && files.length > 0) {
      const paths = files.map((f) => `${prefix}/${f.name}`)
      await this.client.storage.from(this.bucket).remove(paths)
    }
  }

  getPublicUrl(key: string): string {
    const { data } = this.client.storage
      .from(this.bucket)
      .getPublicUrl(key)

    return data.publicUrl
  }
}

let storageInstance: StorageProvider | null = null

export function getStorage(): StorageProvider {
  if (!storageInstance) {
    storageInstance = new SupabaseStorageProvider()
  }
  return storageInstance
}
