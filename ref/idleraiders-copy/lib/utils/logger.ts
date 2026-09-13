// Server-side logging utility to prevent exposing sensitive information in production
export const logger = {
	// Only log in development or when explicitly enabled
	isDev: process.env.NODE_ENV === 'development',

	debug: (label: string, data: unknown) => {
		if (logger.isDev) {
			console.log(`[${label}]`, data)
		}
	},

	info: (label: string, message: string) => {
		if (logger.isDev) {
			console.log(`[${label}]`, message)
		}
	},

	warn: (label: string, message: string) => {
		// Always warn, but don't expose details in production
		if (logger.isDev) {
			console.warn(`[${label}]`, message)
		}
	},

	error: (label: string, error: unknown, sanitize = true) => {
		const err = error instanceof Error ? error : new Error(String(error))

		if (logger.isDev) {
			// In development, log full details including stack
			console.error(`[${label}]`, {
				message: err.message,
				stack: err.stack,
			})
		} else {
			// In production, only log the error label and a generic message
			// Stack trace is never logged in production
			console.error(`[${label}] An error occurred`)
		}
	},

	// Get safe error message for client response
	getSafeErrorMessage: (error: unknown, fallback = 'An error occurred'): string => {
		if (!logger.isDev) {
			// Always return generic message in production
			return fallback
		}

		// In development, return the actual error
		if (error instanceof Error) {
			return error.message
		}
		return String(error)
	},
}
