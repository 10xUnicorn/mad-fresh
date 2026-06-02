/**
 * Validates internal API calls between routes.
 * Email sending and other internal endpoints use this
 * instead of user auth since they're called server-to-server.
 */
export function validateInternalRequest(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.INTERNAL_API_SECRET;

  // If no secret configured, allow in development but block in production
  if (!secret) {
    if (process.env.NODE_ENV === "production") return false;
    console.warn("INTERNAL_API_SECRET not set — allowing request in dev mode");
    return true;
  }

  return authHeader === `Bearer ${secret}`;
}
