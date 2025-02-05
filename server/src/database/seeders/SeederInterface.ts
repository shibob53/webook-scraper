import { DataSource } from 'typeorm'

export interface Seeder {
  seed(dataSource: DataSource): Promise<void>
}
