'use strict';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Header shadow --------------------------------------------------------- */
const header = document.querySelector('.header');
const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

/* Mobile menu ----------------------------------------------------------- */
const burger = document.querySelector('.burger');
const nav = document.querySelector('#primary-nav');
const body = document.body;

const setMenu = (open) => {
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  body.classList.toggle('menu-open', open);
  if (open) nav.querySelector('a')?.focus({ preventScroll: true });
  else if (document.activeElement && nav.contains(document.activeElement)) burger.focus();
};

burger.addEventListener('click', () => {
  setMenu(burger.getAttribute('aria-expanded') !== 'true');
});

nav.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && body.classList.contains('menu-open')) setMenu(false);
});

document.addEventListener('click', (event) => {
  if (!body.classList.contains('menu-open')) return;
  if (nav.contains(event.target) || burger.contains(event.target)) return;
  setMenu(false);
});

window.matchMedia('(min-width: 1024px)').addEventListener('change', (event) => {
  if (event.matches) setMenu(false);
});

/* Reveal on scroll ------------------------------------------------------ */
const revealItems = document.querySelectorAll('[data-reveal]');

if ('IntersectionObserver' in window && !prefersReducedMotion) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px' });

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

/* Stats counter --------------------------------------------------------- */
const counters = document.querySelectorAll('[data-count]');

const animateCounter = (element) => {
  const target = Number(element.dataset.count);
  const duration = 1200;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(target * eased).toLocaleString('ru-RU');
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
};

if (counters.length) {
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    counters.forEach((counter) => {
      counter.textContent = Number(counter.dataset.count).toLocaleString('ru-RU');
    });
  } else {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    counters.forEach((counter) => counterObserver.observe(counter));
  }
}

/* Phone mask ------------------------------------------------------------ */
const phoneInput = document.querySelector('#phone');

const formatPhone = (value) => {
  let digits = value.replace(/\D/g, '');
  if (!digits) return '';
  if (digits[0] === '8') digits = '7' + digits.slice(1);
  if (digits[0] !== '7') digits = '7' + digits;
  digits = digits.slice(0, 11);

  let result = '+7';
  if (digits.length > 1) result += ' (' + digits.slice(1, 4);
  if (digits.length >= 4) result += ') ' + digits.slice(4, 7);
  if (digits.length >= 7) result += '-' + digits.slice(7, 9);
  if (digits.length >= 9) result += '-' + digits.slice(9, 11);
  return result;
};

if (phoneInput) {
  phoneInput.addEventListener('input', (event) => {
    event.target.value = formatPhone(event.target.value);
  });

  phoneInput.addEventListener('focus', () => {
    if (!phoneInput.value) phoneInput.value = '+7 (';
  });

  phoneInput.addEventListener('blur', () => {
    if (phoneInput.value.replace(/\D/g, '').length === 1) phoneInput.value = '';
  });
}

/* Form validation ------------------------------------------------------- */
const form = document.querySelector('#lead-form');

if (form) {
  const fields = {
    name: {
      input: form.querySelector('#name'),
      validate: (value) => value.trim().length >= 2 || 'Укажите имя — минимум 2 символа',
    },
    phone: {
      input: form.querySelector('#phone'),
      validate: (value) => value.replace(/\D/g, '').length === 11 || 'Введите телефон полностью',
    },
    area: {
      input: form.querySelector('#area'),
      validate: (value) => {
        if (!value) return true;
        const area = Number(value);
        return (area >= 10 && area <= 600) || 'Площадь от 10 до 600 м²';
      },
    },
    consent: {
      input: form.querySelector('#consent'),
      validate: (value, input) => input.checked || 'Без согласия не можем принять заявку',
    },
  };

  const showError = (key, message) => {
    const { input } = fields[key];
    const errorBox = document.getElementById(`${key}-error`);
    if (errorBox) errorBox.textContent = message || '';
    input.setAttribute('aria-invalid', String(Boolean(message)));
    input.closest('.field')?.classList.toggle('is-invalid', Boolean(message));
    if (key === 'consent') input.closest('.consent')?.classList.toggle('is-invalid', Boolean(message));
  };

  const validateField = (key) => {
    const field = fields[key];
    const result = field.validate(field.input.value, field.input);
    const message = result === true ? '' : result;
    showError(key, message);
    return !message;
  };

  Object.entries(fields).forEach(([key, field]) => {
    field.input.addEventListener('blur', () => validateField(key));
    field.input.addEventListener('input', () => {
      if (field.input.getAttribute('aria-invalid') === 'true') validateField(key);
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const valid = Object.keys(fields).map(validateField).every(Boolean);
    if (!valid) {
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      firstInvalid?.focus();
      return;
    }

    const submit = form.querySelector('.form__submit');
    const label = submit.querySelector('.form__submit-text');
    submit.disabled = true;
    label.textContent = 'Отправляем…';

    window.setTimeout(() => {
      form.querySelector('.form__success').hidden = false;
      const note = form.querySelector('.form__note');
      if (note) note.hidden = true;

      form.reset();
      Object.keys(fields).forEach((key) => showError(key, ''));
      submit.disabled = false;
      label.textContent = 'Получить смету';
    }, 700);
  });
}

/* Footer year ----------------------------------------------------------- */
const yearNode = document.querySelector('#year');
if (yearNode) yearNode.textContent = String(new Date().getFullYear());
