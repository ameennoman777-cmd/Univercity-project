// --- Shared Functions ---
function getBooks() {
    return JSON.parse(localStorage.getItem('libraryBooks')) || [];
}

function saveBooks(books) {
    localStorage.setItem('libraryBooks', JSON.stringify(books));
}

// --- Login & Registration ---
function handleLogin() {
    const userIn = document.getElementById('loginUsername').value.trim();
    const passIn = document.getElementById('loginPassword').value;
    const loginUser = JSON.parse(localStorage.getItem('libraryUser'));

    if (loginUser) {
        if (userIn === loginUser.username && passIn === loginUser.password) {
            alert("Login Successful! Welcome " + loginUser.fullName);
            window.location.href = "Home.html";
        } else {
            alert("Incorrect username or password!");
        }
    } else {
        alert("No account found! Please sign up first.");
    }
}

function handleSignUp() {
    const username = document.getElementById('Username').value.trim();
    const fullName = document.getElementById('FullName').value.trim();
    const email = document.getElementById('Email').value.trim();
    const password = document.getElementById('Password').value;

    const userData = { username, fullName, email, password };
    localStorage.setItem('libraryUser', JSON.stringify(userData));

    alert("Account Created Successfully!");
    window.location.href = "index.html";
}

// --- Book Management ---
function addBook() {
    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const type = document.querySelector('input[name="bookType"]:checked');
    const professor = document.getElementById('bookProfessor').value.trim();
    const fileInput = document.getElementById('bookImage');
    const file = fileInput.files[0];

    if (!title || !author || !type || !file || !professor) {
        alert("Please fill all fields and select an image.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const books = getBooks();
        const newBook = {
            id: Date.now(),
            title, author, type: type.value, professor,
            image: e.target.result
        };
        books.push(newBook);
        saveBooks(books);

        const lastAdded = document.getElementById('lastAdded');
        if (lastAdded) {
            lastAdded.innerHTML = `
                <div style="background:rgba(232, 248, 245, 0.2); padding:15px; border-radius:12px; margin-top:20px;">
                    <strong>Last Added Book:</strong><br>
                    Name: ${title}<br>Author: ${author}<br>
                    Type: ${type.value}<br>Professor: ${professor}<br>
                    <img src="${e.target.result}" style="max-width:100px; margin-top:8px; border-radius:6px;">
                </div>
            `;
        }
        document.querySelector('form').reset();
        const preview = document.getElementById('preview');
        if (preview) preview.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function displayAllBooks(booksToDisplay) {
    const container = document.getElementById('booksContainer');
    if (!container) return;

    const books = booksToDisplay || getBooks();
    window.allBooks = booksToDisplay ? window.allBooks : books;

    if (books.length === 0) {
        container.innerHTML = '<p style="text-align:center;">No books found.</p>';
        return;
    }
    
    container.innerHTML = books.map(book => `
        <div class="book-card" id="book-${book.id}">
            <img src="${book.image}" alt="Book Cover">
            <h3>Book's Name: ${book.title}</h3>
            <p>Author's Name: ${book.author}</p>
            <p>Book's Type: ${book.type}</p>
            <p>Professor' Name: ${book.professor}</p>
            <div class="book-actions">
                <button class="btn-edit" onclick="editBook(${book.id})">Edit</button>
                <button class="btn-delete" onclick="deleteBook(${book.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function filterBooks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filtered = (window.allBooks || getBooks()).filter(book => 
        book.title.toLowerCase().includes(searchTerm) || 
        book.author.toLowerCase().includes(searchTerm) || 
        book.professor.toLowerCase().includes(searchTerm)
    );
    displayAllBooks(filtered);
}

function deleteBook(id) {
    if (confirm("Are you sure you want to delete this book?")) {
        const books = getBooks().filter(book => book.id !== id);
        saveBooks(books);
        window.allBooks = books;
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value) {
            filterBooks();
        } else {
            displayAllBooks();
        }
    }
}

function editBook(id) {
    localStorage.setItem('editBookId', id);
    window.location.href = 'Edit.html';
}

// --- Edit Page Functions ---
function loadEditData() {
    const select = document.getElementById('bookSelect');
    if (!select) return;

    const books = getBooks();
    select.innerHTML = '<option value="">-- Choose a book --</option>' + 
        books.map(b => `<option value="${b.id}">${b.title} - ${b.author}</option>`).join('');

    const editId = localStorage.getItem('editBookId');
    if (editId) {
        select.value = editId;
        loadBookData();
        localStorage.removeItem('editBookId');
    }
}

function loadBookData() {
    const id = parseInt(document.getElementById('bookSelect').value);
    if (!id) return;
    
    const book = getBooks().find(b => b.id === id);
    if (book) {
        document.getElementById('editTitle').value = book.title;
        document.getElementById('editAuthor').value = book.author;
        document.querySelectorAll('input[name="editType"]').forEach(r => r.checked = (r.value === book.type));
        document.getElementById('editProfessor').value = book.professor || '';
        const preview = document.getElementById('editPreview');
        preview.src = book.image;
        preview.style.display = 'block';
        window.currentBookId = id;
    }
}

function updateBook() {
    if (!window.currentBookId) { alert("Select a book first"); return; }
    const title = document.getElementById('editTitle').value.trim();
    const author = document.getElementById('editAuthor').value.trim();
    const type = document.querySelector('input[name="editType"]:checked');
    const professor = document.getElementById('editProfessor').value.trim();
    const file = document.getElementById('editImage').files[0];

    const books = getBooks();
    const index = books.findIndex(b => b.id === window.currentBookId);
    if (index === -1) return;

    const finalizeUpdate = (img) => {
        books[index] = { ...books[index], title, author, type: type.value, professor, image: img || books[index].image };
        saveBooks(books);
        alert("Book Updated Successfully!");
        window.location.href = "View.html";
    };

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => finalizeUpdate(e.target.result);
        reader.readAsDataURL(file);
    } else {
        finalizeUpdate();
    }
}

// --- Search Page Functions ---
function searchBook() {
    const keyword = document.getElementById('searchKeyword').value.trim().toLowerCase();
    const resultDiv = document.getElementById('searchResult');
    if (!keyword) { resultDiv.innerHTML = '<span class="not-found">Please enter search term.</span>'; return; }
    
    const found = getBooks().find(book => 
        book.title.toLowerCase().includes(keyword) || 
        book.author.toLowerCase().includes(keyword) ||
        (book.professor && book.professor.toLowerCase().includes(keyword))
    );
    
    resultDiv.innerHTML = found ? `
        <div class="book-found">
            <h3>Book Found</h3>
            <p><strong>Title:</strong> ${found.title}</p>
            <p><strong>Author:</strong> ${found.author}</p>
            <p><strong>Type:</strong> ${found.type}</p>
            <p><strong>Professor:</strong> ${found.professor}</p>
            <img src="${found.image}" alt="Book Cover">
        </div>
    ` : '<div class="not-found">This book does not exist in the library.</div>';
}

// --- Initializations ---
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path.includes('View.html')) displayAllBooks();
    if (path.includes('Edit.html')) loadEditData();
    
    const bookImage = document.getElementById('bookImage');
    if (bookImage) {
        bookImage.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const preview = document.getElementById('preview');
                    preview.src = ev.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
});





function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // إضافة زر التبديل برمجياً لجميع الصفحات التي تستدعي هذا الملف
    if (!document.querySelector('.theme-toggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'theme-toggle';
        toggleBtn.innerHTML = savedTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
        toggleBtn.onclick = toggleTheme;
        document.body.appendChild(toggleBtn);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const btn = document.querySelector('.theme-toggle');
    if (btn) {
        btn.innerHTML = newTheme === 'dark' ? ' Light Mode' : '?Dark Mode';
    }
}

// تنفيذ التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initTheme);

