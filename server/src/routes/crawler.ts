import { Router } from 'express'
import { holdEvent } from '../controllers/cawlerController'

const router = Router()

router.post('/hold-event', holdEvent)

export default router
