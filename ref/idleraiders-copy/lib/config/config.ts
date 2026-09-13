// Environment
export const NODE_ENV: string = process.env.NODE_ENV || 'development'
export const IS_PRODUCTION: boolean = NODE_ENV === 'production'

// Database - Server-side only, never use NEXT_PUBLIC_ for sensitive data
export const MONGO_URI: string | undefined = IS_PRODUCTION
	? process.env.MONGO_URI
	: process.env.MONGO_URI_LOCAL || process.env.MONGO_URI

// JWT Configuration - Server-side only
const jwtSecret: string = process.env.JWT_SECRET || 'dev-secret'
export const JWT_SECRET_ENCODED: Uint8Array = new TextEncoder().encode(jwtSecret)
export const JWT_EXPIRY_SECONDS: number = 7 * 24 * 60 * 60 // 7 days

// Game Configuration
export const GAME_ACCOUNT_NAME: string = process.env.GAME_ACCOUNT_NAME || 'idleraiders'

// Blockchain Configuration - Server-side only
export const HIVE_ACTIVE_KEY: string | undefined = process.env.HIVE_ACTIVE_KEY

// Redis Configuration
export const REDIS_URL: string = process.env.REDIS_URL || 'redis://localhost:6379'

// Server Configuration
export const PORT: number = parseInt(process.env.PORT || '5000', 10)
export const CORS_ORIGIN: string = process.env.CORS_ORIGIN || 'http://localhost:3000'
