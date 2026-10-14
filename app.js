'use strict';
const content = window.GAD_CONTENT;
const authors = document.querySelector('#authors');
content.authors.forEach((author, i) => {
  if (i === 5) { const br = document.createElement('span'); br.className = 'author-row-break'; br.setAttribute('aria-hidden','true'); authors.append(br); }
  const wrap = document.createElement('span'); wrap.className = 'author';
  const name = document.createElement(author.url ? 'a' : 'span'); name.textContent = author.name;
  if (author.url) { name.href = author.url; name.target = '_blank'; name.rel = 'noopener noreferrer'; }
  const marks = document.createElement('sup');
  for (const mark of author.marks) {
    if ('*†✉'.includes(mark)) {
      const symbol = document.createElement('span'); symbol.className = 'author-role-mark'; symbol.textContent = mark; marks.append(symbol);
    } else marks.append(document.createTextNode(mark));
  }
  wrap.append(name, marks); authors.append(wrap);
});
const resources = document.querySelector('#resource-links');
for (const [key, label] of [['paper','Paper'],['code','Code']]) {
  const url = content.links[key];
  const element = document.createElement(url ? 'a' : 'span');
  element.className = 'resource-button';
  if (url) { element.href = url; element.target = '_blank'; element.rel = 'noopener noreferrer'; }
  else { element.setAttribute('aria-disabled', 'true'); element.classList.add('coming-soon'); }
  const icon = document.createElement('span'); icon.className = 'resource-icon'; icon.setAttribute('aria-hidden','true');
  if (key === 'paper') { icon.classList.add('arxiv-icon'); icon.textContent = '\ue974'; }
  else { const image = document.createElement('img'); image.src = 'assets/icons/github.svg'; image.alt = ''; image.width = 18; image.height = 18; icon.append(image); }
  const text = document.createElement('span'); text.textContent = label;
  element.append(icon, text);
  if (!url) { const note = document.createElement('small'); note.textContent = 'Coming soon'; element.append(note); }
  resources.append(element);
}
resources.hidden = false;
const comparisons = [];
document.querySelectorAll('.comparison').forEach(root => {
  const category = root.dataset.category;
  const video = root.querySelector('video');
  const status = root.querySelector('.video-status');
  const thumbs = root.querySelector('.thumbnails');
  video.controls = false;
  video.muted = true;
  const showStatus = message => {
    status.textContent = message;
    status.hidden = !message;
  };
  const startPlayback = () => video.play().catch(error => {
    if (error.name === 'AbortError') return;
    showStatus('Select a thumbnail to retry playback.');
  });
  video.resumePlayback = startPlayback;
  let current = 1;
  const name = category === 'static' ? 'Long-range' : 'Dynamic';
  function select(scene, play = true) {
    video.pause(); current = scene;
    const mediaVersion = '?v=labels56';
    video.style.aspectRatio = '2496 / 840';
    video.poster = `assets/images/${category}-${scene}-poster.jpg${mediaVersion}`;
    video.src = `assets/videos/${category}-${scene}.mp4${mediaVersion}`;
    video.setAttribute('aria-label', `${name} scene ${scene}: eight-panel comparison`);
    thumbs.querySelectorAll('button').forEach((button,i) => button.setAttribute('aria-pressed', String(i+1 === scene)));
    showStatus('');
    video.load();
    if (play) startPlayback();
  }
  for (let scene = 1; scene <= content.sceneCounts[category]; scene++) {
    const button = document.createElement('button'); button.className = 'thumbnail'; button.type = 'button';
    button.setAttribute('aria-label',`Show ${name.toLowerCase()} scene ${scene}`);
    button.setAttribute('aria-pressed',String(scene === 1));
    const img = document.createElement('img'); img.src = `assets/thumbnails/${category}-${scene}.jpg`; img.alt = ''; img.width = 104; img.height = 60; img.loading = 'lazy';
    const caption = document.createElement('span'); caption.className = 'scene-caption'; caption.textContent = `Scene ${scene}`;
    button.append(img, caption); thumbs.append(button);
    button.addEventListener('click', () => { if (current !== scene) select(scene); else startPlayback(); });
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault(); const buttons = [...thumbs.children];
      let index = scene-1;
      if (event.key === 'ArrowLeft') index = (index-1+buttons.length)%buttons.length;
      if (event.key === 'ArrowRight') index = (index+1)%buttons.length;
      if (event.key === 'Home') index = 0;
      if (event.key === 'End') index = buttons.length-1;
      buttons[index].focus(); buttons[index].click();
    });
  }
  video.addEventListener('waiting', () => { showStatus('Loading video…'); });
  video.addEventListener('playing', () => { showStatus(''); });
  video.addEventListener('error', () => { showStatus('Unable to load this video. Please select another thumbnail or reload the page.'); });
  comparisons.push(video); select(1, false);
});
const visibleComparisons = new Set();
document.addEventListener('visibilitychange', () => {
  comparisons.forEach(video => {
    if (document.hidden) video.pause();
    else if (visibleComparisons.has(video)) video.resumePlayback();
  });
});
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    const video = entry.target;
    if (entry.isIntersecting) {
      visibleComparisons.add(video);
      if (!document.hidden) video.resumePlayback();
    } else {
      visibleComparisons.delete(video);
      video.pause();
    }
  }), {threshold: 0});
  comparisons.forEach(video => observer.observe(video));
} else {
  comparisons.forEach(video => {
    visibleComparisons.add(video);
    if (!document.hidden) video.resumePlayback();
  });
}
const carousel = document.querySelector('.carousel');
const track = carousel.querySelector('.carousel-track');
const slides = [...carousel.querySelectorAll('.slide')];
const dots = [...carousel.querySelectorAll('.carousel-dots button')];
let active = 0;
function showSlide(index) {
  active = (index + slides.length) % slides.length;
  track.style.transform = `translateX(-${active*100}%)`;
  slides.forEach((slide, i) => { slide.setAttribute('aria-hidden', String(i !== active)); slide.inert = i !== active; });
  dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === active)));
  document.querySelector('#attention-label').textContent = `${active ? 'Dynamic' : 'Static'} scene · ${active+1} / ${slides.length}`;
}
carousel.querySelector('.previous').addEventListener('click', () => showSlide(active-1));
carousel.querySelector('.next').addEventListener('click', () => showSlide(active+1));
dots.forEach((dot,i) => dot.addEventListener('click', () => showSlide(i)));
carousel.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); showSlide(active + (event.key === 'ArrowRight' ? 1 : -1)); }
});
let touch = null;
carousel.addEventListener('touchstart', e => { touch = {x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY}; }, {passive:true});
carousel.addEventListener('touchend', e => {
  if (!touch) return;
  const dx = e.changedTouches[0].clientX-touch.x, dy=e.changedTouches[0].clientY-touch.y;
  if (Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)) showSlide(active+(dx<0?1:-1));
  touch=null;
}, {passive:true});

// Reveal full evidence in sequence, with no frame swapping or interactive controls.
(() => {
  const figure = document.querySelector('.motivation-reveal');
  if (!figure) return;
  let visible = false;
  const update = () => figure.classList.toggle('is-paused', !visible || document.hidden);
  const ready = Promise.all([...figure.querySelectorAll('img')].map(image => {
    image.loading = 'eager';
    return image.decode();
  }));
  ready.then(() => {
    figure.classList.add('is-animated');
    update();
  }).catch(() => {}); // The complete static figure remains available on loading failure.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); }, {threshold:.25}).observe(figure);
  } else { visible = true; update(); }
  document.addEventListener('visibilitychange', update);
})();
