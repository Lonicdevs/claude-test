import { URL } from 'url'
import * as cheerio from 'cheerio'
import { pino } from 'pino'
import { parse as parseDomain } from 'tldts'
import { db } from '../lib/database'
import { DomainVerificationJobSchema } from '../lib/schemas'
import { unifiedScraper } from '../lib/scraper'
import type { ScrapingResult } from '../lib/scraper'
import type { z } from 'zod'

const logger = pino({ name: 'domain-verification-agent' })

// ========== TYPES ==========

export type DomainVerificationJob = z.infer<typeof DomainVerificationJobSchema>

export interface VerificationResult {
  verified: boolean
  confidence: number
  reasons: string[]
  rejectionReason?: string
  canonicalUrl?: string
  brandMatches: {
    titleMatch: boolean
    contentMatch: boolean
    metaMatch: boolean
    domainMatch: boolean
  }
  businessSignals: {
    hasContactInfo: boolean
    hasLocationInfo: boolean
    hasBusinessHours: boolean
    hasAboutSection: boolean
  }
  officeSpaceSignals: {
    mentionsCoworking: boolean
    mentionsOfficeSpace: boolean
    mentionsFlexible: boolean
    hasLocationPages: boolean
    hasPricing: boolean
  }
}

// ========== DOMAIN VERIFICATION AGENT ==========

export class DomainVerificationAgent {
  private static instance: DomainVerificationAgent

  private constructor() {}

  public static getInstance(): DomainVerificationAgent {
    if (!DomainVerificationAgent.instance) {
      DomainVerificationAgent.instance = new DomainVerificationAgent()
    }
    return DomainVerificationAgent.instance
  }

  /**
   * Main entry point for domain verification job processing
   */
  public async processJob(jobData: DomainVerificationJob): Promise<void> {
    logger.info({ 
      operatorId: jobData.operator_id, 
      domain: jobData.domain 
    }, 'Starting domain verification')

    try {
      // Validate input
      const validatedJob = DomainVerificationJobSchema.parse(jobData)
      
      // Perform comprehensive domain verification
      const verificationResult = await this.verifyDomain(
        validatedJob.domain,
        validatedJob.brand_tokens
      )
      
      // Update database with verification results
      await this.updateDomainCandidate(
        validatedJob.operator_id,
        validatedJob.domain,
        verificationResult
      )
      
      // Create website record if verified
      if (verificationResult.verified && verificationResult.canonicalUrl) {
        await this.createWebsiteRecord(
          validatedJob.operator_id,
          validatedJob.domain,
          verificationResult.canonicalUrl
        )
      }
      
      logger.info({ 
        operatorId: validatedJob.operator_id,
        domain: validatedJob.domain,
        verified: verificationResult.verified,
        confidence: verificationResult.confidence
      }, 'Domain verification completed')

    } catch (error) {
      logger.error({ 
        operatorId: jobData.operator_id, 
        domain: jobData.domain,
        error: error.message 
      }, 'Domain verification failed')
      throw error
    }
  }

