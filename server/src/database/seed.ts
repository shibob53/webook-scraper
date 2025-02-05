import 'reflect-metadata'
import { AccountsSeeder } from './seeders/AccountsSeeder'
import { Seeder } from './seeders/SeederInterface'
import { AppDataSource } from '../data-source'

const seeders: Seeder[] = [new AccountsSeeder()]

seeders.forEach(async (seeder) => {
  try {
    const source = await AppDataSource.initialize()
    await seeder.seed(source)
  } catch (error) {
    console.error(`Error seeding ${seeder.constructor.name}: ${error}`)
  }
})
