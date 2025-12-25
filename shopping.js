let shoppingItems = [];
let itemHistory = {};

// טעינת הרשימה מ-localStorage
function loadItems() {
    const saved = localStorage.getItem('shoppingList');
    if (saved) {
        shoppingItems = JSON.parse(saved);
        renderList();
    }
    
    const history = localStorage.getItem('itemHistory');
    if (history) {
        itemHistory = JSON.parse(history);
    }
}

// שמירת הרשימה ל-localStorage
function saveItems() {
    localStorage.setItem('shoppingList', JSON.stringify(shoppingItems));
}

// שמירת היסטוריה
function saveHistory() {
    localStorage.setItem('itemHistory', JSON.stringify(itemHistory));
}

// הוספה להיסטוריה
function addToHistory(item) {
    const itemLower = item.toLowerCase().trim();
    if (itemHistory[itemLower]) {
        itemHistory[itemLower].count++;
        itemHistory[itemLower].lastUsed = Date.now();
    } else {
        itemHistory[itemLower] = {
            text: item,
            count: 1,
            lastUsed: Date.now()
        };
    }
    saveHistory();
}

// הצגת הרשימה
function renderList() {
    const list = document.getElementById('shoppingList');
    
    if (shoppingItems.length === 0) {
        list.innerHTML = '<div class="empty-message">הרשימה ריקה. הוסף מוצרים! 📝</div>';
        return;
    }
    
    list.innerHTML = shoppingItems.map((item, index) => `
        <li class="${item.completed ? 'completed' : ''}">
            <span class="item-text" onclick="toggleItem(${index})">${item.text}</span>
            <button class="delete-btn" onclick="deleteItem(${index})">🗑️</button>
        </li>
    `).join('');
}

// הוספת מוצר
function addItem() {
    const input = document.getElementById('itemInput');
    const text = input.value.trim();
    
    if (text) {
        shoppingItems.push({ text, completed: false });
        addToHistory(text);
        input.value = '';
        hideSuggestions();
        saveItems();
        renderList();
    }
}

// הצגת הצעות
function showSuggestions(query) {
    const suggestionsDiv = document.getElementById('suggestions');
    
    if (!query || query.length < 1) {
        hideSuggestions();
        return;
    }
    
    const queryLower = query.toLowerCase();
    const matches = Object.entries(itemHistory)
        .filter(([key, data]) => key.startsWith(queryLower))
        .sort((a, b) => {
            // מיון לפי תדירות ואז לפי שימוש אחרון
            if (b[1].count !== a[1].count) {
                return b[1].count - a[1].count;
            }
            return b[1].lastUsed - a[1].lastUsed;
        })
        .slice(0, 5);
    
    if (matches.length === 0) {
        hideSuggestions();
        return;
    }
    
    suggestionsDiv.innerHTML = matches.map(([key, data]) => `
        <div class="suggestion-item" onclick="selectSuggestion('${data.text.replace(/'/g, "\\'")}')">
            <span class="suggestion-text">${data.text}</span>
        </div>
    `).join('');
    
    suggestionsDiv.classList.add('active');
}

// הסתרת הצעות
function hideSuggestions() {
    const suggestionsDiv = document.getElementById('suggestions');
    suggestionsDiv.classList.remove('active');
}

// בחירת הצעה
function selectSuggestion(text) {
    const input = document.getElementById('itemInput');
    input.value = text;
    hideSuggestions();
    addItem(); // הוספה אוטומטית לרשימה
}

// סימון מוצר כקנוי
function toggleItem(index) {
    shoppingItems[index].completed = !shoppingItems[index].completed;
    saveItems();
    renderList();
}

// מחיקת מוצר
function deleteItem(index) {
    shoppingItems.splice(index, 1);
    saveItems();
    renderList();
}

// ריקון כל הרשימה
function clearList() {
    if (shoppingItems.length === 0) return;
    if (confirm('האם אתה בטוח שברצונך לרוקן את כל רשימת הקניות?')) {
        shoppingItems = [];
        saveItems();
        renderList();
    }
}

// אירועים
document.getElementById('addBtn').addEventListener('click', addItem);
document.getElementById('clearListBtn').addEventListener('click', clearList);

const itemInput = document.getElementById('itemInput');

itemInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addItem();
    }
});

itemInput.addEventListener('input', (e) => {
    showSuggestions(e.target.value);
});

itemInput.addEventListener('focus', (e) => {
    if (e.target.value) {
        showSuggestions(e.target.value);
    }
});

// סגירת הצעות בלחיצה מחוץ לאזור
document.addEventListener('click', (e) => {
    if (!e.target.closest('.add-item')) {
        hideSuggestions();
    }
});

// טעינה ראשונית
loadItems();

// פונקציית סגירת עמוד
function closePage() {
    window.location.href = 'index.html';
}
