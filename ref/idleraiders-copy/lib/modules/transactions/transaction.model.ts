import mongoose, { Schema, Document, Model, Types } from 'mongoose'

// ═══════════════════════════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════════════════════════

export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type TransactionType = 'registration' | 'withdraw' | 'deposit' | 'dollar_purchase' | 'referral_payout'

export interface ITransaction {
  transactionId: string
  chainTxId?: string
  sender: string
  contract: string
  action: string
  status: TransactionStatus
  type: TransactionType
  metadata: Record<string, unknown>
  logs: Record<string, unknown>
  processedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface ITransactionDocument extends ITransaction, Document {
  _id: Types.ObjectId
}

// ═══════════════════════════════════════════════════════════════════════════════
// Schema
// ═══════════════════════════════════════════════════════════════════════════════

const TransactionSchema = new Schema<ITransactionDocument>(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    chainTxId: {
      type: String,
      index: true,
    },
    sender: {
      type: String,
      required: true,
      index: true,
    },
    contract: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['registration', 'withdraw', 'deposit', 'dollar_purchase', 'referral_payout'],
      required: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    logs: {
      type: Schema.Types.Mixed,
      default: {},
    },
    processedAt: Date,
  },
  { timestamps: true }
)

TransactionSchema.index({ type: 1, status: 1 })
TransactionSchema.index({ sender: 1, type: 1, status: 1 })

// ═══════════════════════════════════════════════════════════════════════════════
// Model Export
// ═══════════════════════════════════════════════════════════════════════════════

const Transaction: Model<ITransactionDocument> =
  mongoose.models.Transaction || mongoose.model<ITransactionDocument>('Transaction', TransactionSchema)

export { Transaction }
export default Transaction
