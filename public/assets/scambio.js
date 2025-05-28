
document.addEventListener('DOMContentLoaded', async () => {
    const user = await fetch('/getUser').then(res => res.json());
    caricaCartePerScambio(user._id);
  });
  

async function caricaCartePerScambio(userId) {
    try {
      const res = await fetch(`/scambi/${userId}/altre-doppioni`);
      if (!res.ok) throw new Error('Errore nella risposta del server');
  
      const carte = await res.json();
  
      carte.forEach(carta => {
        const card = createCharacterCard(carta, false);
  
        const scambiaBtn = document.createElement('button');
        scambiaBtn.textContent = 'Conferma scambio';
  
        scambiaBtn.addEventListener('click', () => {
          confermaScambio(userId, carta.owner, carta); // anche ID del proprietario della carta
        });
  
        card.appendChild(scambiaBtn);
        document.getElementById('offerte-container').appendChild(card);
      });
  
    } catch (err) {
      console.error('Errore nel caricamento delle carte da altri utenti:', err);
    }
  }
  
  
  function confermaScambio(userAId, userBId, cartaRichiesta) {
    const cartaProposta = JSON.parse(localStorage.getItem('cartaProposta'));
    if (!cartaProposta) {
      alert('Devi prima selezionare una carta da proporre per lo scambio!');
      return;
    }
  
    fetch('/api/scambia', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userAId,           // utente loggato
        userBId,           // proprietario della carta richiesta
        cardA: cartaProposta,
        cardB: cartaRichiesta
      })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore durante lo scambio');
      alert(data.message);
      localStorage.removeItem('cartaProposta');
      window.location.href = '/album-duplicati';
    })
    .catch(err => {
      console.error('Errore nello scambio:', err);
      alert('Scambio fallito: ' + err.message);
      window.location.href = '/dashboard';
    });
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
  