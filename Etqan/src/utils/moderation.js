function hasUrlLike(text) {
  const s = String(text || '');
  if (!s.trim()) return false;
  // http/https or www
  if (/(https?:\/\/|www\.)\S+/i.test(s)) return true;
  // common TLDs / domains (very simple on purpose)
  if (/\b[a-z0-9-]+\.(com|net|org|io|co|ai|app|dev|me|ly|xyz|info|site|online|store)\b/i.test(s)) return true;
  return false;
}

function hasEmail(text) {
  const s = String(text || '');
  if (!s.trim()) return false;
  return /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(s);
}

function hasPhoneNumber(text) {
  const s = String(text || '');
  if (!s.trim()) return false;
  // match phone-ish patterns and ensure >= 8 digits total
  const m = s.match(/(\+?\d[\d\s().-]{6,}\d)/g);
  if (!m) return false;
  return m.some((cand) => (cand.match(/\d/g) || []).length >= 8);
}

function hasOffensiveLanguage(text) {
  const sRaw = String(text || '');
  const s = sRaw.toLowerCase();
  if (!s.trim()) return false;

  // English
  const en = [
    'fuck', 'fucking', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy', 'faggot', 'motherfucker',
  ];
  // Italian
  const it = [
    'cazzo', 'merda', 'stronzo', 'stronza', 'puttana', 'vaffanculo',
  ];
  // Arabic (no reliable word boundaries, so includes checks)
  const ar = [
    'كسم', 'كس', 'خول', 'شرموطة', 'زب', 'عرص', 'احا', 'متناك', 'ابن الكلب', 'يا كلب', 'يا حمار',
  ];

  const hasWord = (list) => list.some((w) => (w.includes(' ') ? s.includes(w) : new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(s)));
  if (hasWord(en) || hasWord(it)) return true;
  return ar.some((w) => sRaw.includes(w));
}

/**
 * Returns true if the message must be removed and NOT stored.
 * No logging, no side effects.
 */
function shouldRemoveMessage(text) {
  if (!text || !String(text).trim()) return false;
  return hasUrlLike(text) || hasEmail(text) || hasPhoneNumber(text) || hasOffensiveLanguage(text);
}

module.exports = {
  shouldRemoveMessage,
};

