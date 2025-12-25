let apartmentItems = [];

function loadApartmentItems() {
    const saved = localStorage.getItem('apartmentList');
    if (saved) {
        apartmentItems = JSON.parse(saved);
        renderApartmentList();
    }
}

function saveApartmentItems() {
    localStorage.setItem('apartmentList', JSON.stringify(apartmentItems));
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

function addApartmentItem() {
    const nameInput = document.getElementById('apartmentItemInput');
    const priceInput = document.getElementById('apartmentPriceInput');
    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    if (!name || isNaN(price) || price < 0) return;
    apartmentItems.push({ name, price });
    nameInput.value = '';
    priceInput.value = '';
    saveApartmentItems();
    renderApartmentList();
}

document.getElementById('addApartmentBtn').addEventListener('click', addApartmentItem);
document.getElementById('apartmentItemInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addApartmentItem();
});
document.getElementById('apartmentPriceInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addApartmentItem();
});

loadApartmentItems();
