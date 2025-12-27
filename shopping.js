let shoppingItems = [];
let itemHistory = {};

// --- FIRESTORE SYNC ---

// קריאה בזמן אמת
function listenToShoppingList() {
    db.collection('shoppingList').orderBy('timestamp')
      .onSnapshot(snapshot => {
        shoppingItems = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          shoppingItems.push({
            id: doc.id,
            text: data.text,
            qty: data.qty,
            completed: data.completed
          });
        });
        renderList();
      });
}

// הוספת מוצר
function addItem() {
    const input = document.getElementById('itemInput');
    const text = input.value.trim();
    if (text) {
        db.collection('shoppingList').add({
            text,
            qty: 1,
            completed: false,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        addToHistory(text);
        input.value = '';
        hideSuggestions();
    }
}

// עדכון כמות
function increaseQty(e, index) {
    e.stopPropagation();
    const item = shoppingItems[index];
    db.collection('shoppingList').doc(item.id).update({ qty: (item.qty || 1) + 1 });
}

function decreaseQty(e, index) {
    e.stopPropagation();
    const item = shoppingItems[index];
    if ((item.qty || 1) > 1) {
        db.collection('shoppingList').doc(item.id).update({ qty: (item.qty || 1) - 1 });
    } else {
        if (confirm('האם אתה בטוח שברצונך להסיר את הפריט מהרשימה?')) {
            db.collection('shoppingList').doc(item.id).delete();
        }
    }
}

// סימון מוצר כקנוי
function toggleItem(index) {
    const item = shoppingItems[index];
    db.collection('shoppingList').doc(item.id).update({ completed: !item.completed });
}

// --- FIRESTORE SYNC להיסטוריה ---
function listenToItemHistory() {
    db.collection('itemHistory').onSnapshot(snapshot => {
        itemHistory = {};
        snapshot.forEach(doc => {
            itemHistory[doc.id] = doc.data();
        });
    });
}

function saveHistory() {
    // שמירה של כל ההיסטוריה ל-Firestore
    Object.entries(itemHistory).forEach(([key, data]) => {
        db.collection('itemHistory').doc(key).set(data);
    });
}

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

listenToItemHistory();

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
            <div class="quantity-control">
                <button class="qty-btn" onclick="decreaseQty(event, ${index})">-</button>
                <span class="qty-value">${item.qty || 1}</span>
                <button class="qty-btn" onclick="increaseQty(event, ${index})">+</button>
            </div>
        </li>
    `).join('');
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
listenToShoppingList();

// פונקציית סגירת עמוד
function closePage() {
    window.location.href = 'index.html';
}
