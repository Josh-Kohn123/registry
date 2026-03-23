#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."
while ! pg_isready -h db -p 5432 > /dev/null 2>&1; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done
echo "PostgreSQL is up!"

echo "Running database migrations..."
npx prisma migrate deploy

echo "Checking if database needs seeding..."
# Simple check: if no events exist, run seed
RECORD_COUNT=$(PGPASSWORD=postgres psql -h db -U postgres -d registry_dev -tc "SELECT COUNT(*) FROM events;" 2>/dev/null || echo "0")
if [ "$RECORD_COUNT" = "0" ]; then
  echo "Database is empty. Running seed..."
  npx prisma db seed
fi

echo "Starting development server..."
npm run dev
