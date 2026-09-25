import type { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { getAuthTokenFromCookies } from './cookie.js'
import type { JwtPayload } from '../interfaces/auth.js'

export const getJwtPayload = (req: Request): JwtPayload | null => {
  const token = getAuthTokenFromCookies(req)
  const secret = process.env['JWT_SECRET']
  if (!token || !secret) return null

  try {
    return jwt.verify(token, secret) as JwtPayload
  } catch {
    return null
  }
}

export const requireStaff = (req: Request, res: Response): JwtPayload | null => {
  const payload = getJwtPayload(req)
  if (!payload || !['TEACHER', 'ADMIN'].includes(payload.role)) {
    res.status(403).json({ message: 'Teacher access required' })
    return null
  }
  return payload
}
