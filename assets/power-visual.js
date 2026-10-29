(() => {
  'use strict';
  const figure = document.getElementById('role-game');
  if (!figure) return;
  const choices = [...figure.querySelectorAll('[data-alignment-choice]')];
  const play = document.getElementById('role-game-play');
  const title = document.getElementById('role-game-title');
  const description = document.getElementById('role-game-description');
  const announcement = document.getElementById('role-game-announcement');
  const alignments = [
    ['Author + Reviewer B', 'Together, they can challenge Reviewer A’s critique.'],
    ['Author + Reviewer A', 'Together, they can challenge Reviewer B’s rating or scrutiny.'],
    ['Reviewer A + Reviewer B', 'Together, they can question how the AC / editor uses their judgments.']
  ];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0, playing = !reduced.matches, inView = false, timer;
  function schedule() {
    clearTimeout(timer);
    if (playing && inView && !document.hidden) timer = setTimeout(() => show((current + 1) % alignments.length), 3000);
  }
  function playback() {
    figure.classList.toggle('is-playing', playing);
    play.textContent = playing ? 'Ⅱ' : '▷';
    const label = playing ? 'Pause illustration' : 'Play illustration';
    play.setAttribute('aria-label', label); play.title = label;
    schedule();
  }
  function show(index, manual = false) {
    current = index; figure.dataset.alignment = String(index);
    choices.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    title.textContent = alignments[index][0]; description.textContent = alignments[index][1];
    if (manual) { playing = false; announcement.textContent = alignments[index].join('. '); }
    playback();
  }
  choices.forEach((button,index) => button.addEventListener('click', () => show(index,true)));
  play.addEventListener('click', () => { playing = !playing; playback(); });
  figure.addEventListener('focusin', e => { if (e.target !== play && playing) { playing = false; playback(); } });
  document.addEventListener('visibilitychange', schedule);
  reduced.addEventListener('change', e => { if (e.matches) { playing = false; playback(); } });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { inView = entries[0].isIntersecting; schedule(); }, {threshold:.25}).observe(figure);
  else inView = true;
  show(0);
})();
