
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
        const card = createCharacterCard(carta);
  
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

  function createCharacterCard(character) {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';
  
    col.innerHTML = `
      <div class="card h-100" data-id="${character.id}">
        <img src="${character.image || 'https://us.123rf.com/450wm/tatkrav/tatkrav2201/tatkrav220100080/180401676-icona-della-siluetta-della-persona-forma-nera-personaggio-anonimo-profilo-utente-design-semplice.jpg?ver=6://www.google.com/url?sa=i&url=https%3A%2F%2Fit.123rf.com%2Fphoto_75444212_simbolo-del-web-dell-utente-simbolo-semplice-icona-sulla-priorit%25C3%25A0-bassa.html&psig=AOvVaw0JVn1XJyuyT0l5vtFb0cCd&ust=1748521100038000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCPjzye-Sxo0DFQAAAAAdAAAAABAE'}" class="card-img-top">
        <div class="card-body">
          <h5 class="card-title">${character.name}</h5>
          <p class="card-text">${character.house || 'Nessuna casata'}</p>
        </div>
      </div>
    `;
  
    return col;
  }
  