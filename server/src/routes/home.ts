import express from 'express'

const router = express.Router()

router.get('/', (_, res) => {
  res.status(404).json({
    up: true,
  })
})

export default router
