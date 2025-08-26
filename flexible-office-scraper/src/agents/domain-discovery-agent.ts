import axios from 'axios'
import * as cheerio from 'cheerio'
import { URL } from 'url'
import { pino } from 'pino'
import { parseDomain } from 'tldts'
import { db } from '../lib/database'
import { DomainDiscoveryJobSchema, DomainCandidateSchema } from '../lib/schemas'
import { ScrapingUtils } from '../lib/scraper'
import type { z } from 'zod'

const logger = pino({ name: 'domain-discovery-agent' })

// ========== TYPES ==========

export type DomainDiscoveryJob = z.infer<typeof DomainDiscoveryJobSchema>

export interface DomainCandidate {
  domain: string
  url: string
  source: string
  confidence: number
  brandMatch?: boolean
  title?: string
  description?: string
}

// ========== DOMAIN DISCOVERY AGENT ==========

export class DomainDiscoveryAgent {
  private static instance: DomainDiscoveryAgent

  private constructor() {}

  public static getInstance(): DomainDiscoveryAgent {
    if (!DomainDiscoveryAgent.instance) {
      DomainDiscoveryAgent.instance = new DomainDiscoveryAgent()
    }
    return DomainDiscoveryAgent.instance
  }

  /**
   * Main entry point for domain discovery job processing
   */
  public async processJob(jobData: DomainDiscoveryJob): Promise<void> {
    logger.info({ 
      operatorId: jobData.operator_id, 
      operatorName: jobData.operator_name 
    }, 'Starting domain discovery')

    try {
      // Validate input
      const validatedJob = DomainDiscoveryJobSchema.parse(jobData)
      
      // Discover domain candidates using multiple methods
      const candidates = await this.discoverDomains(validatedJob.operator_name)
      
      // Score and rank candidates
      const scoredCandidates = await this.scoreCandidates(candidates, validatedJob.operator_name)
      
      // Store candidates in database
      await this.storeCandidates(validatedJob.operator_id, scoredCandidates)
      
      logger.info({ 
        operatorId: validatedJob.operator_id,
        candidatesFound: scoredCandidates.length 
      }, 'Domain discovery completed successfully')

    } catch (error) {
      logger.error({ 
        operatorId: jobData.operator_id, 
        error: error.message 
      }, 'Domain discovery failed')
      throw error
    }
  }

  /**
   * Discover domain candidates using multiple search strategies
   */
  private async discoverDomains(operatorName: string): Promise<DomainCandidate[]> {
    const candidates: DomainCandidate[] = []
    
    // Strategy 1: Direct search queries
    const searchQueries = this.generateSearchQueries(operatorName)
    for (const query of searchQueries) {
      try {
        const searchCandidates = await this.searchForDomains(query)
        candidates.push(...searchCandidates)
        await ScrapingUtils.delay(1000) // Respectful delay between searches
      } catch (error) {
        logger.warn({ query, error: error.message }, 'Search query failed')
      }
    }

    // Strategy 2: Direct domain guessing
    const guessCandidates = this.generateDomainGuesses(operatorName)
    for (const candidate of guessCandidates) {
      const isLive = await this.checkDomainLiveness(candidate.domain)
      if (isLive) {
        candidates.push(candidate)
      }
      await ScrapingUtils.delay(500)
    }

    // Deduplicate by domain
    return this.deduplicateCandidates(candidates)
  }

  /**
   * Generate search queries for finding operator websites
   */
  private generateSearchQueries(operatorName: string): string[] {
    const queries = [
      `"${operatorName}" coworking space`,
      `"${operatorName}" flexible office`,
      `"${operatorName}" workspace`,
      `"${operatorName}" shared office`,
      `${operatorName} site:*.com`,
      `${operatorName} locations offices`,
    ]

    // Add variations without quotes for broader search
    queries.push(
      `${operatorName} coworking`,
      `${operatorName} office space`,
      `${operatorName} meeting rooms`
    )

    return queries
  }

  /**
   * Search for domains using web search (fallback to scraping search engines)
   */
  private async searchForDomains(query: string): Promise<DomainCandidate[]> {
    const candidates: DomainCandidate[] = []

    try {
      // Try Google search first (scraping approach since we may not have API keys)
      const googleCandidates = await this.scrapeGoogleSearch(query)
      candidates.push(...googleCandidates)
    } catch (error) {
      logger.warn({ query, error: error.message }, 'Google search failed')
    }

    try {
      // Try Bing search as fallback
      const bingCandidates = await this.scrapeBingSearch(query)
      candidates.push(...bingCandidates)
    } catch (error) {
      logger.warn({ query, error: error.message }, 'Bing search failed')
    }

    return candidates
  }

