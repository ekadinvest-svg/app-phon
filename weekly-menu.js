const DAYS = [
    { key: 'sun', label: 'ראשון' },
    { key: 'mon', label: 'שני' },
    { key: 'tue', label: 'שלישי' },
    { key: 'wed', label: 'רביעי' },
    { key: 'thu', label: 'חמישי' },
    { key: 'fri', label: 'שישי' },
    { key: 'sat', label: 'שבת' }
];

let weeklyMeals = [];
let shoppingMap = new Map();
let selectedWeekStart = '';

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getWeekStart(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
}

function setWeekStart(dateValue) {
    const date = dateValue ? new Date(dateValue + 'T00:00:00') : new Date();
    selectedWeekStart = formatDate(getWeekStart(date));
    document.getElementById('weekStartDate').value = selectedWeekStart;
    renderWeeklyMenu();
}

function shiftWeek(daysDelta) {
    const base = new Date(selectedWeekStart + 'T00:00:00');
    base.setDate(base.getDate() + daysDelta);
    setWeekStart(formatDate(base));
}

function closePage() {
    window.location.href = 'index.html';
}

function listenWeeklyMenu() {
    db.collection('weeklyMenu').onSnapshot(snapshot => {
        weeklyMeals = [];
        snapshot.forEach(doc => {
            weeklyMeals.push({ id: doc.id, ...doc.data() });
        });
        renderWeeklyMenu();
    }, error => {
        console.error('Error listening to weekly menu:', error);
    });
}

function listenShoppingList() {
    db.collection('shoppingList').onSnapshot(snapshot => {
        shoppingMap = new Map();
        snapshot.forEach(doc => {
            const data = doc.data();
            const key = (data.textLower || (data.text || '').toLowerCase().trim());
            if (key) {
                shoppingMap.set(key, {
                    id: doc.id,
                    qty: data.qty || 1,
                    text: data.text || ''
                });
            }
        });
    }, error => {
        console.error('Error listening to shopping list:', error);
    });
}

function addMeal() {
    const day = document.getElementById('daySelect').value;
    const mealName = document.getElementById('mealName').value.trim();
    const ingredientsRaw = document.getElementById('ingredients').value.trim();

    if (!mealName) {
        alert('נא להזין מה אוכלים');
        return;
    }

    const ingredients = ingredientsRaw
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);

    db.collection('weeklyMenu').add({
        day,
        mealName,
        ingredients,
        weekStart: selectedWeekStart,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        document.getElementById('mealName').value = '';
        document.getElementById('ingredients').value = '';
    }).catch(error => {
        console.error('Error adding meal:', error);
        alert('שגיאה בהוספת ארוחה: ' + error.message);
    });
}

async function addIngredientsToShopping(mealId) {
    const meal = weeklyMeals.find(item => item.id === mealId);
    if (!meal) {
        return;
    }

    const ingredients = (meal.ingredients || [])
        .map(item => item.trim())
        .filter(item => item.length > 0);

    if (ingredients.length === 0) {
        alert('אין מצרכים להוסיף עבור הארוחה הזו');
        return;
    }

    let addedCount = 0;

    for (const ingredient of ingredients) {
        const key = ingredient.toLowerCase();
        const existing = shoppingMap.get(key);

        if (existing) {
            const nextQty = (existing.qty || 1) + 1;
            await db.collection('shoppingList').doc(existing.id).update({ qty: nextQty });
            shoppingMap.set(key, { ...existing, qty: nextQty });
        } else {
            const docRef = await db.collection('shoppingList').add({
                text: ingredient,
                textLower: key,
                qty: 1,
                completed: false,
                price: null,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            shoppingMap.set(key, { id: docRef.id, qty: 1, text: ingredient });
        }

        addedCount++;
    }

    alert('נוספו ' + addedCount + ' מצרכים לרשימת הקניות ✅');
}

function deleteMeal(mealId) {
    if (!confirm('למחוק את הארוחה מהתפריט השבועי?')) {
        return;
    }

    db.collection('weeklyMenu').doc(mealId).delete().catch(error => {
        console.error('Error deleting meal:', error);
        alert('שגיאה במחיקת הארוחה: ' + error.message);
    });
}

function renderWeeklyMenu() {
    const wrap = document.getElementById('daysWrap');
    if (!wrap) {
        return;
    }

    const mealsByDay = {
        sun: [],
        mon: [],
        tue: [],
        wed: [],
        thu: [],
        fri: [],
        sat: []
    };

    weeklyMeals.forEach(meal => {
        // תאימות אחורה: רשומות ישנות בלי weekStart יוצגו רק בשבוע הנוכחי שנפתח
        const mealWeekStart = meal.weekStart || selectedWeekStart;
        if (mealWeekStart !== selectedWeekStart) {
            return;
        }
        if (mealsByDay[meal.day]) {
            mealsByDay[meal.day].push(meal);
        }
    });

    wrap.innerHTML = DAYS.map(day => {
        const meals = mealsByDay[day.key] || [];

        const mealsHtml = meals.length
            ? meals.map(meal => `
                <div class="meal-item">
                    <div class="meal-name">${escapeHtml(meal.mealName || '')}</div>
                    <ul class="ingredients-list">
                        ${(meal.ingredients || []).map(ingredient => `<li>${escapeHtml(ingredient)}</li>`).join('')}
                    </ul>
                    <div class="meal-actions">
                        <button class="btn-small btn-add-shopping" onclick="addIngredientsToShopping('${meal.id}')">🛒 הוסף מצרכים לקניות</button>
                        <button class="btn-small btn-delete-meal" onclick="deleteMeal('${meal.id}')">🗑️ מחק</button>
                    </div>
                </div>
            `).join('')
            : '<div class="empty-message">אין ארוחות ליום זה</div>';

        return `
            <section class="day-card">
                <h3 class="day-title">${day.label}</h3>
                ${mealsHtml}
            </section>
        `;
    }).join('');
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

document.getElementById('addMealBtn').addEventListener('click', addMeal);

document.getElementById('weekStartDate').addEventListener('change', e => {
    setWeekStart(e.target.value);
});

document.getElementById('prevWeekBtn').addEventListener('click', () => {
    shiftWeek(-7);
});

document.getElementById('nextWeekBtn').addEventListener('click', () => {
    shiftWeek(7);
});

document.getElementById('ingredients').addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        addMeal();
    }
});

listenWeeklyMenu();
listenShoppingList();
setWeekStart(formatDate(new Date()));
