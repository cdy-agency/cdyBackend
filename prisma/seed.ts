import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing in .env please');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter }); //PrismaClient = the object that lets you create, read, update, and delete data in your database.

async function main() {
  const hashedPassword = await bcrypt.hash('12345', 10);

  await prisma.user.create({
    data: {
      email: 'cdyagency@gmail.com',
      password: hashedPassword,
      role: 'Admin',
    },
  });
  console.log('user created succesfull');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
// connect to this database when running this script
