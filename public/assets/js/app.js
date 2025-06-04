let userId = null;
//appena entro nelle pagine per visualizzare i due album (principale e dei doppioni)
//usando sempre la funzione fetchCurrentUser per controllare se utente e' autenticato
//se l'utente e' autorizzato, allora vengono eseguite immediatamente le funzioni per caricare le carte
//nella pagina, prese dal db
document.addEventListener('DOMContentLoaded', async () => {
  await fetchCurrentUser();
  if (userId) {
    //album Principale
    loadAlbumFromServer();
    //album dei doppioni
    loadDuplicatesFromServer();
  }
});
//div in cui verranno caricate le carte
const album = document.getElementById('album');
const duplicatesAlbum = document.getElementById('duplicates-album');

//funzione per caricare le carte dell'album principale
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

//funzione per caricare le carte dell'album dei doppioni
//a differenza delle carte dell'album principale che sono le carte che l'utente colleziona
//in aggiunta hanno un pulsante 'Scambio', in cui quando lo si preme viene eseguita la funzione preparaScambio
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
      scambiaBtn.className = 'scambia-btn';
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

//questa funzione viene creata per salvare la carta nel localStoage, visto che quando
//decido di scambiare quella carta, successivamente dovro' scegliere una carta doppiona
//di un altro utente per scambiarla con la mia
function preparaScambio(cartaDaScambiare) {
  localStorage.setItem('cartaProposta', JSON.stringify(cartaDaScambiare));
  window.location.href = `/scegli-carta`;
}
