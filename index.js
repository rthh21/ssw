const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 8080;

// Setări EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Afisare path
console.log('Calea folderului (__dirname):', __dirname);
console.log('Calea fișierului (__filename):', __filename);
console.log('Folderul curent de lucru (process.cwd()):', process.cwd());

// Servește fișiere statice din assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

//-------------------------------------------------------------------------------
// IP
app.get(['/', '/index', '/home'], (req, res) => {
    res.render('pages/index', { titlu: "Pagina Principală", ip: req.ip });
});

//-------------------------------------------------------------------------------
// Erori

let obGlobal = {
    obErori: null
};

function initErori() {
    const continutJson = fs.readFileSync(path.join(__dirname, 'errors.json')).toString("utf-8");
    obGlobal.obErori = JSON.parse(continutJson);

    const caleBaza = obGlobal.obErori.cale_baza;
    obGlobal.obErori.eroare_default.imagine = path.join(caleBaza, obGlobal.obErori.eroare_default.imagine);
    for (let eroare of obGlobal.obErori.info_erori) {
        eroare.imagine = path.join(caleBaza, eroare.imagine);
    }
    console.log("Incarcat: errors.json");
}

initErori();

function afisareEroare(res, identificator, titlu, text, imagine) {
    let eroareGasita = null;
    let codStatus = 200;
    
    if (identificator) {
         eroareGasita = obGlobal.obErori.info_erori.find(e => e.identificator === identificator);
    }

    if (eroareGasita) {
        titlu = titlu || eroareGasita.titlu;
        text = text || eroareGasita.text;
        imagine = imagine || eroareGasita.imagine;
        if (eroareGasita.status) {
             codStatus = identificator; 
        }
    } else {
        const errDef = obGlobal.obErori.eroare_default;
        titlu = titlu || errDef.titlu;
        text = text || errDef.text;
        imagine = imagine || errDef.imagine;
    }

     if (!res.headersSent) { 
        res.status(codStatus).render("pages/error", {
            titlu: titlu,
            text: text,
            imagine: imagine,
            ip: res.req.ip 
        });
     }
}

// Blochează accesul la fișiere .ejs
app.get('/*:fisier.ejs', (req, res) => {
    afisareEroare(res, 400);
});

// Blochează accesul la directoare din assets
app.get('/assets/*cale', (req, res, next) => {
    if (req.url.endsWith('/')) {
        afisareEroare(res, 403); 
    } else {
        next(); 
    }
});

//-------------------------------------------------------------------------------
// Ruta FAVICON
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'assets', 'logo', 'favicon.ico'), (err) => {
        if (err) {
            console.error("Favicon nu a putut fi trimis:", err);
            res.status(err.status || 500).end();
        }
    });
});

//-------------------------------------------------------------------------------
// Ruta generală pentru orice pagină (ULTIMA!)
app.get('/:page(*)', (req, res) => {
    const numePagina = req.params.page; 
    res.render(`pages/${numePagina}`, {ip: req.ip}, function(err, html) { 
        if (err) {
            console.error("Eroare randare! -> ", err); 
            if (err.message.startsWith("Failed to lookup view")) {
                afisareEroare(res, 404); 
            } else {
                afisareEroare(res); 
            }
        } else {
            res.send(html);
        }
    });
});

//-------------------------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