  /**
   * Scrape Google search results (respectful and minimal)
   */
  private async scrapeGoogleSearch(query: string): Promise<DomainCandidate[]> {
    const candidates: DomainCandidate[] = []
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10`

    try {
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 10000,
      })

      const $ = cheerio.load(response.data)

      // Extract search result links
      $('a[href]').each((_, element) => {
        const href = $(element).attr('href')
        if (href?.startsWith('/url?q=')) {
          try {
            const urlParam = new URLSearchParams(href.substring(6))
            const actualUrl = urlParam.get('q')
            if (actualUrl && this.isValidWebsiteUrl(actualUrl)) {
              const domain = this.extractDomain(actualUrl)
              if (domain) {
                const title = $(element).text().trim()
                candidates.push({
                  domain,
                  url: actualUrl,
                  source: 'google',
                  confidence: 0.7, // Base confidence for search results
                  title,
                })
              }
            }
          } catch (error) {
            // Skip malformed URLs
          }
        }
      })

      logger.debug({ query, candidatesFound: candidates.length }, 'Google search completed')
    } catch (error) {
      logger.error({ query, error: error.message }, 'Google search scraping failed')
    }

    return candidates.slice(0, 10) // Limit to top 10 results
  }

  /**
   * Scrape Bing search results
   */
  private async scrapeBingSearch(query: string): Promise<DomainCandidate[]> {
    const candidates: DomainCandidate[] = []
    const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=10`

    try {
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 10000,
      })

      const $ = cheerio.load(response.data)

      // Extract Bing search result links
      $('.b_algo h2 a, .b_title a').each((_, element) => {
        const href = $(element).attr('href')
        if (href && this.isValidWebsiteUrl(href)) {
          const domain = this.extractDomain(href)
          if (domain) {
            const title = $(element).text().trim()
            candidates.push({
              domain,
              url: href,
              source: 'bing',
              confidence: 0.7,
              title,
            })
          }
        }
      })

