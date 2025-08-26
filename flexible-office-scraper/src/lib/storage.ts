import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { createHash } from 'crypto'
import { pino } from 'pino'
import { ScrapingResult } from './scraper'

const logger = pino({ name: 'storage' })

// ========== CONFIGURATION ==========

const S3_CONFIG = {
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
  endpoint: process.env.S3_ENDPOINT, // For S3-compatible services
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true', // Required for some S3-compatible services
}

const BUCKET_NAME = process.env.S3_BUCKET || 'office-scraper-raw'

// ========== TYPES ==========

export interface StorageMetadata {
  contentHash: string
  originalUrl: string
  timestamp: string
  fetchTool: 'axios' | 'playwright'
  httpStatus: number
  contentType?: string
  contentLength: number
}

export interface RawSnapshotData {
  content: string
  metadata: StorageMetadata
  sidecarData: {
    headers: Record<string, string>
    timing: {
      started: number
      completed: number
      duration: number
    }
    scrapingResult: Omit<ScrapingResult, 'content'>
  }
}

// ========== S3 STORAGE MANAGER ==========

export class S3StorageManager {
  private static instance: S3StorageManager
  private s3Client: S3Client
  private bucketName: string

  private constructor() {
    this.s3Client = new S3Client(S3_CONFIG)
    this.bucketName = BUCKET_NAME
  }

  public static getInstance(): S3StorageManager {
    if (!S3StorageManager.instance) {
      S3StorageManager.instance = new S3StorageManager()
    }
    return S3StorageManager.instance
  }

  /**
   * Generate S3 key path for raw HTML snapshots
   * Format: raw/{operator_id}/{crawl_run_id}/{page_type}/{YYYY}/{MM}/{DD}/{content_hash}.html
   */
  public generateRawSnapshotKey(
    operatorId: string,
    crawlRunId: string,
    pageType: string,
    contentHash: string,
    timestamp: Date = new Date()
  ): string {
    const year = timestamp.getFullYear()
    const month = String(timestamp.getMonth() + 1).padStart(2, '0')
    const day = String(timestamp.getDate()).padStart(2, '0')
    
    return `raw/${operatorId}/${crawlRunId}/${pageType}/${year}/${month}/${day}/${contentHash}.html`
  }

  /**
   * Generate S3 key for sidecar metadata
   */
  public generateSidecarKey(htmlKey: string): string {
    return htmlKey.replace('.html', '.json')
  }

