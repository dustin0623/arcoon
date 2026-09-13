import type { Request, Response } from 'express'
import * as playerService from './player.service'

interface LoginRequest {
  username: string
  signature: string
  referral?: string
}

export async function handleLogin(req: Request<object, object, LoginRequest>, res: Response): Promise<void> {
  try {
    const { username, signature, referral } = req.body
    const result = await playerService.loginPlayer(username, signature, referral)
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message })
  }
}