      logger.debug({ query, candidatesFound: candidates.length }, 'Bing search completed')
    } catch (error) {
      logger.error({ query, error: error.message }, 'Bing search scraping failed')
    }

    return candidates.slice(0, 10)
  }

  /**
   * Generate direct domain guesses based on operator name
   */
  private generateDomainGuesses(operatorName: string): DomainCandidate[] {
    const cleanName = operatorName.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '')

    const variations = [
      cleanName,
      cleanName.replace(/space|spaces|coworking|office|offices/g, ''),
      cleanName + 'space',
      cleanName + 'spaces',
      cleanName + 'coworking',
      cleanName + 'office',
      cleanName + 'offices',
      cleanName + 'work',
      cleanName + 'workspace',
    ].filter(v => v.length > 2)

    const tlds = ['.com', '.co', '.io', '.co.uk', '.org']
    const candidates: DomainCandidate[] = []

    for (const variation of variations) {
      for (const tld of tlds) {
        const domain = variation + tld
        candidates.push({
          domain,
          url: `https://${domain}`,
          source: 'domain_guess',
          confidence: 0.3, // Lower confidence for guesses
        })
      }
    }

    return candidates
  }

  /**
   * Check if a domain is live and reachable
   */
  private async checkDomainLiveness(domain: string): Promise<boolean> {
    try {
      const url = domain.startsWith('http') ? domain : `https://${domain}`
      const response = await axios.head(url, {
        timeout: 5000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500, // Accept redirects and client errors
      })
      return response.status < 500
    } catch (error) {
      // Try HTTP fallback
      try {
        const url = domain.startsWith('http') ? domain.replace('https:', 'http:') : `http://${domain}`
        const response = await axios.head(url, {
          timeout: 5000,
          maxRedirects: 5,
          validateStatus: (status) => status < 500,
        })
        return response.status < 500
      } catch {
        return false
      }
    }
  }

  /**
   * Score candidates based on various factors
   */
  private async scoreCandidates(candidates: DomainCandidate[], operatorName: string): Promise<DomainCandidate[]> {
    const brandTokens = this.generateBrandTokens(operatorName)
    
    for (const candidate of candidates) {
      let score = candidate.confidence

      // Boost score for brand token matches in domain
      const domainLower = candidate.domain.toLowerCase()
      for (const token of brandTokens) {
        if (domainLower.includes(token.toLowerCase())) {
          score += 0.3
        }
      }

      // Boost score for brand token matches in title
      if (candidate.title) {
        const titleLower = candidate.title.toLowerCase()
        for (const token of brandTokens) {
          if (titleLower.includes(token.toLowerCase())) {
            score += 0.2
          }
        }
      }

      // Boost score for relevant keywords
      const relevantKeywords = ['coworking', 'workspace', 'office', 'flexible', 'shared', 'space']
      for (const keyword of relevantKeywords) {
        if (domainLower.includes(keyword) || (candidate.title && candidate.title.toLowerCase().includes(keyword))) {
          score += 0.1
        }
      }

      // Penalty for very generic domains
      if (domainLower.includes('wordpress') || domainLower.includes('blogspot') || domainLower.includes('wix')) {
        score -= 0.3
      }

      candidate.confidence = Math.min(1.0, Math.max(0.0, score))
    }

    // Sort by confidence score (highest first)
    return candidates.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Generate brand tokens from operator name for matching
   */
  private generateBrandTokens(operatorName: string): string[] {
    const tokens: string[] = []
    
    // Add original name
    tokens.push(operatorName)
    
    // Add individual words
    const words = operatorName.toLowerCase().split(/\s+/).filter(word => word.length > 2)
    tokens.push(...words)
    
    // Add acronym if multiple words
    if (words.length > 1) {
      const acronym = words.map(word => word.charAt(0)).join('')
      if (acronym.length >= 2) {
        tokens.push(acronym)
      }
    }
    
    return [...new Set(tokens)] // Remove duplicates
  }

  /**
   * Store domain candidates in database
   */
  private async storeCandidates(operatorId: string, candidates: DomainCandidate[]): Promise<void> {
    try {
      for (const candidate of candidates) {
        const domainCandidateData = DomainCandidateSchema.parse({
          operator_id: operatorId,
          url: candidate.url,
          domain: candidate.domain,
          source: candidate.source as any,
          confidence: candidate.confidence,
        })

        await db.prisma.domainCandidate.upsert({
          where: {
            operator_id_domain: {
              operator_id: operatorId,
              domain: candidate.domain,
            },
          },
          update: {
            confidence: domainCandidateData.confidence,
            url: domainCandidateData.url,
            source: domainCandidateData.source,
          },
          create: domainCandidateData,
        })
      }

      logger.info({ operatorId, candidatesStored: candidates.length }, 'Domain candidates stored in database')
    } catch (error) {
      logger.error({ operatorId, error: error.message }, 'Failed to store domain candidates')
      throw error
    }
  }

  /**
   * Remove duplicate candidates by domain
   */
  private deduplicateCandidates(candidates: DomainCandidate[]): DomainCandidate[] {
    const seen = new Map<string, DomainCandidate>()
    
    for (const candidate of candidates) {
      const key = candidate.domain.toLowerCase()
      const existing = seen.get(key)
      
      if (!existing || candidate.confidence > existing.confidence) {
        seen.set(key, candidate)
      }
    }
    
    return Array.from(seen.values())
  }

  /**
   * Check if URL is a valid website URL (not social media, etc.)
   */
  private isValidWebsiteUrl(url: string): boolean {
    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.toLowerCase()
      
      // Skip social media and other non-website platforms
      const skipDomains = [
        'facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com',
        'youtube.com', 'tiktok.com', 'pinterest.com', 'reddit.com',
        'google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com',
        'wikipedia.org', 'wiki.', 'github.com', 'gitlab.com'
      ]
      
      for (const skipDomain of skipDomains) {
        if (hostname.includes(skipDomain)) {
          return false
        }
      }
      
      return true
    } catch {
      return false
    }
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string | null {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      // Try with tldts for more robust parsing
      const parsed = parseDomain(url)
      return parsed.hostname || null
    }
  }
}

// ========== WORKER FUNCTION ==========

export async function processDomainDiscoveryJob(jobData: any): Promise<void> {
  const agent = DomainDiscoveryAgent.getInstance()
  await agent.processJob(jobData)
}

// ========== EXPORTS ==========

export const domainDiscoveryAgent = DomainDiscoveryAgent.getInstance()