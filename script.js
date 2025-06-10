// script.js
let currentBook = null;
let currentChapter = 0;
let currentFontSize = 16;

Telegram.WebApp.ready();

function showSection(section) {
    document.querySelectorAll('.container').forEach(el => el.classList.add('hidden'));
    document.getElementById(`${section}-section`).classList.remove('hidden');
    
    if (section === 'books' && !document.getElementById('book-list').innerHTML) {
        loadBooks();
    } else if (section === 'psalms' && !document.getElementById('psalm-list').innerHTML) {
        loadPsalms();
    }
}

function backTo(section) {
    if (section === 'books') {
        document.getElementById('book-reader').classList.add('hidden');
        document.getElementById('books-section').classList.remove('hidden');
    } else {
        document.querySelectorAll('.container').forEach(el => el.classList.add('hidden'));
        document.getElementById('main').classList.remove('hidden');
    }
}

async function loadBooks() {
    try {
        const response = await fetch('books/index.json');
        const books = await response.json();
        
        books.sort((a, b) => a.title.localeCompare(b.title));
        window.booksData = books;
        
        const list = document.getElementById('book-list');
        list.innerHTML = '';
        
        books.forEach(book => {
            const div = document.createElement('div');
            div.className = 'book-item';
            div.textContent = book.title;
            div.onclick = () => loadBook(book);
            list.appendChild(div);
        });
    } catch (error) {
        console.error('Error loading books:', error);
    }
}

async function loadBook(book) {
    try {
        const response = await fetch(`books/${book.file}`);
        const bookData = await response.json();
        
        currentBook = bookData;
        currentChapter = 0;
        
        document.getElementById('books-section').classList.add('hidden');
        document.getElementById('book-reader').classList.remove('hidden');
        
        // Update chapter select
        const select = document.getElementById('chapter-select');
        select.innerHTML = '';
        
        bookData.chapters.forEach((chapter, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `Глава ${index + 1}`;
            select.appendChild(option);
        });
        
        select.value = currentChapter;
        displayChapter();
    } catch (error) {
        console.error('Error loading book:', error);
    }
}

function changeChapter() {
    currentChapter = parseInt(document.getElementById('chapter-select').value);
    displayChapter();
}

function displayChapter() {
    const content = document.getElementById('book-content');
    content.style.fontSize = `${currentFontSize}px`;
    content.textContent = currentBook.chapters[currentChapter];
}

function changeFontSize(delta) {
    currentFontSize += delta;
    if (currentFontSize < 12) currentFontSize = 12;
    if (currentFontSize > 24) currentFontSize = 24;
    displayChapter();
}

function filterBooks() {
    const titleFilter = document.getElementById('book-title-search').value.toLowerCase();
    const contentFilter = document.getElementById('book-content-search').value.toLowerCase();
    
    const filteredBooks = window.booksData.filter(book => {
        if (titleFilter && !book.title.toLowerCase().includes(titleFilter)) return false;
        if (contentFilter) {
            // Check if any chapter contains the search term
            if (!book.chapters.some(chapter => 
                chapter.toLowerCase().includes(contentFilter))) return false;
        }
        return true;
    });
    
    const list = document.getElementById('book-list');
    list.innerHTML = '';
    
    filteredBooks.sort((a, b) => a.title.localeCompare(b.title));
    
    filteredBooks.forEach(book => {
        const div = document.createElement('div');
        div.className = 'book-item';
        div.textContent = book.title;
        div.onclick = () => loadBook(book);
        list.appendChild(div);
    });
}

async function loadPsalms() {
    try {
        const response = await fetch('psalms/index.json');
        const psalms = await response.json();
        window.psalmsData = psalms;
        
        displayPsalms(psalms);
    } catch (error) {
        console.error('Error loading psalms:', error);
    }
}

function displayPsalms(psalms) {
    const list = document.getElementById('psalm-list');
    list.innerHTML = '';
    
    psalms.forEach(psalm => {
        const div = document.createElement('div');
        div.className = 'psalm-item';
        div.innerHTML = `<strong>${psalm.title}</strong><br>${psalm.text.substring(0, 100)}...`;
        div.onclick = () => showPsalm(psalm);
        list.appendChild(div);
    });
}

function searchPsalms() {
    const filter = document.getElementById('psalm-search').value.toLowerCase();
    
    if (!filter) {
        displayPsalms(window.psalmsData);
        return;
    }
    
    const results = window.psalmsData.filter(psalm => 
        psalm.title.toLowerCase().includes(filter) ||
        psalm.number.toString().includes(filter) ||
        psalm.text.toLowerCase().includes(filter)
    );
    
    displayPsalms(results);
}

function showPsalm(psalm) {
    alert(`Псалом ${psalm.number}: ${psalm.title}\n\n${psalm.text}`);
}