  /**
   * Perform comprehensive domain verification
   */
  private async verifyDomain(domain: string, brandTokens: string[]): Promise<VerificationResult> {
    let scrapingResult: ScrapingResult

    try {
      // Try HTTPS first, then HTTP
      const httpsUrl = domain.startsWith('http') ? domain : `https://${domain}`
      scrapingResult = await unifiedScraper.scrape(httpsUrl)
    } catch (error) {
      try {
        const httpUrl = domain.startsWith('http') ? domain.replace('https:', 'http:') : `http://${domain}`
        scrapingResult = await unifiedScraper.scrape(httpUrl, true) // Force Playwright for problematic sites
      } catch (error2) {
        logger.warn({ domain, error: error2.message }, 'Domain unreachable')
        return {
          verified: false,
          confidence: 0,
          reasons: [],
          rejectionReason: `Domain unreachable: ${error2.message}`,
          brandMatches: {
            titleMatch: false,
            contentMatch: false,
            metaMatch: false,
            domainMatch: false
          },
          businessSignals: {
            hasContactInfo: false,
            hasLocationInfo: false,
            hasBusinessHours: false,
            hasAboutSection: false
          },
          officeSpaceSignals: {
            mentionsCoworking: false,
            mentionsOfficeSpace: false,
            mentionsFlexible: false,
            hasLocationPages: false,
            hasPricing: false
          }
        }
      }
    }

    // Check for obvious rejection reasons first
    const rejectionReason = this.checkRejectionReasons(scrapingResult)
    if (rejectionReason) {
      return {
        verified: false,
        confidence: 0,
        reasons: [],
        rejectionReason,
        brandMatches: {
          titleMatch: false,
          contentMatch: false,
          metaMatch: false,
          domainMatch: false
        },
        businessSignals: {
          hasContactInfo: false,
          hasLocationInfo: false,
          hasBusinessHours: false,
          hasAboutSection: false
        },
        officeSpaceSignals: {
          mentionsCoworking: false,
          mentionsOfficeSpace: false,
          mentionsFlexible: false,
          hasLocationPages: false,
          hasPricing: false
        }
      }
    }

    // Parse HTML content
    const $ = cheerio.load(scrapingResult.content)
    
    // Analyze page content for verification signals
    const brandMatches = this.analyzeBrandMatches($, brandTokens, domain)
    const businessSignals = this.analyzeBusinessSignals($)
    const officeSpaceSignals = this.analyzeOfficeSpaceSignals($)
    
    // Calculate overall confidence score
    const confidence = this.calculateConfidenceScore(brandMatches, businessSignals, officeSpaceSignals)
    
    // Generate reasons for the verification decision
    const reasons = this.generateReasons(brandMatches, businessSignals, officeSpaceSignals)
    
    // Determine if verification passes
    const verified = confidence >= 0.6 // Configurable threshold
    
    return {
      verified,
      confidence,
      reasons,
      canonicalUrl: scrapingResult.url,
      brandMatches,
      businessSignals,
      officeSpaceSignals
    }
  }

  /**
   * Check for obvious rejection reasons
   */
  private checkRejectionReasons(result: ScrapingResult): string | null {
    const content = result.content.toLowerCase()
    const url = result.url.toLowerCase()

    // Check for parked domains
    const parkedIndicators = [
      'this domain is for sale',
      'domain parking',
      'buy this domain',
      'parked domain',
      'coming soon',
      'under construction',
      'godaddy.com',
      'domain.com',
      'sedo.com'
    ]
    
    for (const indicator of parkedIndicators) {
      if (content.includes(indicator)) {
        return `Parked or placeholder domain: contains "${indicator}"`
      }
    }

    // Check for redirects to unrelated sites
    const unrelatedDomains = [
      'facebook.com',
      'twitter.com',
      'linkedin.com',
      'instagram.com',
      'youtube.com',
      'google.com',
      'wordpress.com',
      'blogspot.com',
      'wix.com',
      'squarespace.com'
    ]

    for (const unrelatedDomain of unrelatedDomains) {
      if (url.includes(unrelatedDomain)) {
        return `Redirects to unrelated platform: ${unrelatedDomain}`
      }
    }

    // Check for 404 or error pages
    if (result.status >= 400) {
      return `HTTP error: ${result.status}`
    }

    // Check for empty or minimal content
    if (content.length < 1000) {
      return 'Insufficient content (likely placeholder or error page)'
    }

    return null
  }

  /**
   * Analyze brand matching signals
   */
  private analyzeBrandMatches($: cheerio.CheerioAPI, brandTokens: string[], domain: string): VerificationResult['brandMatches'] {
    const title = $('title').text().toLowerCase()
    const metaDescription = $('meta[name="description"]').attr('content')?.toLowerCase() || ''
    const h1Text = $('h1').text().toLowerCase()
    const bodyText = $('body').text().toLowerCase()
    const domainLower = domain.toLowerCase()

    let titleMatch = false
    let contentMatch = false
    let metaMatch = false
    let domainMatch = false

    for (const token of brandTokens) {
      const tokenLower = token.toLowerCase()
      
      if (title.includes(tokenLower) || h1Text.includes(tokenLower)) {
        titleMatch = true
      }
      
      if (bodyText.includes(tokenLower)) {
        contentMatch = true
      }
      
      if (metaDescription.includes(tokenLower)) {
        metaMatch = true
      }
      
      if (domainLower.includes(tokenLower)) {
        domainMatch = true
      }
    }

    return { titleMatch, contentMatch, metaMatch, domainMatch }
  }

