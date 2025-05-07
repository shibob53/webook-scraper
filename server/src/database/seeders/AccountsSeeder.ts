import { AppDataSource } from '../../data-source'
import WebookAccount from '../../entity/WebookAccount'
import { Seeder } from './SeederInterface'

export class AccountsSeeder implements Seeder {
  async seed(): Promise<void> {
    const emails1 = [
      'shibob53@gmail.com' 
    ]

    const password1 = 'Tr|g,8s`oPw7dOf?_bkR'

    // insert all accounts

    for (const email of emails1) {
      const accounts = new WebookAccount()
      accounts.email = email
      accounts.password = password1

      await AppDataSource.manager.save(accounts)
    }
  }
}
