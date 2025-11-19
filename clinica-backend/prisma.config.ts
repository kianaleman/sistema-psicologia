import dotenv from "dotenv";
dotenv.config(); // ← carga el archivo .env

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});


// node --loader ts-node/esm src/index.ts
