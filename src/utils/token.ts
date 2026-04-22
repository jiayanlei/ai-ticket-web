const TOKEN_KEY = 'AI_TICKET_WEB_TOKEN';

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token: string, remember = true) {
  clearToken();

  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }

  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}
