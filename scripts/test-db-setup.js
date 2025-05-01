const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load .env.test and override any existing env vars
const envTestPath = path.join(process.cwd(), '.env.test');
const envConfig = dotenv.parse(fs.readFileSync(envTestPath));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

// Debug helper
function logEnvironment(stage) {
  console.log(`\n=== ${stage} ===`);
  console.log('Current working directory:', process.cwd());
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('NODE_ENV:', process.env.NODE_ENV);
}

logEnvironment('Initial State');

// Run Prisma commands with explicit environment variable
try {
  console.log('\nRunning prisma db push...');
  execSync('prisma db push', { 
    stdio: 'inherit',
    env: { 
      ...process.env,
      PRISMA_SKIP_ENV_VALIDATION: "1"
    }
  });
  
  console.log('\nRunning prisma generate...');
  execSync('prisma generate', { 
    stdio: 'inherit',
    env: { 
      ...process.env,
      PRISMA_SKIP_ENV_VALIDATION: "1"
    }
  });
  
  console.log('\nDatabase setup complete!');
  logEnvironment('Final State');
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
} 