const { shouldRemoveMessage } = require('../../src/utils/moderation');

describe('moderation.shouldRemoveMessage', () => {
  test('allows clean message', () => {
    expect(shouldRemoveMessage('Hello team, great job!')).toBe(false);
    expect(shouldRemoveMessage('مرحبا يا جماعة')).toBe(false);
    expect(shouldRemoveMessage('Ciao a tutti, come va?')).toBe(false);
  });

  test('blocks URLs and domains', () => {
    expect(shouldRemoveMessage('visit https://example.com now')).toBe(true);
    expect(shouldRemoveMessage('www.example.net is cool')).toBe(true);
    expect(shouldRemoveMessage('go to example.org please')).toBe(true);
  });

  test('blocks email addresses', () => {
    expect(shouldRemoveMessage('contact me at test.user+1@mail.com')).toBe(true);
  });

  test('blocks phone numbers', () => {
    expect(shouldRemoveMessage('Call me +1 (650) 555-1234')).toBe(true);
    expect(shouldRemoveMessage('my number is 010-1234-5678')).toBe(true);
  });

  test('blocks offensive language (EN/AR/IT sample)', () => {
    expect(shouldRemoveMessage('you are an asshole')).toBe(true);
    expect(shouldRemoveMessage('vaffanculo')).toBe(true);
    expect(shouldRemoveMessage('كسمك')).toBe(true);
  });
});

