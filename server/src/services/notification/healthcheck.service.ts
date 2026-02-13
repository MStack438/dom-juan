export async function pingHealthcheck(
  status: 'success' | 'fail'
): Promise<void> {
  const pingUrl = process.env.HEALTHCHECKS_PING_URL;

  if (!pingUrl) {
    console.log(
      '[Healthcheck] No HEALTHCHECKS_PING_URL configured, skipping ping'
    );
    return;
  }

  const url = status === 'fail' ? `${pingUrl}/fail` : pingUrl;

  try {
    await fetch(url, { method: 'POST' });
    console.log(`[Healthcheck] Pinged ${status}`);
  } catch (error) {
    console.error('[Healthcheck] Failed to ping:', error);
  }
}
