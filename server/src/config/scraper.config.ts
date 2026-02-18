/**
 * Centralized configuration for the scraper service.
 * All settings in one place for easy management and validation.
 */

export interface ProxyConfig {
  enabled: boolean;
  service: 'smartproxy' | 'brightdata' | 'none';
  host: string;
  port: number;
  username: string;
  password: string;
  country: 'CA' | 'US';
}

export interface StealthConfig {
  enabled: boolean;
  sessionWarmup: boolean;
  fingerprintRotation: 'aggressive' | 'moderate' | 'conservative' | 'off';
  // Tier 3: Advanced stealth features
  advancedHumanBehavior: boolean; // Mouse movements, realistic scrolling, reading time
  sessionPersistence: boolean; // Save/load cookies between runs
  intelligentTiming: boolean; // Time-of-day aware delays, burst protection
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  enableJitter: boolean;
}

export interface BudgetConfig {
  enabled: boolean;
  monthlyLimitGB: number;
  alertThresholdPercent: number;
  hardStopPercent: number;
}

export interface ScraperConfig {
  realtor: {
    enabled: boolean;
    stealth: StealthConfig;
    proxy: ProxyConfig;
    retry: RetryConfig;
    budget: BudgetConfig;
  };
  centris: {
    enabled: boolean;
    // Centris doesn't need stealth or proxies
  };
}

// Load and validate configuration from environment
function loadProxyConfig(): ProxyConfig {
  const enabled = process.env.PROXY_ENABLED === 'true';

  if (!enabled) {
    return {
      enabled: false,
      service: 'none',
      host: '',
      port: 0,
      username: '',
      password: '',
      country: 'CA',
    };
  }

  // Validate required proxy settings
  const service = process.env.PROXY_SERVICE as 'smartproxy' | 'brightdata' | 'none';
  if (!service || !['smartproxy', 'brightdata', 'none'].includes(service)) {
    throw new Error('PROXY_SERVICE must be set to "smartproxy", "brightdata", or "none"');
  }

  const host = process.env.PROXY_HOST;
  const port = parseInt(process.env.PROXY_PORT || '0');
  const username = process.env.PROXY_USERNAME;
  const password = process.env.PROXY_PASSWORD;
  const country = (process.env.PROXY_COUNTRY || 'CA') as 'CA' | 'US';

  if (!host || !port || !username || !password) {
    throw new Error('Proxy enabled but missing required credentials: PROXY_HOST, PROXY_PORT, PROXY_USERNAME, PROXY_PASSWORD');
  }

  return {
    enabled: true,
    service,
    host,
    port,
    username,
    password,
    country,
  };
}

function loadStealthConfig(): StealthConfig {
  return {
    enabled: process.env.ENABLE_REALTOR_STEALTH !== 'false', // Default true
    sessionWarmup: process.env.ENABLE_SESSION_WARMUP === 'true', // Default false (Tier 2)
    fingerprintRotation: (process.env.FINGERPRINT_ROTATION || 'off') as StealthConfig['fingerprintRotation'],
    // Tier 3
    advancedHumanBehavior: process.env.ENABLE_ADVANCED_HUMAN_BEHAVIOR !== 'false', // Default true
    sessionPersistence: process.env.ENABLE_SESSION_PERSISTENCE !== 'false', // Default true
    intelligentTiming: process.env.ENABLE_INTELLIGENT_TIMING !== 'false', // Default true
  };
}

function loadRetryConfig(): RetryConfig {
  return {
    maxAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3'),
    baseDelayMs: parseInt(process.env.RETRY_BASE_DELAY || '2000'),
    maxDelayMs: parseInt(process.env.RETRY_MAX_DELAY || '30000'),
    backoffMultiplier: parseFloat(process.env.RETRY_BACKOFF_MULTIPLIER || '2.0'),
    enableJitter: process.env.RETRY_ENABLE_JITTER !== 'false', // Default true
  };
}

function loadBudgetConfig(): BudgetConfig {
  return {
    enabled: process.env.PROXY_BUDGET_ENABLED === 'true',
    monthlyLimitGB: parseFloat(process.env.PROXY_BUDGET_MONTHLY_GB || '5'),
    alertThresholdPercent: parseFloat(process.env.PROXY_BUDGET_ALERT_PERCENT || '80'),
    hardStopPercent: parseFloat(process.env.PROXY_BUDGET_STOP_PERCENT || '95'),
  };
}

// Main configuration object
export const SCRAPER_CONFIG: ScraperConfig = {
  realtor: {
    enabled: process.env.ENABLE_REALTOR_SCRAPING !== 'false', // Default true
    stealth: loadStealthConfig(),
    proxy: loadProxyConfig(),
    retry: loadRetryConfig(),
    budget: loadBudgetConfig(),
  },
  centris: {
    enabled: process.env.ENABLE_CENTRIS_SCRAPING !== 'false', // Default true
  },
};

// Validation on module load
export function validateConfig(): void {
  const config = SCRAPER_CONFIG;

  // Validate retry config
  if (config.realtor.retry.maxAttempts < 1 || config.realtor.retry.maxAttempts > 10) {
    throw new Error('MAX_RETRY_ATTEMPTS must be between 1 and 10');
  }

  if (config.realtor.retry.baseDelayMs < 100 || config.realtor.retry.baseDelayMs > 60000) {
    throw new Error('RETRY_BASE_DELAY must be between 100 and 60000 ms');
  }

  // Validate budget config
  if (config.realtor.budget.enabled) {
    if (config.realtor.budget.monthlyLimitGB <= 0) {
      throw new Error('PROXY_BUDGET_MONTHLY_GB must be greater than 0');
    }

    if (config.realtor.budget.alertThresholdPercent >= config.realtor.budget.hardStopPercent) {
      throw new Error('PROXY_BUDGET_ALERT_PERCENT must be less than PROXY_BUDGET_STOP_PERCENT');
    }
  }

  // Log configuration (without sensitive data)
  console.log('[Config] Scraper configuration loaded:');
  console.log(`  Realtor.ca: ${config.realtor.enabled ? 'ENABLED' : 'DISABLED'}`);
  console.log(`    Stealth: ${config.realtor.stealth.enabled ? 'ON' : 'OFF'}`);
  console.log(`    Fingerprint rotation: ${config.realtor.stealth.fingerprintRotation}`);
  console.log(`    Advanced human behavior: ${config.realtor.stealth.advancedHumanBehavior ? 'ON' : 'OFF'}`);
  console.log(`    Session persistence: ${config.realtor.stealth.sessionPersistence ? 'ON' : 'OFF'}`);
  console.log(`    Intelligent timing: ${config.realtor.stealth.intelligentTiming ? 'ON' : 'OFF'}`);
  console.log(`    Proxy: ${config.realtor.proxy.enabled ? config.realtor.proxy.service : 'OFF'}`);
  console.log(`    Max retries: ${config.realtor.retry.maxAttempts}`);
  console.log(`    Budget: ${config.realtor.budget.enabled ? `${config.realtor.budget.monthlyLimitGB}GB/month` : 'OFF'}`);
  console.log(`  Centris: ${config.centris.enabled ? 'ENABLED' : 'DISABLED'}`);
}

// Run validation on import
validateConfig();
