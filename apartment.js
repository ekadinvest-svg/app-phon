let apartmentItems = [];

// --- FIRESTORE SYNC ---
function listenToApartmentList() {
    db.collection('apartmentList')
      .onSnapshot(snapshot => {
        apartmentItems = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          apartmentItems.push({
            id: doc.id,
            name: data.name,
            price: data.price
          });
        });
        renderApartmentList();
      }, error => {
        console.error('Error listening to apartment list:', error);
      });
}

function addApartmentItem() {
    const nameInput = document.getElementById('apartmentItemInput');
    const priceInput = document.getElementById('apartmentPriceInput');
    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    if (!name || isNaN(price) || price < 0) return;
    db.collection('apartmentList').add({
        name,
        price,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    nameInput.value = '';
    priceInput.value = '';
}

function renderApartmentList() {
    const list = document.getElementById('apartmentList');
    if (apartmentItems.length === 0) {
        list.innerHTML = '<div class="empty-message">אין הוצאות כרגע. הוסף הוצאה!</div>';
        return;
    }
    list.innerHTML = apartmentItems.map((item, idx) => `
        <li>
            <span class="item-name">${item.name}</span>
            <span class="item-price">₪${item.price}</span>
        </li>
    `).join('');
}

document.getElementById('addApartmentBtn').addEventListener('click', addApartmentItem);
document.getElementById('apartmentItemInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addApartmentItem();
});
document.getElementById('apartmentPriceInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addApartmentItem();
});

listenToApartmentList();
