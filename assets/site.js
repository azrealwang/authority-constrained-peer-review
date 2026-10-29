(() => {
  'use strict';
  const config = window.ACPR_CONFIG || {};
  const validRepo = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(config.repository || '');
  const repo = validRepo ? config.repository : 'azrealwang/authority-constrained-peer-review';
  const email = config.email || 'hanrui_wang@nii.ac.jp';
  document.querySelectorAll('[data-repo]').forEach(a => a.href = `https://github.com/${repo}`);
  document.querySelectorAll('[data-discussions]').forEach(a => a.href = `https://github.com/${repo}/discussions`);
  document.querySelectorAll('[data-email]').forEach(a => { a.href = `mailto:${email}`; });
  document.querySelectorAll('[data-email-subject]').forEach(a => { a.href = `mailto:${email}?subject=${encodeURIComponent(a.dataset.emailSubject)}`; });
  document.querySelectorAll('[data-objective]').forEach(a => { a.href = `mailto:${email}?subject=${encodeURIComponent(`Authority-constrained peer review: Objective ${a.dataset.objective}`)}`; });

  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('navigation');
  const closeMenu = () => { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); toggle.focus(); } });
  document.addEventListener('click', e => { if (!e.target.closest('.header')) closeMenu(); });
  matchMedia('(min-width: 681px)').addEventListener('change', e => { if (e.matches) closeMenu(); });

  let toastTimer;
  function toast(message) {
    const el = document.querySelector('.toast');
    el.textContent = message; el.classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 2800);
  }
  async function copy(text, button) {
    const original = button.textContent;
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const area = document.createElement('textarea'); area.value = text;
        area.style.position = 'fixed'; area.style.opacity = '0'; document.body.append(area);
        area.select(); const copied = document.execCommand('copy'); area.remove();
        if (!copied) throw new Error('Copy unavailable');
      }
      button.textContent = 'Copied'; toast('Copied to clipboard');
      setTimeout(() => { button.textContent = original; }, 2200);
    } catch (_) { toast('Select and copy the text, or use the download link.'); }
  }
  document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', () => copy(document.getElementById(b.dataset.copy).textContent.trim(), b)));
  document.querySelectorAll('[data-copy-email]').forEach(b => b.addEventListener('click', () => copy(email, b)));

  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function selectTab(tab, focus = false) {
    tabs.forEach(t => {
      const selected = t === tab; t.setAttribute('aria-selected', String(selected)); t.tabIndex = selected ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !selected;
    });
    if (focus) tab.focus();
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', e => {
      let next;
      if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { e.preventDefault(); selectTab(tabs[next], true); }
    });
  });

  // Third-party comments are requested only after an explicit visitor click.
  const g = config.giscus || {};
  const loader = document.getElementById('discussion-loader');
  const commentButton = document.getElementById('load-comments');
  const commentStatus = document.getElementById('comment-status');
  if (loader && g.enabled && g.repoId && g.categoryId) {
    loader.hidden = false;
    let state = 'idle';
    commentButton.addEventListener('click', () => {
      if (state === 'loading' || state === 'ready') return;
      state = 'loading'; commentButton.disabled = true; commentButton.textContent = 'Loading comments…';
      commentStatus.textContent = '';
      const script = document.createElement('script');
      const attrs = {
        src: 'https://giscus.app/client.js',
        'data-repo': repo, 'data-repo-id': g.repoId,
        'data-category': g.category || 'General', 'data-category-id': g.categoryId,
        'data-mapping': g.mapping || 'specific', 'data-term': g.term || 'Project discussion',
        'data-strict': '1', 'data-reactions-enabled': '1', 'data-emit-metadata': '1',
        'data-input-position': 'top', 'data-theme': g.theme || 'light', 'data-lang': 'en',
        'data-loading': 'eager', crossorigin: 'anonymous'
      };
      for (const [key, value] of Object.entries(attrs)) script.setAttribute(key, value);
      script.async = true;
      const failed = () => {
        state = 'failed'; commentButton.disabled = false; commentButton.textContent = 'Retry loading comments';
        commentStatus.textContent = 'Comments could not be loaded. You can still discuss on GitHub or contact us by email.';
      };
      const timer = setTimeout(() => { if (state === 'loading') failed(); }, 18000);
      script.onerror = () => { clearTimeout(timer); script.remove(); failed(); };
      const onMessage = event => {
        if (event.origin !== 'https://giscus.app' || !event.data || !event.data.giscus) return;
        const iframe = document.querySelector('#comments iframe');
        if (!iframe || event.source !== iframe.contentWindow) return;
        clearTimeout(timer);
        if (event.data.giscus.error) { failed(); return; }
        state = 'ready'; commentButton.hidden = true; commentStatus.textContent = '';
      };
      window.addEventListener('message', onMessage);
      document.getElementById('comments').replaceChildren(script);
    });
  }
})();
