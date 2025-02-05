import { AppDataSource } from '../../data-source'
import WebookAccount from '../../entity/WebookAccount'
import { Seeder } from './SeederInterface'

export class AccountsSeeder implements Seeder {
  async seed(): Promise<void> {
    const emails1 = [
      'samir6437@postm.net',
      'mahmoud1686@postm.net',
      'mukhtar8115@postm.net',
      'raed8754@postm.net',
      'yasir1417@postm.net',
      'rafeeq5030@postm.net',
      'adil6193@postm.net',
      'haitham7187@postm.net',
      'nawaf9438@postm.net',
      'ismail1546@postm.net',
    ]

    const password1 = 'Qq-123123123'

    // insert all accounts

    for (const email of emails1) {
      const accounts = new WebookAccount()
      accounts.email = email
      accounts.password = password1

      await AppDataSource.manager.save(accounts)
    }
  }
}
