const USER_ID_KEY = 'eap_user_id';

export async function resolveUser(): Promise<number | null> {
  // 1. Check sessionStorage first (already resolved this tab)
  const stored = sessionStorage.getItem(USER_ID_KEY);
  if (stored) return parseInt(stored, 10);

  // 2. Check URL for token param
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (!token) {
    window.location.href = '/token';
    return null;
  }

  // 3. Validate token with external API
  try {
    const response = await fetch('https://api.mantracare.com/user/user-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) throw new Error('Token validation failed');

    const data = await response.json();
    const userId: number = data.user_id;

    // 4. Store in sessionStorage (tab-scoped only)
    sessionStorage.setItem(USER_ID_KEY, String(userId));

    // 5. Clean URL — remove token from address bar
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);

    return userId;
  } catch {
    window.location.href = '/token';
    return null;
  }
}

export function getUserId(): number | null {
  const stored = sessionStorage.getItem(USER_ID_KEY);
  return stored ? parseInt(stored, 10) : null;
}

export function clearSession(): void {
  sessionStorage.removeItem(USER_ID_KEY);
}
