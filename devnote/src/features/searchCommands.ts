const SEARCH_COMMAND_PATHS = new Set(['/admin']);

interface SearchShortcutEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

export function getSearchCommandPath(query: string): string | null {
  const path = query.trim();
  return SEARCH_COMMAND_PATHS.has(path) ? path : null;
}

export function shouldSearchPosts(query: string): boolean {
  return query.trim().length >= 2 && getSearchCommandPath(query) === null;
}

export function isSearchShortcut(event: SearchShortcutEvent): boolean {
  return event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey;
}
