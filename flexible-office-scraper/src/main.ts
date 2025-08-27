#!/usr/bin/env node

import { Command } from 'commander'
import { pino } from 'pino'
import * as fs from 'fs'
import * as path from 'path'
import { parse as parseCSV } from 'csv-parse/sync'
import { db } from './lib/database'
import { queueManager, addDomainDiscoveryJob, addDomainVerificationJob } from './lib/queue'
import { processDomainDiscoveryJob } from './agents/domain-discovery-agent'
import { processDomainVerificationJob } from './agents/domain-verification-agent'
import { OperatorInputSchema } from './lib/schemas'
import { v4 as uuidv4 } from 'uuid'

const logger = pino({ name: 'main-cli' })
const program = new Command()

// ========== MAIN CLI PROGRAM ==========

program
  .name('office-scraper')
  .description('Flexible Office Space Scraper - Office-First Architecture')
  .version('1.0.0')

// ========== DATABASE COMMANDS ==========

program
  .command('init')
  .description('Initialize database and run migrations')
  .action(async () => {
    try {
      logger.info('Initializing database...')
      await db.connect()
      
      // Generate and run Prisma migrations
      const { execSync } = await import('child_process')
      execSync('npx prisma migrate dev --name init', { stdio: 'inherit' })
      execSync('npx prisma generate', { stdio: 'inherit' })
      
      logger.info('Database initialized successfully')
    } catch (error) {
      logger.error({ error: error.message }, 'Database initialization failed')
      process.exit(1)
    }
  })

program
  .command('db-status')
  .description('Check database connection and health')
  .action(async () => {
    try {
      await db.connect()
      const isHealthy = await db.healthCheck()
      
      if (isHealthy) {
        logger.info('Database is healthy and connected')
        
        // Show basic stats
        const operatorCount = await db.prisma.operator.count()
        const domainCandidateCount = await db.prisma.domainCandidate.count()
        const websiteCount = await db.prisma.website.count()
        const officeCount = await db.prisma.office.count()
        
        console.log('\n=== Database Statistics ===')
        console.log(`Operators: ${operatorCount}`)
        console.log(`Domain Candidates: ${domainCandidateCount}`)
        console.log(`Verified Websites: ${websiteCount}`)
        console.log(`Offices: ${officeCount}`)
        
      } else {
        logger.error('Database health check failed')
        process.exit(1)
      }
    } catch (error) {
      logger.error({ error: error.message }, 'Database connection failed')
      process.exit(1)
    }
  })

// ========== OPERATOR MANAGEMENT ==========

program
  .command('load-operators')
  .description('Load operators from CSV file')
  .requiredOption('-f, --file <file>', 'CSV file path')
  .option('-c, --column <column>', 'Column name for operator names', 'name')
  .action(async (options) => {
    try {
      logger.info({ file: options.file }, 'Loading operators from CSV')
      
      if (!fs.existsSync(options.file)) {
        throw new Error(`File not found: ${options.file}`)
      }

      const csvContent = fs.readFileSync(options.file, 'utf-8')
      const records = parseCSV(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      })

      await db.connect()
      let loaded = 0
      let skipped = 0

      for (const record of records) {
        const operatorName = record[options.column]
        if (!operatorName) {
          logger.warn({ record }, 'Missing operator name, skipping')
          skipped++
          continue
        }

        try {
          // Validate and create operator
          const validatedInput = OperatorInputSchema.parse({
            name: operatorName,
            id: uuidv4()
          })

          await db.prisma.operator.upsert({
            where: { brand_name: validatedInput.name },
            update: {},
            create: {
              id: validatedInput.id!,
              brand_name: validatedInput.name,
              brand_tokens: [validatedInput.name],
            }
          })

          loaded++
          logger.debug({ operatorName }, 'Operator loaded')
        } catch (error) {
          logger.warn({ operatorName, error: error.message }, 'Failed to load operator')
          skipped++
        }
      }

      logger.info({ loaded, skipped, total: records.length }, 'Operator loading completed')
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to load operators')
      process.exit(1)
    }
  })

// ========== DOMAIN DISCOVERY ==========

program
  .command('discover-domains')
  .description('Discover domains for operators')
  .option('-o, --operator <id>', 'Specific operator ID')
  .option('-l, --limit <number>', 'Limit number of operators to process', '10')
  .option('--start-workers', 'Start background workers', false)
  .action(async (options) => {
    try {
      await db.connect()
      
      let operators
      if (options.operator) {
        operators = await db.prisma.operator.findMany({
          where: { id: options.operator }
        })
      } else {
        operators = await db.prisma.operator.findMany({
          where: {
            domain_candidates: {
              none: {} // Only operators without domain candidates
            }
          },
          take: parseInt(options.limit)
        })
      }

      if (operators.length === 0) {
        logger.info('No operators found for domain discovery')
        return
      }

      logger.info({ count: operators.length }, 'Starting domain discovery for operators')

      if (options.startWorkers) {
        // Start background workers
        await queueManager.addWorker('domain-discovery', processDomainDiscoveryJob)
        logger.info('Domain discovery workers started')
      }

      // Queue domain discovery jobs
      for (const operator of operators) {
        await addDomainDiscoveryJob(operator.brand_name, operator.id, 'medium')
        logger.info({ operatorId: operator.id, name: operator.brand_name }, 'Domain discovery job queued')
      }

      if (!options.startWorkers) {
        logger.info('Jobs queued. Use --start-workers to process them in background, or run workers separately.')
      } else {
        logger.info('Domain discovery jobs queued and workers started. Processing in background...')
        // Keep the process running for a bit to process jobs
        await new Promise(resolve => setTimeout(resolve, 30000)) // 30 seconds
      }

    } catch (error) {
      logger.error({ error: error.message }, 'Domain discovery failed')
      process.exit(1)
    }
  })