  /**
   * Analyze business-related signals
   */
  private analyzeBusinessSignals($: cheerio.CheerioAPI): VerificationResult['businessSignals'] {
    const pageText = $('body').text().toLowerCase()
    const links = $('a[href]').map((_, el) => $(el).attr('href')).get()
    
    // Check for contact information
    const hasContactInfo = /contact|phone|email|call|reach|get in touch|enquir/i.test(pageText) ||
                          links.some(link => /contact|about/i.test(link || ''))

    // Check for location information  
    const hasLocationInfo = /location|address|find us|visit|directions|map/i.test(pageText) ||
                           /\d+.*(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr|way|place|pl)/i.test(pageText)

    // Check for business hours
    const hasBusinessHours = /open|hours|monday|tuesday|wednesday|thursday|friday|saturday|sunday|24\/7|24 hours/i.test(pageText) ||
                            /\d{1,2}:\d{2}|am|pm/i.test(pageText)

    // Check for about section
    const hasAboutSection = /about us|about|our story|company|who we are/i.test(pageText) ||
                           links.some(link => /about/i.test(link || ''))

    return {
      hasContactInfo,
      hasLocationInfo,
      hasBusinessHours,
      hasAboutSection
    }
  }

  /**
   * Analyze office space and coworking signals
   */
  private analyzeOfficeSpaceSignals($: cheerio.CheerioAPI): VerificationResult['officeSpaceSignals'] {
    const pageText = $('body').text().toLowerCase()
    const links = $('a[href]').map((_, el) => $(el).attr('href')).get()
    
    // Check for coworking mentions
    const mentionsCoworking = /coworking|co-working|shared office|shared workspace/i.test(pageText)

    // Check for office space mentions
    const mentionsOfficeSpace = /office space|workspace|work space|meeting room|conference room|desk|private office/i.test(pageText)

    // Check for flexible/serviced office mentions
    const mentionsFlexible = /flexible|serviced|virtual|hot desk|hot-desk|dedicated desk|business center/i.test(pageText)

    // Check for location/spaces pages
    const hasLocationPages = links.some(link => /location|office|space|center|building/i.test(link || '')) ||
                            /our locations|find a location|all locations|spaces|offices/i.test(pageText)

    // Check for pricing information
    const hasPricing = /pricing|price|cost|rate|membership|plan|booking|reserve|book now/i.test(pageText) ||
                      links.some(link => /pricing|price|book|reserve/i.test(link || '')) ||
                      /\$\d+|\£\d+|€\d+|per month|per day|per hour/i.test(pageText)

    return {
      mentionsCoworking,
      mentionsOfficeSpace,
      mentionsFlexible,
      hasLocationPages,
      hasPricing
    }
  }

  /**
   * Calculate overall confidence score based on all signals
   */
  private calculateConfidenceScore(
    brandMatches: VerificationResult['brandMatches'],
    businessSignals: VerificationResult['businessSignals'],
    officeSpaceSignals: VerificationResult['officeSpaceSignals']
  ): number {
    let score = 0

    // Brand matching (40% weight)
    if (brandMatches.titleMatch) score += 0.15
    if (brandMatches.contentMatch) score += 0.10
    if (brandMatches.metaMatch) score += 0.05
    if (brandMatches.domainMatch) score += 0.10

    // Business signals (30% weight)
    if (businessSignals.hasContactInfo) score += 0.08
    if (businessSignals.hasLocationInfo) score += 0.08
    if (businessSignals.hasBusinessHours) score += 0.07
    if (businessSignals.hasAboutSection) score += 0.07

    // Office space signals (30% weight)
    if (officeSpaceSignals.mentionsCoworking) score += 0.10
    if (officeSpaceSignals.mentionsOfficeSpace) score += 0.08
    if (officeSpaceSignals.mentionsFlexible) score += 0.06
    if (officeSpaceSignals.hasLocationPages) score += 0.03
    if (officeSpaceSignals.hasPricing) score += 0.03

    return Math.min(1.0, score)
  }

