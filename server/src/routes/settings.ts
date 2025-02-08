import { Router } from 'express'
import { getSettings, saveSettings } from '../controllers/settingsController'

const router = Router()

router.post('/', saveSettings)
router.get('/', getSettings)

export default router