// ========== DOMAIN VERIFICATION ==========

program
  .command('verify-domains')
  .description('Verify discovered domain candidates')
  .option('-o, --operator <id>', 'Specific operator ID')
  .option('-l, --limit <number>', 'Limit number of candidates to verify', '20')
  .option('--start-workers', 'Start background workers', false)
  .action(async (options) => {
    try {
      await db.connect()
      
      let domainCandidates
      const whereClause: any = {
        verified_at: null,
        rejected_at: null,
        confidence: { gte: 0.3 } // Only verify candidates with some confidence
      }

      if (options.operator) {
        whereClause.operator_id = options.operator
      }

      domainCandidates = await db.prisma.domainCandidate.findMany({
        where: whereClause,
        include: {
          operator: true
        },
        orderBy: [
          { confidence: 'desc' },
          { created_at: 'asc' }
        ],
        take: parseInt(options.limit)
      })

      if (domainCandidates.length === 0) {
        logger.info('No domain candidates found for verification')
        return
      }

      logger.info({ count: domainCandidates.length }, 'Starting domain verification')

      if (options.startWorkers) {
        // Start background workers
        await queueManager.addWorker('domain-verification', processDomainVerificationJob)
        logger.info('Domain verification workers started')
      }

      // Queue verification jobs
      for (const candidate of domainCandidates) {
        await addDomainVerificationJob(
          candidate.operator_id,
          candidate.domain,
          candidate.operator.brand_tokens
        )
        logger.info({ 
          operatorId: candidate.operator_id, 
          domain: candidate.domain,
          confidence: candidate.confidence
        }, 'Domain verification job queued')
      }

      if (!options.startWorkers) {
        logger.info('Jobs queued. Use --start-workers to process them in background, or run workers separately.')
      } else {
        logger.info('Domain verification jobs queued and workers started. Processing in background...')
        await new Promise(resolve => setTimeout(resolve, 45000)) // 45 seconds for verification
      }

    } catch (error) {
      logger.error({ error: error.message }, 'Domain verification failed')
      process.exit(1)
    }
  })

// ========== PIPELINE COMMANDS ==========

