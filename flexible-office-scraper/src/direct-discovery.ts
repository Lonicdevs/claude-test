#!/usr/bin/env node

import { db } from './lib/database'
import { domainDiscoveryAgent } from './agents/domain-discovery-agent'
import { pino } from 'pino'

const logger = pino({ name: 'direct-discovery' })

async function runDirectDiscovery() {
  try {
    await db.connect()
    
    // Get first 10 operators
    const operators = await db.prisma.operator.findMany({
      take: 10,
      orderBy: { created_at: 'asc' }
    })
    
    logger.info({ count: operators.length }, 'Starting direct domain discovery')
    
    for (const operator of operators) {
      logger.info({ 
        operatorId: operator.id, 
        brandName: operator.brand_name 
      }, 'Processing operator')
      
      try {
        // Create discovery job data
        const jobData = {
          operator_id: operator.id,
          operator_name: operator.brand_name
        }
        
        // Run discovery directly
        await domainDiscoveryAgent.processJob(jobData)
        
        logger.info({ operatorId: operator.id }, 'Discovery completed')
        
        // Small delay to be respectful to search APIs
        await new Promise(resolve => setTimeout(resolve, 2000))
        
      } catch (error) {
        logger.error({ 
          operatorId: operator.id,
          error: error.message 
        }, 'Discovery failed for operator')
      }
    }
    
    // Show final stats
    const stats = await db.prisma.domainCandidate.groupBy({
      by: ['source'],
      _count: { _all: true }
    })
    
    logger.info({ stats }, 'Discovery completed for all operators')
    
  } catch (error) {
    logger.error({ error: error.message }, 'Direct discovery failed')
    process.exit(1)
  }
}

runDirectDiscovery()