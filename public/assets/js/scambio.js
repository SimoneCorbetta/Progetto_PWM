//appena viene aperta la pagina, in cui vengono visualizzate le carte doppione degli altri utenti, tolto quello loggato in quel momento,
//viene svolto sempre il controllo sull'utente e poi viene chiamata la funzione caricaCartePerScambio
document.addEventListener('DOMContentLoaded', async () => {
    const user = await fetch('/getUser').then(res => res.json());
    caricaCartePerScambio(user._id);
  });
  
//funzione per il caricamento delle carte doppioni degli altri utenti, diversi dall'utente loggato
async function caricaCartePerScambio(userId) {
    try {
      // Recupera il mainAlbum del tuo utente (userId è il tuo ID)
      const mainAlbumRes = await fetch(`/album/${userId}/main`);
      const data = await mainAlbumRes.json();
      const showCardPossesso = data.mainAlbum.map(card => card.id); 

      const res = await fetch(`/scambi/${userId}/altre-doppioni`);
      if (!res.ok) throw new Error('Errore nella risposta del server');
  
      const carte = await res.json();
  
      carte.forEach(carta => {
        const card = createCharacterCard(carta, showCardPossesso);

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
  
  //funzione per confermare che voglio scambiare la mia cartaProposta, che era stata salvata nel localStorage
  //con la cartaRichiesta dell'utente con id=userBId  
  function confermaScambio(userAId, userBId, cartaRichiesta) {
  const cartaProposta = JSON.parse(localStorage.getItem('cartaProposta'));
  if (!cartaProposta) {
    alert('Devi prima selezionare una carta da proporre per lo scambio!');
    return;
  }

  //fetch per inviare questa richiesta di scambio all'utenteB
  fetch('/api/richiesta-scambio', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userAId,
      userBId,
      cardA: cartaProposta,
      cardB: cartaRichiesta
    })
  })
  .then(async res => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Errore durante l’invio della richiesta');
    alert(data.message);
    localStorage.removeItem('cartaProposta');
    window.location.href = '/dashboard';
  })
  .catch(err => {
    console.error('Errore nella richiesta di scambio:', err);
    alert('Invio della richiesta fallito: ' + err.message);
    window.location.href = '/dashboard';
  });
}

  //funzione per creare la carta del persinaggio che verra' visualizzata sulla pagina scegli-carta
  function createCharacterCard(character, showCardPossesso = []) {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';


    const isOwned = showCardPossesso.includes(character.id);
    const nameWithMark = isOwned ? `${character.name} *` : character.name;
  
    col.innerHTML = `
      <div class="card h-100" data-id="${character.id}">
        <img src="${character.image || 'https://us.123rf.com/450wm/tatkrav/tatkrav2201/tatkrav220100080/180401676-icona-della-siluetta-della-persona-forma-nera-personaggio-anonimo-profilo-utente-design-semplice.jpg?ver=6://www.google.com/url?sa=i&url=https%3A%2F%2Fit.123rf.com%2Fphoto_75444212_simbolo-del-web-dell-utente-simbolo-semplice-icona-sulla-priorit%25C3%25A0-bassa.html&psig=AOvVaw0JVn1XJyuyT0l5vtFb0cCd&ust=1748521100038000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCPjzye-Sxo0DFQAAAAAdAAAAABAE'}" class="card-img-top">
        <div class="card-body">
          <h5 class="card-title">${nameWithMark}</h5>
          <p class="card-text">${character.house || 'Nessuna casata'}</p>
        </div>
      </div>
    `;
  
    return col;
  }
  