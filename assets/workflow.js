(() => {
  'use strict';
  const demo = document.getElementById('compact-demo');
  if (!demo) return;
  const steps = [...demo.querySelectorAll('[data-phase-choice]')];
  const play = document.getElementById('demo-play');
  const captions = [
    'Critiques are produced in parallel. None carries a recommendation.',
    'Four independent records add ratings and scrutiny. Disagreement stays visible.',
    'The AC / editor weighs all four records and explains the decision—without a fixed aggregation formula.'
  ];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let phase = 0, playing = !reduced.matches, visible = false, timer;
  const schedule = () => {
    clearTimeout(timer);
    if (playing && visible && !document.hidden) timer=setTimeout(()=>show((phase+1)%3), phase===2?4000:5000);
  };
  function show(index,manual=false) {
    phase=index;demo.dataset.phase=String(index);
    steps.forEach((button,i)=>{if(i===index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
    document.getElementById('demo-caption').textContent=captions[index];
    demo.querySelector('.scrutiny-row').setAttribute('aria-hidden',String(index<1));
    demo.querySelector('.compact-decision').setAttribute('aria-hidden',String(index<2));
    if(manual)playing=false;
    sync();
  }
  function sync() {
    play.textContent=playing?'Ⅱ Pause':'▷ Play';
    play.setAttribute('aria-label',playing?'Pause process animation':'Play process animation');
    demo.classList.toggle('is-playing',playing);schedule();
  }
  steps.forEach((button,index)=>button.addEventListener('click',()=>show(index,true)));
  play.addEventListener('click',()=>{playing=!playing;sync();});
  document.getElementById('demo-replay').addEventListener('click',()=>{playing=!reduced.matches;show(0);});
  demo.addEventListener('focusin',e=>{if(e.target!==play&&e.target.id!=='demo-replay'){playing=false;sync();}});
  reduced.addEventListener('change',e=>{if(e.matches){playing=false;sync();}});
  document.addEventListener('visibilitychange',schedule);
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:.2}).observe(demo);
  else visible=true;
  show(0);
})();