  /**
   * Store raw HTML snapshot with metadata
   */
  public async storeRawSnapshot(
    operatorId: string,
    crawlRunId: string,
    pageType: string,
    scrapingResult: ScrapingResult
  ): Promise<{ htmlKey: string; sidecarKey: string }> {
    const timestamp = new Date()
    const contentHash = scrapingResult.contentHash
    
    // Generate keys
    const htmlKey = this.generateRawSnapshotKey(operatorId, crawlRunId, pageType, contentHash, timestamp)
    const sidecarKey = this.generateSidecarKey(htmlKey)

    try {
      // Prepare metadata
      const metadata: StorageMetadata = {
        contentHash,
        originalUrl: scrapingResult.url,
        timestamp: timestamp.toISOString(),
        fetchTool: scrapingResult.fetchTool,
        httpStatus: scrapingResult.status,
        contentType: scrapingResult.headers['content-type'] || 'text/html',
        contentLength: scrapingResult.content.length,
      }

      // Prepare sidecar data
      const sidecarData = {
        headers: scrapingResult.headers,
        timing: scrapingResult.timing,
        scrapingResult: {
          url: scrapingResult.url,
          status: scrapingResult.status,
          headers: scrapingResult.headers,
          contentHash: scrapingResult.contentHash,
          timing: scrapingResult.timing,
          fetchTool: scrapingResult.fetchTool,
          error: scrapingResult.error,
        },
      }

      // Store HTML content
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: htmlKey,
        Body: scrapingResult.content,
        ContentType: 'text/html',
        Metadata: {
          'original-url': scrapingResult.url,
          'content-hash': contentHash,
          'fetch-tool': scrapingResult.fetchTool,
          'http-status': String(scrapingResult.status),
        },
      }))

      // Store sidecar JSON metadata
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: sidecarKey,
        Body: JSON.stringify({ metadata, sidecar: sidecarData }, null, 2),
        ContentType: 'application/json',
        Metadata: {
          'content-hash': contentHash,
          'original-url': scrapingResult.url,
        },
      }))

      logger.info({
        operatorId,
        crawlRunId,
        pageType,
        htmlKey,
        sidecarKey,
        contentLength: scrapingResult.content.length,
        contentHash,
      }, 'Raw snapshot stored successfully')

      return { htmlKey, sidecarKey }
    } catch (error) {
      logger.error({
        operatorId,
        crawlRunId,
        pageType,
        htmlKey,
        sidecarKey,
        error: error.message,
      }, 'Failed to store raw snapshot')
      throw error
    }
  }

  /**
   * Retrieve raw HTML content
   */
  public async getRawSnapshot(key: string): Promise<string> {
    try {
      const response = await this.s3Client.send(new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }))

      if (!response.Body) {
        throw new Error('Empty response body')
      }

      const content = await response.Body.transformToString()
      
      logger.debug({ key, contentLength: content.length }, 'Retrieved raw snapshot')
      return content
    } catch (error) {
      logger.error({ key, error: error.message }, 'Failed to retrieve raw snapshot')
      throw error
    }
  }

  /**
   * Retrieve sidecar metadata
   */
  public async getSidecarData(key: string): Promise<RawSnapshotData['sidecarData']> {
    try {
      const response = await this.s3Client.send(new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }))

      if (!response.Body) {
        throw new Error('Empty response body')
      }

      const jsonContent = await response.Body.transformToString()
      const data = JSON.parse(jsonContent)
      
      logger.debug({ key }, 'Retrieved sidecar data')
      return data.sidecar
    } catch (error) {
      logger.error({ key, error: error.message }, 'Failed to retrieve sidecar data')
      throw error
    }
  }

  /**
   * Check if content already exists (by content hash)
   */
  public async contentExists(operatorId: string, crawlRunId: string, pageType: string, contentHash: string): Promise<boolean> {
    const key = this.generateRawSnapshotKey(operatorId, crawlRunId, pageType, contentHash)
    
    try {
      await this.s3Client.send(new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }))
      return true
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false
      }
      throw error
    }
  }

  /**
   * Store structured data (for exports, reports, etc.)
   */
  public async storeStructuredData(
    key: string,
    data: any,
    contentType: 'application/json' | 'text/csv' | 'text/plain' = 'application/json'
  ): Promise<void> {
    try {
      let body: string
      if (contentType === 'application/json') {
        body = JSON.stringify(data, null, 2)
      } else {
        body = String(data)
      }

      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
        Metadata: {
          'stored-at': new Date().toISOString(),
        },
      }))

      logger.info({ key, contentType, size: body.length }, 'Structured data stored successfully')
    } catch (error) {
      logger.error({ key, contentType, error: error.message }, 'Failed to store structured data')
      throw error
    }
  }

  /**
   * Generate a unique crawl run ID
   */
  public static generateCrawlRunId(): string {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15)
    const random = Math.random().toString(36).substring(2, 8)
    return `${timestamp}-${random}`
  }

  /**
   * Calculate content hash for deduplication
   */
  public static calculateContentHash(content: string): string {
    return createHash('sha256').update(content).digest('hex')
  }

  /**
   * Generate batch export key for final results
   */
  public generateExportKey(
    operatorId: string | 'all',
    exportType: 'operators' | 'offices' | 'products' | 'full_dataset',
    format: 'csv' | 'json' | 'ndjson',
    timestamp: Date = new Date()
  ): string {
    const dateStr = timestamp.toISOString().split('T')[0]
    return `exports/${operatorId}/${exportType}/${dateStr}/${exportType}.${format}`
  }
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Batch store multiple scraping results
 */
export async function batchStoreSnapshots(
  operatorId: string,
  crawlRunId: string,
  results: Array<{ pageType: string; result: ScrapingResult }>
): Promise<Array<{ htmlKey: string; sidecarKey: string }>> {
  const storage = S3StorageManager.getInstance()
  const promises = results.map(({ pageType, result }) => 
    storage.storeRawSnapshot(operatorId, crawlRunId, pageType, result)
  )
  
  return await Promise.all(promises)
}

/**
 * Check for duplicate content across multiple results
 */
export function detectDuplicateContent(results: ScrapingResult[]): Map<string, ScrapingResult[]> {
  const duplicates = new Map<string, ScrapingResult[]>()
  
  for (const result of results) {
    const hash = result.contentHash
    if (!duplicates.has(hash)) {
      duplicates.set(hash, [])
    }
    duplicates.get(hash)!.push(result)
  }
  
  // Filter to only return actual duplicates (more than 1 result per hash)
  const actualDuplicates = new Map<string, ScrapingResult[]>()
  for (const [hash, results] of duplicates.entries()) {
    if (results.length > 1) {
      actualDuplicates.set(hash, results)
    }
  }
  
  return actualDuplicates
}

// ========== EXPORTS ==========

export const s3Storage = S3StorageManager.getInstance()