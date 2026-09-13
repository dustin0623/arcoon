import mongoose, { type Mongoose } from 'mongoose'
import { MONGO_URI } from './config'

interface MongooseCache {
	conn: Mongoose | null
	promise: Promise<Mongoose> | null
}

declare global {
	// eslint-disable-next-line no-var
	var __idleraidersMongoose: MongooseCache | undefined
}

const cached: MongooseCache = globalThis.__idleraidersMongoose ?? { conn: null, promise: null }

if (!globalThis.__idleraidersMongoose) {
	globalThis.__idleraidersMongoose = cached
}

export async function connectDB(): Promise<Mongoose> {
	// Check at runtime, not module load time
	if (!MONGO_URI) {
		throw new Error('Missing MongoDB connection string. Set MONGO_URI or MONGO_URI_LOCAL environment variable.')
	}

	if (cached.conn) return cached.conn

	if (!cached.promise) {
		cached.promise = mongoose
			.connect(MONGO_URI, {
				bufferCommands: false,
				maxPoolSize: 10,
			})
			.then((mongooseInstance) => mongooseInstance)
	}

	cached.conn = await cached.promise
	return cached.conn
}
