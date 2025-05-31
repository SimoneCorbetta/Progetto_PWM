const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const axios = require('axios');

const app = express();
const port = 3000;

function getFromHarryPotter() {
  const hpApiUrl = 'https://hp-api.onrender.com/api/characters';
  return fetch(hpApiUrl)
    .then(response => response.json())
    .then(data => {
      const selected = [];
      const usedIndices = new Set();
      while (selected.length < 5 && usedIndices.size < data.length) {
        const index = getRandomInt(0, data.length - 1);
        if (!usedIndices.has(index)) {
          usedIndices.add(index);
          selected.push({
            id: index,
            name: data[index].name,
            species: data[index].species,
            house: data[index].house,
            image: data[index].image,
            gender: data[index].gender,
            eyeColour: data[index].eyeColour,
            hairColour: data[index].hairColour,
            actor: data[index].actor
          });
        }
      }
      return selected;
    })
    .catch(error => console.log('Errore nel recupero dati da HP API:', error));
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// MongoDB connection
mongoose.connect('mongodb+srv://corbetta:1234@pwm.ttn8fle.mongodb.net/PWM')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String },
  house_p: {
    type: String,
    enum: ['Gryffindor', 'Slytherin', 'Hufflepuff', 'Ravenclaw'],
    required: true
  },
  credits: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema, 'users');

const albumSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mainAlbum: [{ id: Number, name: String, house: String, image: String, species: String, gender: String, eyeColour: String, hairColour: String, actor: String}],
  duplicatesAlbum: [{ id: Number, name: String, house: String, image: String, species: String, gender: String, eyeColour: String, hairColour: String, actor: String}]
});
const Album = mongoose.model('Album', albumSchema, 'albums');


const messaggioSchema = new mongoose.Schema({
  mittente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  destinatario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tipo: { type: String, enum: ['scambio', 'testo'], required: true }, // per messaggi futuri
  testo: { type: String, default: ''},
  cartaOfferta: Object, // struttura della carta offerta
  cartaRichiesta: Object, // struttura della carta richiesta
  stato: { type: String, enum: ['in attesa', 'accettato', 'rifiutato', 'inviato'], default: 'in attesa' },
  data: { type: Date, default: Date.now }
});
const Messaggi = mongoose.model('Messaggi', messaggioSchema, 'ExchangeRequests');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let currentUser = null;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/getUser', async (req, res) => {
  if (!currentUser) return res.status(401).send('Non autorizzato');
  const user = await User.findOne({ username: currentUser });
  if (!user) return res.status(404).send('Utente non trovato');
  res.json(user);
});

app.post('/register', async (req, res) => {
  const { username, password, email, house_p } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, email, house_p });
    await newUser.save();
    currentUser = username;
    res.redirect('/dashboard');
  } catch (err) {
    res.status(500).send('Errore durante la registrazione: ' + err.message);
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
      currentUser = username;
      res.redirect('/dashboard');
    } else {
      res.status(401).send('Credenziali non valide.');
    }
  } catch (err) {
    res.status(500).send('Errore durante l\'accesso: ' + err.message);
  }
});

app.get('/dashboard', (req, res) => {
  if (!currentUser) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/edit', (req, res) => {
  if (!currentUser) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'public', 'edit.html'));
});

app.put('/update', async (req, res) => {
  if (!currentUser) return res.status(401).send('Non autorizzato');
  const { username, password, email, house_p } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.updateOne({ username: currentUser }, { username, password: hashedPassword, email, house_p });
    currentUser = username;
    res.send('Utente aggiornato con successo');
  } catch (err) {
    res.status(500).send('Errore durante l\'aggiornamento');
  }
});

app.delete('/delete', async (req, res) => {
  if (!currentUser) return res.status(401).send('Non autorizzato');
  try {
    await User.deleteOne({ username: currentUser });
    currentUser = null;
    res.send('Utente eliminato con successo');
  } catch (err) {
    res.status(500).send('Errore durante l\'eliminazione');
  }
});

app.get('/get-credits', async (req, res) => {
  try {
    const user = await User.findOne({ username: currentUser });
    if (!user) return res.status(404).send({ error: 'Utente non trovato' });
    res.send({ credits: user.credits });
  } catch (err) {
    res.status(500).send({ error: 'Errore del server' });
  }
});

app.post('/buy-credits', async (req, res) => {
  const { username, credits } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).send('Utente non trovato.');
    user.credits += credits;
    await user.save();
    res.status(200).send(`Crediti aggiunti con successo. Totale crediti: ${user.credits}`);
  } catch (err) {
    res.status(500).send('Errore durante l\'acquisto dei crediti.');
  }
});

