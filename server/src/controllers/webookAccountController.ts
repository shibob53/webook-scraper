import { Request, Response } from 'express'
import { AppDataSource } from '../data-source'
import WebookAccount from '../entity/WebookAccount'

/**
 * Create a new WebookAccount.
 * Expects: { email, password, jwt?, jwtExpiresIn?, cookiesJson?, disabled?, apiToken?, userId }
 */
const addWebookAccount = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      jwt,
      jwtExpiresIn,
      cookiesJson,
      disabled,
      apiToken,
      userId,
    } = req.body

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' })
      return
    }

    const accountRepo = AppDataSource.getRepository(WebookAccount)
    const account = new WebookAccount()
    account.email = email
    account.password = password
    account.jwt = jwt
    account.jwtExpiresIn = jwtExpiresIn
    account.cookiesJson = cookiesJson
    account.disabled = disabled !== undefined ? disabled : false
    account.apiToken =
      apiToken ||
      'e9aac1f2f0b6c07d6be070ed14829de684264278359148d6a582ca65a50934d2'
    if (userId) {
      // Minimal assignment; ideally, you’d fetch the User entity.
      account.user = { id: userId } as any
    }

    const savedAccount = await accountRepo.save(account)
    res.status(201).json({
      message: 'WebookAccount added successfully',
      account: savedAccount,
    })
    return
  } catch (error: any) {
    console.error('Error adding WebookAccount:', error)
    res
      .status(500)
      .json({ message: 'Error adding WebookAccount', error: error.message })
    return
  }
}

/**
 * Bulk import WebookAccounts.
 * Expects: { accounts: Array<{ email, password, jwt?, jwtExpiresIn?, cookiesJson?, disabled?, apiToken?, userId }> }
 */
const importWebookAccounts = async (req: Request, res: Response) => {
  try {
    const accountsData = req.body.accounts
    if (!Array.isArray(accountsData)) {
      res.status(400).json({ message: 'Accounts should be an array.' })
      return
    }

    const accountRepo = AppDataSource.getRepository(WebookAccount)
    const accountsToSave = accountsData.map((data: any) => {
      const account = new WebookAccount()
      account.email = data.email
      account.password = data.password
      account.jwt = data.jwt
      account.jwtExpiresIn = data.jwtExpiresIn
      account.cookiesJson = data.cookiesJson
      account.disabled = data.disabled !== undefined ? data.disabled : false
      account.apiToken =
        data.apiToken ||
        'e9aac1f2f0b6c07d6be070ed14829de684264278359148d6a582ca65a50934d2'
      if (data.userId) {
        account.user = { id: data.userId } as any
      }
      return account
    })

    const savedAccounts = await accountRepo.save(accountsToSave)
    res.status(201).json({
      message: 'WebookAccounts imported successfully',
      accounts: savedAccounts,
    })
    return
  } catch (error: any) {
    console.error('Error importing WebookAccounts:', error)
    res
      .status(500)
      .json({ message: 'Error importing WebookAccounts', error: error.message })
    return
  }
}

/**
 * Toggle the disabled status of a WebookAccount.
 * Expects account ID in req.params.id.
 */
const toggleWebookAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (!id) {
      res.status(400).json({ message: 'Account ID is required.' })
      return
    }

    const accountRepo = AppDataSource.getRepository(WebookAccount)
    const account = await accountRepo.findOne({ where: { id: Number(id) } })
    if (!account) {
      res.status(404).json({ message: 'WebookAccount not found.' })
      return
    }

    account.disabled = !account.disabled
    const updatedAccount = await accountRepo.save(account)
    res.status(200).json({
      message: 'WebookAccount toggled successfully',
      account: updatedAccount,
    })
    return
  } catch (error: any) {
    console.error('Error toggling WebookAccount:', error)
    res
      .status(500)
      .json({ message: 'Error toggling WebookAccount', error: error.message })
    return
  }
}

/**
 * Update a WebookAccount.
 * Expects account ID in req.params.id and new values in req.body.
 */
const updateWebookAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const {
      email,
      password,
      jwt,
      jwtExpiresIn,
      cookiesJson,
      disabled,
      apiToken,
      userId,
    } = req.body

    if (!id) {
      res.status(400).json({ message: 'Account ID is required.' })
      return
    }

    const accountRepo = AppDataSource.getRepository(WebookAccount)
    const account = await accountRepo.findOne({ where: { id: Number(id) } })
    if (!account) {
      res.status(404).json({ message: 'WebookAccount not found.' })
      return
    }

    if (email !== undefined) account.email = email
    if (password !== undefined) account.password = password
    if (jwt !== undefined) account.jwt = jwt
    if (jwtExpiresIn !== undefined) account.jwtExpiresIn = jwtExpiresIn
    if (cookiesJson !== undefined) account.cookiesJson = cookiesJson
    if (disabled !== undefined) account.disabled = disabled
    if (apiToken !== undefined) account.apiToken = apiToken
    if (userId !== undefined) account.user = { id: userId } as any

    const updatedAccount = await accountRepo.save(account)
    res.status(200).json({
      message: 'WebookAccount updated successfully',
      account: updatedAccount,
    })
    return
  } catch (error: any) {
    console.error('Error updating WebookAccount:', error)
    res
      .status(500)
      .json({ message: 'Error updating WebookAccount', error: error.message })
    return
  }
}

/**
 * Delete a WebookAccount.
 * Expects account ID in req.params.id.
 */
const deleteWebookAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (!id) {
      res.status(400).json({ message: 'Account ID is required.' })
      return
    }

    const accountRepo = AppDataSource.getRepository(WebookAccount)
    const account = await accountRepo.findOne({ where: { id: Number(id) } })
    if (!account) {
      res.status(404).json({ message: 'WebookAccount not found.' })
      return
    }

    await accountRepo.remove(account)
    res.status(200).json({ message: 'WebookAccount deleted successfully' })
    return
  } catch (error: any) {
    console.error('Error deleting WebookAccount:', error)
    res
      .status(500)
      .json({ message: 'Error deleting WebookAccount', error: error.message })
    return
  }
}

/**
 * List all WebookAccounts.
 */
const listWebookAccounts = async (req: Request, res: Response) => {
  try {
    const accountRepo = AppDataSource.getRepository(WebookAccount)
    const accounts = await accountRepo.find()
    res
      .status(200)
      .json({ message: 'WebookAccounts fetched successfully', accounts })
    return
  } catch (error: any) {
    console.error('Error listing WebookAccounts:', error)
    res
      .status(500)
      .json({ message: 'Error listing WebookAccounts', error: error.message })
    return
  }
}

/**
 * Clear all WebookAccounts.
 * This method removes all records from the WebookAccount table.
 */
const clearAllWebookAccounts = async (req: Request, res: Response) => {
  try {
    const accountRepo = AppDataSource.getRepository(WebookAccount)
    await accountRepo.clear() // Removes all entries in the table
    res.status(200).json({ message: 'All WebookAccounts cleared successfully' })
    return
  } catch (error: any) {
    console.error('Error clearing WebookAccounts:', error)
    res
      .status(500)
      .json({ message: 'Error clearing WebookAccounts', error: error.message })
    return
  }
}

export {
  addWebookAccount,
  importWebookAccounts,
  toggleWebookAccount,
  updateWebookAccount,
  deleteWebookAccount,
  listWebookAccounts,
  clearAllWebookAccounts,
}
