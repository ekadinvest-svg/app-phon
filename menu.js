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
    if (confirm('האם אתה בטוח שברצונך למחוק את כל הנתונים?\n\nפעולה זו תמחק:\n• את כל רשימת הקניות\n• את היסטוריית המוצרים\n• את כל הנתונים השמורים\n\nפעולה זו בלתי הפיכה!')) {
        // מחיקת כל ה-localStorage
        localStorage.clear();
        
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

// סגירת מודל בלחיצה על הרקע
document.addEventListener('click', (e) => {
    const modal = document.getElementById('settingsModal');
    if (modal && e.target === modal) {
        closeSettings();
    }
});
