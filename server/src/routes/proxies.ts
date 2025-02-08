import { Router } from 'express'
import {
  addProxy,
  importProxyList,
  toggleProxy,
  deleteProxy,
  updateProxy,
  listProxies,
} from '../controllers/poxyController'

const router = Router()

// Route to add a new proxy.
router.post('/', addProxy)

// Route to import a list of proxies.
router.post('/import', importProxyList)

// Route to list all proxies.
router.get('/', listProxies)

// Route to toggle the active status of a proxy by ID.
router.patch('/:id/toggle', toggleProxy)

// Route to update a proxy by ID.
router.put('/:id', updateProxy)

// Route to delete a proxy by ID.
router.delete('/:id', deleteProxy)

export default router