  /**
   * Generate human-readable reasons for verification decision
   */
  private generateReasons(
    brandMatches: VerificationResult['brandMatches'],
    businessSignals: VerificationResult['businessSignals'],
    officeSpaceSignals: VerificationResult['officeSpaceSignals']
  ): string[] {
    const reasons: string[] = []

    // Brand matching reasons
    if (brandMatches.titleMatch) reasons.push('Brand name appears in page title')
    if (brandMatches.domainMatch) reasons.push('Brand name matches domain')
    if (brandMatches.contentMatch) reasons.push('Brand name found in page content')

    // Business signal reasons
    if (businessSignals.hasContactInfo) reasons.push('Contains contact information')
    if (businessSignals.hasLocationInfo) reasons.push('Contains location/address information')

    // Office space signal reasons
    if (officeSpaceSignals.mentionsCoworking) reasons.push('Mentions coworking or shared office')
    if (officeSpaceSignals.mentionsOfficeSpace) reasons.push('Mentions office space or workspace')
    if (officeSpaceSignals.hasLocationPages) reasons.push('Has location or spaces pages')
    if (officeSpaceSignals.hasPricing) reasons.push('Contains pricing information')

    return reasons
  }

  /**
   * Update domain candidate with verification results
   */
  private async updateDomainCandidate(
    operatorId: string,
    domain: string,
    verificationResult: VerificationResult
  ): Promise<void> {
    try {
      const updateData = {
        ...(verificationResult.verified ? { verified_at: new Date() } : { rejected_at: new Date() }),
        ...(verificationResult.rejectionReason && { rejection_reason: verificationResult.rejectionReason })
      }

      await db.prisma.domainCandidate.update({
        where: {
          operator_id_domain: {
            operator_id: operatorId,
            domain: domain
          }
        },
        data: updateData
      })

      logger.debug({ 
        operatorId, 
        domain, 
        verified: verificationResult.verified 
      }, 'Domain candidate updated')
    } catch (error) {
      logger.error({ 
        operatorId, 
        domain, 
        error: error.message 
      }, 'Failed to update domain candidate')
      throw error
    }
  }

  /**
   * Create website record for verified domain
   */
  private async createWebsiteRecord(operatorId: string, domain: string, canonicalUrl: string): Promise<void> {
    try {
      const normalizedDomain = this.extractDomain(canonicalUrl) || domain

      await db.prisma.website.upsert({
        where: {
          operator_id_domain: {
            operator_id: operatorId,
            domain: normalizedDomain
          }
        },
        update: {
          canonical_url: canonicalUrl,
          last_seen_at: new Date(),
          is_active: true
        },
        create: {
          operator_id: operatorId,
          domain: normalizedDomain,
          canonical_url: canonicalUrl,
          first_seen_at: new Date(),
          last_seen_at: new Date(),
          is_active: true
        }
      })

      logger.info({ operatorId, domain: normalizedDomain, canonicalUrl }, 'Website record created')
    } catch (error) {
      logger.error({ operatorId, domain, error: error.message }, 'Failed to create website record')
      throw error
    }
  }

  /**
   * Extract clean domain from URL
   */
  private extractDomain(url: string): string | null {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      const parsed = parseDomain(url)
      return parsed.hostname || null
    }
  }
}

// ========== WORKER FUNCTION ==========

export async function processDomainVerificationJob(jobData: any): Promise<void> {
  const agent = DomainVerificationAgent.getInstance()
  await agent.processJob(jobData)
}

// ========== EXPORTS ==========

export const domainVerificationAgent = DomainVerificationAgent.getInstance()