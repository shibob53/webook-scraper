import { Router } from 'express'
import {
  addWebookAccount,
  importWebookAccounts,
  toggleWebookAccount,
  updateWebookAccount,
  deleteWebookAccount,
  listWebookAccounts,
  clearAllWebookAccounts,
} from '../controllers/webookAccountController'

const router = Router()

router.post('/', addWebookAccount)
router.post('/import', importWebookAccounts)
router.post('/clear', clearAllWebookAccounts)
router.get('/', listWebookAccounts)
router.patch('/:id/toggle', toggleWebookAccount)
router.put('/:id', updateWebookAccount)
router.delete('/:id', deleteWebookAccount)

export default router
