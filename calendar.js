let events = [];
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

const hebrewMonths = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

const eventIcons = {
    event: '🎉',
    task: '✅',
    reminder: '🔔'
};

// --- FIRESTORE SYNC ---
function listenToEvents() {
    console.log('Starting to listen to events...');
    db.collection('events')
      .onSnapshot(snapshot => {
        console.log('Got events snapshot with', snapshot.size, 'items');
        events = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          events.push({
            id: doc.id,
            title: data.title,
            date: data.date,
            time: data.time || '',
            type: data.type || 'event'
          });
        });
        renderCalendar();
        renderEventsList();
      }, error => {
        console.error('Error listening to events:', error);
      });
}

// רינדור לוח השנה
function renderCalendar() {
    const monthLabel = document.getElementById('currentMonth');
    monthLabel.textContent = `${hebrewMonths[currentMonth]} ${currentYear}`;
    
    const daysContainer = document.getElementById('calendarDays');
    daysContainer.innerHTML = '';
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const today = new Date();
    const todayStr = formatDate(today);
    
    // ימים מהחודש הקודם
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const dayEl = createDayElement(day, true);
        daysContainer.appendChild(dayEl);
    }
    
    // ימים בחודש הנוכחי
    for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = dateStr === todayStr;
        const hasEvent = events.some(e => e.date === dateStr);
        
        const dayEl = createDayElement(day, false, isToday, hasEvent, dateStr);
        daysContainer.appendChild(dayEl);
    }
    
    // ימים מהחודש הבא
    const remainingDays = 42 - (startDay + totalDays);
    for (let day = 1; day <= remainingDays; day++) {
        const dayEl = createDayElement(day, true);
        daysContainer.appendChild(dayEl);
    }
}

let selectedDate = null;

function createDayElement(day, isOtherMonth, isToday = false, hasEvent = false, dateStr = '') {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    if (isOtherMonth) dayEl.classList.add('other-month');
    if (isToday) dayEl.classList.add('today');
    if (hasEvent) dayEl.classList.add('has-event');
    if (dateStr === selectedDate) dayEl.classList.add('selected');
    
    dayEl.innerHTML = `<span class="day-number">${day}</span>`;
    
    if (!isOtherMonth && dateStr) {
        dayEl.onclick = () => {
            selectDate(dateStr);
        };
    }
    
    return dayEl;
}

function selectDate(dateStr) {
    selectedDate = dateStr;
    renderCalendar();
    showDayDetails(dateStr);
}

function showDayDetails(dateStr) {
    const dayEvents = events.filter(e => e.date === dateStr);
    const detailsSection = document.getElementById('dayDetails');
    const dateObj = new Date(dateStr);
    const dateFormatted = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
    
    if (dayEvents.length === 0) {
        detailsSection.innerHTML = `
            <div class="day-details-header">
                <h3>📅 ${dateFormatted}</h3>
            </div>
            <div class="empty-message">אין אירועים ביום זה</div>
            <button class="btn" onclick="openEventModalForDate('${dateStr}')" style="width:100%;margin-top:10px;">➕ הוסף אירוע</button>
        `;
    } else {
        detailsSection.innerHTML = `
            <div class="day-details-header">
                <h3>📅 ${dateFormatted}</h3>
            </div>
            <ul class="day-events-list">
                ${dayEvents.map(event => `
                    <li>
                        <span class="event-type">${eventIcons[event.type] || '📅'}</span>
                        <div class="event-info">
                            <div class="event-title">${event.title}</div>
                            ${event.time ? `<div class="event-time">${event.time}</div>` : ''}
                        </div>
                        <button class="delete-btn" onclick="deleteEvent('${event.id}')">🗑️</button>
                    </li>
                `).join('')}
            </ul>
            <button class="btn" onclick="openEventModalForDate('${dateStr}')" style="width:100%;margin-top:10px;">➕ הוסף אירוע</button>
        `;
    }
    detailsSection.style.display = 'block';
}

function openEventModalForDate(dateStr) {
    document.getElementById('eventDate').value = dateStr;
    openEventModal();
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

// רשימת אירועים
function renderEventsList() {
    const list = document.getElementById('eventsList');
    
    // מיון לפי תאריך
    const sortedEvents = [...events].sort((a, b) => {
        const dateA = new Date(a.date + (a.time ? 'T' + a.time : ''));
        const dateB = new Date(b.date + (b.time ? 'T' + b.time : ''));
        return dateA - dateB;
    });
    
    // רק אירועים מהיום והלאה
    const today = formatDate(new Date());
    const upcomingEvents = sortedEvents.filter(e => e.date >= today);
    
    if (upcomingEvents.length === 0) {
        list.innerHTML = '<div class="empty-message">אין אירועים קרובים 📅</div>';
        return;
    }
    
    list.innerHTML = upcomingEvents.map(event => {
        const dateObj = new Date(event.date);
        const dateFormatted = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
        const timeFormatted = event.time || '';
        
        return `
            <li>
                <span class="event-type">${eventIcons[event.type] || '📅'}</span>
                <div class="event-info">
                    <div class="event-title">${event.title}</div>
                    <div class="event-date">${dateFormatted} ${timeFormatted}</div>
                </div>
                <button class="delete-btn" onclick="deleteEvent('${event.id}')">🗑️</button>
            </li>
        `;
    }).join('');
}

// מודל אירוע
function openEventModal() {
    const modal = document.getElementById('eventModal');
    modal.classList.add('active');
    
    // ברירת מחדל - היום
    if (!document.getElementById('eventDate').value) {
        document.getElementById('eventDate').value = formatDate(new Date());
    }
}

function closeEventModal() {
    const modal = document.getElementById('eventModal');
    modal.classList.remove('active');
    
    // איפוס שדות
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventTime').value = '';
    document.getElementById('eventType').value = 'event';
}

function saveEvent() {
    const date = document.getElementById('eventDate').value;
    const title = document.getElementById('eventTitle').value.trim();
    const time = document.getElementById('eventTime').value;
    const type = document.getElementById('eventType').value;
    
    if (!date || !title) {
        alert('נא למלא תאריך וכותרת');
        return;
    }
    
    console.log('Saving event:', { date, title, time, type });
    
    db.collection('events').add({
        date,
        title,
        time,
        type,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        console.log('Event saved successfully');
        closeEventModal();
    }).catch(error => {
        console.error('Error saving event:', error);
        alert('שגיאה בשמירת האירוע: ' + error.message);
    });
}

function deleteEvent(id) {
    if (confirm('האם אתה בטוח שברצונך למחוק את האירוע?')) {
        db.collection('events').doc(id).delete();
    }
}

// סגירת מודל בלחיצה על הרקע
document.addEventListener('click', (e) => {
    const eventModal = document.getElementById('eventModal');
    if (e.target === eventModal) {
        closeEventModal();
    }
});

// פונקציית סגירת עמוד
function closePage() {
    window.location.href = 'index.html';
}

// הפעלה
listenToEvents();
