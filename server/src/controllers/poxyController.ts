import { Request, Response } from 'express'
import { AppDataSource } from '../data-source'
import { Proxy } from '../entity/Proxy'
import { User } from '../entity/User'

/**
 * Adds a new proxy.
 * Expects in req.body: { ip: string, port: number, username?: string, password?: string, active?: boolean }
 */
const addProxy = async (req: Request & { user: User }, res: Response) => {
  try {
    const { ip, port, username, password, active } = req.body

    if (!ip || !port) {
      res.status(400).json({ message: 'IP and port are required.' })
      return
    }
    const user = req.user
    if (!user) {
      res.status(401).json({ message: 'No user on request' })
      return
    }

    const proxyRepo = AppDataSource.getRepository(Proxy)
    const proxy = new Proxy()
    proxy.userId = user.id
    proxy.ip = ip
    proxy.port = port
    proxy.username = username
    proxy.password = password
    // Default to true if 'active' is not provided
    proxy.active = active !== undefined ? active : true

    const savedProxy = await proxyRepo.save(proxy)
    res
      .status(201)
      .json({ message: 'Proxy added successfully', proxy: savedProxy })
    return
  } catch (error: any) {
    console.error('Error adding proxy:', error)
    res
      .status(500)
      .json({ message: 'Error adding proxy', error: error.message })
    return
  }
}

/**
 * Imports a list of proxies.
 * Expects in req.body: { proxies: Array<{ ip: string, port: number, username?: string, password?: string, active?: boolean }> }
 */
const importProxyList = async (req: Request, res: Response) => {
  try {
    const proxies = req.body.proxies

    if (!Array.isArray(proxies)) {
      res.status(400).json({ message: 'Proxies should be an array.' })
      return
    }

    const proxyRepo = AppDataSource.getRepository(Proxy)
    const proxiesToSave: Proxy[] = proxies.map((p: any) => {
      const proxy = new Proxy()
      proxy.userId = 1
      proxy.ip = p.ip
      proxy.port = p.port
      proxy.username = p.username
      proxy.password = p.password
      proxy.active = p.active !== undefined ? p.active : true

      return proxy
    })

    const savedProxies = await proxyRepo.save(proxiesToSave)
    res.status(201).json({
      message: 'Proxies imported successfully',
      proxies: savedProxies,
    })
    return
  } catch (error: any) {
    console.error('Error importing proxies:', error)
    res
      .status(500)
      .json({ message: 'Error importing proxies', error: error.message })
    return
  }
}

/**
 * Toggles the 'active' status of a proxy.
 * Expects the proxy ID in req.params.id.
 */
const toggleProxy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!id) {
      res.status(400).json({ message: 'Proxy ID is required.' })
      return
    }

    const proxyRepo = AppDataSource.getRepository(Proxy)
    const proxy = await proxyRepo.findOne({ where: { id: Number(id) } })

    if (!proxy) {
      res.status(404).json({ message: 'Proxy not found.' })
      return
    }

    proxy.active = !proxy.active
    const updatedProxy = await proxyRepo.save(proxy)
    res
      .status(200)
      .json({ message: 'Proxy toggled successfully', proxy: updatedProxy })
    return
  } catch (error: any) {
    console.error('Error toggling proxy:', error)
    res
      .status(500)
      .json({ message: 'Error toggling proxy', error: error.message })
    return
  }
}

/**
 * Deletes a proxy.
 * Expects the proxy ID in req.params.id.
 */
const deleteProxy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!id) {
      res.status(400).json({ message: 'Proxy ID is required.' })
      return
    }

    const proxyRepo = AppDataSource.getRepository(Proxy)
    const proxy = await proxyRepo.findOne({ where: { id: Number(id) } })

    if (!proxy) {
      res.status(404).json({ message: 'Proxy not found.' })
      return
    }

    await proxyRepo.remove(proxy)
    res.status(200).json({ message: 'Proxy deleted successfully' })
    return
  } catch (error: any) {
    console.error('Error deleting proxy:', error)
    res
      .status(500)
      .json({ message: 'Error deleting proxy', error: error.message })
    return
  }
}

/**
 * Updates a proxy.
 * Expects the proxy ID in req.params.id and new values in req.body.
 */
const updateProxy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { ip, port, username, password, active } = req.body

    if (!id) {
      res.status(400).json({ message: 'Proxy ID is required.' })
      return
    }

    const proxyRepo = AppDataSource.getRepository(Proxy)
    const proxy = await proxyRepo.findOne({ where: { id: Number(id) } })

    if (!proxy) {
      res.status(404).json({ message: 'Proxy not found.' })
      return
    }

    // Update fields if provided
    if (ip !== undefined) proxy.ip = ip
    if (port !== undefined) proxy.port = port
    if (username !== undefined) proxy.username = username
    if (password !== undefined) proxy.password = password
    if (active !== undefined) proxy.active = active

    const updatedProxy = await proxyRepo.save(proxy)
    res.status(200).json({
      message: 'Proxy updated successfully',
      proxy: updatedProxy,
    })
    return
  } catch (error: any) {
    console.error('Error updating proxy:', error)
    res
      .status(500)
      .json({ message: 'Error updating proxy', error: error.message })
    return
  }
}

/**
 * Lists all proxies.
 */
const listProxies = async (req: Request, res: Response) => {
  try {
    const proxyRepo = AppDataSource.getRepository(Proxy)
    const proxies = await proxyRepo.find()
    res.status(200).json({ message: 'Proxies fetched successfully', proxies })
    return
  } catch (error: any) {
    console.error('Error listing proxies:', error)
    res
      .status(500)
      .json({ message: 'Error listing proxies', error: error.message })
    return
  }
}

export {
  addProxy,
  importProxyList,
  toggleProxy,
  deleteProxy,
  updateProxy,
  listProxies,
}
