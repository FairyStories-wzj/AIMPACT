const header = document.querySelector('.site-header');
const progress = document.querySelector('.reading-progress span');

function updateScrollUI() {
  const top = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  header.classList.toggle('scrolled', top > 16);
  progress.style.width = `${max > 0 ? (top / max) * 100 : 0}%`;
}

updateScrollUI();
window.addEventListener('scroll', updateScrollUI, { passive: true });

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

document.querySelectorAll('.button.is-placeholder').forEach((button) => {
  button.addEventListener('click', (event) => event.preventDefault());
});

const datasetCaseList = document.querySelector('#dataset-cases');
const scoreFields = [
  ['score_language', 'Language'],
  ['score_vocal_pronunciation', 'Pronunciation'],
  ['score_vocal_volume_pace', 'Volume & pace'],
  ['score_vocal_fluency', 'Fluency'],
  ['score_nonvocal', 'Non-vocal'],
  ['score_visuals_design', 'Visual design'],
  ['score_visuals_techniques_sync', 'Visual sync'],
  ['score_visuals_techniques_reference', 'Visual reference']
];
const scoreTones = ['#2563eb', '#7c3aed', '#0891b2', '#0d9488', '#4f46e5', '#6366f1', '#0284c7', '#8b5cf6'];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}

function scoreRow(label, score, tone) {
  const numericScore = Number(score) || 0;
  const cells = Array.from({ length: 5 }, (_, index) => `<b class="${index < numericScore ? 'is-filled' : ''}" style="--tone: ${tone}"></b>`).join('');
  return `<div style="--tone: ${tone}"><span>${escapeHtml(label)}</span><i aria-hidden="true">${cells}</i><strong>${numericScore}</strong></div>`;
}

const caseTitles = {
  'VID-001': 'Clear communication, integrated visuals',
  'VID-003': 'Measured ideas, audience engagement gaps',
  'VID-004': 'Accurate content, restrained delivery',
  'VID-008': 'Steady explanation, limited presence',
  'VID-016': 'Strong visuals, softer vocal delivery',
  'VID-018': 'Confident pacing, polished slide alignment',
  'VID-023': 'Promising structure, uneven emphasis',
  'VID-028': 'Emerging clarity, focused coaching needs',
  'VID-034': 'Fluent presence, presentation-ready polish'
};

function caseTitle(videoId) {
  return caseTitles[videoId] || 'Multimodal presentation assessment';
}

function datasetCard(annotation) {
  const videoId = escapeHtml(annotation.video_id);
  const fileName = `${encodeURIComponent(annotation.video_id)}.mp4`;
  const rows = scoreFields.map(([field, label], fieldIndex) => scoreRow(label, annotation[field], scoreTones[fieldIndex])).join('');
  const title = escapeHtml(caseTitle(annotation.video_id));
  return `<article class="case-card reveal">
    <div class="case-video is-real">
      <video preload="metadata" playsinline aria-label="Annotated presentation recording ${videoId}" src="videos/compressed/${fileName}"></video>
      <div class="video-controls" role="group" aria-label="Video controls">
        <button class="video-control video-toggle" type="button" aria-label="Play video"><span aria-hidden="true">▶</span></button>
        <span class="video-time" aria-live="off">0:00 / 0:00</span>
        <input class="video-progress" type="range" min="0" max="100" value="0" step="0.1" aria-label="Video progress">
        <button class="video-control video-volume" type="button" aria-label="Mute video"><span aria-hidden="true">🔊</span></button>
        <button class="video-control video-fullscreen" type="button" aria-label="Enter fullscreen"><span aria-hidden="true">⛶</span></button>
      </div>
    </div>
    <div class="case-content">
      <div class="case-title"><h4>${title}</h4></div>
      <div class="score-list" aria-label="Dimension scores out of 5">${rows}</div>
      <div class="overall-score"><span>Overall score</span><strong>${Number(annotation.overall_score) || 0}/5</strong></div>
      <blockquote class="overall-comment">“${escapeHtml(annotation.overall_comment)}”</blockquote>
    </div>
  </article>`;
}

function formatVideoTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

function setupVideoControls(root) {
  root.querySelectorAll('.case-video.is-real').forEach((frame) => {
    const video = frame.querySelector('video');
    const toggle = frame.querySelector('.video-toggle');
    const progress = frame.querySelector('.video-progress');
    const time = frame.querySelector('.video-time');
    const volume = frame.querySelector('.video-volume');
    const fullscreen = frame.querySelector('.video-fullscreen');

    if (!video || !toggle || !progress || !time || !volume || !fullscreen) return;

    const update = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      progress.value = duration ? String((video.currentTime / duration) * 100) : '0';
      time.textContent = `${formatVideoTime(video.currentTime)} / ${formatVideoTime(duration)}`;
      toggle.setAttribute('aria-label', video.paused ? 'Play video' : 'Pause video');
      toggle.querySelector('span').textContent = video.paused ? '▶' : '❚❚';
      volume.querySelector('span').textContent = video.muted ? '🔇' : '🔊';
      volume.setAttribute('aria-label', video.muted ? 'Unmute video' : 'Mute video');
    };

    toggle.addEventListener('click', () => {
      if (video.paused) void video.play().catch(() => {});
      else video.pause();
    });

    video.addEventListener('click', () => toggle.click());
    video.addEventListener('loadedmetadata', update);
    video.addEventListener('timeupdate', update);
    video.addEventListener('play', update);
    video.addEventListener('pause', update);
    video.addEventListener('volumechange', update);

    progress.addEventListener('input', () => {
      if (Number.isFinite(video.duration)) video.currentTime = (Number(progress.value) / 100) * video.duration;
    });

    volume.addEventListener('click', () => {
      video.muted = !video.muted;
      update();
    });

    fullscreen.addEventListener('click', () => {
      if (document.fullscreenElement) void document.exitFullscreen();
      else if (frame.requestFullscreen) void frame.requestFullscreen();
    });

    update();
  });
}

async function loadDatasetAnnotations() {
  if (!datasetCaseList) return;
  try {
    const response = await fetch('videos/annotations_selected.json');
    if (!response.ok) throw new Error(`Could not load annotations (${response.status})`);
    const annotations = await response.json();
    const ordered = [...annotations].sort((a, b) => String(a.video_id).localeCompare(String(b.video_id), undefined, { numeric: true }));
    datasetCaseList.innerHTML = ordered.map(datasetCard).join('');
    datasetCaseList.setAttribute('aria-busy', 'false');
    datasetCaseList.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
    setupVideoControls(datasetCaseList);
  } catch (error) {
    datasetCaseList.setAttribute('aria-busy', 'false');
    datasetCaseList.innerHTML = '<p class="dataset-load-error">The selected annotations could not be loaded in this preview.</p>';
    console.error(error);
  }
}

loadDatasetAnnotations();
