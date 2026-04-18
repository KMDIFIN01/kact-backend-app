import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const tsvPath = path.join(__dirname, 'data', 'lifetime-members.tsv');
  const fileContent = fs.readFileSync(tsvPath, 'utf-8');

  const records: Array<{
    first_name: string;
    last_name: string;
    email: string;
    membership_type: string;
    phone_number: string;
  }> = parse(fileContent, {
    columns: true,
    delimiter: '\t',
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`📄 Read ${records.length} rows from TSV file`);

  // Get existing emails to skip duplicates
  const existingMemberships = await prisma.membership.findMany({
    where: { membershipType: 'LIFETIME' },
    select: { email: true },
  });
  const existingEmails = new Set(
    existingMemberships.map((m) => m.email.toLowerCase())
  );

  const toInsert = records
    .filter((row) => {
      const email = row.email.trim().toLowerCase();
      if (!email) {
        console.log(`⚠️  Skipping row with empty email: ${row.first_name} ${row.last_name}`);
        return false;
      }
      if (existingEmails.has(email)) {
        console.log(`⏭️  Skipping duplicate: ${email}`);
        return false;
      }
      return true;
    })
    .map((row) => ({
      firstName: row.first_name?.trim() || '',
      lastName: row.last_name?.trim() || '',
      email: row.email.trim().toLowerCase(),
      phoneNumber: row.phone_number?.trim() || 'N/A',
      address1: 'N/A',
      city: 'N/A',
      state: 'N/A',
      zip: '00000',
      membershipType: 'LIFETIME' as const,
      paymentType: 'CASH' as const,
      membershipStatus: 'APPROVED' as const,
      approvedDate: new Date(),
    }));

  if (toInsert.length === 0) {
    console.log('✅ No new memberships to insert (all duplicates or empty).');
    return;
  }

  const result = await prisma.membership.createMany({
    data: toInsert,
    skipDuplicates: true,
  });

  console.log(`✅ Successfully inserted ${result.count} lifetime memberships`);
  console.log(`⏭️  Skipped ${records.length - toInsert.length} rows (duplicates/empty)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
