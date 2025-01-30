import { AccountsSeeder } from './seeders/AccountsSeeder'
import { Seeder } from './seeders/SeederInterface'

const seeders: Seeder[] = [new AccountsSeeder()]

seeders.forEach(async (seeder) => {
  try {
    await seeder.seed()
  } catch (error) {
    console.error(`Error seeding ${seeder.constructor.name}: ${error}`)
  }
})
