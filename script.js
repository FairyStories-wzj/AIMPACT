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
