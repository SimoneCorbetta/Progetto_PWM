let userId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const buyButton = document.getElementById('buy-package');
    await fetchCurrentUser();
    if (userId) {
        buyButton.addEventListener('click', buyPackage);
    }
});

const cardContainer = document.getElementById('card-container');
  
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
        const card = createCharacterCard(character, true, false);
        cardContainer.appendChild(card);
      });
    } catch (err) {
      console.error('Errore acquisto pacchetto:', err);
    }
  }

  document.getElementById('buy-package')?.addEventListener('click', buyPackage);
