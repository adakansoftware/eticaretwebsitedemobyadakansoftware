export function buildNextOutboxAvailability(
  lastAttemptAt: Date,
  retryMinutes: number,
  attempts: number
) {
  const multiplier = Math.max(1, attempts);
  return new Date(lastAttemptAt.getTime() + retryMinutes * multiplier * 60 * 1000);
}
