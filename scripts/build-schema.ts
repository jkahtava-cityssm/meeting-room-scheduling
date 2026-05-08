import * as fs from 'fs';
import * as path from 'path';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const DATABASE_TYPE = process.env.DATABASE_PROVIDER || 'sqlserver';
const BASE_SCHEMA_PATH = path.join(__dirname, '../prisma/base.schema.prisma');
const OUTPUT_SCHEMA_PATH = path.join(__dirname, '../prisma/schema.prisma');

const generateSchema = () => {
  try {
    // 1. Read the base model schema
    let schemaContent = fs.readFileSync(BASE_SCHEMA_PATH, 'utf-8');

    // 2. Define the header blocks
    const header = `datasource db {
                      provider = "${DATABASE_TYPE === 'sqlserver' ? 'sqlserver' : 'postgresql'}" 
                      url      = env("${DATABASE_TYPE === 'sqlserver' ? 'DATABASE_URL_SQLSERVER' : 'DATABASE_URL_POSTGRESQL'}")
                    }

                  generator client {
                    provider      = "prisma-client-js"
                    binaryTargets = ["native", "windows", "linux-musl-openssl-3.0.x"]
                  }`;

    // 3. Transformation Logic
    if (DATABASE_TYPE !== 'sqlserver') {
      console.log('--- Non-SQLServer DB detected. Stripping @db attributes. ---');

      // Matches @db. followed by anything until a space or end of line
      // e.g., @db.NVarChar(255), @db.VarChar(Max), @db.NVarChar(4000)
      schemaContent = schemaContent.replace(/@db\.[a-zA-Z0-9_]+(\([^)]*\))?/g, '');
    } else {
      console.log('--- SQLServer DB detected. Preserving schema attributes. ---');
    }

    // 4. Write the final file
    const finalSchema = header + schemaContent;
    fs.writeFileSync(OUTPUT_SCHEMA_PATH, finalSchema);

    console.log(`Successfully generated: ${OUTPUT_SCHEMA_PATH}`);
  } catch (error) {
    console.error('Error generating Prisma schema:', error);
    process.exit(1);
  }
};

generateSchema();
