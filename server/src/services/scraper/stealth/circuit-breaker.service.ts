/**
 * Circuit breaker pattern implementation with database persistence.
 * Tier 2: Prevents wasting resources when a service is consistently failing.
 */

import { db } from '../../../db/index.js';
import { circuitBreakerState } from '../../../db/schema/circuit-breaker.js';
import { eq } from 'drizzle-orm';

type CircuitState = 'closed' | 'open' | 'half_open';

interface CircuitBreakerConfig {
  failureThreshold: number; // Open after this many consecutive failures
  successThreshold: number; // Close after this many consecutive successes (in half-open)
  halfOpenAfterMs: number; // Try half-open after this time
  resetAfterMs: number; // Reset failure count after this time of success
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5, // Open after 5 failures
  successThreshold: 3, // Close after 3 successes
  halfOpenAfterMs: 30 * 60 * 1000, // 30 minutes
  resetAfterMs: 60 * 60 * 1000, // 1 hour
};

/**
 * Check if circuit breaker allows the operation
 */
export async function canExecute(
  service: string,
  config: Partial<CircuitBreakerConfig> = {}
): Promise<{ allowed: boolean; reason?: string }> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const state = await getOrCreateState(service);

  switch (state.state) {
    case 'closed':
      // Normal operation
      return { allowed: true };

    case 'open':
      // Check if we should try half-open
      if (state.openedAt) {
        const timeOpen = Date.now() - state.openedAt.getTime();
        if (timeOpen >= fullConfig.halfOpenAfterMs) {
          // Transition to half-open
          await updateState(service, { state: 'half_open' });
          console.log(`[CircuitBreaker] ${service}: open → half_open (testing recovery)`);
          return { allowed: true };
        }
      }

      return {
        allowed: false,
        reason: `Circuit breaker open for ${service} (too many failures)`,
      };

    case 'half_open':
      // Allow limited requests to test if service recovered
      return { allowed: true };

    default:
      return { allowed: true };
  }
}

/**
 * Record a successful operation
 */
export async function recordSuccess(
  service: string,
  config: Partial<CircuitBreakerConfig> = {}
): Promise<void> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const state = await getOrCreateState(service);

  const newSuccessCount = state.successCount + 1;
  const newFailureCount = 0; // Reset failures on success

  let newState: CircuitState = state.state as CircuitState;

  if (state.state === 'half_open') {
    // Check if we can close the circuit
    if (newSuccessCount >= fullConfig.successThreshold) {
      newState = 'closed';
      console.log(
        `[CircuitBreaker] ${service}: half_open → closed ` +
          `(${newSuccessCount} consecutive successes)`
      );
    }
  } else if (state.state === 'closed') {
    // Check if we should reset counter
    if (state.lastCheckedAt) {
      const timeSinceCheck = Date.now() - state.lastCheckedAt.getTime();
      if (timeSinceCheck >= fullConfig.resetAfterMs) {
        // Reset success counter after long period
        await updateState(service, {
          successCount: 1,
          failureCount: 0,
          lastCheckedAt: new Date(),
        });
        return;
      }
    }
  }

  await updateState(service, {
    state: newState,
    successCount: newSuccessCount,
    failureCount: newFailureCount,
    lastCheckedAt: new Date(),
    ...(newState === 'closed' && { openedAt: null }),
  });
}

/**
 * Record a failed operation
 */
export async function recordFailure(
  service: string,
  reason: string,
  config: Partial<CircuitBreakerConfig> = {}
): Promise<void> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const state = await getOrCreateState(service);

  const newFailureCount = state.failureCount + 1;
  const newSuccessCount = 0; // Reset successes on failure

  let newState: CircuitState = state.state as CircuitState;
  let openedAt = state.openedAt;

  if (state.state === 'half_open') {
    // Failure in half-open → back to open
    newState = 'open';
    openedAt = new Date();
    console.warn(
      `[CircuitBreaker] ${service}: half_open → open (failed during recovery test)`
    );
  } else if (state.state === 'closed') {
    // Check if we should open
    if (newFailureCount >= fullConfig.failureThreshold) {
      newState = 'open';
      openedAt = new Date();
      console.error(
        `[CircuitBreaker] ${service}: closed → open ` +
          `(${newFailureCount} failures, threshold: ${fullConfig.failureThreshold})`
      );
      console.error(`[CircuitBreaker] ${service}: Last failure: ${reason}`);
    }
  }

  await updateState(service, {
    state: newState,
    successCount: newSuccessCount,
    failureCount: newFailureCount,
    lastFailureReason: reason,
    lastCheckedAt: new Date(),
    ...(newState === 'open' && { openedAt }),
  });
}

/**
 * Manually reset circuit breaker (admin override)
 */
export async function reset(service: string): Promise<void> {
  await updateState(service, {
    state: 'closed',
    failureCount: 0,
    successCount: 0,
    openedAt: null,
    lastFailureReason: null,
    lastCheckedAt: new Date(),
  });

  console.log(`[CircuitBreaker] ${service}: Manually reset to closed state`);
}

/**
 * Get current circuit breaker status
 */
export async function getStatus(service: string): Promise<{
  state: CircuitState;
  failureCount: number;
  successCount: number;
  openedAt: Date | null;
  lastFailureReason: string | null;
}> {
  const state = await getOrCreateState(service);

  return {
    state: state.state as CircuitState,
    failureCount: state.failureCount,
    successCount: state.successCount,
    openedAt: state.openedAt,
    lastFailureReason: state.lastFailureReason,
  };
}

/**
 * Get or create circuit breaker state for a service
 */
async function getOrCreateState(service: string) {
  const existing = await db
    .select()
    .from(circuitBreakerState)
    .where(eq(circuitBreakerState.service, service))
    .limit(1);

  if (existing.length > 0) {
    return existing[0]!;
  }

  // Create new state
  const [newState] = await db
    .insert(circuitBreakerState)
    .values({
      service,
      state: 'closed',
      failureCount: 0,
      successCount: 0,
    })
    .returning();

  return newState!;
}

/**
 * Update circuit breaker state
 */
async function updateState(
  service: string,
  updates: Partial<{
    state: CircuitState;
    failureCount: number;
    successCount: number;
    openedAt: Date | null;
    lastFailureReason: string | null;
    lastCheckedAt: Date;
  }>
): Promise<void> {
  await db
    .update(circuitBreakerState)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(circuitBreakerState.service, service));
}
