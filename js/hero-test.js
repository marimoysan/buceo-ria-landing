// TEMPORAL: A/B test del hero. Quitar este archivo y el bloque .hero-test-nav
// en index.html / styles.css una vez elegida la imagen/vídeo definitivo.
(function () {
  const heroSection = document.getElementById('hero');
  const heroBgImg = document.querySelector('.hero-bg-img');
  if (!heroSection || !heroBgImg) return;

  const images = {
    1: 'assets/images/hero_image.jpg',
    2: 'assets/images/hero_image2.jpg',
    3: 'assets/images/hero_image3.jpg',
  };

  const video = document.createElement('video');
  video.className = 'hero-bg-video';
  video.src = 'assets/images/hero_video.mp4';
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('aria-hidden', 'true');
  heroBgImg.insertAdjacentElement('afterend', video);

  const buttons = document.querySelectorAll('.hero-test-nav button');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const option = btn.dataset.hero;
      if (option === '4') {
        heroBgImg.style.display = 'none';
        video.classList.add('active');
        video.currentTime = 0;
        video.play();
      } else {
        video.classList.remove('active');
        video.pause();
        heroBgImg.style.display = '';
        heroBgImg.style.backgroundImage = `url('${images[option]}')`;
      }
    });
  });
})();
