let books = [];
let filteredBooks = [];
let currentBook = null;
let currentChapter = 0;
let currentFontSize = 16;

let psalms = [];
let filteredPsalms = [];

Telegram.WebApp.ready();

function navigateTo(screen) {
  document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
  document.getElementById(`${screen}-screen`).classList.remove('hidden');
}

function navigateBack() {
  if (document.getElementById('book-reader').classList.contains('hidden')) {
    // Возвращаемся к главному меню
    document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
    document.getElementById('main-menu').classList.remove('hidden');
  } else {
    // Возвращаемся к списку книг
    document.getElementById('book-reader').classList.add('hidden');
    document.getElementById('books-screen').classList.remove('hidden');
  }
}

async function loadBooks() {
  try {
    const res = await fetch('books/index.json');
    books = await res.json();
    books.sort((a, b) => a.title.localeCompare(b.title));
    renderBooksList(books);
  } catch (e) {
    console.error('Ошибка загрузки книг:', e);
  }
}

function renderBooksList(list) {
  const container = document.getElementById('books-list');
  container.innerHTML = '';
  list.forEach((book, index) => {
    const div = document.createElement('div');
    div.className = 'book-item';
    div.textContent = book.title;
    div.onclick = () => openBook(book);
    container.appendChild(div);
  });
}

async function openBook(book) {
  try {
    const res = await fetch(`books/${book.file}`);
    currentBook = await res.json();
    currentChapter = 0;
    document.getElementById('books-screen').classList.add('hidden');
    document.getElementById('book-reader').classList.remove('hidden');

    document.getElementById('book-title').textContent = currentBook.title;
    renderChapters(currentBook.chapters);
    displayChapter(currentChapter);
  } catch (e) {
    console.error('Ошибка открытия книги:', e);
  }
}

function renderChapters(chapters) {
  const select = document.getElementById('chapter-select');
  select.innerHTML = chapters.map((_, i) => `<option value="${i}">Глава ${i + 1}</option>`).join('');
}

function jumpToChapter() {
  currentChapter = parseInt(document.getElementById('chapter-select').value);
  displayChapter(currentChapter);
}

function changeChapter(delta) {
  currentChapter += delta;
  if (currentChapter < 0) currentChapter = 0;
  if (currentChapter >= currentBook.chapters.length) currentChapter = currentBook.chapters.length - 1;
  document.getElementById('chapter-select').value = currentChapter;
  displayChapter(currentChapter);
}

function displayChapter(index) {
  const content = document.getElementById('book-content');
  content.style.fontSize = `${currentFontSize}px`;
  content.textContent = currentBook.chapters[index];
}

function adjustFontSize(delta) {
  currentFontSize += delta;
  if (currentFontSize < 12) currentFontSize = 12;
  if (currentFontSize > 24) currentFontSize = 24;
  document.getElementById('font-size-label').textContent = currentFontSize;
  displayChapter(currentChapter);
}

function filterBooksByTitle(query) {
  query = query.toLowerCase();
  const results = books.filter(b => b.title.toLowerCase().includes(query));
  renderBooksList(results);
}

function filterBooksByContent(query) {
  query = query.toLowerCase();
  if (!query) return renderBooksList(books);

  const results = books.filter(b =>
    b.chapters.some(ch => ch.toLowerCase().includes(query))
  );
  renderBooksList(results);
}

async function loadPsalms() {
  try {
    const res = await fetch('psalms/index.json');
    psalms = await res.json();
    renderPsalms(psalms);
  } catch (e) {
    console.error('Ошибка загрузки псалмов:', e);
  }
}

function renderPsalms(list) {
  const container = document.getElementById('psalms-list');
  container.innerHTML = '';
  list.forEach(psalm => {
    const div = document.createElement('div');
    div.className = 'psalm-item';
    div.innerHTML = `<strong>${psalm.number}. ${psalm.title}</strong><br>${psalm.text.substring(0, 100)}...`;
    div.onclick = () => alert(`${psalm.number}. ${psalm.title}\n\n${psalm.text}`);
    container.appendChild(div);
  });
}

function searchPsalms(query) {
  query = query.toLowerCase();
  if (!query) {
    renderPsalms(psalms);
    return;
  }

  const results = psalms.filter(p =>
    p.title.toLowerCase().includes(query) ||
    p.number.toString().includes(query) ||
    p.text.toLowerCase().includes(query)
  );
  renderPsalms(results);
}

// Загружаем данные при старте
window.addEventListener('load', () => {
  loadBooks();
  loadPsalms();
});
