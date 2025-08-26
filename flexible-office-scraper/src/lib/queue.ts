import { Queue, Worker, Job, QueueOptions, WorkerOptions } from 'bullmq'
import { Redis } from 'ioredis'
import { pino } from 'pino'
import { 
  DomainDiscoveryJobSchema,
  DomainVerificationJobSchema,
  PageScrapingJobSchema,
  ExtractionJobSchema,
  OfficeResolutionJobSchema 
} from './schemas'
import type { z } from 'zod'

const logger = pino({ name: 'queue' })

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  db: 0,
}

// Create Redis connection
export const redis = new Redis(redisConfig)

// Queue configuration
const queueConfig: QueueOptions = {
  connection: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50,      // Keep last 50 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
}

// ========== QUEUE DEFINITIONS ==========

export const domainDiscoveryQueue = new Queue('domain-discovery', queueConfig)
export const domainVerificationQueue = new Queue('domain-verification', queueConfig)
export const crawlOrchestrationQueue = new Queue('crawl-orchestration', queueConfig)
export const pageScrapingQueue = new Queue('page-scraping', queueConfig)
export const extractionQueue = new Queue('extraction-processing', queueConfig)
export const officeResolutionQueue = new Queue('office-resolution', queueConfig)
export const storageQueue = new Queue('storage-operations', queueConfig)
export const qaQueue = new Queue('qa-processing', queueConfig)
export const rescrapeSchedulingQueue = new Queue('rescrape-scheduling', queueConfig)
export const monitoringQueue = new Queue('monitoring-tasks', queueConfig)

// ========== JOB TYPES ==========

export type DomainDiscoveryJob = z.infer<typeof DomainDiscoveryJobSchema>
export type DomainVerificationJob = z.infer<typeof DomainVerificationJobSchema>
export type PageScrapingJob = z.infer<typeof PageScrapingJobSchema>
export type ExtractionJob = z.infer<typeof ExtractionJobSchema>
export type OfficeResolutionJob = z.infer<typeof OfficeResolutionJobSchema>

// ========== QUEUE MANAGER ==========

export class QueueManager {
  private static instance: QueueManager
  private queues: Queue[]
  private workers: Worker[]

  private constructor() {
    this.queues = [
      domainDiscoveryQueue,
      domainVerificationQueue,
      crawlOrchestrationQueue,
      pageScrapingQueue,
      extractionQueue,
      officeResolutionQueue,
      storageQueue,
      qaQueue,
      rescrapeSchedulingQueue,
      monitoringQueue,
    ]
    this.workers = []
  }

  public static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager()
    }
    return QueueManager.instance
  }

  public async addJob(queueName: string, jobData: any, options?: any): Promise<Job> {
    const queue = this.findQueue(queueName)
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`)
    }

    logger.info({ queueName, jobId: jobData.id || 'auto' }, 'Adding job to queue')
    return await queue.add(queueName, jobData, options)
  }

  public async addWorker(
    queueName: string,
    processor: (job: Job) => Promise<any>,
    options?: WorkerOptions
  ): Promise<Worker> {
    const defaultWorkerOptions: WorkerOptions = {
      connection: redisConfig,
      concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'),
      ...options,
    }

    const worker = new Worker(queueName, processor, defaultWorkerOptions)

    // Event handlers for monitoring
    worker.on('completed', (job) => {
      logger.info({ jobId: job.id, queueName }, 'Job completed successfully')
    })

    worker.on('failed', (job, err) => {
      logger.error({ 
        jobId: job?.id, 
        queueName, 
        error: err.message,
        attempts: job?.attemptsMade || 0 
      }, 'Job failed')
    })

    worker.on('error', (err) => {
      logger.error({ queueName, error: err.message }, 'Worker error')
    })

    this.workers.push(worker)
    return worker
  }

  public async getQueueStats(queueName: string) {
    const queue = this.findQueue(queueName)
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`)
    }

    return {
      waiting: await queue.getWaiting(),
      active: await queue.getActive(),
      completed: await queue.getCompleted(),
      failed: await queue.getFailed(),
    }
  }

  public async getAllQueueStats() {
    const stats: Record<string, any> = {}
    
    for (const queue of this.queues) {
      const queueName = queue.name
      stats[queueName] = {
        waiting: (await queue.getWaiting()).length,
        active: (await queue.getActive()).length,
        completed: (await queue.getCompleted()).length,
        failed: (await queue.getFailed()).length,
      }
    }
    
    return stats
  }

  public async pauseQueue(queueName: string): Promise<void> {
    const queue = this.findQueue(queueName)
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`)
    }
    await queue.pause()
    logger.info({ queueName }, 'Queue paused')
  }

  public async resumeQueue(queueName: string): Promise<void> {
    const queue = this.findQueue(queueName)
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`)
    }
    await queue.resume()
    logger.info({ queueName }, 'Queue resumed')
  }

  public async closeAll(): Promise<void> {
    logger.info('Shutting down all queues and workers')
    
    // Close all workers first
    await Promise.all(this.workers.map(worker => worker.close()))
    
    // Close all queues
    await Promise.all(this.queues.map(queue => queue.close()))
    
    // Close Redis connection
    await redis.quit()
    
    logger.info('All queues and workers shut down successfully')
  }

  private findQueue(queueName: string): Queue | undefined {
    return this.queues.find(queue => queue.name === queueName)
  }
}

// ========== HELPER FUNCTIONS ==========

export async function addDomainDiscoveryJob(
  operatorName: string,
  operatorId: string,
  priority: 'high' | 'medium' | 'low' = 'medium'
): Promise<Job> {
  const jobData = DomainDiscoveryJobSchema.parse({
    operator_name: operatorName,
    operator_id: operatorId,
  })

  return await domainDiscoveryQueue.add('domain-discovery', jobData, {
    priority: priority === 'high' ? 10 : priority === 'medium' ? 5 : 1,
  })
}

export async function addDomainVerificationJob(
  operatorId: string,
  domain: string,
  brandTokens: string[] = []
): Promise<Job> {
  const jobData = DomainVerificationJobSchema.parse({
    operator_id: operatorId,
    domain,
    brand_tokens: brandTokens,
  })

  return await domainVerificationQueue.add('domain-verification', jobData)
}

export async function addPageScrapingJob(
  pageUrl: string,
  pageType: string,
  operatorId: string,
  priority: 'high' | 'medium' | 'low' = 'medium'
): Promise<Job> {
  const jobData = PageScrapingJobSchema.parse({
    page_url: pageUrl,
    page_type: pageType as any,
    operator_id: operatorId,
    priority,
  })

  return await pageScrapingQueue.add('page-scraping', jobData, {
    priority: priority === 'high' ? 10 : priority === 'medium' ? 5 : 1,
  })
}

// Singleton instance
export const queueManager = QueueManager.getInstance()