program
  .command('run-discovery-pipeline')
  .description('Run complete domain discovery and verification pipeline')
  .option('-f, --file <file>', 'Operators CSV file')
  .option('-l, --limit <number>', 'Limit operators to process', '50')
  .option('--discovery-delay <ms>', 'Delay between discovery jobs (ms)', '2000')
  .option('--verification-delay <ms>', 'Delay between verification jobs (ms)', '3000')
  .action(async (options) => {
    try {
      logger.info('Starting complete domain discovery pipeline')
      await db.connect()

      // Step 1: Load operators if file provided
      if (options.file) {
        logger.info('Loading operators from file first...')
        // This would need to be implemented - for now assume operators are already loaded
      }

      // Step 2: Start all workers
      await queueManager.addWorker('domain-discovery', processDomainDiscoveryJob, { concurrency: 2 })
      await queueManager.addWorker('domain-verification', processDomainVerificationJob, { concurrency: 3 })
      
      logger.info('All workers started')

      // Step 3: Queue domain discovery for operators without candidates
      const operatorsForDiscovery = await db.prisma.operator.findMany({
        where: {
          domain_candidates: { none: {} }
        },
        take: parseInt(options.limit)
      })

      logger.info({ count: operatorsForDiscovery.length }, 'Queuing domain discovery jobs')
      
      for (const operator of operatorsForDiscovery) {
        await addDomainDiscoveryJob(operator.brand_name, operator.id, 'medium')
        await new Promise(resolve => setTimeout(resolve, parseInt(options.discoveryDelay)))
      }

      // Step 4: Wait a bit for discovery to complete, then queue verification
      logger.info('Waiting for domain discovery to complete before starting verification...')
      await new Promise(resolve => setTimeout(resolve, 30000)) // 30 second delay

      // Step 5: Queue domain verification
      const candidatesForVerification = await db.prisma.domainCandidate.findMany({
        where: {
          verified_at: null,
          rejected_at: null,
          confidence: { gte: 0.3 }
        },
        include: { operator: true },
        orderBy: { confidence: 'desc' },
        take: parseInt(options.limit) * 3 // More candidates than operators
      })

      logger.info({ count: candidatesForVerification.length }, 'Queuing domain verification jobs')
      
      for (const candidate of candidatesForVerification) {
        await addDomainVerificationJob(
          candidate.operator_id,
          candidate.domain,
          candidate.operator.brand_tokens
        )
        await new Promise(resolve => setTimeout(resolve, parseInt(options.verificationDelay)))
      }

      logger.info('Pipeline started. Jobs are processing in background. Use Ctrl+C to stop.')
      
      // Keep process running and show periodic stats
      const showStats = async () => {
        const stats = await queueManager.getAllQueueStats()
        console.log('\n=== Queue Statistics ===')
        for (const [queueName, queueStats] of Object.entries(stats)) {
          console.log(`${queueName}: waiting=${queueStats.waiting}, active=${queueStats.active}, completed=${queueStats.completed}, failed=${queueStats.failed}`)
        }
        
        const operatorStats = await db.prisma.operator.count()
        const candidateStats = await db.prisma.domainCandidate.count()
        const verifiedStats = await db.prisma.domainCandidate.count({ where: { verified_at: { not: null } } })
        const websiteStats = await db.prisma.website.count()
        
        console.log('\n=== Database Statistics ===')
        console.log(`Operators: ${operatorStats}`)
        console.log(`Domain Candidates: ${candidateStats}`)
        console.log(`Verified Domains: ${verifiedStats}`)
        console.log(`Websites: ${websiteStats}`)
        console.log('---')
      }

      // Show stats every 30 seconds
      const statsInterval = setInterval(showStats, 30000)
      
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\nShutting down gracefully...')
        clearInterval(statsInterval)
        await queueManager.closeAll()
        await db.disconnect()
        process.exit(0)
      })

      // Initial stats display
      await showStats()

    } catch (error) {
      logger.error({ error: error.message }, 'Pipeline execution failed')
      process.exit(1)
    }
  })

// ========== UTILITY COMMANDS ==========

program
  .command('stats')
  .description('Show system statistics')
  .action(async () => {
    try {
      await db.connect()
      
      const operatorCount = await db.prisma.operator.count()
      const candidateCount = await db.prisma.domainCandidate.count()
      const verifiedCount = await db.prisma.domainCandidate.count({ where: { verified_at: { not: null } } })
      const rejectedCount = await db.prisma.domainCandidate.count({ where: { rejected_at: { not: null } } })
      const websiteCount = await db.prisma.website.count()
      const officeCount = await db.prisma.office.count()
      
      console.log('\n=== System Statistics ===')
      console.log(`Operators Loaded: ${operatorCount}`)
      console.log(`Domain Candidates Found: ${candidateCount}`)
      console.log(`Domains Verified: ${verifiedCount}`)
      console.log(`Domains Rejected: ${rejectedCount}`)
      console.log(`Active Websites: ${websiteCount}`)
      console.log(`Offices Detected: ${officeCount}`)
      
      if (candidateCount > 0) {
        const verificationRate = ((verifiedCount / candidateCount) * 100).toFixed(1)
        console.log(`Verification Success Rate: ${verificationRate}%`)
      }

      // Queue stats if available
      try {
        const queueStats = await queueManager.getAllQueueStats()
        console.log('\n=== Queue Statistics ===')
        for (const [queueName, stats] of Object.entries(queueStats)) {
          console.log(`${queueName}: waiting=${stats.waiting}, active=${stats.active}, completed=${stats.completed}, failed=${stats.failed}`)
        }
      } catch (error) {
        console.log('Queue statistics unavailable (Redis not connected)')
      }
      
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to retrieve statistics')
      process.exit(1)
    }
  })

// ========== WORKER COMMANDS ==========

program
  .command('workers')
  .description('Start background workers for job processing')
  .option('--discovery', 'Start domain discovery workers')
  .option('--verification', 'Start domain verification workers')
  .option('--all', 'Start all available workers')
  .option('-c, --concurrency <number>', 'Worker concurrency', '3')
  .action(async (options) => {
    try {
      const concurrency = parseInt(options.concurrency)
      
      if (options.all || options.discovery) {
        await queueManager.addWorker('domain-discovery', processDomainDiscoveryJob, { concurrency })
        logger.info('Domain discovery workers started')
      }
      
      if (options.all || options.verification) {
        await queueManager.addWorker('domain-verification', processDomainVerificationJob, { concurrency })
        logger.info('Domain verification workers started')
      }
      
      logger.info('Workers started. Press Ctrl+C to stop.')
      
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\nShutting down workers...')
        await queueManager.closeAll()
        process.exit(0)
      })
      
      // Keep process running
      await new Promise(() => {}) // Run forever
      
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to start workers')
      process.exit(1)
    }
  })

// ========== MAIN EXECUTION ==========

program.parse()

// Handle unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Rejection')
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught Exception')
  process.exit(1)
})