//funzione per acquistare i crediti per acquistare i pacchetti di figurine
async function buyCredits(amount) {
    const username = prompt("Inserisci il tuo username:");
    if (!username) return alert("Username obbligatorio.");

    try {
        const response = await fetch('/buy-credits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, credits: amount }),
        });

        const message = await response.text();
        document.getElementById('feedback').innerText = message;
    } catch (error) {
        console.error(error);
        alert('Errore durante l\'acquisto dei crediti.');
    }
}
