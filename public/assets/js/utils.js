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

function createCharacterCard(character, showAddButton = false, showInfoButton = true) {
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
        </div>
      </div>
    `;
  
    if (showAddButton) {
      col.querySelector('.add-to-album').addEventListener('click', () => {
        addToAlbum(character);
      });
    }

    if (showInfoButton) {
      col.querySelector('.view-data-figurina').addEventListener('click', () => {
        //funzione per vedere le altre info
        //cercare su chatgpt come formare questo modal con i dati presi dal db
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
  
    } catch (err) {
      console.error('Errore aggiunta all’album:', err);
    }
  }