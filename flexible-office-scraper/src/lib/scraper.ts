import axios, { AxiosResponse, AxiosRequestConfig } from 'axios'
import { chromium, Browser, Page, BrowserContext } from 'playwright'
import * as cheerio from 'cheerio'
import { createHash } from 'crypto'
import { pino } from 'pino'
import robotsParser from 'robots-txt-parse'
import { URL } from 'whatwg-url'
import { parseDomain } from 'tldts'

const logger = pino({ name: 'scraper' })

// ========== CONFIGURATION ==========

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
]

const DEFAULT_REQUEST_CONFIG: AxiosRequestConfig = {
  timeout: 30000,
  maxRedirects: 5,
  headers: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0',
  },
}

// ========== TYPES ==========

export interface ScrapingResult {
  url: string
  status: number
  headers: Record<string, string>
  content: string
  contentHash: string
  timing: {
    started: number
    completed: number
    duration: number
  }
  fetchTool: 'axios' | 'playwright'
  error?: string
}

export interface RobotsInfo {
  allowed: boolean
  crawlDelay?: number
  sitemaps: string[]
}

// ========== BROWSER MANAGER ==========

export class BrowserManager {
  private static instance: BrowserManager
  private browser?: Browser
  private contexts: Map<string, BrowserContext> = new Map()

  private constructor() {}

  public static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager()
    }
    return BrowserManager.instance
  }

  public async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
        ],
      })
      logger.info('Browser launched successfully')
    }
    return this.browser
  }

  public async getContext(domain: string): Promise<BrowserContext> {
    if (!this.contexts.has(domain)) {
      const browser = await this.getBrowser()
      const context = await browser.newContext({
        userAgent: USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true,
      })
      this.contexts.set(domain, context)
    }
    return this.contexts.get(domain)!
  }

  public async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = undefined
      this.contexts.clear()
      logger.info('Browser closed successfully')
    }
  }
}

// ========== SCRAPING UTILITIES ==========

export class ScrapingUtils {
  private static robotsCache = new Map<string, RobotsInfo>()
  private static requestDelay = parseInt(process.env.REQUEST_DELAY_MS || '2000')

  public static generateContentHash(content: string): string {
    return createHash('sha256').update(content).digest('hex')
  }

  public static getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
  }

  public static async delay(ms: number = this.requestDelay): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  public static normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      // Remove fragment, normalize protocol
      urlObj.hash = ''
      if (urlObj.protocol === 'http:' && urlObj.port === '80') {
        urlObj.port = ''
      }
      if (urlObj.protocol === 'https:' && urlObj.port === '443') {
        urlObj.port = ''
      }
      return urlObj.toString().replace(/\/$/, '') // Remove trailing slash
    } catch {
      return url
    }
  }

  public static extractDomain(url: string): string | null {
    try {
      const parsed = parseDomain(url)
      return parsed.domain || null
    } catch {
      return null
    }
  }

  public static async checkRobots(url: string): Promise<RobotsInfo> {
    const domain = this.extractDomain(url)
    if (!domain) {
      return { allowed: false, sitemaps: [] }
    }

    if (this.robotsCache.has(domain)) {
      return this.robotsCache.get(domain)!
    }

    try {
      const robotsUrl = `https://${domain}/robots.txt`
      const response = await axios.get(robotsUrl, {
        timeout: 10000,
        validateStatus: (status) => status === 200,
      })

      const robots = robotsParser(robotsUrl, response.data)
      const userAgent = process.env.USER_AGENT || 'FlexOfficeBot'
      
      const result: RobotsInfo = {
        allowed: robots.isAllowed(url, userAgent),
        crawlDelay: robots.getCrawlDelay(userAgent),
        sitemaps: robots.getSitemaps(),
      }

      this.robotsCache.set(domain, result)
      return result
    } catch (error) {
      logger.warn({ domain, error: error.message }, 'Failed to fetch robots.txt, assuming allowed')
      const result: RobotsInfo = { allowed: true, sitemaps: [] }
      this.robotsCache.set(domain, result)
      return result
    }
  }
}

// ========== AXIOS SCRAPER ==========

export class AxiosScraper {
  private static instance: AxiosScraper
  private axiosInstance = axios.create(DEFAULT_REQUEST_CONFIG)

  private constructor() {
    // Add request interceptor for delays and user agents
    this.axiosInstance.interceptors.request.use(async (config) => {
      // Add delay between requests
      await ScrapingUtils.delay()
      
      // Set random user agent
      config.headers!['User-Agent'] = ScrapingUtils.getRandomUserAgent()
      
      logger.debug({ url: config.url }, 'Making HTTP request')
      return config
    })

    // Add response interceptor for logging
    this.axiosInstance.interceptors.response.use(
      (response) => {
        logger.debug({ 
          url: response.config.url, 
          status: response.status 
        }, 'HTTP request successful')
        return response
      },
      (error) => {
        logger.warn({ 
          url: error.config?.url, 
          status: error.response?.status,
          error: error.message 
        }, 'HTTP request failed')
        return Promise.reject(error)
      }
    )
  }

  public static getInstance(): AxiosScraper {
    if (!AxiosScraper.instance) {
      AxiosScraper.instance = new AxiosScraper()
    }
    return AxiosScraper.instance
  }

