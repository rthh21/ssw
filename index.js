const express = require('express');
const sass = require('sass');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');
const app = express();
const ejs = require('ejs');
const http = require('http');
const fsp = require('fs/promises');
const PORT = 8080;
const pool = require('./scripts/db.js');

// Setări EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 
console.log("Calea folderului (__dirname):", __dirname);
console.log("Calea fișierului (__filename):", __filename);
console.log("Folderul curent de lucru (process.cwd()):", process.cwd());
// Servește fișiere statice din assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

//-------------------------------------------------------------------------------

// 20 Adaugare etapa 4 pentru 5
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
// In your routes
// Replace your current routes
app.get(['/', '/index', '/home'], async (req, res) => {
    const galerie = await getImaginiGalerie(req.query.ora); // Fix: Pass query parameter
    res.render('pages/index', {
      titlu: "Pagina Principală",
      galerie: galerie,
      ip: req.ip.replace(/^.*:/, '')
    });
  });
  
  app.get('/galerie', async (req, res) => {
    const galerie = await getImaginiGalerie(req.query.ora); // Fix: Pass query parameter  
    res.render('pages/galerie', {
      titlu: "Galerie",
      galerie: galerie,
      ip: req.ip.replace(/^.*:/, '')
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

// Ruta pentru afișarea listei de adidași, cu filtrare și sortare
app.get('/adidasi', async (req, res) => {
    try {
        // Extrage filtrele din query-ul URL-ului
        const { nume, descriere, pret_max, categorie, subcategorie, culoare, noutati, materiale } = req.query;

        // Construim query-ul SQL dinamic, adăugând coloane calculate pentru sortare naturală
        let query = "SELECT * from adidasi";
        // let query = "SELECT *, substring(nume from '^[^0-9]+') as text_part, (regexp_matches(nume, '[0-9]+'))[1]::integer as num_part FROM adidasi WHERE 1=1";
        let params = [];
        let idx = 1;

        // Adaugă filtru pentru nume (căutare case-insensitive după prefix)
        if (nume) {
            query += ` AND LOWER(nume) LIKE $${idx++}`;
            params.push(nume.toLowerCase() + '%');
        }
        // Adaugă filtru pentru descriere (căutare case-insensitive)
        if (descriere) {
            // Validare server-side
            if (/\d/.test(descriere)) {
                return afisareEroare(res, 400, "Cerere invalidă", "Cuvântul cheie din descriere nu poate conține cifre.");
            }
            query += ` AND LOWER(descriere) LIKE $${idx++}`;
            params.push('%' + descriere.toLowerCase() + '%');
        }
        // Filtru pentru preț maxim
        if (pret_max) {
            query += ` AND pret <= $${idx++}`;
            params.push(parseFloat(pret_max));
        }
        // Adaugă filtru pentru categorie
        if (categorie && categorie !== 'toate') {
            query += ` AND categorie_mare = $${idx++}`;
            params.push(categorie);
        }
        // Adaugă filtru pentru subcategorie
        if (subcategorie && subcategorie !== 'toate') {
            query += ` AND subcategorie = $${idx++}`;
            params.push(subcategorie);
        }
        // Adaugă filtru pentru culoare
        if (culoare) {
            query += ` AND culoare = $${idx++}`;
            params.push(culoare.toLowerCase());
        }
        // Filtru pentru noutăți (adăugate după o anumită dată)
        if (noutati) {
            query += ` AND data_introdusa > '2025-01-01'`;
        }
        // Filtru pentru materiale (verifică dacă array-ul de materiale din DB conține unul dintre materialele selectate)
        if (materiale && materiale.length > 0) {
            // Asigură-te că 'materiale' este un array
            const materialeArray = Array.isArray(materiale) ? materiale : [materiale];
            if (materialeArray.length > 0) {
                query += ` AND materiale && $${idx++}`; // Operatorul && verifică dacă există elemente comune între array-uri (OR)
                params.push(materialeArray);
            }
        }

        // Adaugă logica de sortare
        if (req.query.sort === 'asc') {
            query += " ORDER BY text_part ASC, num_part ASC NULLS FIRST";
        } else if (req.query.sort === 'desc') {
            query += " ORDER BY text_part DESC, num_part DESC NULLS LAST";
        }

        // Execută query-ul final pentru a obține produsele filtrate și sortate
        console.log('Executing query:', query);
        console.log('With parameters:', params);
        const result = await pool.query(query, params);
        console.log('Number of products found:', result.rows.length);
        const adidasi = result.rows;

        // Extrage toate categoriile posibile din ENUM pentru a popula meniul de filtrare
        const categoriiQuery = "SELECT unnest(enum_range(NULL::categorie_mare)) AS categ";
        const categorii = (await pool.query(categoriiQuery)).rows.map(o => o.categ);
        
        // Randează pagina EJS și îi trimite datele necesare
        res.render('pages/adidasi', { 
            titlu: "Adidasi", 
            adidasi, // Lista de produse
            categorii, // Lista de categorii pentru meniu
            query: req.query, // Trimite query-ul pentru a repopula filtrele
            ip: req.ip.replace(/^.*:/, '') // Elimină prefixul IPv6 pentru adrese locale
        });

    } catch (err) {
        console.error("Eroare la ruta /adidasi:", err);
        afisareEroare(res, 500, "Eroare server", "A apărut o problemă la încărcarea produselor.");
    }
});

// Ruta pentru afișarea unui singur produs, pe baza ID-ului
app.get('/adidas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'SELECT * FROM adidasi WHERE id=$1';
        const adidas = (await pool.query(query, [id])).rows[0];

        // Dacă nu se găsește niciun produs cu acest ID, trimite eroare 404
        if (!adidas) {
            return afisareEroare(res, 404);
        }

        // Randează pagina pentru un singur produs
        res.render('pages/adidas', { 
            titlu: adidas.nume, // Titlu dinamic pentru pagină
            adidas 
        });
        
    } catch (err) {
        console.error(`Eroare la ruta /adidas/${req.params.id}:`, err);
        afisareEroare(res, 500);
    }
});

// // Galerie route should be here, before the catch-all route
// function getImaginiGalerie(oraParam = null) {
//     const galerieRaw = fs.readFileSync("./galerie.json");
//     const galerieJson = JSON.parse(galerieRaw);

//     // Use provided hour or current hour - CONVERT TO NUMBER
//     const now = new Date();
//     const oraCurenta = oraParam !== null ? parseInt(oraParam, 10) : now.getHours();

//     // Filter images based on current hour and time intervals
//     let imaginiFiltrate = galerieJson.imagini.filter(img => {
//         if (!img.intervale_ore || !Array.isArray(img.intervale_ore)) {
//             return false;
//         }

//         return img.intervale_ore.some(interval => {
//             const [start, end] = interval;
//             return start <= oraCurenta && oraCurenta <= end;
//         });
//     });

//     return {
//         cale_galerie: galerieJson.cale_galerie,
//         imagini: imaginiFiltrate,
//         oraAfisata: oraCurenta
//     };
// }



//-------------------------------------------------------------------------------
// ERRORS
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

// ETAPA 5
//galerie:


async function getImaginiGalerie(oraParam = null) {
    const galerieRaw = fs.readFileSync("./galerie.json");
    const galerieJson = JSON.parse(galerieRaw);
    
    const now = new Date();
    const oraCurenta = oraParam !== null ? parseInt(oraParam, 10) : now.getHours();
    
    console.log(`Current hour: ${oraCurenta}, from param: ${oraParam}`); // Debug log
    
    let imaginiFiltrate = galerieJson.imagini.filter(img => {
      if (!img.intervale_ore || !Array.isArray(img.intervale_ore)) {
        return false;
      }
      const matches = img.intervale_ore.some(interval => {
        const [start, end] = interval;
        return start <= oraCurenta && oraCurenta <= end;
      });
      
      console.log(`Image ${img.cale_relativa}: intervals ${JSON.stringify(img.intervale_ore)}, matches: ${matches}`);
      
      return matches;
    });
    
    // Generate responsive images
    for (const img of imaginiFiltrate) {
      const fullImagePath = path.join(galerieJson.cale_galerie, img.cale_relativa);
      await generateResponsiveImages(fullImagePath);
    }
    
    // Truncate to even number for zig-zag pattern
    const evenCount = Math.floor(imaginiFiltrate.length / 2) * 2;
    imaginiFiltrate = imaginiFiltrate.slice(0, evenCount);
    
    console.log(`Filtered ${imaginiFiltrate.length} images`);
    
    return {
      cale_galerie: galerieJson.cale_galerie,
      cale_galerie_mediu: galerieJson.cale_galerie_mediu || 'Galerie-medium/',
      cale_galerie_mic: galerieJson.cale_galerie_mic || 'Galerie-small/',
      imagini: imaginiFiltrate,
      oraAfisata: oraCurenta
    };
  }
  
  async function generateResponsiveImages(imagePath, sizes = { medium: 400, small: 250 }) {
    const inputPath = path.join(__dirname, 'assets', imagePath);
    
    if (!fs.existsSync(inputPath)) {
      console.error(`Input file does not exist: ${inputPath}`);
      return;
    }
    
    const filename = path.parse(imagePath).name;
    const ext = path.parse(imagePath).ext;
    
    for (const [size, width] of Object.entries(sizes)) {
      const outputDir = path.join(__dirname, 'assets', `Galerie-${size}`);
      const outputPath = path.join(outputDir, `${filename}${ext}`);
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      if (fs.existsSync(outputPath)) {
        continue; // Skip if already exists
      }
      
      try {
        await sharp(inputPath)
          .resize({ width, height: width, fit: 'cover' })
          .jpeg({ quality: 85 })
          .toFile(outputPath);
        
        console.log(`Generated ${size} image: ${path.basename(outputPath)}`);
      } catch (error) {
        console.error(`Error processing ${size} image for ${imagePath}:`, error.message);
      }
    }
  }
  
  
  

// COMPILARE SCSS 

global.folderScss = path.join(__dirname, 'assets', 'style-scss');
global.folderCss = path.join(__dirname, 'assets', 'style-css');

function createFolders() {
    const folders = [
        global.folderScss,
        global.folderCss,
        path.join(__dirname, 'temp'),
        path.join(__dirname, 'backup'),
    ];
    
    folders.forEach(folder => {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
    }); 
    
    // Verificare creere fisiere
    folders.forEach(folder => {
      try {
        fs.mkdirSync(folder, { recursive: true });
        console.log(`Folder creat sau existent: ${folder}`);
      } catch (err) {
        console.error(`Eroare la crearea folderului ${folder}:`, err);
      }
    });
}
createFolders();

// COMPILARE SASS
function compileazaScss(caleScss, caleCss) {
    // Determinarea căii absolute pentru SCSS
    const timestamp = Date.now();
    
    let inputPath;
    if (path.isAbsolute(caleScss)) {
        inputPath = caleScss;
    } else {
        inputPath = path.join(global.folderScss, caleScss);
    }
    
    // Determinarea căii pentru CSS
    let outputPath;
    if (!caleCss || caleCss === '') {
        const baseName = path.basename(inputPath, '.scss');
        outputPath = path.join(global.folderCss, baseName + '.css');
    } else if (path.isAbsolute(caleCss)) {
        outputPath = caleCss;
    } else {
        outputPath = path.join(global.folderCss, caleCss);
    }
    
    // Salvare în backup înainte de compilare
    if (fs.existsSync(outputPath)) {
        const backupDir = path.join(__dirname, 'backup', 'assets', 'style-css');
        // AICI modifici:
        const numeFisier = path.basename(outputPath, '.css');
        const extensie = path.extname(outputPath);
        const backupPath = path.join(backupDir, `${numeFisier}_${timestamp}${extensie}`);
    
        try {
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
    
            fs.copyFileSync(outputPath, backupPath);
            console.log(`Backup creat pentru: ${path.basename(backupPath)}`);
        } catch (error) {
            console.error(`Eroare la copierea fișierului CSS în backup: ${error.message}`);
        }
    }
    
    try {
        // Compilarea SCSS cu includePaths pentru Bootstrap
        const result = sass.compile(inputPath, {
            includePaths: [
                path.join(__dirname, 'node_modules'),
                path.join(__dirname, 'assets', 'style-scss')
            ],
            style: 'compressed',
            silenceDeprecations: ['import'] // Silențiază warning-urile pentru @import
        });
        
        // Crearea directorului de output dacă nu există
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Salvarea fișierului CSS compilat
        fs.writeFileSync(outputPath, result.css);
        console.log(`Compilat cu succes: ${path.basename(inputPath)} -> ${path.basename(outputPath)}`);
        
        return outputPath;
    } catch (error) {
        console.error(`Eroare la compilarea SCSS: ${error.message}`);
        throw error;
    }
}


function compilareInitiala() {
    console.log('Începe compilarea inițială a fișierelor SCSS...');
    
    try {
        // Citirea tuturor fișierelor SCSS din folderul style-scss
        const fisiere = fs.readdirSync(global.folderScss);
        const fisiereScss = fisiere.filter(fisier => fisier.endsWith('.scss'));
        
        if (fisiereScss.length === 0) {
            console.log('Nu au fost găsite fișiere SCSS pentru compilare în assets/style-scss/');
            return;
        }
        
        console.log(`Găsite ${fisiereScss.length} fișiere SCSS: ${fisiereScss.join(', ')}`);
        
        fisiereScss.forEach(fisier => {
            const caleFisier = path.join(global.folderScss, fisier);
            
            try {
                compileazaScss(caleFisier);
            } catch (error) {
                console.error(`Eroare la compilarea fișierului ${fisier}: ${error.message}`);
            }
        });
        
        console.log(`Compilarea inițială completă pentru folderul assets/style-scss/`);
    } catch (error) {
        console.error(`Eroare la citirea folderului SCSS: ${error.message}`);
    }
}

function monitorizareScss() {
    console.log(`Monitorizarea folderului SCSS: ${global.folderScss}`);
    
    if (!fs.existsSync(global.folderScss)) {
        console.error('Folderul assets/style-scss nu există!');
        return;
    }
    
    const watcher = fs.watch(global.folderScss, { recursive: false }, (eventType, filename) => {
        if (!filename || !filename.endsWith('.scss')) {
            return;
        }
        
        const caleFisier = path.join(global.folderScss, filename);
        
        if (!fs.existsSync(caleFisier)) {
            return;
        }
        
        console.log(`Detectată modificare în style-scss: ${filename} (${eventType})`);
        
        setTimeout(() => {
            try {
                compileazaScss(caleFisier);
            } catch (error) {
                console.error(`Eroare la compilarea automată a ${filename}: ${error.message}`);
            }
        }, 100);
    });
    
    watcher.on('error', (error) => {
        console.error(`Eroare la monitorizarea folderului style-scss: ${error.message}`);
    });
    
    return watcher;
}

// Funcție de inițializare adaptată la structura ta
async function initializeScssCompiler() {
    console.log('Inițializare sistem compilare SCSS pentru proiectul SSW...');
    console.log(`Folder SCSS: ${global.folderScss}`);
    console.log(`Folder CSS: ${global.folderCss}`);
    
    // Crearea folderelor necesare
    createFolders();
    
    // Compilarea inițială a fișierelor existente
    compilareInitiala();
    
    // Pornirea monitorizării pentru modificări viitoare
    const watcher = monitorizareScss();
    
    // Gestionarea închiderii aplicației
    process.on('SIGINT', () => {
        console.log('Închidere sistem compilare SCSS...');
        if (watcher) {
            watcher.close();
        }
        process.exit(0);
    });
    
    console.log('Sistem compilare SCSS inițializat cu succes!');
}

// Export pentru utilizare în aplicația principală
module.exports = {
    compileazaScss,
    initializeScssCompiler,
    compilareInitiala,
    monitorizareScss
};
// În fișierul principal al aplicației (ex: app.js, server.js)
// La pornirea serverului
initializeScssCompiler();


//-------------------------------------------------------------------------------
app.listen(PORT, () => {
    console.log('Server domain: http://localhost:'+PORT);
});



