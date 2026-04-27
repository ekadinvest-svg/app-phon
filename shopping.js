let shoppingItems = [];
let itemHistory = {};

// --- FIRESTORE SYNC ---

// קריאה בזמן אמת
function listenToShoppingList() {
    console.log('Starting to listen to shopping list...');
    db.collection('shoppingList')
      .onSnapshot(snapshot => {
        console.log('Got snapshot with', snapshot.size, 'items');
        shoppingItems = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          console.log('Item:', doc.id, data);
          shoppingItems.push({
            id: doc.id,
            text: data.text,
            qty: data.qty || 1,
            completed: data.completed || false,
            price: data.price || null
          });
        });
        renderList();
      }, error => {
        console.error('Error listening to shopping list:', error);
        alert('שגיאה בטעינת הרשימה: ' + error.message);
      });
}

// הוספת מוצר
function addItem() {
    const input = document.getElementById('itemInput');
    const text = input.value.trim();
    if (text) {
        console.log('Adding item:', text);
        db.collection('shoppingList').add({
            text,
            textLower: text.toLowerCase().trim(),
            qty: 1,
            completed: false,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            console.log('Item added successfully');
        }).catch(error => {
            console.error('Error adding item:', error);
            alert('שגיאה בהוספת מוצר: ' + error.message);
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
    console.log('Starting to listen to item history...');
    db.collection('itemHistory').onSnapshot(snapshot => {
        console.log('Got history snapshot with', snapshot.size, 'items');
        itemHistory = {};
        snapshot.forEach(doc => {
            itemHistory[doc.id] = doc.data();
        });
    }, error => {
        console.error('Error listening to item history:', error);
    });
}

function saveHistory() {
    // שמירה של כל ההיסטוריה ל-Firestore
    console.log('Saving history to Firestore...');
    Object.entries(itemHistory).forEach(([key, data]) => {
        db.collection('itemHistory').doc(key).set(data)
          .then(() => console.log('History saved:', key))
          .catch(error => console.error('Error saving history:', error));
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
    
    // מיון - פריטים לא מסומנים קודם, מסומנים אחרים
    const sortedItems = [...shoppingItems].sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
    });
    
    list.innerHTML = sortedItems.map((item) => {
        const originalIndex = shoppingItems.findIndex(i => i.id === item.id);
        return `
        <li class="${item.completed ? 'completed' : ''}" 
            oncontextmenu="event.preventDefault(); openPriceModal(${originalIndex});" 
            ontouchstart="startLongPress(event, ${originalIndex})" 
            ontouchend="cancelLongPress()" 
            ontouchmove="cancelLongPress()">
            <span class="item-text" onclick="toggleItem(${originalIndex})">${item.text}</span>
            ${item.price ? `<span class="item-price">₪${item.price}</span>` : ''}
            <div class="quantity-control">
                <button class="qty-btn" onclick="decreaseQty(event, ${originalIndex})">-</button>
                <span class="qty-value">${item.qty || 1}</span>
                <button class="qty-btn" onclick="increaseQty(event, ${originalIndex})">+</button>
            </div>
        </li>
    `;
    }).join('');
}

// לחיצה ארוכה להוספת מחיר
let longPressTimer = null;

function startLongPress(e, index) {
    longPressTimer = setTimeout(() => {
        openPriceModal(index);
    }, 500);
}

function cancelLongPress() {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}

function openPriceModal(index) {
    const item = shoppingItems[index];
    const currentPrice = item.price || '';
    const newPrice = prompt(`הזן מחיר ל"${item.text}":`, currentPrice);
    
    if (newPrice !== null) {
        const price = parseFloat(newPrice);
        if (!isNaN(price) && price >= 0) {
            db.collection('shoppingList').doc(item.id).update({ price: price });
        } else if (newPrice === '') {
            db.collection('shoppingList').doc(item.id).update({ price: null });
        }
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

// מחיקת מוצר
function deleteItem(index) {
    const item = shoppingItems[index];
    db.collection('shoppingList').doc(item.id).delete();
}

// ריקון כל הרשימה
function clearList() {
    if (shoppingItems.length === 0) return;
    if (confirm('האם אתה בטוח שברצונך לרוקן את כל רשימת הקניות?')) {
        // מחיקת כל הפריטים מ-Firestore
        shoppingItems.forEach(item => {
            db.collection('shoppingList').doc(item.id).delete();
        });
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
