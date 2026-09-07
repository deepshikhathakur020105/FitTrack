/**
 * Environment variable validation
 * Ensures all required variables are set before starting the server
 */

const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'EMAIL_USER',
  'EMAIL_PASSWORD'
];

export function validateEnv() {
  const missing = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\n📋 Please check your .env file and ensure all required variables are set.\n');
    process.exit(1);
  }

  console.log('✅ All required environment variables are configured');
}

/**
 * Validate environment variable values
 */
export function validateEnvValues() {
  // JWT secrets should be at least 32 characters
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET.length < 32) {
      console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters in production');
    }
    if (process.env.JWT_REFRESH_SECRET.length < 32) {
      console.warn('⚠️  WARNING: JWT_REFRESH_SECRET should be at least 32 characters in production');
    }
  }

  // Database password should not be empty in production
  if (process.env.NODE_ENV === 'production' && process.env.DB_PASSWORD.length < 8) {
    console.warn('⚠️  WARNING: Database password should be at least 8 characters in production');
  }

  // Email configuration should be valid
  if (!process.env.EMAIL_USER.includes('@')) {
    console.error('\n❌ Invalid EMAIL_USER format. Must be a valid email address.\n');
    process.exit(1);
  }
}
