let shoppingItems = [];

// טעינת הרשימה מ-localStorage
function loadItems() {
    const saved = localStorage.getItem('shoppingList');
    if (saved) {
        shoppingItems = JSON.parse(saved);
        renderList();
    }
}

// שמירת הרשימה ל-localStorage
function saveItems() {
    localStorage.setItem('shoppingList', JSON.stringify(shoppingItems));
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
        input.value = '';
        saveItems();
        renderList();
    }
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

// אירועים
document.getElementById('addBtn').addEventListener('click', addItem);
document.getElementById('itemInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addItem();
});

// טעינה ראשונית
loadItems();
