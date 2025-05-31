
document.addEventListener('DOMContentLoaded', async () => {
    const user = await fetch('/getUser').then(res => res.json());
    caricaRichieste(user._id);
  });

    async function caricaRichieste(userId) {
      const container = document.getElementById('richieste-container');
      container.innerHTML = '';

      try {
        const res = await fetch(`/api/richieste/${userId}`);
        const richieste = await res.json();
        console.log(richieste);

        if (richieste.length === 0) {
          container.innerHTML = '<p>Nessuna richiesta di scambio al momento.</p>';
          return;
        }

        richieste.forEach(richiesta => {
        const div = document.createElement('div');
        div.classList.add('richiesta');

        // Mostra lo stato aggiornato come messaggio
        if (richiesta.stato !== 'in attesa') {
          div.innerHTML = `
            <p><strong>Scambio ${richiesta.stato}:</strong><br>${richiesta.testo}</p>
          `;
        } else {
          // Visualizzazione normale per richieste in attesa
          div.innerHTML = `
            <p><strong>${richiesta.mittente.username}</strong> ti offre 
              <span style="color: green;"><b>${richiesta.cartaOffera?.name}</b></span> 
              in cambio di 
              <span style="color: blue;"><b>${richiesta.cartaRichiesta?.name}</b></span>
            </p>
          `;

          const accettaBtn = document.createElement('button');
          accettaBtn.textContent = 'Accetta';
          accettaBtn.style.marginRight = '10px';
          accettaBtn.onclick = () => rispondiARichiesta(richiesta._id, true);

          const rifiutaBtn = document.createElement('button');
          rifiutaBtn.textContent = 'Rifiuta';
          rifiutaBtn.onclick = () => rispondiARichiesta(richiesta._id, false);

          div.appendChild(accettaBtn);
          div.appendChild(rifiutaBtn);
        }

        container.appendChild(div);
      });

      } catch (err) {
        console.error('Errore nel caricare le richieste:', err);
        container.innerHTML = '<p>Errore nel caricamento delle richieste.</p>';
      }
    }

    function rispondiARichiesta(idRichiesta, accettato) {
      fetch(`/api/richiesta/${idRichiesta}/rispondi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accettato })
      })
        .then(res => res.json())
        .then(data => {
          if (accettato) {
            // Dopo la conferma, esegue materialmente lo scambio
            fetch(`/api/scambio/${idRichiesta}`, {
              method: 'POST'
            })
              .then(res => res.json())
              .then(data => {
                alert(`Scambio completato: ${data.message}`);
                window.location.href = '/dashboard';
              })
              .catch(err => {
                console.error('Errore nello scambio:', err);
                alert('Errore durante lo scambio.');
              });
          } else {
            alert(data.message);
            window.location.href = '/album-duplicati';
          }
        })
        .catch(err => {
          console.error('Errore nella risposta alla richiesta:', err);
          alert('Errore nella gestione della richiesta.');
        });
    }

