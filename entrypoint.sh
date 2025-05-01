#!/bin/sh
set -e

echo "Waiting for the database to be ready..."
while ! nc -z db 5432; do
  sleep 2
done
echo "Database is up!"

# Run Prisma migrations (push schema changes)
npx prisma db push --accept-data-loss --skip-generate


# Run the initial seed script
tsx scripts/initial-seed.ts

# Start the application
exec node server.js
