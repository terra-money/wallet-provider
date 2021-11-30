export const storage = typeof window === 'undefined' ? undefined : localStorage;

interface Session {
  identifier: string;
}

const SESSION_KEY = '__terra_extension_router_session__';

export function getStoredSession(): Session | undefined {
  const data = storage?.getItem(SESSION_KEY);

  if (!data) {
    return undefined;
  }

  try {
    const object = JSON.parse(data);

    if ('identifier' in object) {
      return {
        identifier: object['identifier'],
      };
    } else {
      storage?.removeItem(SESSION_KEY);
      return undefined;
    }
  } catch {
    storage?.removeItem(SESSION_KEY);
    return undefined;
  }
}

export function storeSession(session: Session) {
  storage?.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  storage?.removeItem(SESSION_KEY);
}
