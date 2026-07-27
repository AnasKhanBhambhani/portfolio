// Error reporter stub — logs to console instead of Sentry.
export const reportError = (error: unknown, context?: Record<string, unknown>): void => {
  // eslint-disable-next-line no-console
  console.error('[site-lens]', error, context ?? '');
};
