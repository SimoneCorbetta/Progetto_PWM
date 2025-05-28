let userId = null;

document.addEventListener('DOMContentLoaded', async () => {
  await fetchCurrentUser();
  if (userId) {
    loadAlbumFromServer();
    loadDuplicatesFromServer();
  }
});

const album = document.getElementById('album');
const duplicatesAlbum = document.getElementById('duplicates-album');

async function loadAlbumFromServer() {
  try {
    const res = await fetch(`/album/${userId}`);
    const characters = await res.json();

    if (!Array.isArray(characters)) {
      console.error('Album ricevuto non è un array:', characters);
      return;
    }

    characters.forEach(character => {
      const card = createCharacterCard(character, false, true);
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
      const card = createCharacterCard(character, false, true);

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
