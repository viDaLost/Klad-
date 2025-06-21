import React, { useState, useEffect } from 'react';

function App() {
  // Application state
  const [currentScreen, setCurrentScreen] = useState('main-menu'); // main-menu, books, book-detail, psalms, psalm-modal
  const [bookSearchTerm, setBookSearchTerm] = useState('');
  const [wordSearchTerm, setWordSearchTerm] = useState('');
  const [psalmSearchTerm, setPsalmSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [selectedChapterNumber, setSelectedChapterNumber] = useState(1);
  const [selectedPsalmId, setSelectedPsalmId] = useState(null);
  const [fontSize, setFontSize] = useState('base');
  const [readingProgress, setReadingProgress] = useState({});
  const [books, setBooks] = useState([]);
  const [psalms, setPsalms] = useState([]);

  // Load books from JSON files
  useEffect(() => {
    // In a real app, you would fetch these files from the server
    // For demonstration, we'll use mock data
    Promise.all([
      import('./books/book1.json'),
      import('./books/book2.json')
    ]).then(([book1, book2]) => {
      setBooks([book1.default, book2.default]);
    });
  }, []);

  // Load psalms from JSON files
  useEffect(() => {
    // In a real app, you would fetch these files from the server
    // For demonstration, we'll use mock data
    Promise.all([
      import('./psalms/psalm1.json'),
      import('./psalms/psalm2.json'),
      import('./psalms/psalm3.json'),
      import('./psalms/psalm4.json'),
      import('./psalms/psalm5.json'),
      import('./psalms/psalm5_duplicate.json')
    ]).then(([psalm1, psalm2, psalm3, psalm4, psalm5, psalm5dup]) => {
      setPsalms([
        psalm1.default,
        psalm2.default,
        psalm3.default,
        psalm4.default,
        psalm5.default,
        psalm5dup.default
      ]);
    });
  }, []);

  // Load reading progress from localStorage when component mounts
  useEffect(() => {
    const savedProgress = localStorage.getItem('readingProgress');
    if (savedProgress) {
      setReadingProgress(JSON.parse(savedProgress));
    }
  }, []);

  // Save reading progress to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('readingProgress', JSON.stringify(readingProgress));
  }, [readingProgress]);

  // Get current book
  const currentBook = books.find(book => book.id === selectedBookId);
  
  // Get current chapter
  const currentChapter = currentBook ? 
    currentBook.chapters.find(chapter => chapter.number === selectedChapterNumber) : null;

  // Handle book search
  const handleBookSearch = () => {
    if (!bookSearchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const results = books.filter(book => 
      book.title.toLowerCase().includes(bookSearchTerm.toLowerCase())
    );
    
    setSearchResults(results);
  };

  // Handle word search in books
  const handleWordSearch = () => {
    if (!wordSearchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const results = books.map(book => {
      const chaptersWithMatches = book.chapters.filter(chapter => 
        chapter.content.toLowerCase().includes(wordSearchTerm.toLowerCase())
      );
      
      if (chaptersWithMatches.length > 0) {
        return {
          bookId: book.id,
          bookTitle: book.title,
          matches: chaptersWithMatches.map(chapter => ({
            chapterNumber: chapter.number,
            chapterTitle: chapter.title,
            snippet: getSnippet(chapter.content, wordSearchTerm)
          }))
        };
      }
      
      return null;
    }).filter(result => result !== null);
    
    setSearchResults(results);
  };

  // Get a snippet of text containing the search term
  const getSnippet = (text, searchTerm) => {
    const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (index === -1) return text;
    
    const start = Math.max(0, index - 30);
    const end = Math.min(text.length, index + searchTerm.length + 30);
    
    return text.substring(start, end);
  };

  // Handle psalm search
  const handlePsalmSearch = () => {
    if (!psalmSearchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const results = psalms.filter(psalms => 
      psalms.title.toLowerCase().includes(psalmSearchTerm.toLowerCase()) ||
      psalms.number.toString().includes(psalmSearchTerm) ||
      psalms.content.toLowerCase().includes(psalmSearchTerm.toLowerCase())
    );
    
    setSearchResults(results);
  };

  // Handle selecting a book
  const handleSelectBook = (bookId) => {
    setSelectedBookId(bookId);
    // If the user has previously read this book, go to their last position
    const lastPosition = readingProgress[bookId];
    if (lastPosition) {
      setSelectedChapterNumber(lastPosition.chapterNumber);
    } else {
      setSelectedChapterNumber(1);
    }
    setCurrentScreen('book-detail');
  };

  // Handle selecting a chapter
  const handleSelectChapter = (chapterNumber) => {
    setSelectedChapterNumber(chapterNumber);
    
    // Update reading progress
    setReadingProgress(prev => ({
      ...prev,
      [selectedBookId]: {
        chapterNumber: chapterNumber
      }
    }));
  };

  // Handle selecting a psalm
  const handleSelectPsalm = (psalmId) => {
    const selectedPsalm = psalms.find(p => p.id === psalmId);
    setSelectedPsalmId(psalmId);
    setCurrentScreen('psalm-modal');
  };

  // Increase font size
  const increaseFontSize = () => {
    if (fontSize === 'sm') setFontSize('base');
    else if (fontSize === 'base') setFontSize('lg');
    else if (fontSize === 'lg') setFontSize('xl');
  };

  // Decrease font size
  const decreaseFontSize = () => {
    if (fontSize === 'xl') setFontSize('lg');
    else if (fontSize === 'lg') setFontSize('base');
    else if (fontSize === 'base') setFontSize('sm');
  };

  // Close psalm modal
  const handleClosePsalmModal = () => {
    setCurrentScreen('psalms');
    setSelectedPsalmId(null);
  };

  // Render the main menu screen
  const renderMainMenu = () => (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-8 text-amber-900">Библиотека</h1>
      <div className="flex flex-col gap-4 w-full max-w-md">
        <button 
          onClick={() => setCurrentScreen('books')}
          className="bg-[#5C4033] hover:bg-[#4a3022] text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200 shadow-md"
        >
          Книги
        </button>
        <button 
          onClick={() => setCurrentScreen('psalms')}
          className="bg-[#5C4033] hover:bg-[#4a3022] text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200 shadow-md"
        >
          Псалмы
        </button>
      </div>
    </div>
  );

  // Render the books screen
  const renderBooks = () => (
    <div className="min-h-screen bg-amber-50 flex flex-col p-4">
      <div className="max-w-3xl mx-auto w-full">
        <div className="mb-6">
          <button 
            onClick={() => setCurrentScreen('main-menu')}
            className="bg-[#5C4033] hover:bg-[#4a3022] text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-md mb-4"
          >
            Главное меню
          </button>
          
          <h2 className="text-2xl font-bold mb-4 text-amber-900">Поиск книг</h2>
          
          <div className="bg-white rounded-lg p-4 shadow-md mb-6">
            <div className="mb-4">
              <label className="block text-amber-800 font-medium mb-2">Поиск по книгам</label>
              <div className="flex">
                <input
                  type="text"
                  value={bookSearchTerm}
                  onChange={(e) => setBookSearchTerm(e.target.value)}
                  placeholder="Введите название книги"
                  className="flex-grow p-2 border border-amber-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                />
                <button
                  onClick={handleBookSearch}
                  className="bg-[#5C4033] hover:bg-[#4a3022] text-white font-medium py-2 px-4 rounded-r-lg transition-colors duration-200"
                >
                  Поиск
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-amber-800 font-medium mb-2">Поиск по слову</label>
              <div className="flex">
                <input
                  type="text"
                  value={wordSearchTerm}
                  onChange={(e) => setWordSearchTerm(e.target.value)}
                  placeholder="Введите слово для поиска"
                  className="flex-grow p-2 border border-amber-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                />
                <button
                  onClick={handleWordSearch}
                  className="bg-[#5C4033] hover:bg-[#4a3022] text-white font-medium py-2 px-4 rounded-r-lg transition-colors duration-200"
                >
                  Поиск
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-md">
            <h3 className="text-xl font-bold mb-4 text-amber-800">Результаты поиска</h3>
            
            {searchResults.length === 0 && bookSearchTerm === '' && wordSearchTerm === '' && (
              <p className="text-amber-700">Введите запрос для поиска</p>
            )}
            
            {searchResults.length === 0 && (bookSearchTerm !== '' || wordSearchTerm !== '') && (
              <p className="text-amber-700">Ничего не найдено</p>
            )}
            
            {/* Book search results */}
            {bookSearchTerm !== '' && searchResults.length > 0 && (
              <div className="space-y-4">
                {searchResults.map(book => (
                  <div 
                    key={book.id} 
                    className="cursor-pointer p-3 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors duration-200"
                    onClick={() => handleSelectBook(book.id)}
                  >
                    <h4 className="font-medium text-amber-900">{book.title}</h4>
                  </div>
                ))}
              </div>
            )}
            
            {/* Word search results */}
            {wordSearchTerm !== '' && searchResults.length > 0 && (
              <div className="space-y-6">
                {searchResults.map((result, index) => (
                  <div key={index} className="border border-amber-200 rounded-lg p-3">
                    <h4 className="font-medium text-amber-900 mb-2">{result.bookTitle}</h4>
                    {result.matches.map((match, matchIndex) => (
                      <div 
                        key={matchIndex}
                        className="mb-3 p-2 border-l-4 border-[#5C4033] pl-3 cursor-pointer hover:bg-amber-50 transition-colors duration-200"
                        onClick={() => handleSelectBook(result.bookId)}
                      >
                        <p className="text-sm text-amber-700">Глава {match.chapterNumber}: {match.chapterTitle}</p>
                        <p className="text-amber-800 italic">{match.snippet}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render the book detail screen
  const renderBookDetail = () => {
    if (!currentBook || !currentChapter) return null;
    
    return (
      <div className="min-h-screen bg-amber-50 flex flex-col p-4">
        <div className="max-w-3xl mx-auto w-full">
          <div className="mb-6">
            <button 
              onClick={() => setCurrentScreen('books')}
              className="bg-[#5C4033] hover:bg-[#4a3022] text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-md mb-4"
            >
              Главное меню
            </button>
            
            <h2 className="text-2xl font-bold mb-2 text-amber-900">{currentBook.title}</h2>
            <h3 className="text-xl font-medium text-amber-800">{currentChapter.title}</h3>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md mb-6">
            <div className="mb-4 flex flex-wrap justify-between items-center">
              <div className="flex space-x-2 mb-2 sm:mb-0">
                <button 
                  onClick={decreaseFontSize}
                  className="bg-[#5C4033] hover:bg-[#4a3022] text-white font-medium py-1 px-3 rounded transition-colors duration-200"
                >
                  A-
                </button>
                <button 
                  onClick={increaseFontSize}
                  className="bg-[#5C4033] hover:bg-[#4a3022] text-white font-medium py-1 px-3 rounded transition-colors duration-200"
                >
                  A+
                </button>
              </div>
              
              <div>
                <span className="text-amber-800 mr-2">Глава:</span>
                <select 
                  value={selectedChapterNumber}
                  onChange={(e) => handleSelectChapter(Number(e.target.value))}
                  className="border border-amber-300 rounded p-1 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                >
                  {currentBook.chapters.map(chapter => (
                    <option key={chapter.number} value={chapter.number}>
                      {chapter.number}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className={`${fontSize === 'sm' ? 'text-sm' : fontSize === 'base' ? 'text-base' : fontSize === 'lg' ? 'text-lg' : 'text-xl'} text-amber-800 leading-relaxed`}>
              {currentChapter.content}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            {selectedChapterNumber > 1 && (
              <button 
                onClick={() => handleSelectChapter(selectedChapterNumber - 1)}
                className="bg-[#5C4033] hover:bg-[#4a3022] text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Предыдущая глава
              </button>
            )}
            
            {selectedChapterNumber < currentBook.chapters.length && (
              <button 
                onClick={() => handleSelectChapter(selectedChapterNumber + 1)}
                className="bg-[#5C4033] hover:bg-[#4a3022] text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Следующая глава
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render the psalms screen
  const renderPsalms = () => (
    <div className="min-h-screen bg-amber-50 flex flex-col p-4">
      <div className="max-w-3xl mx-auto w-full">
        <div className="mb-6">
          <button 
            onClick={() => setCurrentScreen('main-menu')}
            className="bg-[#5C4033] hover:bg-[#4a3022] text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-md mb-4"
          >
            Главное меню
          </button>
          
          <h2 className="text-2xl font-bold mb-4 text-amber-900">Поиск псалмов</h2>
          
          <div className="bg-white rounded-lg p-4 shadow-md mb-6">
            <label className="block text-amber-800 font-medium mb-2">Введите название, номер или строчку из псалма</label>
            <div className="flex">
              <input
                type="text"
                value={psalmSearchTerm}
                onChange={(e) => setPsalmSearchTerm(e.target.value)}
                placeholder="Введите запрос для поиска"
                className="flex-grow p-2 border border-amber-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
              />
              <button
                onClick={handlePsalmSearch}
                className="bg-[#5C4033] hover:bg-[#4a3022] text-white font-medium py-2 px-4 rounded-r-lg transition-colors duration-200"
              >
                Поиск
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-md">
            <h3 className="text-xl font-bold mb-4 text-amber-800">Результаты поиска</h3>
            
            {searchResults.length === 0 && psalmSearchTerm === '' && (
              <p className="text-amber-700">Введите запрос для поиска</p>
            )}
            
            {searchResults.length === 0 && psalmSearchTerm !== '' && (
              <p className="text-amber-700">Ничего не найдено</p>
            )}
            
            {searchResults.length > 0 && (
              <div className="space-y-4">
                {searchResults.map(psalms => (
                  <div 
                    key={psalms.id}
                    className="cursor-pointer p-3 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors duration-200"
                    onClick={() => handleSelectPsalm(psalms.id)}
                  >
                    <h4 className="font-medium text-amber-900">Псалом {psalms.number}: {psalms.title}</h4>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render the psalm modal
  const renderPsalmModal = () => {
    const selectedPsalm = psalms.find(p => p.id === selectedPsalmId);
    if (!selectedPsalm) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-amber-900">
              Псалом {selectedPsalm.number}: {selectedPsalm.title}
            </h3>
            <button
              onClick={handleClosePsalmModal}
              className="bg-[#5C4033] hover:bg-[#4a3022] text-white font-medium py-1 px-3 rounded transition-colors duration-200"
            >
              Закрыть
            </button>
          </div>
          
          <div className="mb-4 flex justify-end">
            <button 
              onClick={increaseFontSize}
              className="bg-[#5C4033] hover:bg-[#4a3022] text-white font-medium py-1 px-3 rounded transition-colors duration-200"
            >
              A+
            </button>
          </div>
          
          <div className={`${fontSize === 'sm' ? 'text-sm' : fontSize === 'base' ? 'text-base' : fontSize === 'lg' ? 'text-lg' : 'text-xl'} text-amber-800 leading-relaxed whitespace-pre-wrap`}>
            {selectedPsalm.content}
          </div>
        </div>
      </div>
    );
  };

  // Render the appropriate screen based on current state
  return (
    <div className="min-h-screen">
      {currentScreen === 'main-menu' && renderMainMenu()}
      {currentScreen === 'books' && renderBooks()}
      {currentScreen === 'book-detail' && renderBookDetail()}
      {currentScreen === 'psalms' && renderPsalms()}
      {currentScreen === 'psalm-modal' && renderPsalmModal()}
    </div>
  );
}

export default App;
