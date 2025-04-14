import DOMPurify from 'dompurify';
import xss from 'xss';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Uses DOMPurify for thorough sanitization
 * 
 * @param content - HTML content to be sanitized
 * @returns Sanitized HTML that is safe to render
 */
export function sanitizeHtml(content: string): string {
  if (!content) return '';
  
  // First apply xss filter with strict options
  const xssFiltered = xss(content, {
    whiteList: {}, // Only allow text content by default
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'xml'] // Remove these tags completely
  });
  
  // Then apply DOMPurify for additional protection
  return DOMPurify.sanitize(xssFiltered, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target="_blank"', 'rel="noopener noreferrer"'],
    USE_PROFILES: { html: true }
  });
}

/**
 * Sanitizes plain text to be used in non-HTML contexts
 * 
 * @param text - Text to be sanitized
 * @returns Plain text without potentially dangerous characters
 */
export function sanitizePlainText(text: string): string {
  if (!text) return '';
  
  // Remove HTML tags and encode special characters
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitizes data objects recursively
 * 
 * @param data - Object or value to sanitize
 * @returns Sanitized data structure
 */
export function sanitizeData(data: any): any {
  if (!data) return data;
  
  if (typeof data === 'string') {
    return sanitizePlainText(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeData(value);
    }
    
    return sanitized;
  }
  
  // Return other data types as-is (numbers, booleans, etc.)
  return data;
}

/**
 * Create a secure Content Security Policy header value
 * 
 * @returns CSP header value
 */
export function getCSPHeader(): string {
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://firebasestorage.googleapis.com data:",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com",
    "font-src 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "frame-src 'self' https://*.stripe.com",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "block-all-mixed-content"
  ].join('; ');
} 