import fs from 'fs/promises'
import path from 'path'

export interface StorageProvider {
  put(key: string, data: Buffer, contentType: string): Promise<string>
  get(key: string): Promise<Buffer | null>
  delete(key: string): Promise<void>
  deletePrefix(prefix: string): Promise<void>
  getPublicUrl(key: string): string
}

export class LocalStorageProvider implements StorageProvider {
  private basePath: string

  constructor(basePath?: string) {
    this.basePath = basePath || path.resolve(process.cwd(), 'storage')
  }

  async put(key: string, data: Buffer, _contentType: string): Promise<string> {
    const filePath = path.join(this.basePath, key)
    const dir = path.dirname(filePath)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(filePath, data)
    return this.getPublicUrl(key)
  }

  async get(key: string): Promise<Buffer | null> {
    const filePath = path.join(this.basePath, key)
    try {
      return await fs.readFile(filePath)
    } catch {
      return null
    }
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.basePath, key)
    try {
      await fs.unlink(filePath)
    } catch {
      // Ignore errors if file doesn't exist
    }
  }

  async deletePrefix(prefix: string): Promise<void> {
    const dirPath = path.join(this.basePath, prefix)
    try {
      await fs.rm(dirPath, { recursive: true, force: true })
    } catch {
      // Ignore errors if directory doesn't exist
    }
  }

  getPublicUrl(key: string): string {
    return `/api/images/${key}`
  }
}

let storageInstance: StorageProvider | null = null

export function getStorage(): StorageProvider {
  if (!storageInstance) {
    const provider = process.env.STORAGE_PROVIDER || 'local'

    switch (provider) {
      case 'local':
      default:
        storageInstance = new LocalStorageProvider()
        break
    }
  }

  return storageInstance
}
