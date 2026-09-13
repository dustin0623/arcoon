import Transaction, { 
  type ITransaction, 
  type ITransactionDocument,
  type TransactionStatus,
  type TransactionType 
} from './transaction.model';
import type { FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface CreateTransactionData {
  transactionId: string;
  chainTxId?: string;
  sender: string;
  contract: string;
  action: string;
  status: TransactionStatus;
  type: TransactionType;
  metadata?: Record<string, unknown>;
  logs?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Repository Functions
// ═══════════════════════════════════════════════════════════════════════════════

export async function create(data: CreateTransactionData): Promise<ITransactionDocument> {
  return Transaction.create(data);
}

export async function findById(id: string): Promise<ITransactionDocument | null> {
  return Transaction.findById(id);
}

export async function findByTransactionId(transactionId: string): Promise<ITransactionDocument | null> {
  return Transaction.findOne({ transactionId });
}

export async function findByChainTxId(chainTxId: string): Promise<ITransactionDocument | null> {
  return Transaction.findOne({ chainTxId });
}

export async function findOne(filter: FilterQuery<ITransaction>): Promise<ITransactionDocument | null> {
  return Transaction.findOne(filter);
}

export async function findMany(
  filter: FilterQuery<ITransaction> = {},
  options: QueryOptions = {}
): Promise<ITransactionDocument[]> {
  return Transaction.find(filter, null, options);
}

export async function findBySender(sender: string, limit: number = 50): Promise<ITransactionDocument[]> {
  return Transaction.find({ sender })
    .sort({ createdAt: -1 })
    .limit(limit);
}

export async function findPendingBySender(sender: string, limit: number = 10): Promise<ITransactionDocument[]> {
  return Transaction.find({
    sender,
    status: { $in: ['pending', 'processing'] },
  })
    .sort({ createdAt: -1 })
    .limit(limit);
}

export async function findByStatus(
  status: TransactionStatus | TransactionStatus[],
  limit: number = 100
): Promise<ITransactionDocument[]> {
  const statusFilter = Array.isArray(status) ? { $in: status } : status;
  return Transaction.find({ status: statusFilter })
    .sort({ createdAt: 1 })
    .limit(limit);
}

export async function findByTypeAndStatus(
  type: TransactionType,
  status: TransactionStatus | TransactionStatus[],
  limit: number = 100
): Promise<ITransactionDocument[]> {
  const statusFilter = Array.isArray(status) ? { $in: status } : status;
  return Transaction.find({ type, status: statusFilter })
    .sort({ createdAt: 1 })
    .limit(limit);
}

export async function updateById(
  id: string,
  update: UpdateQuery<ITransaction>,
  options: QueryOptions = { returnDocument: 'after' }
): Promise<ITransactionDocument | null> {
  return Transaction.findByIdAndUpdate(id, update, options);
}

export async function updateStatus(
  id: string,
  status: TransactionStatus,
  logs?: Record<string, unknown>
): Promise<ITransactionDocument | null> {
  const update: UpdateQuery<ITransaction> = { 
    status,
    ...(status === 'completed' || status === 'failed' ? { processedAt: new Date() } : {}),
  };
  
  if (logs) {
    update.$set = { ...update.$set, logs };
  }
  
  return Transaction.findByIdAndUpdate(id, update, { returnDocument: 'after' });
}

export async function deleteById(id: string): Promise<ITransactionDocument | null> {
  return Transaction.findByIdAndDelete(id);
}

export async function count(filter: FilterQuery<ITransaction> = {}): Promise<number> {
  return Transaction.countDocuments(filter);
}

export async function countPending(): Promise<number> {
  return Transaction.countDocuments({ status: { $in: ['pending', 'processing'] } });
}
