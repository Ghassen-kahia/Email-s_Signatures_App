import { describe, expect, it } from 'vitest';
import { cleanText, escapeHtml, isHttpsUrl, isValidEmail, isValidPhone, mailtoHref, normalizeWebUrl, safeColor, telHref } from './sanitize';

describe('escapeHtml', () => {
  it('escapes markup characters', () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'y'`)).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;');
  });
});

describe('cleanText', () => {
  it('collapses whitespace, strips control chars and truncates', () => {
    expect(cleanText('  Ada \n\t Moreau\u0007 ')).toBe('Ada Moreau');
    expect(cleanText('abcdef', 3)).toBe('abc');
  });
});

describe('normalizeWebUrl', () => {
  it('upgrades bare domains and http to https', () => {
    expect(normalizeWebUrl('example.com')).toBe('https://example.com/');
    expect(normalizeWebUrl('http://example.com/a?b=1')).toBe('https://example.com/a?b=1');
  });
  it('rejects dangerous or malformed URLs', () => {
    expect(normalizeWebUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeWebUrl('data:text/html,hi')).toBeNull();
    expect(normalizeWebUrl('ftp://example.com')).toBeNull();
    expect(normalizeWebUrl('not a url')).toBeNull();
    expect(normalizeWebUrl('localhost')).toBeNull();
    expect(normalizeWebUrl('https://user:pass@example.com')).toBeNull();
    expect(normalizeWebUrl('')).toBeNull();
  });
});

describe('isHttpsUrl', () => {
  it('accepts only absolute https URLs', () => {
    expect(isHttpsUrl('https://cdn.example.com/a.png')).toBe(true);
    expect(isHttpsUrl('http://cdn.example.com/a.png')).toBe(false);
    expect(isHttpsUrl('C:\\Users\\me\\photo.jpg')).toBe(false);
    expect(isHttpsUrl('/photo.jpg')).toBe(false);
  });
});

describe('contact validators', () => {
  it('validates emails', () => {
    expect(isValidEmail('ada@example.com')).toBe(true);
    expect(isValidEmail('ada@example')).toBe(false);
    expect(isValidEmail('a"b@example.com')).toBe(false);
  });
  it('validates phones and builds tel: links', () => {
    expect(isValidPhone('+33 6 12 34 56 78')).toBe(true);
    expect(isValidPhone('(555) 010-0199')).toBe(true);
    expect(isValidPhone('call me')).toBe(false);
    expect(isValidPhone('123')).toBe(false);
    expect(telHref('+33 6 12 34 56 78')).toBe('tel:+33612345678');
  });
  it('builds mailto links', () => {
    expect(mailtoHref('ada@example.com')).toBe('mailto:ada@example.com');
  });
});

describe('safeColor', () => {
  it('only allows hex colours', () => {
    expect(safeColor('#0aF', '#000')).toBe('#0aF');
    expect(safeColor('red;background:url(x)', '#000')).toBe('#000');
  });
});
