(function () {
  'use strict';

  const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
  const isSafeUrl = (value) => {
    if (!value || value.startsWith('#') || value.startsWith('/') || value.startsWith('./') || value.startsWith('../')) return true;
    try { return SAFE_PROTOCOLS.has(new URL(value, window.location.href).protocol); }
    catch (_) { return false; }
  };

  function hardenLinksAndImages(root = document) {
    root.querySelectorAll('a[href]').forEach((link) => {
      if (!isSafeUrl(link.getAttribute('href'))) link.removeAttribute('href');
      if (link.target === '_blank') link.rel = 'noopener noreferrer';
    });
    root.querySelectorAll('img[src]').forEach((img) => {
      if (!isSafeUrl(img.getAttribute('src'))) img.removeAttribute('src');
      img.loading ||= 'lazy';
      img.decoding ||= 'async';
      img.referrerPolicy ||= 'no-referrer';
    });
  }

  function hardenForms(root = document) {
    root.querySelectorAll('form').forEach((form) => {
      if (form.action && !isSafeUrl(form.getAttribute('action'))) form.removeAttribute('action');
      form.setAttribute('autocomplete', form.getAttribute('autocomplete') || 'on');
    });
    root.querySelectorAll('input, textarea').forEach((field) => {
      if (field.maxLength < 0) field.maxLength = field.tagName === 'TEXTAREA' ? 2000 : 255;
      field.setAttribute('spellcheck', field.getAttribute('spellcheck') || 'true');
    });
  }

  function safeCartStorage() {
    try {
      const raw = window.FawzCart.getItem('cart');
      if (!raw) return;
      const cart = JSON.parse(raw);
      if (!Array.isArray(cart)) throw new Error('Invalid cart');
      const clean = cart.slice(0, 250).filter((item) => item && typeof item === 'object');
      if (clean.length !== cart.length) window.FawzCart.setItem('cart', JSON.stringify(clean));
    } catch (_) {
      window.FawzCart.removeItem('cart');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    hardenLinksAndImages();
    hardenForms();
    safeCartStorage();
    const observer = new MutationObserver((records) => records.forEach((record) =>
      record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          hardenLinksAndImages(node);
          hardenForms(node);
        }
      })
    ));
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }, { once: true });

  window.addEventListener('storage', (event) => {
    if (event.key === 'cart') safeCartStorage();
  });
})();
