import { Request, RequestHandler, Response } from 'express'
import { User } from '../entity/User'
import { AppDataSource } from '../data-source'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export const login: RequestHandler = async (req: Request, res: Response) => {
  const { username, password } = req.body
  const repo = AppDataSource.getRepository(User)
  const user = await repo.findOneBy({ username })

  if (!user) {
    res.status(400).json({ message: 'User not found' })
    return
  }

  if (bcrypt.compareSync(password, user.password)) {
    // generate jwt
    const token = jwt.sign(
      { id: user.id, username: user.username },
      '$2a$12$1Mqyvh0nBHgrLDY5ms2KD.k5eCzxrVfhqwDcPW5cmfYIDLO.Y3Jse',
      {
        expiresIn: '2222h',
      }
    )
    user.jwt = token
    await repo.save(user)
    delete user.password
    res.json({ message: 'Logged in successfully', token, user })
    return
  }

  res.status(400).json({ message: 'Invalid password' })
  return
}
