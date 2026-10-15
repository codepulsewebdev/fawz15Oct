/* Keep category and product popups in the same one-step navigation history. */
(function () {
  'use strict';
  function install() {
    const modals = Array.from(document.querySelectorAll('.modal[id], .section-modal[id]'));
    if (!modals.length) return;
    const token = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const key = '__fawzModalNavigation';
    const frames = [];
    let index = 0;
    let depth = 0;
    let restoring = false;
    let pendingClose = null;
    let waitingForBack = false;
    function capture() {
      return {
        bodyOverflow: document.body.style.overflow,
        x: window.scrollX, y: window.scrollY,
        modals: modals.map(el => ({
          id: el.id, display: el.style.display,
          visible: getComputedStyle(el).display !== 'none',
          scroll: [el, ...el.querySelectorAll('*')].filter(node => node.scrollTop || node.scrollLeft)
            .map(node => ({node, top: node.scrollTop, left: node.scrollLeft})),
          fields: Array.from(el.querySelectorAll('select, input, textarea')).filter(node => {
            for (let parent = node; parent && parent !== el; parent = parent.parentElement) {
              if (parent.hidden || getComputedStyle(parent).display === 'none') return false;
            }
            return true;
          }).map(node => ({
            id: node.id, index: Array.from(el.querySelectorAll('select, input, textarea')).indexOf(node),
            value: node.value, checked: node.checked
          }))
        }))
      };
    }
    function visibleIds(scene) { return scene.modals.filter(m => m.visible).map(m => m.id).join('|'); }
    function marker(n) {
      return Object.assign({}, history.state || {}, {[key]: {token, index: n}});
    }
    function apply(frame, replay) {
      restoring = true;
      try {
        // Rebuild the selected product's existing controls and JavaScript state on Forward.
        if (replay && frame.open) frame.open.fn.apply(frame.open.context, frame.open.args);
        frame.scene.modals.forEach(saved => {
          const el = document.getElementById(saved.id);
          el.style.display = saved.display;
          if (replay && saved.visible) saved.fields.forEach(field => {
            const node = field.id ? document.getElementById(field.id) :
              Array.from(el.querySelectorAll('select, input, textarea'))[field.index];
            if (!node) return;
            const changed = node.value !== field.value || ('checked' in node && node.checked !== field.checked);
            node.value = field.value;
            if ('checked' in node) node.checked = field.checked;
            if (changed) node.dispatchEvent(new Event('change', {bubbles: true}));
          });
          saved.scroll.forEach(s => { s.node.scrollTop = s.top; s.node.scrollLeft = s.left; });
        });
        document.body.style.overflow = frame.scene.bodyOverflow;
        window.scrollTo(frame.scene.x, frame.scene.y);
      } finally { restoring = false; }
    }
    frames.push({scene: capture(), open: null});
    history.replaceState(marker(0), '', location.href);
    const openNames = ['openModal', 'openCategoryModal', 'openSectionModal', 'openOptionsModal',
      'openProduct', 'openProductModal', 'openProductSpecific'];
    const closeNames = ['closeModal', 'closeCategoryModal', 'closeSectionModal',
      'closeOptionsModal', 'closeProductModal'];
    openNames.forEach(name => {
      const original = window[name];
      if (typeof original !== 'function') return;
      window[name] = function (...args) {
        if (restoring || depth) return original.apply(this, args);
        if (waitingForBack) return;
        const before = pendingClose ? pendingClose.before : capture();
        pendingClose = null;
        depth++;
        let result;
        try { result = original.apply(this, args); } finally { depth--; }
        const after = capture();
        if (!visibleIds(after) || visibleIds(after) === visibleIds(before)) return result;
        frames[index].scene = before;
        frames.splice(index + 1);
        frames.push({scene: after, open: {fn: original, context: this, args}});
        index++;
        history.pushState(marker(index), '', location.href);
        return result;
      };
    });
    closeNames.forEach(name => {
      const original = window[name];
      if (typeof original !== 'function') return;
      window[name] = function (...args) {
        if (restoring || depth) return original.apply(this, args);
        if (waitingForBack) return;
        const before = capture();
        const result = original.apply(this, args);
        if (!index || visibleIds(before) === visibleIds(capture())) return result;
        const close = {before};
        pendingClose = close;
        // Some pages close the category then open its product in the same click.
        // Treat that pair as opening the next level, rather than going Back first.
        queueMicrotask(() => {
          if (pendingClose !== close) return;
          pendingClose = null;
          frames[index].scene = before;
          waitingForBack = true;
          apply(frames[index - 1], false);
          history.back();
        });
        return result;
      };
    });
    window.addEventListener('popstate', event => {
      const state = event.state && event.state[key];
      if (!state || state.token !== token || !frames[state.index]) return;
      const next = state.index;
      const forward = next > index;
      if (!waitingForBack) frames[index].scene = capture();
      index = next;
      pendingClose = null;
      waitingForBack = false;
      apply(frames[index], forward);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
