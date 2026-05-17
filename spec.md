📋 SPECIFICA DI PROGETTO PER AGENT: "FIND VIOVVO"
=================================================

**Contesto e Obiettivo dell'Applicazione** Sviluppare un'applicazione web interamente client-side, concepita come un clone interattivo del gioco "Dov'è Waldo", rinominato per l'occasione "Find Viovvo". L'utente deve esplorare una mappa 2D ad alta risoluzione, effettuare pan e zoom e individuare un personaggio specifico (Viovvo) nascosto in mezzo a una folla di elementi di disturbo. La particolarità ingegneristica del progetto risiede nella **generazione procedurale della scena a ogni ricaricamento**. Non esistono mappe pre-renderizzate. Il sistema assembla la scena a runtime combinando uno sfondo statico, il bersaglio e decine di "distrattori" generati dinamicamente. Il gioco non richiede backend, database o sicurezza crittografica: l'intera logica di validazione spaziale avviene in memoria sul browser.

**Architettura di Sistema e Scelte Tecnologiche** Il progetto si basa su uno stack minimale per massimizzare le prestazioni di calcolo e rendering:

1.  **Ambiente:** Vite + Vanilla JavaScript. Nessun framework UI (come React o Vue) è tollerato, poiché il 90% dell'interazione avviene fuori dal DOM tradizionale, direttamente su Canvas.
    
2.  **Motore di Rendering:** HTML5 `<canvas>` utilizzato per il rendering off-screen. La composizione di centinaia di sprite avviene in memoria in un'unica passata. Il risultato statico viene poi proiettato in un canvas visibile.
    
3.  **Gestione Viewport:** La libreria esterna `panzoom` gestirà la traslazione e la scala tramite matrici CSS applicate al contenitore del Canvas. Questo delega il calcolo dei frame alla GPU, garantendo fluidità senza dover ridisegnare il canvas a ogni movimento del mouse.
    

**Il Motore Modulare "Paper Doll" (Gestione degli Asset)** I distrattori non sono immagini monolitiche. Per garantire estrema varianza visiva limitando il peso in download, il sistema utilizza un approccio modulare (Paper Doll). Tutti gli asset dei personaggi condividono una griglia di base rigorosa di `120x150 pixel`. I punti di ancoraggio anatomici (collo, occhi, attaccatura dei capelli) sono identici in tutti i file. Il motore assembrerà ogni distrattore sovrapponendo i livelli PNG trasparenti nel seguente e rigoroso ordine di Z-Index:

*   Livello 1: Corpo (Posa e vestiti)
    
*   Livello 2: Testa (Forma e tono della pelle)
    
*   Livello 3: Capelli
    
*   Livello 4: Accessori viso (Occhiali, barbe)
    
*   Livello 5: Copricapo (Cappelli, che si sovrappongono ai capelli)
    

Viovvo, il bersaglio, fa eccezione: è un singolo asset PNG statico pre-disegnato (es. `viovvo_classic.png`).

**Dettagli Implementativi e Logica di Composizione** L'agent dovrà organizzare la codebase in moduli specifici e fortemente coesi, seguendo questa esatta pipeline logica.

**Modulo Configurazione (`src/assetsConfig.js`)** Poiché non c'è un server in grado di leggere le directory, il sistema necessita di un manifest hardcoded che elenchi i nomi dei file presenti nella cartella `public/assets/`. Il file definirà anche le costanti spaziali: la mappa generata avrà una risoluzione nativa e invariabile di 2400x2400 pixel, mentre i componenti dei personaggi saranno di 120x150 pixel.

**Modulo Motore Grafico (`src/engine.js`)** Questo è il cuore dell'applicazione. All'avvio, il modulo esegue un caricamento asincrono parallelo (tramite `Promise.all`) di tutti gli asset definiti nel manifest. Terminato il caricamento di rete, istanzia un Canvas 2400x2400px in memoria e procede con il rendering sequenziale: Disegna lo sfondo. Genera una coordinata `(X,Y)` casuale per Viovvo, assicurandosi che non collida con i margini (0-2280 per X, 0-2250 per Y). Avvia il ciclo di disegno dei distrattori (es. 150 unità). Per ottenere un realistico effetto di occlusione parziale, disegna il primo 50% dei distrattori, successivamente disegna Viovvo, e infine conclude sovrascrivendo il restante 50% dei distrattori. Il modulo restituisce il Canvas fuso e un oggetto geometrico contenente il perimetro esatto (Bounding Box) in cui è stato posizionato Viovvo.

**Modulo Interazione e Mappatura (`src/interaction.js`)** Qui si gestisce la problematica matematica più critica del progetto: l'annullamento delle trasformazioni CSS. L'utente clicca su uno schermo che ha subito zoom e pan. Il modulo deve tradurre le coordinate del mouse relative alla viewport `(clientX, clientY)` nei pixel esatti del Canvas logico originale. La formula matematica da applicare rigorosamente è l'estrazione del bounding client rect del canvas nel DOM, la sottrazione degli offset, e la moltiplicazione per il rapporto di scala: `clickX = (clientX - rect.left) * (2400 / rect.width)` `clickY = (clientY - rect.top) * (2400 / rect.height)` Questa normalizzazione viene passata al modulo principale per la validazione spaziale.

**Modulo Orchestratore (`src/main.js`)** Governa il ciclo di vita e le macchine a stati del DOM (Loading, Playing, Victory). Avvia il boot, mostra il loader, ordina al motore la generazione, e appende il canvas risultante. Riceve dal modulo di interazione le coordinate normalizzate del click. Se il punto calcolato cade all'interno del Bounding Box geometrico di Viovvo, attiva l'interfaccia di vittoria. La pressione del tasto di rigenerazione deve forzare lo smontaggio dell'istanza di panzoom, lo svuotamento del contenitore DOM e una nuova esecuzione del modulo motore, il tutto senza ricaricare l'intera pagina web.

* * *

**Istruzioni Operative per il Coding Agent** Leggendo questa specifica, devi comportarti come un esecutore tecnico. Non prendere iniziative su framework alternativi e non alterare l'architettura procedurale. Procederemo scrivendo un modulo alla volta per garantire il corretto disaccoppiamento del codice. Attendi il mio prompt per iniziare con il setup dell'ambiente Vite e del manifest degli asset.