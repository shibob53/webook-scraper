export default class AccountManager {
  public async getLoggedInAccounts(): Promise<string[]> {
    return []
  }

  public async loginAccount(email: string): Promise<void> {}

  public async getAccountTickets(email: string): Promise<number[]> {
    return []
  }

  // returns a list of booked tickets for the account
  public async accountBookedTickets(email: string): Promise<number[]> {
    return []
  }

  public async bookTicket(email: string, ticket: number): Promise<boolean> {
    return false
  }
}
