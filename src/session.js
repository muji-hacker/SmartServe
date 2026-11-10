const SESSION_ID = 'smartserve_session_id';
const TABLE_NUMBER = 'smartserve_table_number';

export function getSession() {
  return {
    sessionId: sessionStorage.getItem(SESSION_ID) || '',
    tableNumber: sessionStorage.getItem(TABLE_NUMBER) || '',
  };
}

export function setSession(sessionId, tableNumber) {
  sessionStorage.setItem(SESSION_ID, sessionId);
  sessionStorage.setItem(TABLE_NUMBER, tableNumber);
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_ID);
  sessionStorage.removeItem(TABLE_NUMBER);
}
