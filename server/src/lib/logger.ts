export function logError(context: string, err: unknown) {
  console.error(`[erro:${context}]`, err);
}
