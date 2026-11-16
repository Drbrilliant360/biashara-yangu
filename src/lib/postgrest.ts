/**
 * User text placed inside a PostgREST `.or(...)` / `.ilike(...)` filter string can add its own
 * conditions (a comma or parenthesis ends the value). Strip those characters and the LIKE wildcards
 * so the search term can only ever be a plain substring.
 */
export function escapeFilterTerm(input: string, maxLength = 80): string {
  return input
    .normalize('NFKC')
    .replace(/[,()"'\\%*_:;]/g, ' ')
    .split('').map((c) => (c.charCodeAt(0) < 32 ? ' ' : c)).join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}