app.post('/api/buy-package', async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send('Utente non trovato');

    if (user.credits > 0) {
      user.credits -= 1;
      await user.save();

      // Controlla se l'album esiste
    let album = await Album.findOne({ owner: userId });

    // Se non esiste, crealo
    if (!album) {
      album = new Album({
        owner: userId,
        mainAlbum: [],
        duplicatesAlbum: []
      });
      await album.save();
      console.log('Album creato per il nuovo utente.');
    }
    
      const characters = await getFromHarryPotter();
      res.status(200).json({ characters, credits: user.credits });
    } else {
      res.status(400).json({ message: 'Crediti insufficienti!' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Errore durante l\'acquisto del pacchetto.' });
  }
});


app.get('/album/:idUtente', async (req, res) => {
  try {
    const album = await Album.findOne({ owner: req.params.idUtente });
    if (!album) {
      return res.status(404).json({ error: 'Album non trovato' });
    }
    res.json(album.mainAlbum); // Questo ora è array di stringhe
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

app.get('/album/:idUtente/doppioni', async (req, res) => {
  try {
    const album = await Album.findOne({ owner: req.params.idUtente });
    if (!album) {
      return res.status(404).json({ error: 'Album non trovato' });
    }
    res.json(album.duplicatesAlbum); // Anche questo è array di stringhe
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});


// Aggiungi una carta all'album
app.post('/api/album/add', async (req, res) => {
  const { userId, character } = req.body;

  try {
    const album = await Album.findOne({ owner: userId });
    if (!album) {
      return res.status(404).json({ error: 'Album non trovato' });
    }

    // Controlla se la carta è già nel mainAlbum
    const inMain = album.mainAlbum.some(c => c.id === character.id);
    const inDuplicates = album.duplicatesAlbum.some(c => c.id === character.id);

    if (inMain) {
      if (!inDuplicates) {
        album.duplicatesAlbum.push(character);
        await album.save();
        return res.json({ message: 'Aggiunto ai doppioni' });
      } else {
        return res.json({ message: 'Già presente nei doppioni' });
      }
    }

    album.mainAlbum.push(character);
    await album.save();
    res.json({ message: 'Personaggio aggiunto all’album principale' });

  } catch (error) {
    console.error('Errore durante l’aggiunta all’album:', error);
    res.status(500).json({ error: 'Errore del server' });
  }
});
//rotta ripetuta eliminare successivamente
app.get('/album/:userId/main', async (req, res) => {
  const { userId } = req.params;

  try {
    const album = await Album.findOne({ owner: userId });

    if (!album) {
      return res.status(404).json({ error: 'Album non trovato per questo utente.' });
    }

    res.status(200).json({ mainAlbum: album.mainAlbum });
  } catch (err) {
    console.error('Errore nel recuperare il mainAlbum:', err);
    res.status(500).json({ error: 'Errore del server.' });
  }
});


// Rotta per l'Album Principale
app.get('/album-principale', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'AlbumPrincipale.html'));
});

// Rotta per l'Album Duplicati
app.get('/album-duplicati', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'AlbumDoppioni.html'));
});



//rotte per lo scambio
app.get('/scegli-carta', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'scegli-carta.html'));
});

app.get('/scambi/:idUtente/altre-doppioni', async (req, res) => {
  const { idUtente } = req.params;

  try {
    // Trova tutti gli album tranne quello dell'utente corrente
    const altriAlbum = await Album.find({ owner: { $ne: idUtente } });

    const tutteLeCarte = [];
    for (const album of altriAlbum) {
      album.duplicatesAlbum.forEach(carta => {
        tutteLeCarte.push({
          ...carta.toObject(),
          owner: album.owner.toString() // aggiungi info proprietario
        });
      });
    }

    res.json(tutteLeCarte);
  } catch (err) {
    res.status(500).json({ error: 'Errore durante il recupero dei doppioni' });
  }
});

