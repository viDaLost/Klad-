const CONFIG = {
  couple: ['Артур', 'Алиса'],
  dateISO: '2026-05-26T16:00:00+03:00',
  weddingDay: 26,
  calendarMonthIndex: 4, // май: 0 = январь
  calendarYear: 2026,
  storageKey: 'premium-wedding-rsvp-v1',
};

const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

function initReveal() {
  const items = qsa('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -40px 0px' });
  items.forEach((item) => observer.observe(item));
}

function initCountdown() {
  const root = qs('[data-countdown]');
  if (!root) return;

  const nodes = {
    days: qs('[data-days]', root),
    hours: qs('[data-hours]', root),
    minutes: qs('[data-minutes]', root),
    seconds: qs('[data-seconds]', root),
  };

  const pad = (num) => String(num).padStart(2, '0');
  const target = new Date(CONFIG.dateISO).getTime();

  const render = () => {
    const distance = target - Date.now();

    if (Number.isNaN(target) || distance <= 0) {
      root.classList.add('is-done');
      root.innerHTML = '<div>Событие уже состоялось — сохраните эту страницу как красивое воспоминание.</div>';
      return;
    }

    const days = Math.floor(distance / 86_400_000);
    const hours = Math.floor((distance % 86_400_000) / 3_600_000);
    const minutes = Math.floor((distance % 3_600_000) / 60_000);
    const seconds = Math.floor((distance % 60_000) / 1000);

    nodes.days.textContent = pad(days);
    nodes.hours.textContent = pad(hours);
    nodes.minutes.textContent = pad(minutes);
    nodes.seconds.textContent = pad(seconds);
  };

  render();
  setInterval(render, 1000);
}

function initCalendar() {
  const root = qs('[data-calendar-days]');
  if (!root) return;

  const { calendarYear: year, calendarMonthIndex: month, weddingDay } = CONFIG;
  const firstDay = new Date(year, month, 1).getDay();
  const mondayBasedOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const frag = document.createDocumentFragment();

  for (let i = 0; i < mondayBasedOffset; i += 1) {
    const empty = document.createElement('span');
    empty.className = 'calendar__day is-empty';
    frag.append(empty);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cell = document.createElement('span');
    cell.className = `calendar__day${day === weddingDay ? ' is-wedding' : ''}`;
    cell.textContent = day;
    frag.append(cell);
  }

  root.replaceChildren(frag);
}

function initNavigationSpy() {
  const links = qsa('.mobile-nav a');
  const sections = links
    .map((link) => qs(link.getAttribute('href')))
    .filter(Boolean);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
      });
    });
  }, { threshold: 0.45 });

  sections.forEach((section) => observer.observe(section));
}

function initRsvp() {
  const form = qs('[data-rsvp-form]');
  const result = qs('[data-rsvp-result]');
  if (!form || !result) return;

  const saved = localStorage.getItem(CONFIG.storageKey);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      Object.entries(data).forEach(([key, value]) => {
        if (form.elements[key]) form.elements[key].value = value;
      });
    } catch {}
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));

    const message = [
      'Ответ на свадебное приглашение',
      `Имя: ${data.name || '—'}`,
      `Присутствие: ${data.attendance || '—'}`,
      `Второй день: ${data.secondDay || '—'}`,
      `Комментарий: ${data.comment || '—'}`,
    ].join('\n');

    result.hidden = false;
    result.innerHTML = `<strong>Ответ сохранён.</strong>\n\n${escapeHtml(message)}\n<button class="btn btn--ghost" type="button" data-copy-answer>Скопировать сообщение</button>`;

    qs('[data-copy-answer]', result).addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(message);
        qs('[data-copy-answer]', result).textContent = 'Скопировано';
      } catch {
        qs('[data-copy-answer]', result).textContent = 'Скопируйте вручную';
      }
    });
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function initSoundToggle() {
  const button = qs('[data-sound-toggle]');
  const label = qs('[data-sound-label]');
  const audio = qs('[data-audio]');
  if (!button || !audio) return;

  button.addEventListener('click', async () => {
    const source = qs('source', audio)?.getAttribute('src');
    if (!source) {
      label.textContent = 'Добавьте музыку';
      button.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(0)' }], { duration: 240 });
      return;
    }

    if (audio.paused) {
      await audio.play();
      label.textContent = 'Играет';
    } else {
      audio.pause();
      label.textContent = 'Музыка';
    }
  });
}

function initTimelineMicroMotion() {
  const cards = qsa('.timeline article');
  cards.forEach((card, index) => {
    card.style.transitionDelay = `${index * 70}ms`;
    card.classList.add('reveal');
  });
}

function hydrateCouple() {
  const [first, second] = CONFIG.couple;
  qsa('[data-bridegroom-a]').forEach((node) => { node.textContent = first; });
  qsa('[data-bridegroom-b]').forEach((node) => { node.textContent = second; });
}

document.addEventListener('DOMContentLoaded', () => {
  hydrateCouple();
  initTimelineMicroMotion();
  initReveal();
  initCountdown();
  initCalendar();
  initNavigationSpy();
  initRsvp();
  initSoundToggle();
});
