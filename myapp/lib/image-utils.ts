/**
 * Validates that an image path is safe to use in img src attribute
 * Prevents XSS and path traversal attacks
 */
export function isValidImagePath(path: string | undefined): boolean {
  if (!path) return false;
  
  // Must start with / and be a relative path (no protocol)
  if (!path.startsWith("/")) return false;
  
  // Must not contain dangerous patterns
  if (path.includes("../") || path.includes("javascript:") || path.includes("data:")) {
    return false;
  }
  
  return true;
}
