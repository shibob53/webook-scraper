// data-source.ts
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  entities: ['dist/src/entity/*.js'],
  synchronize: true,    // يجدر حذفها إذا كنت لا تريد تعديل الهيكل تلقائياً
  logging: false,
});
