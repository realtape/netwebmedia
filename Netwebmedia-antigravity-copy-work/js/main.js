/* ============================================================
   NetWebMedia - Main JavaScript
   ============================================================ */

function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });
}

function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
    document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
  });

  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

function initFloatingSquares() {
  const container = document.querySelector('.squares-container');
  if (!container) return;

  const colors = ['#FF671F', '#FF8C42', '#012169', '#004B87', '#FF9A6C', '#FFB347', '#0047AB'];

  function createSquare() {
    const square = document.createElement('div');
    square.className = 'sq';

    const size = Math.random() * 30 + 10;
    const x = Math.random() * 100;
    const duration = Math.random() * 8 + 6;
    const delay = Math.random() * 5;
    const color = colors[Math.floor(Math.random() * colors.length)];

    square.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x}%;
      bottom: -50px;
      border-color: ${color};
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
    `;

    container.appendChild(square);
    setTimeout(() => square.remove(), (duration + delay) * 1000);
  }

  for (let i = 0; i < 20; i += 1) {
    setTimeout(createSquare, i * 200);
  }

  setInterval(createSquare, 400);
}

function initScrollReveal() {
  const elements = document.querySelectorAll('.scroll-reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  elements.forEach((element) => observer.observe(element));
}

function animateCounter(element, target, suffix = '') {
  const duration = 1800;
  const start = performance.now();
  const numericTarget = parseFloat(target);
  const isDecimal = String(target).includes('.');

  function update(time) {
    const elapsed = time - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = numericTarget * eased;

    element.textContent = `${isDecimal ? current.toFixed(1) : Math.floor(current)}${suffix}`;
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const element = entry.target;
      animateCounter(element, element.dataset.counter, element.dataset.suffix || '');
      observer.unobserve(element);
    });
  }, { threshold: 0.5 });

  counters.forEach((counter) => observer.observe(counter));
}

function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  const context = canvas.getContext('2d');
  const particles = [];
  const count = 60;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resizeCanvas();

  for (let i = 0; i < count; i += 1) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2 + 1
    });
  }

  function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

      context.beginPath();
      context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      context.fillStyle = 'rgba(255,103,31,0.35)';
      context.fill();
    });

    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance >= 120) continue;

        context.beginPath();
        context.moveTo(particles[i].x, particles[i].y);
        context.lineTo(particles[j].x, particles[j].y);
        context.strokeStyle = `rgba(255,103,31,${0.15 * (1 - distance / 120)})`;
        context.lineWidth = 0.5;
        context.stroke();
      }
    }

    requestAnimationFrame(draw);
  }

  draw();
  window.addEventListener('resize', resizeCanvas);
}

function initTypewriter() {
  const element = document.querySelector('.typewriter');
  if (!element) return;

  const words = element.dataset.words ? JSON.parse(element.dataset.words) : [];
  if (!words.length) return;

  let wordIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function type() {
    const word = words[wordIndex % words.length];

    if (deleting) {
      charIndex -= 1;
    } else {
      charIndex += 1;
    }

    element.textContent = word.substring(0, charIndex);

    let delay = deleting ? 50 : 90;

    if (!deleting && charIndex === word.length) {
      deleting = true;
      delay = 1800;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      wordIndex += 1;
      delay = 450;
    }

    setTimeout(type, delay);
  }

  type();
}

function initForm() {
  const form = document.querySelector('.contact-form-el');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const button = form.querySelector('button[type="submit"]');
    if (!button) return;

    const originalText = button.textContent;
    button.textContent = 'Inquiry sent';
    button.style.background = '#10B981';

    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '';
      form.reset();
    }, 2500);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initFloatingSquares();
  initScrollReveal();
  initCounters();
  initParticles();
  initTypewriter();
  initForm();

  document
    .querySelectorAll('.services-grid .glass-card, .testimonials-grid .glass-card, .blog-grid .glass-card')
    .forEach((element, index) => {
      element.style.transitionDelay = `${index * 0.08}s`;
      element.classList.add('scroll-reveal');
    });
});
