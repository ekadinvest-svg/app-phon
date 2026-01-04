// ניהול אירועים
let userEvents = [];
let fabMenuOpen = false;

// האזנה לאירועים
function listenToUserEvents() {
    db.collection('userEvents').onSnapshot(snapshot => {
        userEvents = [];
        snapshot.forEach(doc => {
            userEvents.push({
                id: doc.id,
                ...doc.data()
            });
        });
        renderEventsList();
    }, error => {
        console.error('Error listening to events:', error);
    });
}

// הצגת רשימת אירועים - עכשיו בתוך הגריד הראשי
function renderEventsList() {
    const grid = document.getElementById('tilesGrid');
    if (!grid) return;
    
    // הסרת אירועים קודמים
    const existingEvents = grid.querySelectorAll('.event-tile');
    existingEvents.forEach(el => el.remove());
    
    // הוספת אירועים חדשים
    userEvents.forEach(event => {
        const tile = document.createElement('a');
        tile.href = `event.html?id=${event.id}`;
        tile.className = 'tile event-tile';
        tile.innerHTML = `
            <span class="tile-icon">🎉</span>
            <span class="tile-label">${event.name}</span>
        `;
        grid.appendChild(tile);
    });
}

// פתיחה/סגירה של תפריט FAB
function toggleFabMenu() {
    const menu = document.getElementById('fabMenu');
    const fab = document.querySelector('.add-event-fab');
    fabMenuOpen = !fabMenuOpen;
    
    if (fabMenuOpen) {
        menu.classList.add('active');
        fab.classList.add('active');
    } else {
        menu.classList.remove('active');
        fab.classList.remove('active');
    }
}

// סגירת תפריט FAB
function closeFabMenu() {
    const menu = document.getElementById('fabMenu');
    const fab = document.querySelector('.add-event-fab');
    fabMenuOpen = false;
    menu.classList.remove('active');
    fab.classList.remove('active');
}

// פתיחת מודל אירוע חדש
function openNewEventModal() {
    closeFabMenu();
    document.getElementById('newEventModal').classList.add('active');
}

// סגירת מודל אירוע חדש
function closeNewEventModal() {
    document.getElementById('newEventModal').classList.remove('active');
    document.getElementById('newEventName').value = '';
}

// פתיחת מודל מחיקת אירוע
function openDeleteEventModal() {
    closeFabMenu();
    renderDeleteEventsList();
    document.getElementById('deleteEventModal').classList.add('active');
}

// סגירת מודל מחיקת אירוע
function closeDeleteEventModal() {
    document.getElementById('deleteEventModal').classList.remove('active');
}

// הצגת רשימת אירועים למחיקה
function renderDeleteEventsList() {
    const container = document.getElementById('deleteEventsList');
    
    if (userEvents.length === 0) {
        container.innerHTML = '<div class="empty-message">אין אירועים למחיקה</div>';
        return;
    }
    
    container.innerHTML = userEvents.map(event => `
        <div class="delete-event-item">
            <span class="event-name">🎉 ${event.name}</span>
            <button class="btn-danger" onclick="deleteEvent('${event.id}')">🗑️ מחק</button>
        </div>
    `).join('');
}

// מחיקת אירוע
function deleteEvent(eventId) {
    if (confirm('האם אתה בטוח שברצונך למחוק את האירוע?\n\nכל הנתונים של האירוע יימחקו.')) {
        // מחיקת הנתונים של האירוע
        db.collection('eventExpenses').where('eventId', '==', eventId).get().then(snapshot => {
            snapshot.forEach(doc => doc.ref.delete());
        });
        db.collection('eventVendors').where('eventId', '==', eventId).get().then(snapshot => {
            snapshot.forEach(doc => doc.ref.delete());
        });
        db.collection('eventIdeas').where('eventId', '==', eventId).get().then(snapshot => {
            snapshot.forEach(doc => doc.ref.delete());
        });
        
        // מחיקת האירוע עצמו
        db.collection('userEvents').doc(eventId).delete().then(() => {
            renderDeleteEventsList();
        });
    }
}

// יצירת אירוע חדש
function createNewEvent() {
    const name = document.getElementById('newEventName').value.trim();
    if (!name) {
        alert('נא להזין שם לאירוע');
        return;
    }
    
    db.collection('userEvents').add({
        name: name,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        closeNewEventModal();
    }).catch(error => {
        console.error('Error creating event:', error);
        alert('שגיאה ביצירת האירוע');
    });
}

// סגירת מודלים בלחיצה על הרקע
document.addEventListener('click', (e) => {
    const newEventModal = document.getElementById('newEventModal');
    const deleteEventModal = document.getElementById('deleteEventModal');
    
    if (newEventModal && e.target === newEventModal) {
        closeNewEventModal();
    }
    if (deleteEventModal && e.target === deleteEventModal) {
        closeDeleteEventModal();
    }
    
    // סגירת תפריט FAB בלחיצה מחוץ
    if (fabMenuOpen && !e.target.closest('.fab-container')) {
        closeFabMenu();
    }
});

// התחלה
listenToUserEvents();