  public async scrape(url: string): Promise<ScrapingResult> {
    const started = Date.now()
    
    try {
      // Check robots.txt first
      const robotsInfo = await ScrapingUtils.checkRobots(url)
      if (!robotsInfo.allowed) {
        throw new Error('Blocked by robots.txt')
      }

      const response: AxiosResponse = await this.axiosInstance.get(url)
      const completed = Date.now()

      const result: ScrapingResult = {
        url: ScrapingUtils.normalizeUrl(response.request.res.responseUrl || url),
        status: response.status,
        headers: response.headers as Record<string, string>,
        content: response.data,
        contentHash: ScrapingUtils.generateContentHash(response.data),
        timing: {
          started,
          completed,
          duration: completed - started,
        },
        fetchTool: 'axios',
      }

      logger.info({ 
        url: result.url, 
        status: result.status,
        contentLength: result.content.length,
        duration: result.timing.duration 
      }, 'Axios scraping completed')

      return result
    } catch (error) {
      const completed = Date.now()
      logger.error({ url, error: error.message, duration: completed - started }, 'Axios scraping failed')
      
      throw {
        url,
        status: 0,
        headers: {},
        content: '',
        contentHash: '',
        timing: { started, completed, duration: completed - started },
        fetchTool: 'axios',
        error: error.message,
      }
    }
  }

  public async scrapeWithCheerio(url: string) {
    const result = await this.scrape(url)
    const $ = cheerio.load(result.content)
    return { result, $ }
  }
}

// ========== PLAYWRIGHT SCRAPER ==========

export class PlaywrightScraper {
  private static instance: PlaywrightScraper
  private browserManager = BrowserManager.getInstance()

  private constructor() {}

  public static getInstance(): PlaywrightScraper {
    if (!PlaywrightScraper.instance) {
      PlaywrightScraper.instance = new PlaywrightScraper()
    }
    return PlaywrightScraper.instance
  }

  public async scrape(url: string, waitForSelector?: string): Promise<ScrapingResult> {
    const started = Date.now()
    let page: Page | undefined

    try {
      // Check robots.txt first
      const robotsInfo = await ScrapingUtils.checkRobots(url)
      if (!robotsInfo.allowed) {
        throw new Error('Blocked by robots.txt')
      }

      const domain = ScrapingUtils.extractDomain(url)
      const context = await this.browserManager.getContext(domain || 'default')
      page = await context.newPage()

      // Navigate to page
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000,
      })

      if (!response) {
        throw new Error('Failed to load page')
      }

      // Wait for specific selector if provided
      if (waitForSelector) {
        await page.waitForSelector(waitForSelector, { timeout: 10000 })
      }

      // Get page content and headers
      const content = await page.content()
      const headers = response.headers()
      const completed = Date.now()

      const result: ScrapingResult = {
        url: ScrapingUtils.normalizeUrl(page.url()),
        status: response.status(),
        headers,
        content,
        contentHash: ScrapingUtils.generateContentHash(content),
        timing: {
          started,
          completed,
          duration: completed - started,
        },
        fetchTool: 'playwright',
      }

      logger.info({ 
        url: result.url, 
        status: result.status,
        contentLength: result.content.length,
        duration: result.timing.duration 
      }, 'Playwright scraping completed')

      return result
    } catch (error) {
      const completed = Date.now()
      logger.error({ url, error: error.message, duration: completed - started }, 'Playwright scraping failed')
      
      throw {
        url,
        status: 0,
        headers: {},
        content: '',
        contentHash: '',
        timing: { started, completed, duration: completed - started },
        fetchTool: 'playwright',
        error: error.message,
      }
    } finally {
      if (page) {
        await page.close()
      }
    }
  }

  public async scrapeWithCheerio(url: string, waitForSelector?: string) {
    const result = await this.scrape(url, waitForSelector)
    const $ = cheerio.load(result.content)
    return { result, $ }
  }
}

// ========== UNIFIED SCRAPER ==========

export class UnifiedScraper {
  private axiosScraper = AxiosScraper.getInstance()
  private playwrightScraper = PlaywrightScraper.getInstance()

  public async scrape(url: string, usePlaywright: boolean = false): Promise<ScrapingResult> {
    try {
      if (usePlaywright) {
        return await this.playwrightScraper.scrape(url)
      } else {
        return await this.axiosScraper.scrape(url)
      }
    } catch (axiosError) {
      // Fallback to Playwright if axios fails
      if (!usePlaywright) {
        logger.warn({ url, error: axiosError.message }, 'Axios failed, falling back to Playwright')
        try {
          return await this.playwrightScraper.scrape(url)
        } catch (playwrightError) {
          logger.error({ url, axiosError: axiosError.message, playwrightError: playwrightError.message }, 'Both scrapers failed')
          throw playwrightError
        }
      }
      throw axiosError
    }
  }
}

// ========== EXPORTS ==========

export const browserManager = BrowserManager.getInstance()
export const axiosScraper = AxiosScraper.getInstance()
export const playwrightScraper = PlaywrightScraper.getInstance()
export const unifiedScraper = new UnifiedScraper()