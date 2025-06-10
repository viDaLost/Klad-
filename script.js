let booksData = [];
let psalmsData = [];

function goTo(page) {
  window.location.href = page + ".html";
}

function goHome() {
  window.location.href = "index.html";
}

// Загрузка данных
async function loadBooks() {
  const res = await fetch("data/books.json");
  booksData = await res.json();
}

async function loadPsalms() {
  const res = await fetch("data/psalms.json");
  psalmsData = await res.json();
}

function searchBooks() {
  const input = document.getElementById("bookSearchInput").value.toLowerCase();
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  const results = booksData.filter(book => book.title.toLowerCase().includes(input));

  if (results.length === 0) {
    resultsDiv.innerHTML = "<p>Ничего не найдено</p>";
    return;
  }

  results.forEach(book => {
    const el = document.createElement("div");
    el.className = "result-item";
    el.innerText = book.title;
    el.onclick = () => showBook(book);
    resultsDiv.appendChild(el);
  });
}

function searchByWord() {
  const word = document.getElementById("wordSearchInput").value.toLowerCase();
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  let matches = [];

  booksData.forEach(book => {
    book.chapters.forEach(chapter => {
      if (chapter.text.toLowerCase().includes(word)) {
        matches.push({
          bookTitle: book.title,
          chapterNumber: chapter.number,
          snippet: chapter.text.slice(0, 100) + "..."
        });
      }
    });
  });

  if (matches.length === 0) {
    resultsDiv.innerHTML = "<p>Ничего не найдено</p>";
    return;
  }

  matches.forEach(match => {
    const el = document.createElement("div");
    el.className = "result-item";
    el.innerHTML = `<strong>${match.bookTitle}</strong><br>${match.snippet}`;
    el.onclick = () => showBookAndChapter(match.bookTitle, match.chapterNumber);
    resultsDiv.appendChild(el);
  });
}

function showBook(book) {
  localStorage.setItem("lastRead", JSON.stringify({ title: book.title, chapter: 1 }));
  alert(`Открыть книгу "${book.title}", глава 1`);
}

function showBookAndChapter(title, chapter) {
  const book = booksData.find(b => b.title === title);
  if (!book) return;

  const chap = book.chapters.find(c => c.number === chapter);
  if (!chap) return;

  localStorage.setItem("lastRead", JSON.stringify({ title, chapter }));
  alert(`Открыть "${title}", глава ${chapter}`);
}

// Псалмы
function searchPsalms() {
  const input = document.getElementById("psalmSearchInput").value.toLowerCase();
  const resultsDiv = document.getElementById("psalmResults");
  resultsDiv.innerHTML = "";

  const results = psalmsData.filter(p =>
    p.number.toString().includes(input) ||
    p.title.toLowerCase().includes(input) ||
    p.text.toLowerCase().includes(input)
  );

  results.forEach(p => {
    const el = document.createElement("div");
    el.className = "result-item";
    el.innerHTML = `<strong>Псалом ${p.number}</strong>: ${p.title}`;
    el.onclick = () => showModal(p.text);
    resultsDiv.appendChild(el);
  });
}

function showModal(text) {
  document.getElementById("modalText").innerText = text;
  document.getElementById("modal").style.display = "flex";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

function increaseFontSize() {
  const modalText = document.getElementById("modalText");
  let currentSize = parseFloat(window.getComputedStyle(modalText).fontSize);
  modalText.style.fontSize = (currentSize + 2) + "px";
}
