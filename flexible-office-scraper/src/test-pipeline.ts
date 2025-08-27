#!/usr/bin/env node

import { db } from './lib/database'
import { domainVerificationAgent } from './agents/domain-verification-agent'
import { pino } from 'pino'

const logger = pino({ name: 'test-pipeline' })

async function testPipeline() {
  try {
    await db.connect()
    
    // Get first 5 operators
    const operators = await db.prisma.operator.findMany({
      take: 5,
      orderBy: { created_at: 'asc' }
    })
    
    logger.info({ count: operators.length }, 'Starting test pipeline')
    
    // Create test domain candidates based on CSV data
    const testDomains = [
      { operator: operators[0], domain: 'wework.com' },
      { operator: operators[1], domain: 'regus.com' },
      { operator: operators[2], domain: 'spaces.com' },
      { operator: operators[3], domain: 'theyard.com' },
      { operator: operators[4], domain: 'convene.com' }
    ]
    
    // Create domain candidates
    for (const test of testDomains) {
      if (test.operator) {
        logger.info({ 
          operatorId: test.operator.id, 
          brandName: test.operator.brand_name,
          domain: test.domain
        }, 'Creating domain candidate')
        
        // Create domain candidate
        await db.prisma.domainCandidate.create({
          data: {
            operator_id: test.operator.id,
            url: `https://${test.domain}`,
            domain: test.domain,
            source: 'manual',
            confidence: 0.9
          }
        })
        
        // Run verification
        logger.info({ domain: test.domain }, 'Starting verification')
        
        const jobData = {
          operator_id: test.operator.id,
          domain: test.domain,
          brand_tokens: [test.operator.brand_name]
        }
        
        await domainVerificationAgent.processJob(jobData)
        
        logger.info({ domain: test.domain }, 'Verification completed')
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    // Show final stats
    const stats = await db.prisma.domainCandidate.groupBy({
      by: ['source'],
      _count: { _all: true }
    })
    
    const verified = await db.prisma.domainCandidate.count({
      where: { verified_at: { not: null } }
    })
    
    const websites = await db.prisma.website.count()
    
    logger.info({ 
      stats, 
      verified, 
      websites 
    }, 'Test pipeline completed')
    
  } catch (error) {
    logger.error({ error: error.message }, 'Test pipeline failed')
    process.exit(1)
  }
}

testPipeline()