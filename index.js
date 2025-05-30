const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const ejs = require('ejs');
const http = require('http');
const PORT = 8080;

// Setări EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 
console.log("Calea folderului (__dirname):", __dirname);
console.log("Calea fișierului (__filename):", __filename);
console.log("Folderul curent de lucru (process.cwd()):", process.cwd());
// Servește fișiere statice din assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

//-------------------------------------------------------------------------------
// 20
const vect_foldere = ['temp','temp1']; // sau ['temp', 'temp1'] pentru testare

vect_foldere.forEach(folder => {
    const folderPath = path.join(__dirname, folder);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
        console.log(`Folder creat: ${folderPath}`);
    } else {
        console.log(`Folderul exista deja: ${folderPath}`);
    }
});

//-------------------------------------------------------------------------------
// IP si PAGINI
app.get(['/', '/index', '/home'], (req, res) => {
    res.render('pages/index', { 
        titlu: "Pagina Principală", 
        ip: req.ip.replace(/^.*:/, '') // Elimină prefixul IPv6 pentru adrese locale
    });
});

app.get(['/blog'], (req, res) => {
    res.render('pages/blog', { 
        titlu: "Blog", 
        ip: req.ip.replace(/^.*:/, '') // Elimină prefixul IPv6 pentru adrese locale
    });
});
//-------------------------------------------------------------------------------
// include path (no relative)
ejs.includer = (pathName, options) => {
    if (pathName.startsWith('/')) {
      // Remove leading slash and resolve relative to views dir
      const viewsDir = Array.isArray(options.settings.views)
        ? options.settings.views[0]
        : options.settings.views;
      pathName = path.join(viewsDir, pathName.slice(1));
    }
    return ejs.fileLoader(pathName, options);
  };

//-------------------------------------------------------------------------------
// Erori

let obGlobal = {
    obErori: null
};

function initErori() {
    try {
        const continutJson = fs.readFileSync(path.join(__dirname, 'errors.json'));
        const errorsJson = JSON.parse(continutJson);
        obGlobal.obErori = {
            cale_baza: errorsJson.cale_baza,
            eroare_default: {
                ...errorsJson.eroare_default,
                imagine: errorsJson.eroare_default.imagine ? path.join('/', errorsJson.cale_baza, errorsJson.eroare_default.imagine).replace(/\\/g, '/') : null
            },
            map_erori: errorsJson.info_erori.reduce((acc, err) => {
                acc[err.identificator] = {
                    ...err,
                    imagine: err.imagine ? path.join('/', errorsJson.cale_baza, err.imagine).replace(/\\/g, '/') : null
                };
                return acc;
            }, {})
        };
    } catch (err) {
        console.error("EROARE CRITICĂ la inițializarea erorilor:", err);
        obGlobal.obErori = {
            cale_baza: '/assets/imagini/erori/',
            eroare_default: { titlu: "Eroare Server", text: "Datele de eroare nu au putut fi încărcate.", imagine: null },
            map_erori: {}
        };
    }
}
initErori();

function afisareEroare(res, identificator) {
    const eroareConfig = obGlobal.obErori.map_erori[identificator] || obGlobal.obErori.eroare_default;
    res.status(identificator).render('pages/error', {
        titlu: eroareConfig.titlu,
        eroare: {
            titlu: eroareConfig.titlu,
            text: eroareConfig.text,
            imagine: eroareConfig.imagine,
            ip: eroareConfig.ip
        }
    });
}

//-------------------------------------------------------------------------------
// Ruta FAVICON
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'assets', 'ico', 'favicon.ico'));
});

//-------------------------------------------------------------------------------
app.listen(PORT, () => {
    console.log('Server domain: http://localhost:'+PORT);
});

app.get('/*splat', (req, res) => {
    const pagina = req.params.splat[0];
    if (!pagina) {
        return res.render('pages/index', function (eroare, rezultatRandare) {
            if (eroare) {
                if (eroare.message.startsWith("Failed to lookup view")) {
                    return afisareEroare(res, 404);
                } else {
                    console.error("Eroare la randare:", eroare);
                    return afisareEroare(res, 500); // TO ADD
                }
            }
            res.send(rezultatRandare);
        });
    }
    
        if(req.url.startsWith('/assets/')) {
            afisareEroare(res, 403);       
        } else if (req.url.endsWith('.ejs')) {
            afisareEroare(res, 400);
        } else {
            afisareEroare(res, 404); 
        }
    });

app.use((req, res, next) => {
    if (req.url.endsWith('.ejs')) {
        if (req.url.startsWith('/assets/')) {
            return afisareEroare(res, 403); 
        }
        return afisareEroare(res, 400);
    }
    next();
});

