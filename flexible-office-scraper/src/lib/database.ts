import { PrismaClient } from '@prisma/client'
import { pino } from 'pino'

const logger = pino({ name: 'database' })

class Database {
  private static instance: Database
  public prisma: PrismaClient

  private constructor() {
    this.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    })
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database()
    }
    return Database.instance
  }

  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect()
      logger.info('Database connected successfully')
    } catch (error) {
      logger.error({ error }, 'Failed to connect to database')
      throw error
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect()
      logger.info('Database disconnected successfully')
    } catch (error) {
      logger.error({ error }, 'Failed to disconnect from database')
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      logger.error({ error }, 'Database health check failed')
      return false
    }
  }
}

export const db = Database.getInstance()
export { PrismaClient } from '@prisma/client'