import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST ?? "localhost",
  user: process.env.DATABASE_USER ?? "root",
  password: process.env.DATABASE_PASSWORD ?? "umar2006",
  database: process.env.DATABASE_NAME ?? "user_data_sys",
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

export default prisma;
