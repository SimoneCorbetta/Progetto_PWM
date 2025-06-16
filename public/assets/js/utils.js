//funzione per controllare l'utente se e' autenticato
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

//funzione per creare la carta, i parametri sono: character (personaggio);
//showAddButton, ovvero booleano (se true fa visualizzare il pulsante per aggiungere questo personaggio nel mio album principale o doppioni);
//showInfoButton, anch'esso booleano per far visualizzare questo pulsante nel div della card
function createCharacterCard(character, showAddButton = false, showInfoButton = true, showVendiButton = false) {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';
  
    col.innerHTML = `
      <div class="card h-100" data-id="${character.id}">
        <img src="${character.image || 'https://us.123rf.com/450wm/tatkrav/tatkrav2201/tatkrav220100080/180401676-icona-della-siluetta-della-persona-forma-nera-personaggio-anonimo-profilo-utente-design-semplice.jpg?ver=6://www.google.com/url?sa=i&url=https%3A%2F%2Fit.123rf.com%2Fphoto_75444212_simbolo-del-web-dell-utente-simbolo-semplice-icona-sulla-priorit%25C3%25A0-bassa.html&psig=AOvVaw0JVn1XJyuyT0l5vtFb0cCd&ust=1748521100038000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCPjzye-Sxo0DFQAAAAAdAAAAABAE'}" class="card-img-top">
        <div class="card-body">
          <h5 class="card-title">${character.name}</h5>
          <p class="card-text">${character.house || 'Nessuna casata'}</p>
          ${showAddButton ? `<button class="btn btn-success add-to-album">Aggiungi all'album</button>` : ''}
          ${showInfoButton ? `<button class="btn btn-success view-data-figurina">Visualizza altre info</button>` : ''}
          ${showVendiButton ? `<button class="btn btn-success vendi-figurina">Vendi figuriina</button>` : ''}
        </div>
      </div>
    `;

    //se il booleano showAddButton e' vero, al click del bottone con class=add-to-album, esegui la funzione addToAlbum
    if (showAddButton) {
      col.querySelector('.add-to-album').addEventListener('click', () => {
        addToAlbum(character);
      });
    }

    //se il booleano showInfoButton e' vero, al click del bottone con class=view-data-figurina,
    //fai una fetch al server e con i dati della risposta chiami la funzione showModalWithCharacterData
    if (showInfoButton) {
      col.querySelector('.view-data-figurina').addEventListener('click', async () => {
        try {
          const response = await fetch(`/character/${character.id}`);
          if (!response.ok) throw new Error('Errore nel recupero dei dati');
          const data = await response.json();
          showModalWithCharacterData(data);
        } catch (error) {
          console.error('Errore durante il fetch del personaggio:', error);
        }
      });
    }

    if(showVendiButton){
      col.querySelector('.vendi-figurina').addEventListener('click', async () => {
        try {
          fetch('/album/vendi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              characterId: character.id
            })
          })
          .then(res => res.json())
          .then(data => {
            if (data.error) return alert(data.error);
            alert(data.message);

            // Rimuove la card venduta dal DOM
            const cardElement = document.querySelector(`[data-id="${characterId}"]`);
            if (cardElement) cardElement.remove();

          })
        } catch (error) {
          console.error('Errore durante la vendita per crediti della figurina:', error);
        }
      });
    }
  
    return col;
  }
  //funzione per aggiungere il personaggio (figurina) nell'album
  //se nuova nel principale, altrimenti nell'album dei doppioni
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
      //quando schiaccio il pulsante per aggiungere la figurina nel mio album la card dal div viene eliminata
      //perche' se non la rimuovo e' possibile ripremere lo stesso pulsante e ne aggiunge un'altra uguale
      const cardElement = document.querySelector(`[data-id="${character.id}"]`);
      if (cardElement) cardElement.remove();
  
    } catch (err) {
      console.error('Errore aggiunta all’album:', err);
    }
  }

  //funzione per mostrare piu' dati del personaggio in un modal (bootstrap)
  function showModalWithCharacterData(character) {
    const modalHtml = `
      <div class="modal fade" id="infoModal" tabindex="-1" aria-labelledby="infoModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${character.name}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Chiudi"></button>
            </div>
            <div class="modal-body">
              <img src="${character.image || 'https://us.123rf.com/450wm/tatkrav/tatkrav2201/tatkrav220100080/180401676-icona-della-siluetta-della-persona-forma-nera-personaggio-anonimo-profilo-utente-design-semplice.jpg?ver=6://www.google.com/url?sa=i&url=https%3A%2F%2Fit.123rf.com%2Fphoto_75444212_simbolo-del-web-dell-utente-simbolo-semplice-icona-sulla-priorit%25C3%25A0-bassa.html&psig=AOvVaw0JVn1XJyuyT0l5vtFb0cCd&ust=1748521100038000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCPjzye-Sxo0DFQAAAAAdAAAAABAE'}" class="img-fluid mb-3" />
              <p><strong>Casa:</strong> ${character.house || 'Nessuna casata'}</p>
              <p><strong>Specie:</strong> ${character.species}</p>
              <p><strong>Genere:</strong> ${character.gender}</p>
              <p><strong>Colore occhi:</strong> ${character.eyeColour || 'Dato sconosciuto'}</p>
              <p><strong>Colore capelli:</strong> ${character.hairColour || 'Dato sconosciuto'}</p>
              <p><strong>Attore:</strong> ${character.actor || 'Dato sconosciuto'}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Rimuove modali vecchi, se presenti
    const existingModal = document.getElementById('infoModal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('infoModal'));
    modal.show();
  }
