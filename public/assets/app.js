let userId = null;

document.addEventListener('DOMContentLoaded', async () => {
  await fetchCurrentUser();
  if (userId) {
    loadAlbumFromServer();
    loadDuplicatesFromServer();
  }
});

const cardContainer = document.getElementById('card-container');
const album = document.getElementById('album');
const duplicatesAlbum = document.getElementById('duplicates-album');

async function fetchCurrentUser() {
  try {
    const res = await fetch('/getUser');
    if (!res.ok) throw new Error('Utente non autenticato');
    const user = await res.json();
    userId = user._id;
  } catch (err) {
    console.error('Errore nel recupero utente:', err);
    alert('Sessione scaduta. Effettua di nuovo il login.');
    window.location.href = '/login';
  }
}

async function buyPackage() {
  cardContainer.innerHTML = '';

  try {
    const res = await fetch('/api/buy-package', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    if (!res.ok) {
      const error = await res.json();
      alert(error.message || 'Errore durante l’acquisto del pacchetto.');
      return;
    }

    const { characters } = await res.json();
    characters.forEach(character => {
      const card = createCharacterCard(character, true);
      cardContainer.appendChild(card);
    });
  } catch (err) {
    console.error('Errore acquisto pacchetto:', err);
  }
}

function createCharacterCard(character, showAddButton = false) {
  const col = document.createElement('div');
  col.className = 'col-md-4 mb-4';

  col.innerHTML = `
    <div class="card h-100" data-id="${character.id}">
      <img src="${character.image}" class="card-img-top">
      <div class="card-body">
        <h5 class="card-title">${character.name}</h5>
        <p class="card-text">${character.house || 'Nessuna casata'}</p>
        ${showAddButton ? `<button class="btn btn-success add-to-album">Aggiungi all'album</button>` : ''}
      </div>
    </div>
  `;

  if (showAddButton) {
    col.querySelector('.add-to-album').addEventListener('click', () => {
      addToAlbum(character);
    });
  }

  return col;
}

async function addToAlbum(character) {
  try {
    const res = await fetch('/api/album/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, character })
    });

    const data = await res.json();
    alert(data.message || 'Personaggio aggiunto.');

    // Rimuove dal DOM
    const cardElement = document.querySelector(`[data-id="${character.id}"]`);
    if (cardElement) cardElement.remove();

    // Aggiorna visivamente gli album
    if (data.message.includes('Doppione')) {
      addToDuplicates(character);
    } else {
      addToMainAlbum(character);
    }
  } catch (err) {
    console.error('Errore aggiunta all’album:', err);
  }
}

function addToMainAlbum(character) {
  const card = createCharacterCard(character, false);
  album.appendChild(card);
}

function addToDuplicates(character) {
  const card = createCharacterCard(character, false);
  duplicatesAlbum.appendChild(card);
}

async function loadAlbumFromServer() {
  try {
    const res = await fetch(`/album/${userId}`);
    const characters = await res.json();

    if (!Array.isArray(characters)) {
      console.error('Album ricevuto non è un array:', characters);
      return;
    }

    characters.forEach(character => {
      const card = createCharacterCard(character, false);
      album.appendChild(card);
    });
  } catch (err) {
    console.error('Errore nel caricamento dell’album:', err);
  }
}

async function loadDuplicatesFromServer() {
  try {
    const res = await fetch(`/album/${userId}/doppioni`);
    const characters = await res.json();

    if (!Array.isArray(characters)) {
      console.error('Doppioni ricevuti non sono un array:', characters);
      return;
    }

    characters.forEach(character => {
      const card = createCharacterCard(character, false);

      // Aggiungi pulsante per lo scambio
      const scambiaBtn = document.createElement('button');
      scambiaBtn.textContent = 'Scambia';
      scambiaBtn.addEventListener('click', () => {
        preparaScambio(character);
      });

      card.appendChild(scambiaBtn);
      duplicatesAlbum.appendChild(card);
    });
  } catch (err) {
    console.error('Errore nel caricamento dei doppioni:', err);
  }
}

function preparaScambio(cartaDaScambiare) {
  localStorage.setItem('cartaProposta', JSON.stringify(cartaDaScambiare));
  window.location.href = `/scegli-carta`;
}

document.getElementById('buy-package')?.addEventListener('click', buyPackage);
