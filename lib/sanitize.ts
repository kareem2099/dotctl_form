import createDOMPurify from "isomorphic-dompurify";


const DOMPurify = createDOMPurify();
// Remove all HTML tags, sanitize completely
export function sanitizeTextInput(input: string): string {
  if (typeof input !== "string") return "";

  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
    .replace(/<\/?[^>]+>/g, "") // extra stripping
    .trim()
    .replace(/\s+/g, " ");
}

// Safe HTML for display (optional)
export function sanitizeHtmlForDisplay(html: string): string {
  if (typeof html !== "string") return "";

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "a"],
    ALLOWED_ATTR: ["href"],
  });
}

// Email validation
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;

  const cleaned = sanitizeTextInput(email).toLowerCase();

  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z]+$/;

  return emailRegex.test(cleaned) && cleaned.length <= 254;
}

// Phone validation
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== "string") return false;

  const cleaned = sanitizeTextInput(phone).replace(/[\s\-\(\)\+]/g, "");
  const phoneRegex = /^[1-9]\d{9,14}$/;

  return phoneRegex.test(cleaned);
}

// Name validation
export function isValidName(name: string): boolean {
  if (!name || typeof name !== "string") return false;

  const cleaned = sanitizeTextInput(name);
  const nameRegex = /^[a-zA-Z\s'-]+$/;

  return nameRegex.test(cleaned) && cleaned.length >= 2 && cleaned.length <= 100;
}

// Use-case / message validation
export function isValidUseCase(useCase: string): boolean {
  if (!useCase || typeof useCase !== "string") return false;

  const cleaned = sanitizeTextInput(useCase);

  const spamPatterns = [
    /test/i,
    /spam/i,
    /money/i,
    /win.*prize/i,
    /http/i,
    /www\./i,
    /bitcoin/i,
    /crypto/i,
  ];

  return (
    !spamPatterns.some((p) => p.test(cleaned)) &&
    cleaned.length >= 10 &&
    cleaned.length <= 1000
  );
}
