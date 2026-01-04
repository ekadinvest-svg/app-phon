// ניהול אירועים
let userEvents = [];

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

// הצגת רשימת אירועים
function renderEventsList() {
    const container = document.getElementById('eventsList');
    if (!container) return;
    
    if (userEvents.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = userEvents.map(event => `
        <a href="event.html?id=${event.id}" class="tile event-tile">
            <span class="tile-icon">🎉</span>
            <span class="tile-label">${event.name}</span>
        </a>
    `).join('');
}

// פתיחת מודל אירוע חדש
function openNewEventModal() {
    document.getElementById('newEventModal').classList.add('active');
}

// סגירת מודל אירוע חדש
function closeNewEventModal() {
    document.getElementById('newEventModal').classList.remove('active');
    document.getElementById('newEventName').value = '';
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

// סגירת מודל בלחיצה על הרקע
document.addEventListener('click', (e) => {
    const modal = document.getElementById('newEventModal');
    if (modal && e.target === modal) {
        closeNewEventModal();
    }
});

// התחלה
listenToUserEvents();
