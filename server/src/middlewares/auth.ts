import { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { AppDataSource } from '../data-source'
import { User } from '../entity/User'

export const verifyToken: RequestHandler = async (req, res, next) => {
  try {
    // 1. Parse header
    const authHeader = req.headers.authorization
    if (!authHeader) {
      res.status(401).json({ message: 'No token provided' })
      return
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      res.status(401).json({ message: 'Invalid token format' })
      return
    }

    // 2. Verify JWT
    const secret =
      process.env.JWT_SECRET ||
      '$2a$12$1Mqyvh0nBHgrLDY5ms2KD.k5eCzxrVfhqwDcPW5cmfYIDLO.Y3Jse'

    const decoded = jwt.verify(token, secret) as {
      id: number
      username: string
    }

    // 3. Fetch user
    const repo = AppDataSource.getRepository(User)
    const user = await repo.findOneBy({ id: decoded.id })

    if (!user) {
      res.status(401).json({ message: 'User not found' })
      return
    }

    // 4. Attach to req
    req.body.jwt = token
    req.body.decoded = decoded
    req.body.user = user

    // 5. next() to continue
    next()
  } catch (err) {
    // Catch all JWT or DB errors
    res.status(401).json({ message: 'Unauthorized' })
    return
  }
}
