document.addEventListener('DOMContentLoaded', () => {
  const hero = document.querySelector('.ticket-lookup-hero');
  const cards = document.querySelectorAll('.reveal');
  const accordionButtons = document.querySelectorAll('.lk-adv-toggle');
  const buttons = document.querySelectorAll('.lk-btn-search, .lk-btn-action');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  cards.forEach((card) => revealObserver.observe(card));

  accordionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const icon = button.querySelector('.lk-adv-chevron');
      if (icon) icon.classList.toggle('open');
    });
  });

  buttons.forEach((button) => {
    button.addEventListener('click', function () {
      if (!this.classList.contains('lk-btn-action')) {
        this.classList.add('is-loading');
        const icon = this.querySelector('i');
        if (icon) icon.classList.add('bi-arrow-clockwise');
      }
    });
  });

  const counters = document.querySelectorAll('[data-target]');
  const speed = 1600;
  const animateCounter = (el) => {
    const target = Number(el.getAttribute('data-target')) || 0;
    const duration = speed;
    const increment = target / (duration / 16);
    let current = 0;
    const step = () => {
      current += increment;
      if (current < target) {
        el.textContent = Math.floor(current).toLocaleString('vi-VN');
        requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString('vi-VN');
      }
    };
    step();
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  counters.forEach((counter) => counterObserver.observe(counter));

  // Hero tilt perspective animation removed to disable hover wiggling effect

});
