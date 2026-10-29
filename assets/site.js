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

  // The Get involved page lists every discussion in the chosen category.
  const list = document.getElementById('discussion-list');
  if (list) {
    const category = (config.giscus && config.giscus.category) || 'Website comments';
    const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    document.querySelectorAll('#discussion [data-discussions]').forEach(a => {
      a.href = `https://github.com/${repo}/discussions/categories/${slug}`;
    });
    const status = list.querySelector('.discussion-status');
    const excerpt = body => {
      const text = String(body || '').replace(/[#>*_\[\]()`]/g, ' ').replace(/\s+/g, ' ').trim();
      if (text.length <= 180) return text;
      return `${text.slice(0, 177).replace(/\s+\S*$/, '')}…`;
    };
    fetch(`https://api.github.com/repos/${repo}/discussions?per_page=30`, {
      headers: { Accept: 'application/vnd.github+json' }
    }).then(response => {
      if (!response.ok) throw new Error(String(response.status));
      return response.json();
    }).then(items => {
      const posts = items
        .filter(item => item.category && item.category.name === category && String(item.html_url || '').startsWith(`https://github.com/${repo}/`))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      list.replaceChildren();
      if (!posts.length) {
        const empty = document.createElement('p');
        empty.className = 'discussion-status';
        empty.textContent = `No discussions in ${category} yet.`;
        list.append(empty);
        return;
      }
      posts.forEach(post => {
        const article = document.createElement('article');
        const time = document.createElement('time');
        time.dateTime = post.created_at;
        time.textContent = new Date(post.created_at).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' });
        const body = document.createElement('div');
        const heading = document.createElement('h3');
        const link = document.createElement('a');
        link.href = post.html_url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.append(post.title, document.createTextNode(' '));
        const arrow = document.createElement('span');
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '↗';
        link.append(arrow);
        heading.append(link);
        const meta = document.createElement('p');
        const author = post.user && post.user.login ? post.user.login : 'GitHub';
        const count = Number(post.comments) || 0;
        meta.textContent = `${author} · ${count} ${count === 1 ? 'comment' : 'comments'}`;
        body.append(heading, meta);
        const preview = excerpt(post.body);
        if (preview) {
          const summary = document.createElement('p');
          summary.textContent = preview;
          body.append(summary);
        }
        article.append(time, body);
        list.append(article);
      });
    }).catch(() => {
      status.textContent = 'Discussions could not be loaded. You can still read and start them on GitHub.';
    });
  }
})();
