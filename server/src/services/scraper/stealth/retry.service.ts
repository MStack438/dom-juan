/**
 * Retry service with exponential backoff and jitter.
 * Tier 1: Simple retry logic for failed requests.
 */

import type { RetryConfig } from '../../../config/scraper.config.js';

export interface RetryContext {
  attempt: number;
  maxAttempts: number;
  lastError?: Error;
}

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: (context: RetryContext) => Promise<T>,
  config: RetryConfig,
  operationName: string = 'operation'
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    const context: RetryContext = {
      attempt,
      maxAttempts: config.maxAttempts,
      lastError,
    };

    try {
      console.log(`[Retry] ${operationName} - Attempt ${attempt}/${config.maxAttempts}`);
      const result = await fn(context);

      if (attempt > 1) {
        console.log(`[Retry] ${operationName} - Succeeded on attempt ${attempt}`);
      }

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this was the last attempt, throw the error
      if (attempt >= config.maxAttempts) {
        console.error(
          `[Retry] ${operationName} - Failed after ${config.maxAttempts} attempts`,
          lastError.message
        );
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = calculateBackoff(attempt, config);

      console.warn(
        `[Retry] ${operationName} - Attempt ${attempt} failed: ${lastError.message}. ` +
          `Retrying in ${delay}ms...`
      );

      // Wait before next attempt
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Retry failed with unknown error');
}

/**
 * Calculate backoff delay with exponential growth and optional jitter
 */
function calculateBackoff(attempt: number, config: RetryConfig): number {
  // Base formula: baseDelay * (multiplier ^ (attempt - 1))
  let delay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);

  // Cap at max delay
  delay = Math.min(delay, config.maxDelayMs);

  // Add jitter (randomness) to prevent thundering herd
  if (config.enableJitter) {
    // Add ±25% randomness
    const jitter = delay * 0.25;
    delay = delay - jitter + Math.random() * (jitter * 2);
  }

  return Math.floor(delay);
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Definitely retryable errors
  const retryablePatterns = [
    'timeout',
    'network',
    'econnrefused',
    'econnreset',
    'socket hang up',
    'too many requests',
    'rate limit',
    '503', // Service unavailable
    '502', // Bad gateway
    '429', // Too many requests
  ];

  // Not retryable errors
  const nonRetryablePatterns = [
    '400', // Bad request - won't succeed on retry
    '401', // Unauthorized - need different credentials
    '404', // Not found - won't exist on retry
    'invalid credentials',
  ];

  // Check if it's explicitly non-retryable
  if (nonRetryablePatterns.some((pattern) => message.includes(pattern))) {
    return false;
  }

  // Check if it's retryable
  if (retryablePatterns.some((pattern) => message.includes(pattern))) {
    return true;
  }

  // Default: retry on errors (conservative approach)
  return true;
}

/**
 * Check if error is Incapsula blocking
 */
export function isIncapsulaBlock(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('incapsula') ||
    message.includes('403') ||
    message.includes('access denied') ||
    message.includes('bot protection')
  );
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry specifically for page navigation
 * Handles common navigation errors
 */
export async function retryPageNavigation(
  navigateFn: () => Promise<void>,
  config: RetryConfig,
  url: string
): Promise<void> {
  return withRetry(
    async (context) => {
      try {
        await navigateFn();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        // Check for Incapsula
        if (isIncapsulaBlock(err)) {
          console.warn(`[Retry] Incapsula detected on attempt ${context.attempt}`);
          // On next attempt, different techniques could be used
        }

        throw err;
      }
    },
    config,
    `Navigation to ${url.substring(0, 80)}`
  );
}
