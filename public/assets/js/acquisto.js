let userId = null;

/* Appena entro nella pagina per acquistare i pacchetti, identifico se l'utente
e' quello corrente, quindi chiamo la funzione fetchCurrentUser
e se l'utente e' autenticato puo' cliccare il pulsante per acquistare il pacchetto di figurine*/
document.addEventListener('DOMContentLoaded', async () => {
    const buyButton = document.getElementById('buy-package');
    await fetchCurrentUser();
    if (userId) {
        buyButton.addEventListener('click', buyPackage);
    }
});

const cardContainer = document.getElementById('card-container');
  /* funzione per l'acquisto del pacchetto in cui nel div cardContainer andra' a caricare
  le card (figurine) nel div*/
  async function buyPackage() {
    cardContainer.innerHTML = '';
  
    try {
      //res variabile che contiene il risultato della fetch sotto
      const res = await fetch('/api/buy-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      //se il risultato portato dal server non da un valore corretto
      //visualizzo errore con alert
      if (!res.ok) {
        const error = await res.json();
        alert(error.message || 'Errore durante l’acquisto del pacchetto.');
        return;
      }

      //invece se il res e' ok, salvo il contenuto nella variabile { characters }
      //e per ogni personaggio creo la card con la funzione createCharacterCard
      // per poi aggiungerla nel mio div cardContainer
      const { characters } = await res.json();
      characters.forEach(character => {
        const card = createCharacterCard(character, true, false, false);
        cardContainer.appendChild(card);
      });
    } catch (err) {
      console.error('Errore acquisto pacchetto:', err);
    }
  }
  
  document.getElementById('buy-package')?.addEventListener('click', buyPackage);