app.post('/api/scambio/:id', async (req, res) => {
  try {
    const richiesta = await Messaggi.findById(req.params.id)
      .populate('mittente')
      .populate('destinatario')
      .populate('cartaOfferta')
      .populate('cartaRichiesta');

    if (!richiesta || richiesta.stato !== 'accettato') {
      return res.status(400).json({ error: 'Scambio non valido o non accettato.' });
    }

    const userA = richiesta.mittente;
    const userB = richiesta.destinatario;
    const albumA = await Album.findOne({ owner: userA.id });
    const albumB = await Album.findOne({ owner: userB.id });

    if (!albumA || !albumB) {
      return res.status(404).json({ error: 'Uno degli album non esiste' });
    }

    // Verifica che le carte siano effettivamente nei rispettivi album dei doppioni
    const hasCardAinDuplicates = albumA.duplicatesAlbum.some(c => c.id === cardA.id);
    const hasCardBinDuplicates = albumB.duplicatesAlbum.some(c => c.id === cardB.id);

    if (!hasCardAinDuplicates || !hasCardBinDuplicates) {
      return res.status(400).json({ error: 'Una delle carte non è nei doppioni' });
    }

    // Verifica che la carta A non sia già nel mainAlbum di B e viceversa
    const cardAInBMain = albumB.mainAlbum.some(c => c.id === cardA.id);
    const cardBInAMain = albumA.mainAlbum.some(c => c.id === cardB.id);

    if (cardAInBMain || cardBInAMain) {
      return res.status(400).json({ error: 'Una delle carte è già nel mainAlbum del ricevente' });
    }

    // Rimuovi carte dai doppioni
    albumA.duplicatesAlbum = albumA.duplicatesAlbum.filter(c => c.id !== cardA.id);
    albumB.duplicatesAlbum = albumB.duplicatesAlbum.filter(c => c.id !== cardB.id);

    // Aggiungi carte ai rispettivi mainAlbum
    albumB.mainAlbum.push(cardA);
    albumA.mainAlbum.push(cardB);

    await albumA.save();
    await albumB.save();

    res.status(200).json({ message: 'Scambio eseguito con successo!' });
  } catch (err) {
    console.error('Errore durante lo scambio:', err);
    res.status(500).json({ error: 'Errore del server durante lo scambio' });
  }
});

app.get('/character/:id', async (req, res) => {
  const characterId = parseInt(req.params.id);

  try {
    const album = await Album.findOne({
      $or: [
        { 'mainAlbum.id': characterId },
        { 'duplicatesAlbum.id': characterId }
      ]
    });

    if (!album) return res.status(404).json({ message: 'Personaggio non trovato' });

    // Cerca nella mainAlbum o duplicatesAlbum
    const character = album.mainAlbum.find(c => c.id === characterId) || 
                      album.duplicatesAlbum.find(c => c.id === characterId);

    res.json(character);
  } catch (err) {
    res.status(500).json({ message: 'Errore server', error: err });
  }
});

app.get('/messaggi', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'messaggi.html'));
});

//rotte per lo scambio dei messaggi per lo scambio
app.post('/api/richiesta-scambio', async (req, res) => {
  const { userAId, userBId, cardA, cardB } = req.body;

  try {
    const nuovoMessaggio = new Messaggi({
      mittente: userAId,
      destinatario: userBId,
      tipo: 'scambio',
      testo: '',
      cartaOfferta: cardA,
      cartaRichiesta: cardB,
      stato: 'in attesa'
    });

    await nuovoMessaggio.save();

    res.status(200).json({ message: 'Richiesta di scambio inviata con successo!' });
  } catch (err) {
    console.error('Errore durante la creazione della richiesta di scambio:', err);
    res.status(500).json({ error: 'Errore del server nel salvataggio della richiesta' });
  }
});



app.get('/api/richieste/:userId', async (req, res) => {
  try {
    if(Messaggi.tipo == 'scambio'){
      richieste = await Messaggi.find({ destinatario: req.params.userId, stato: 'in attesa' })
        .populate('mittente', 'username');
    }else{
      richieste = await Messaggi.find({ destinatario: req.params.userId, stato: 'rifiutato' || 'accettato' });
    }

    res.status(200).json(richieste);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore durante il recupero delle richieste.' });
  }
});

app.post('/api/richiesta/:id/rispondi', async (req, res) => {
  const { accettato } = req.body;

  try {
    const richiesta = await Messaggi.findById(req.params.id)
      .populate('mittente')
      .populate('destinatario')
      .populate('cartaOfferta')
      .populate('cartaRichiesta');

    if (!richiesta) {
      return res.status(404).json({ error: 'Richiesta non trovata' });
    }

    const stato = accettato ? 'accettato' : 'rifiutato';
    const testo = `Ciao, ho ${stato} la tua proposta di scambio del ${new Date().toLocaleString('it-IT')}.`;

    // ⚠️ Salviamo i riferimenti originali prima di sovrascrivere
    const originaleMittente = richiesta.mittente;
    const originaleDestinatario = richiesta.destinatario;

    // Trasformazione messaggio
    richiesta.tipo = 'testo';
    richiesta.testo = testo;
    richiesta.stato = stato;
    richiesta.cartaOffera = undefined;
    richiesta.cartaRichiesta = undefined;

    // ⚡ Inverti mittente/destinatario
    richiesta.mittente = originaleDestinatario._id;
    richiesta.destinatario = originaleMittente._id;

    await richiesta.save();

    res.status(200).json({ message: `Richiesta ${stato}. Messaggio trasformato e inviato al richiedente.` });
  } catch (err) {
    console.error('Errore nella gestione della risposta:', err);
    res.status(500).json({ error: 'Errore durante la risposta alla richiesta.' });
  }
});



app.listen(port, () => console.log(`Server in ascolto su http://localhost:${port}`));
