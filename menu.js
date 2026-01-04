// פתיחה/סגירה של התפריט
function toggleMenu() {
    const sideMenu = document.getElementById('sideMenu');
    const overlay = document.getElementById('menuOverlay');
    
    sideMenu.classList.toggle('active');
    overlay.classList.toggle('active');
}

// פתיחת הגדרות
function openSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.add('active');
        toggleMenu(); // סגירת התפריט
    }
}

// סגירת הגדרות
function closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// איפוס מערכת
function resetSystem() {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל הנתונים?\n\nפעולה זו תמחק:\n• את כל רשימת הקניות\n• את היסטוריית המוצרים\n• את הוצאות הדירה\n• את כל האירועים\n• את כל הנתונים השמורים\n\nפעולה זו בלתי הפיכה!')) {
        // מחיקת כל ה-localStorage
        localStorage.clear();
        
        // מחיקת נתונים מ-Firestore
        if (typeof db !== 'undefined') {
            // מחיקת רשימת קניות
            db.collection('shoppingList').get().then(snapshot => {
                snapshot.forEach(doc => doc.ref.delete());
            });
            // מחיקת היסטוריית מוצרים
            db.collection('itemHistory').get().then(snapshot => {
                snapshot.forEach(doc => doc.ref.delete());
            });
            // מחיקת הוצאות דירה
            db.collection('apartmentList').get().then(snapshot => {
                snapshot.forEach(doc => doc.ref.delete());
            });
            // מחיקת אירועי לוח שנה
            db.collection('events').get().then(snapshot => {
                snapshot.forEach(doc => doc.ref.delete());
            });
            // מחיקת אירועים משתמש
            db.collection('userEvents').get().then(snapshot => {
                snapshot.forEach(doc => doc.ref.delete());
            });
            // מחיקת הוצאות אירועים
            db.collection('eventExpenses').get().then(snapshot => {
                snapshot.forEach(doc => doc.ref.delete());
            });
            // מחיקת ספקים
            db.collection('eventVendors').get().then(snapshot => {
                snapshot.forEach(doc => doc.ref.delete());
            });
            // מחיקת רעיונות
            db.collection('eventIdeas').get().then(snapshot => {
                snapshot.forEach(doc => doc.ref.delete());
            });
        }
        
        // הודעה למשתמש
        alert('המערכת אופסה בהצלחה! ✅\n\nכל הנתונים נמחקו.');
        
        // סגירת ההגדרות
        closeSettings();
        
        // רענון העמוד
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }
}

// פתיחת עזרה
function openHelp() {
    closeSettings();
    const modal = document.getElementById('helpModal');
    if (modal) {
        modal.classList.add('active');
    }
}

// סגירת עזרה
function closeHelp() {
    const modal = document.getElementById('helpModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// סגירת מודל בלחיצה על הרקע
document.addEventListener('click', (e) => {
    const settingsModal = document.getElementById('settingsModal');
    const helpModal = document.getElementById('helpModal');
    if (settingsModal && e.target === settingsModal) {
        closeSettings();
    }
    if (helpModal && e.target === helpModal) {
        closeHelp();
    }
});
