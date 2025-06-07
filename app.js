document.addEventListener('DOMContentLoaded', () => {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();

    // Инициализация главного меню
    function initMainMenu() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <header>
                <h1>КЛАДОВАЯ</h1>
            </header>
            <main>
                <div class="button-container">
                    <button id="booksBtn">Книги</button>
                    <button id="psalmsBtn">Псалмы</button>
                </div>
            </main>
        `;
        document.getElementById('booksBtn').addEventListener('click', loadBooks);
        document.getElementById('psalmsBtn').addEventListener('click', loadPsalms);
    }

    // Загрузка книг
    function loadBooks() {
        fetch('/books/index.json') // Абсолютный путь
            .then(response => response.json())
            .then(books => {
                const app = document.getElementById('app');
                app.innerHTML = `
                    <header>
                        <h1>КЛАДОВАЯ</h1>
                    </header>
                    <main>
                        <div class="search-container">
                            <input type="text" id="bookSearch" placeholder="Поиск по названию">
                            <input type="text" id="contentSearch" placeholder="Поиск по содержимому">
                        </div>
                        <div class="books-list" id="booksList"></div>
                    </main>
                    <footer>
                        <button id="backBtn">← Назад</button>
                    </footer>
                `;

                const bookSearchInput = document.getElementById('bookSearch');
                const contentSearchInput = document.getElementById('contentSearch');
                const booksList = document.getElementById('booksList');

                // Рендеринг книг
                function renderBooks(filteredBooks) {
                    booksList.innerHTML = '';
                    if (filteredBooks.length === 0) {
                        booksList.innerHTML = '<p style="text-align:center; color:#888;">Книги не найдены</p>';
                        return;
                    }
                    filteredBooks.forEach(book => {
                        const bookItem = document.createElement('div');
                        bookItem.className = 'book-item';
                        bookItem.textContent = book.title;
                        bookItem.addEventListener('click', () => loadBookContent(book));
                        booksList.appendChild(bookItem);
                    });
                }

                // Поиск по названию
                bookSearchInput.addEventListener('input', (e) => {
                    const query = e.target.value.toLowerCase();
                    const filtered = books.filter(book => book.title.toLowerCase().includes(query));
                    renderBooks(filtered);
                });

                // Поиск по содержимому
                contentSearchInput.addEventListener('input', (e) => {
                    const query = e.target.value.toLowerCase();
                    if (query.length < 2) return;

                    Promise.all(books.map(book => {
                        return fetch(`/books/${book.file}`) // Абсолютный путь
                            .then(response => response.json())
                            .then(data => {
                                const results = findTextInBook(data, query, book);
                                return results;
                            });
                    })).then(results => {
                        // Объединяем все найденные результаты
                        const allResults = results.flat();
                        booksList.innerHTML = '';
                        if (allResults.length === 0) {
                            booksList.innerHTML = '<p style="text-align:center; color:#888;">Ничего не найдено</p>';
                            return;
                        }
                        allResults.forEach(result => {
                            const resultItem = document.createElement('div');
                            resultItem.className = 'search-result';
                            resultItem.innerHTML = `
                                <h3>${result.book.title}</h3>
                                <p>...${result.context}...</p>
                                <small>Глава ${result.chapter.number}</small>
                            `;
                            resultItem.addEventListener('click', () => {
                                loadBookContent(result.book, result.chapter.number, result.verse);
                            });
                            booksList.appendChild(resultItem);
                        });
                    });
                });

                // Назад
                document.getElementById('backBtn').addEventListener('click', initMainMenu);

                // Инициальный рендер
                renderBooks(books);
            })
            .catch(error => {
                console.error('Ошибка при загрузке книг:', error);
                alert('Не удалось загрузить список книг. Пожалуйста, попробуйте позже.');
            });
    }

    // Поиск текста в книге
    function findTextInBook(bookData, query, book) {
        const results = [];
        const words = query.split(/\s+/);
        bookData.chapters.forEach(chapter => {
            // Поиск в заголовке главы
            if (chapter.title && chapter.title.toLowerCase().includes(query)) {
                results.push({
                    book: book,
                    chapter: chapter,
                    context: highlightText(chapter.title, query),
                    verse: null
                });
            }
            // Поиск в тексте главы
            if (chapter.text) {
                const sentences = chapter.text.split(/[.!?]+/);
                sentences.forEach(sentence => {
                    if (sentence.toLowerCase().includes(query)) {
                        results.push({
                            book: book,
                            chapter: chapter,
                            context: highlightText(sentence.trim(), query),
                            verse: null
                        });
                    }
                });
                // Поиск по стихам
                if (chapter.verses) {
                    chapter.verses.forEach(verse => {
                        if (verse.text.toLowerCase().includes(query)) {
                            results.push({
                                book: book,
                                chapter: chapter,
                                context: highlightText(verse.text, query),
                                verse: verse.number
                            });
                        }
                    });
                }
            }
        });
        return results;
    }

    // Подсветка найденного текста
    function highlightText(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    // Загрузка содержания книги
    function loadBookContent(book, chapterNumber = 1, verseNumber = null) {
        fetch(`/books/${book.file}`) // Абсолютный путь
            .then(response => response.json())
            .then(data => {
                const app = document.getElementById('app');
                app.innerHTML = `
                    <header>
                        <h1>${book.title}</h1>
                    </header>
                    <main>
                        <div class="chapter-controls">
                            <button id="prevChapter">← Назад</button>
                            <select id="chapterSelect"></select>
                            <button id="nextChapter">→ Вперед</button>
                        </div>
                        <div class="font-controls">
                            <button id="decreaseFont">-</button>
                            <span id="fontSize">16</span>
                            <button id="increaseFont">+</button>
                        </div>
                        <div class="book-content" id="bookContent"></div>
                    </main>
                    <footer>
                        <button id="backToBooks">← К книгам</button>
                        <button id="backToMenu">← Главное меню</button>
                    </footer>
                `;

                const chapterSelect = document.getElementById('chapterSelect');
                const bookContent = document.getElementById('bookContent');
                const prevChapter = document.getElementById('prevChapter');
                const nextChapter = document.getElementById('nextChapter');
                const fontSizeDisplay = document.getElementById('fontSize');
                const decreaseFont = document.getElementById('decreaseFont');
                const increaseFont = document.getElementById('increaseFont');
                const backToBooks = document.getElementById('backToBooks');
                const backToMenu = document.getElementById('backToMenu');

                let currentChapterIndex = Math.max(0, data.chapters.findIndex(c => c.number == chapterNumber));
                let fontSize = 16;

                // Обновление отображения главы
                function updateChapter() {
                    const chapter = data.chapters[currentChapterIndex];
                    let content = `<h2>Глава ${chapter.number}</h2>`;
                    if (chapter.title) {
                        content += `<h3>${chapter.title}</h3>`;
                    }
                    if (chapter.verses) {
                        content += '<div class="verses">';
                        chapter.verses.forEach(verse => {
                            const verseClass = verseNumber === verse.number ? 'verse active' : 'verse';
                            content += `<p class="${verseClass}" data-verse="${verse.number}">
                                <span class="verse-number">${verse.number}</span>
                                ${verse.text}
                            </p>`;
                        });
                        content += '</div>';
                    } else {
                        content += `<p>${chapter.text}</p>`;
                    }
                    bookContent.innerHTML = content;
                    bookContent.style.fontSize = `${fontSize}px`;
                    // Добавляем обработчики клика на стихи
                    document.querySelectorAll('.verse').forEach(verse => {
                        verse.addEventListener('click', (e) => {
                            const verseNumber = e.currentTarget.dataset.verse;
                        });
                    });
                }

                // Заполнение селекта глав
                function populateChapterSelect() {
                    chapterSelect.innerHTML = '';
                    data.chapters.forEach((chapter, index) => {
                        const option = document.createElement('option');
                        option.value = index;
                        option.textContent = `Глава ${chapter.number}`;
                        chapterSelect.appendChild(option);
                    });
                    chapterSelect.selectedIndex = currentChapterIndex;
                }

                // Обработчики событий
                prevChapter.addEventListener('click', () => {
                    if (currentChapterIndex > 0) {
                        currentChapterIndex--;
                        updateChapter();
                        populateChapterSelect();
                    }
                });
                nextChapter.addEventListener('click', () => {
                    if (currentChapterIndex < data.chapters.length - 1) {
                        currentChapterIndex++;
                        updateChapter();
                        populateChapterSelect();
                    }
                });
                chapterSelect.addEventListener('change', (e) => {
                    currentChapterIndex = parseInt(e.target.value);
                    updateChapter();
                });

                // Управление размером шрифта
                decreaseFont.addEventListener('click', () => {
                    if (fontSize > 12) {
                        fontSize -= 2;
                        fontSizeDisplay.textContent = fontSize;
                        updateChapter();
                    }
                });
                increaseFont.addEventListener('click', () => {
                    if (fontSize < 24) {
                        fontSize += 2;
                        fontSizeDisplay.textContent = fontSize;
                        updateChapter();
                    }
                });

                // Назад к книгам
                backToBooks.addEventListener('click', loadBooks);

                // Назад к главному меню
                backToMenu.addEventListener('click', initMainMenu);

                // Инициализация
                updateChapter();
                populateChapterSelect();
            })
            .catch(error => {
                console.error('Ошибка при загрузке книги:', error);
                alert('Не удалось загрузить содержание книги. Пожалуйста, попробуйте позже.');
            });
    }

    // Загрузка псалмов
    function loadPsalms() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <header>
                <h1>КЛАДОВАЯ</h1>
            </header>
            <main>
                <div class="search-container">
                    <input type="text" id="psalmSearch" placeholder="Введите номер, название или текст псалма">
                </div>
                <div class="psalms-list" id="psalmsList"></div>
            </main>
            <footer>
                <button id="backBtn">← Назад</button>
            </footer>
        `;

        const psalmSearchInput = document.getElementById('psalmSearch');
        const psalmsList = document.getElementById('psalmsList');

        // Поиск псалмов
        psalmSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length < 2) {
                psalmsList.innerHTML = '<p style="text-align:center; color:#888;">Введите поисковой запрос</p>';
                return;
            }

            fetch('/psalms/index.json') // Абсолютный путь
                .then(response => response.json())
                .then(psalms => {
                    Promise.all(psalms.map(psalm => {
                        return fetch(`/psalms/${psalm.file}`) // Абсолютный путь
                            .then(response => response.json())
                            .then(data => {
                                psalm.content = data.text;
                                return psalm;
                            });
                    })).then(allPsalms => {
                        const results = allPsalms.filter(psalm => {
                            return psalm.title.toLowerCase().includes(query) || 
                                   psalm.content.toLowerCase().includes(query);
                        });
                        psalmsList.innerHTML = '';
                        if (results.length === 0) {
                            psalmsList.innerHTML = '<p style="text-align:center; color:#888;">Ничего не найдено</p>';
                            return;
                        }
                        results.forEach(psalm => {
                            const psalmItem = document.createElement('div');
                            psalmItem.className = 'psalm-item';
                            psalmItem.innerHTML = `
                                <h3>${psalm.title}</h3>
                                <p>${highlightText(psalm.content.substring(0, 100), query)}...</p>
                            `;
                            psalmItem.addEventListener('click', () => loadPsalmContent(psalm));
                            psalmsList.appendChild(psalmItem);
                        });
                    });
                });
        });

        // Назад
        document.getElementById('backBtn').addEventListener('click', initMainMenu);
    }

    // Загрузка содержания псалма
    function loadPsalmContent(psalm) {
        fetch(`/psalms/${psalm.file}`) // Абсолютный путь
            .then(response => response.json())
            .then(data => {
                const app = document.getElementById('app');
                app.innerHTML = `
                    <header>
                        <h1>${psalm.title}</h1>
                    </header>
                    <main>
                        <div class="psalm-content" id="psalmContent">${data.text}</div>
                    </main>
                    <footer>
                        <button id="backToPsalms">← К псалмам</button>
                        <button id="backToMenu">← Главное меню</button>
                    </footer>
                `;
                document.getElementById('backToPsalms').addEventListener('click', loadPsalms);
                document.getElementById('backToMenu').addEventListener('click', initMainMenu);
            })
            .catch(error => {
                console.error('Ошибка при загрузке псалма:', error);
                alert('Не удалось загрузить текст псалма. Пожалуйста, попробуйте позже.');
            });
    }

    // Инициализация приложения
    initMainMenu();
});
