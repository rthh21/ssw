// BONUSURI:
// 1. 
// 3.
// 4.
// 7.
// 6.
// 5. 
// 11.

// 13.
// 15.
// 18.
// 20 -> primele 5 si penultima 

// ETAPE:
// 0: 0.3
// 1: 0.85
// 2: 0.40
// 3: 0.45
// 4: 0.6
// 5: 1.15
// 6: 4.15 + 0.4



window.addEventListener('DOMContentLoaded', function() {
    const btnFiltreaza = document.getElementById('btn-filtreaza');
    const btnReseteaza = document.getElementById('btn-reseteaza');
    const btnSortAsc = document.getElementById('btn-sort-asc');
    const btnSortDesc = document.getElementById('btn-sort-desc');
    const btnCalculeaza = document.getElementById('btn-calculeaza');
    console.log('Calculate button found:', btnCalculeaza);
    
    const inpNume = document.getElementById('inp-nume');
    const inpDescriere = document.getElementById('inp-descriere');
    const inpPret = document.getElementById('inp-pret');
    const valPret = document.getElementById('val-pret');
    const inpCategorie = document.getElementById('inp-categorie');
    const inpCuloare = document.getElementById('inp-culoare');
    const inpNoutati = document.getElementById('inp-noutati');
    const inpMateriale = document.getElementById('inp-materiale');
    const inpMarime = document.getElementById('inp-marime');
    
    const produseContainer = document.getElementById('produse-container');
    const produse = Array.from(document.querySelectorAll('.produs'));

    // Seturi pentru a ține evidența stărilor produselor
    const produsePastrate = new Set();
    const produseAscunse = new Set(); // temporary hidden
    const produseSterse = new Set();

    // Încarcă stările salvate din sessionStorage
    function incarcaStariSalvate() {
        const pastrate = JSON.parse(sessionStorage.getItem('produsePastrate') || '[]');
        const sterse = JSON.parse(sessionStorage.getItem('produseSterse') || '[]');
        
        pastrate.forEach(id => produsePastrate.add(id));
        sterse.forEach(id => produseSterse.add(id));
        
        // Aplică stările salvate
        produse.forEach(produs => {
            const id = produs.dataset.produsId;
            if (produsePastrate.has(id)) {
                produs.classList.add('pastrat');
                const btn = produs.querySelector(`[data-action="pastrat"]`);
                if (btn) btn.classList.add('pastrat');
            }
            if (produseSterse.has(id)) {
                produs.style.display = 'none';
            }
        });
    }

    // Salvează stările în sessionStorage
    function salveazaStari() {
        sessionStorage.setItem('produsePastrate', JSON.stringify([...produsePastrate]));
        sessionStorage.setItem('produseSterse', JSON.stringify([...produseSterse]));
    }

    // Funcție pentru gestionarea acțiunilor butoanelor
    function gestioneazaActiuneProdus(e) {
        const buton = e.currentTarget;
        const action = buton.dataset.action;
        const produsId = buton.dataset.produsId;
        const produs = document.querySelector(`article[data-produs-id="${produsId}"]`);

        if (!produs) return;

        switch (action) {
            case 'pastrat':
                if (produsePastrate.has(produsId)) {
                    produsePastrate.delete(produsId);
                    produs.classList.remove('pastrat');
                    buton.classList.remove('pastrat');
                    aplicaFiltrare();
                } else {
                    produsePastrate.add(produsId);
                    produs.classList.add('pastrat');
                    buton.classList.add('pastrat');
                    produs.style.display = 'flex';
                }
                salveazaStari();
                break;
            case 'ascuns':
                produseAscunse.add(produsId);
                produs.classList.add('ascuns');
                buton.classList.add('ascuns');
                produs.style.display = 'none';
                break;
            case 'sterge':
                if (produseSterse.has(produsId)) {
                    produseSterse.delete(produsId);
                    produs.style.display = 'flex';
                    buton.classList.remove('sterge');
                    aplicaFiltrare();
                } else {
                    produseSterse.add(produsId);
                    produs.style.display = 'none';
                    buton.classList.add('sterge');
                }
                salveazaStari();
                break;
        }

        actualizeazaContorProduse();
        actualizeazaMesajProduse();
    }

    // Adaugă event listeners pentru butoanele de acțiune
    document.querySelectorAll('.buton-actiune').forEach(buton => {
        buton.addEventListener('click', gestioneazaActiuneProdus);
    });

    // Funcție pentru afișarea/ascunderea mesajului de lipsă produse
    function actualizeazaMesajProduse() {
        const produseVizibileCount = Array.from(produseContainer.querySelectorAll('.produs')).filter(p => p.style.display !== 'none').length;
        
        let mesajExistent = produseContainer.querySelector('.alert-warning');
        
        if (produseVizibileCount === 0) {
            if (!mesajExistent) {
                const mesaj = document.createElement('div');
                mesaj.className = 'alert alert-warning mesaj-filtrare';
                mesaj.innerHTML = `
                    <i class="bi bi-exclamation-triangle-fill"></i>
                    Nu există produse conform filtrării curente.
                `;
                const hasProductsInContainer = produseContainer.querySelector('.produs');
                if (hasProductsInContainer) {
                    produseContainer.innerHTML = ''; 
                }
                produseContainer.appendChild(mesaj);
            }
        } else {
            if (mesajExistent) {
                mesajExistent.remove();
            }
        }
    }

    // Funcție pentru actualizarea opțiunilor de categorie bazată pe produsele vizibile
    function actualizeazaCategoriiDisponibile() {
        if (!inpCategorie) return;
        
        // Salvează valoarea curentă selectată
        const valoareSelectata = inpCategorie.value;
        
        // Obține toate produsele vizibile
        const produseVizibile = produse.filter(p => p.style.display !== 'none');
        
        // Extrage categoriile unice din produsele vizibile și sortează-le
        const categoriiDisponibile = [...new Set(produseVizibile.map(p => p.dataset.categorie))]
            .filter(Boolean).sort();
        
        // Curăță opțiunile existente, păstrând doar "Oricare"
        inpCategorie.innerHTML = '<option value="toate" selected>Oricare</option>';
        
        // Adaugă noile opțiuni
        categoriiDisponibile.forEach(categorie => {
            const option = document.createElement('option');
            option.value = categorie;
            option.textContent = categorie.charAt(0).toUpperCase() + categorie.slice(1);
            inpCategorie.appendChild(option);
        });
        
        // Încearcă să restaurezi valoarea selectată anterior dacă este încă disponibilă
        if (valoareSelectata !== 'toate' && categoriiDisponibile.includes(valoareSelectata)) {
            inpCategorie.value = valoareSelectata;
        } else {
            inpCategorie.value = 'toate';
        }
    }

    // Funcție pentru actualizarea opțiunilor de materiale bazată pe produsele vizibile
    function actualizeazaMaterialeDisponibile() {
        if (!inpMateriale) return;
        
        // Salvează valorile curente selectate
        const valoriSelectate = Array.from(inpMateriale.selectedOptions).map(opt => opt.value);
        
        // Obține toate produsele vizibile
        const produseVizibile = produse.filter(p => p.style.display !== 'none');
        
        // Extrage materialele unice din produsele vizibile
        const materialeDisponibile = [...new Set(produseVizibile.flatMap(p => 
            p.dataset.materiale ? p.dataset.materiale.split(',').map(m => m.trim()) : []
        ))].filter(Boolean).sort();
        
        // Curăță opțiunile existente
        inpMateriale.innerHTML = '';
        
        // Adaugă noile opțiuni
        materialeDisponibile.forEach(material => {
            const option = document.createElement('option');
            option.value = material;
            option.textContent = material.charAt(0).toUpperCase() + material.slice(1);
            // Restaurează selecția dacă materialul era selectat anterior
            if (valoriSelectate.includes(material)) {
                option.selected = true;
            }
            inpMateriale.appendChild(option);
        });
    }

    // Funcție pentru actualizarea opțiunilor de mărime bazată pe produsele vizibile
    function actualizeazaMarimiDisponibile() {
        if (!inpMarime) return;
        
        // Salvează valoarea curentă selectată
        const valoareSelectata = inpMarime.value;
        
        // Obține toate produsele vizibile
        const produseVizibile = produse.filter(p => p.style.display !== 'none');
        
        // Extrage mărimile unice din produsele vizibile și sortează-le
        const marimiDisponibile = [...new Set(produseVizibile.map(p => p.dataset.marime))]
            .sort((a, b) => parseFloat(a) - parseFloat(b));
        
        // Curăță opțiunile existente, păstrând doar "Toate mărimile"
        inpMarime.innerHTML = '<option value="toate" selected>Toate mărimile</option>';
        
        // Adaugă noile opțiuni
        marimiDisponibile.forEach(marime => {
            const option = document.createElement('option');
            option.value = marime;
            option.textContent = `Mărime ${marime}`;
            inpMarime.appendChild(option);
        });
        
        // Încearcă să restaurezi valoarea selectată anterior dacă este încă disponibilă
        if (valoareSelectata !== 'toate' && marimiDisponibile.includes(valoareSelectata)) {
            inpMarime.value = valoareSelectata;
        } else {
            inpMarime.value = 'toate';
        }
    }

    // --- BONUS 1: Range Pret ---
    const preturi = produse.map(p => parseFloat(p.dataset.pret));
    if (preturi.length && inpPret) {
        inpPret.min = Math.min(...preturi);
        inpPret.max = Math.max(...preturi);
        inpPret.step = 1;
        inpPret.value = inpPret.max;
        const labelPret = document.querySelector('label[for="inp-pret"]');
        if (labelPret) {
            labelPret.innerHTML = `Preț (<span id='val-pret'>${inpPret.value}</span>) RON <small>(${inpPret.min} – ${inpPret.max} lei)</small>`;
        }
        inpPret.addEventListener('input', function() {
            const valPret = document.getElementById('val-pret');
            if (valPret) valPret.textContent = this.value;
        });
    }

    // --- BONUS 1: Radio Subcategorie ---
    const subcategorii = [...new Set(produse.map(p => p.dataset.subcategorie))];
    const radioGroup = document.querySelector('.radio-group .btn-group');
    if (radioGroup && subcategorii.length) {
        radioGroup.innerHTML = '';
        // Toate
        radioGroup.innerHTML += `
            <input type="radio" class="btn-check" name="subcategorie" id="subcat-toate" value="toate" autocomplete="off" checked>
            <label class="btn btn-outline-dark btn-lg rounded-pill text-dark" for="subcat-toate">Toate</label>
        `;
        subcategorii.forEach(subcat => {
            const id = `subcat-${subcat}`;
            radioGroup.innerHTML += `
                <input type="radio" class="btn-check" name="subcategorie" id="${id}" value="${subcat}" autocomplete="off">
                <label class="btn btn-outline-dark btn-lg rounded-pill text-dark" for="${id}">${subcat.charAt(0).toUpperCase() + subcat.slice(1)}</label>
            `;
        });
    }

    // --- BONUS 1: Datalist Culoare ---
    const culori = [...new Set(produse.map(p => p.dataset.culoare))].filter(Boolean);
    const datalistCulori = document.getElementById('culori');
    if (datalistCulori && culori.length) {
        datalistCulori.innerHTML = '';
        culori.forEach(culoare => {
            datalistCulori.innerHTML += `<option value="${culoare}"></option>`;
        });
    }

    // --- BONUS 1: Textarea Nume Produs ---
    if (inpNume) {
        const numeProduse = produse.map(p => p.dataset.nume);
        const maxLen = Math.max(...numeProduse.map(n => n.length));
        inpNume.setAttribute('maxlength', maxLen);
        // Exemplu: cel mai vândut produs (primul din listă)
        if (numeProduse.length) {
            inpNume.setAttribute('placeholder', `ex: ${numeProduse[0]}`);
        }
    }

    // --- BONUS 1: Input Descriere ---
    if (inpDescriere) {
        const descrieri = produse.map(p => p.dataset.descriere);
        const maxLen = Math.max(...descrieri.map(d => d.length));
        inpDescriere.setAttribute('maxlength', maxLen);
        // Exemplu pattern: fără cifre
        inpDescriere.setAttribute('pattern', '[^0-9]*');
        inpDescriere.setAttribute('title', 'Nu sunt permise cifre în descriere');
    }

    // --- BONUS 1: Checkbox Noutăți ---
    const inputNoutati = document.getElementById('inp-noutati');
    const labelNoutati = document.querySelector('label[for="inp-noutati"]');
    if (inputNoutati && labelNoutati) {
        // Data celui mai recent produs
        const dateProduse = produse.map(p => new Date(p.dataset.data_introdusa));
        const maxDate = new Date(Math.max(...dateProduse));
        const zi = String(maxDate.getDate()-1).padStart(2, '0');
        const luna = String(maxDate.getMonth() + 1).padStart(2, '0');
        const an = maxDate.getFullYear();
        labelNoutati.innerHTML = `Doar noutăți (adăugate după ${zi}.${luna}.${an})`;
    }

    // --- BONUS 1: Select Mărime ---
    const marimi = [...new Set(produse.map(p => p.dataset.marime))].sort((a, b) => parseFloat(a) - parseFloat(b));
    if (inpMarime && marimi.length) {
        marimi.forEach(marime => {
            const option = document.createElement('option');
            option.value = marime;
            option.textContent = `Mărime ${marime}`;
            inpMarime.appendChild(option);
        });
    }

    function valideazaInput(input) {
        if (input.id === 'inp-descriere' && /\d/.test(input.value)) {
            alert("Cuvântul cheie din descriere nu poate conține cifre.");
            input.classList.add('invalid');
            return false;
        }
        input.classList.remove('invalid');
        return true;
    }

    function faraDiacritice(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }

    function actualizeazaContorProduse() {
        const produseVizibile = produse.filter(p => 
            p.style.display !== 'none' && p.classList.contains('produs')
        );
        const contorProduse = document.getElementById('numar-produse');
        const mesaj = document.querySelector('.mesaj-filtrare');
        if (contorProduse) {
            contorProduse.textContent = (mesaj ? 0 : produseVizibile.length);
        }
    }

    // Funcție pentru aplicarea filtrelor
    function aplicaFiltrare() {
        produseAscunse.clear(); 
        const valNume = faraDiacritice(inpNume.value.trim());
        const valDescriere = faraDiacritice(inpDescriere.value.trim());
        const valPret = parseFloat(inpPret.value);
        const valCategorie = inpCategorie.value;
        const valSubcategorie = document.querySelector('input[name="subcategorie"]:checked').value;
        const valCuloare = faraDiacritice(inpCuloare.value.trim());
        const valNoutati = inpNoutati.checked;
        const dataNoutati = new Date('2025-01-01');
        const valMaterialeSelectate = Array.from(inpMateriale.selectedOptions).map(opt => opt.value);
        const valMarime = inpMarime.value;

        // Determine which products should be visible based on filters
        const produseFiltrate = produse.filter(produs => {
            const produsId = produs.dataset.produsId;

            if (produseSterse.has(produsId)) {
                return false;
            }
            if (produsePastrate.has(produsId)) {
                return true;
            }

            const numeProdus = faraDiacritice(produs.dataset.nume);
            const descriereProdus = faraDiacritice(produs.dataset.descriere);
            const pretProdus = parseFloat(produs.dataset.pret);
            const categorieProdus = produs.dataset.categorie;
            const subcategorieProdus = produs.dataset.subcategorie;
            const culoareProdus = faraDiacritice(produs.dataset.culoare);
            const dataProdus = new Date(produs.dataset.data_introdusa);
            const materialeProdus = produs.dataset.materiale ? produs.dataset.materiale.split(',').map(m => m.trim()) : [];
            const marimeProdus = produs.dataset.marime;

            let vizibil = true;
            if (valNume && !numeProdus.includes(valNume)) vizibil = false;
            if (valDescriere && !descriereProdus.includes(valDescriere)) vizibil = false;
            if (pretProdus > valPret) vizibil = false;
            if (valCategorie !== 'toate' && categorieProdus !== valCategorie) vizibil = false;
            if (valSubcategorie !== 'toate' && subcategorieProdus !== valSubcategorie) vizibil = false;
            if (valCuloare && culoareProdus !== valCuloare) vizibil = false;
            if (valNoutati && dataProdus <= dataNoutati) vizibil = false;
            if (valMarime !== 'toate' && marimeProdus !== valMarime) vizibil = false;
            if (valMaterialeSelectate.length > 0 && !valMaterialeSelectate.some(mat => materialeProdus.includes(mat))) {
                vizibil = false;
            }

            return vizibil;
        });

        produseContainer.innerHTML = '';
        produseFiltrate.forEach(p => {
            p.style.display = 'flex'; // Ensure it's visible if it's in the filtered set
            produseContainer.appendChild(p); // Add to container
        });

        produse.forEach(p => {
            if (!produseFiltrate.includes(p)) {
                p.style.display = 'none';
            }
        });

        actualizeazaMarimiDisponibile();
        actualizeazaMaterialeDisponibile();
        actualizeazaCategoriiDisponibile();
        actualizeazaMesajProduse();
        actualizeazaContorProduse();

        paginareInit();
    }

    // Adaugă clasa 'filtru' la toate elementele de filtrare
    [inpNume, inpDescriere, inpPret, inpCategorie, inpCuloare, inpNoutati, inpMateriale, inpMarime].forEach(el => {
        if (el) el.classList.add('filtru');
    });

    // Adaugă clasa 'filtru' la toate radio butoanele de subcategorie
    document.querySelectorAll('input[name="subcategorie"]').forEach(radio => {
        radio.classList.add('filtru');
    });

    // Adaugă event listeners pentru toate elementele de filtrare
    document.querySelectorAll('.filtru').forEach(el => {
        if (el.type === 'range') {
            el.addEventListener('input', aplicaFiltrare);
        } else {
            el.addEventListener('change', aplicaFiltrare);
        }
    });

    // Resetare filtre
    btnReseteaza.addEventListener('click', function() {
        produseAscunse.clear(); // Clear temporary hidden products on reset
        if (confirm("Sunteți sigur că doriți să resetați toate filtrele?")) {
            document.getElementById('filtre').querySelectorAll('input, select, textarea').forEach(el => {
                if (el.type === 'text' || el.type === 'textarea') el.value = '';
                if (el.type === 'range') el.value = el.max;
                if (el.tagName === 'SELECT' && !el.multiple) el.selectedIndex = 0;
                if (el.multiple) Array.from(el.options).forEach(opt => opt.selected = false);
                if (el.type === 'radio' && el.value === 'toate') el.checked = true;
                if (el.type === 'checkbox') el.checked = false;
            });
            
            valPret.textContent = inpPret.value;
            
            // Resetează doar produsele care nu sunt păstrate sau șterse
            produse.forEach(p => {
                const produsId = p.dataset.produsId;
                if (!produseSterse.has(produsId)) {
                    if (produsePastrate.has(produsId)) {
                        p.style.display = 'flex';
                    } else {
                        p.style.display = 'flex';
                        p.classList.remove('ascuns');
                        const btn = p.querySelector(`[data-action="ascuns"]`);
                        if (btn) btn.classList.remove('ascuns');
                    }
                }
            });
            
            produse.sort((a,b) => a.dataset.initialOrder - b.dataset.initialOrder);
            produse.forEach(p => produseContainer.appendChild(p));
            
            actualizeazaMarimiDisponibile();
            actualizeazaMaterialeDisponibile();
            actualizeazaCategoriiDisponibile();
            actualizeazaMesajProduse();
            actualizeazaContorProduse();
        }
    });

    // Încarcă stările salvate la încărcarea paginii
    incarcaStariSalvate();

    function sorteazaProduse(directie) {
        produse.sort((a, b) => {
            const numeA = a.dataset.nume;
            const numeB = b.dataset.nume;
            // const raportA = parseFloat(a.dataset.marime) / parseFloat(a.dataset.pret);
            const raportA = a.dataset.pret;
            const raportB = b.dataset.pret;

            let comparatieNume = numeA.localeCompare(numeB);
            if (directie === 'desc') comparatieNume *= -1;

            if (comparatieNume !== 0) return comparatieNume;
            
            let comparatieRaport = raportA - raportB;
            if (directie === 'desc') comparatieRaport *= -1;
            return comparatieRaport;
        });
        produse.forEach(p => produseContainer.appendChild(p));
    }

    btnSortAsc.addEventListener('click', () => sorteazaProduse('asc'));
    btnSortDesc.addEventListener('click', () => sorteazaProduse('desc'));

    btnCalculeaza.addEventListener('click', function() {
        console.log('Button clicked');
        const produseVizibile = produse.filter(p => p.style.display !== 'none');
        console.log('Visible products:', produseVizibile.length);
        if (produseVizibile.length === 0) {
            alert("Nu sunt produse afișate pentru a calcula media.");
            return;
        }
        const sumaPreturi = produseVizibile.reduce((acc, p) => {
            const pret = parseFloat(p.dataset.pret);
            console.log('Product price:', pret);
            return acc + pret;
        }, 0);
        console.log('Total sum:', sumaPreturi);
        const pretMediu = sumaPreturi / produseVizibile.length;
        console.log('Average price:', pretMediu);
        const divRezultat = document.createElement('div');
        divRezultat.className = 'rezultat-calcul';
        divRezultat.textContent = `Prețul mediu: ${pretMediu.toFixed(2)} RON`;
        console.log('Created popup element:', divRezultat);
        document.body.appendChild(divRezultat);
        console.log('Popup added to body');
        console.log('Computed style:', window.getComputedStyle(divRezultat));
        setTimeout(() => {
            document.body.removeChild(divRezultat);
            console.log('Popup removed');
        }, 2000);
    });

    // PAGINARE CLIENT
    const K = 6; // numar produse pe pagina
    let paginaCurenta = 1;
    function afiseazaPagina(pagina, produse) {
        const start = (pagina-1)*K;
        const end = pagina*K;
        produse.forEach((prod, idx) => {
            prod.style.display = (idx >= start && idx < end) ? 'flex' : 'none';
        });
    }
    
    function creeazaPaginare(produse) {
        const paginareContainer = document.getElementById('paginare-container');
        paginareContainer.innerHTML = '';
        const N = produse.length;
        const NRL = Math.ceil(N/K);
        if (NRL <= 1) return;
        for (let i=1; i<=NRL; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.className = 'btn btn-outline-primary mx-1 btn-paginare'+(i===paginaCurenta?' active':'');
            btn.addEventListener('click', () => {
                paginaCurenta = i;
                afiseazaPagina(paginaCurenta, produse);
                creeazaPaginare(produse);
            });
            paginareContainer.appendChild(btn);
        }
    }
    function paginareInit() {
        // Selectează toate produsele care nu sunt șterse
        const produseToate = Array.from(document.querySelectorAll('#produse-container .produs'));
        const produseActive = produseToate.filter(p => !produseSterse.has(p.dataset.produsId));
        if (paginaCurenta > Math.ceil(produseActive.length/K) || paginaCurenta < 1) paginaCurenta = 1;
        afiseazaPagina(paginaCurenta, produseActive);
        creeazaPaginare(produseActive);
    }
    // La incarcare initiala
    paginaCurenta = 1;
    paginareInit();

    // Integreaza cu filtrarea/sortarea/resetarea
    function aplicaFiltrareCuPaginare() {
        aplicaFiltrareOriginal && aplicaFiltrareOriginal();
        paginaCurenta = 1;
        paginareInit();
    }
    const aplicaFiltrareOriginal = window.aplicaFiltrare;
    window.aplicaFiltrare = aplicaFiltrareCuPaginare;
    function sorteazaProduseCuPaginare(dir) {
        sorteazaProduseOriginal && sorteazaProduseOriginal(dir);
        paginaCurenta = 1;
        paginareInit();
    }
    const sorteazaProduseOriginal = window.sorteazaProduse;
    window.sorteazaProduse = sorteazaProduseCuPaginare;
    if (btnReseteaza) {
        btnReseteaza.addEventListener('click', function() {
            setTimeout(function() {
                paginaCurenta = 1;
                paginareInit();
            }, 100);
        });
    }

    // === BONUS 11: Modal Box
    function getProdusData(article) {
        return {
            imagine: article.querySelector('img')?.src,
            nume: article.dataset.nume,
            descriere: article.dataset.descriere,
            pret: article.dataset.pret,
            categorie: article.dataset.categorie,
            subcategorie: article.dataset.subcategorie,
            marime: article.dataset.marime,
            culoare: article.dataset.culoare,
            data_introdusa: article.dataset.data_introdusa,
            editie_limitata: article.dataset.editie_limitata,
            materiale: article.dataset.materiale
        };
    }

    // Helper: format date
    function formatData(dataStr) {
        if (!dataStr) return '';
        const d = new Date(dataStr);
        return d.toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    function showModalProdus(article) {
        const data = getProdusData(article);
        // Calculate if product is new (last 60 days)
        let esteNou = false;
        if (data.data_introdusa) {
            const dataIntrodusa = new Date(data.data_introdusa);
            const intervalNouZile = window.intervalNouZile || 60;
            esteNou = (new Date() - dataIntrodusa) <= intervalNouZile*24*60*60*1000;
        }
        const modal = document.getElementById('modal-produs');
        const body = modal.querySelector('.modal-body');
        body.innerHTML = `
            <div class="modal-card">
                ${data.imagine ? `<img src="${data.imagine}" alt="${data.nume}">` : ''}
                <h2>${data.nume} ${esteNou ? '<span class="badge-nou" style="margin-left:0.5em;">NOU</span>' : ''}</h2>
                <p class="modal-subcat"><span>${data.categorie}</span> &ndash; <span>${data.subcategorie}</span></p>
                <p class="modal-pret">Preț: <strong>${data.pret} RON</strong></p>
                <p class="modal-descriere">${data.descriere}</p>
                <ul>
                    <li><strong>Mărime</strong> ${data.marime}</li>
                    <li><strong>Materiale</strong> ${data.materiale}</li>
                    <li><strong>Adăugat</strong> ${formatData(data.data_introdusa)}</li>
                    <li><strong>Ediție limitată</strong> ${data.editie_limitata === 'true' ? 'Da' : 'Nu'}</li>
                    <li><strong>Culoare</strong> ${data.culoare}</li>
                </ul>
            </div>
        `;
        // Remove any previous compare button
        const modalContent = modal.querySelector('.modal-content');
        let oldBtn = modalContent.querySelector('.compara-btn-container-modal-static');
        if (oldBtn) oldBtn.remove();
        // Add the compare button at the bottom of modal-content
        const btnContainer = document.createElement('div');
        btnContainer.className = 'compara-btn-container-modal-static';
        btnContainer.style.width = '100%';
        btnContainer.innerHTML = `<button class="btn btn-compara-custom btn-compara" data-produs-id="${article.dataset.produsId}">Compară</button>`;
        modalContent.appendChild(btnContainer);
        addComparaBtnAnimations();
        // Attach compare click handler to the modal's compare button
        const btnCompara = btnContainer.querySelector('.btn-compara');
        if (btnCompara) {
            btnCompara.addEventListener('click', handleComparaClick);
        }
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        addComparaTooltip();
    }

    // Hide modal
    function hideModalProdus() {
        const modal = document.getElementById('modal-produs');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Event listeners for modal
    const modal = document.getElementById('modal-produs');
    modal.querySelector('.modal-close').addEventListener('click', hideModalProdus);
    modal.querySelector('.modal-overlay').addEventListener('click', hideModalProdus);
    document.addEventListener('keydown', function(e) {
        if (modal.classList.contains('active') && (e.key === 'Escape' || e.key === 'Esc')) {
            hideModalProdus();
        }
    });

    produse.forEach(produs => {
        produs.addEventListener('click', function(e) {
            // Prevent if click is on a button inside the product or on the 'Compară' button
            if (e.target.closest('.buton-actiune') || e.target.classList.contains('btn-compara')) return;
            showModalProdus(produs);
        });
    });

    // === BONUS 11: Modal Box for homepage new products ===
    if (window.location.pathname === '/' || window.location.pathname === '/index' || window.location.pathname === '/home') {
        document.querySelectorAll('.produs-nou-card').forEach(card => {
            card.addEventListener('click', function(e) {
                e.preventDefault();
                const produsId = card.getAttribute('data-produs-id');
                // Find product data from DOM (if available) or from card
                const nume = card.querySelector('.card-title span')?.textContent || '';
                const descriere = card.querySelector('.card-text')?.textContent || '';
                const pret = card.querySelector('strong')?.textContent?.replace('RON','').trim() || '';
                const imagine = card.querySelector('img')?.src || '';
                const isNew = card.getAttribute('data-new') === 'true';
                // Build modal HTML
                let modal = document.getElementById('modal-produs-home');
                if (!modal) {
                    modal = document.createElement('div');
                    modal.id = 'modal-produs-home';
                    modal.innerHTML = `
                        <div class="modal-overlay"></div>
                        <div class="modal-content">
                            <button class="modal-close" aria-label="Închide">&times;</button>
                            <div class="modal-body"></div>
                        </div>
                    `;
                    document.body.appendChild(modal);
                }
                const body = modal.querySelector('.modal-body');
                body.innerHTML = `
                    <div class="modal-card" style="text-align:center;">
                        ${imagine ? `<img src="${imagine}" alt="${nume}" style="max-width:220px;max-height:220px;border-radius:1em;box-shadow:0 2px 16px 0 rgba(0,0,0,.18);">` : ''}
                        <h2 style="font-family:'Bebas Neue',sans-serif;font-size:2em;color:var(--text-color,#292929);margin-bottom:0.2em;">${nume}
                            ${isNew ? '<span class="badge-nou" style="margin-left:0.5em;">NOU</span>' : ''}
                        </h2>
                        <p style="font-size:1.2em;font-weight:700;color:var(--secondary-color,#ff7878);margin-bottom:0.5em;">Preț: ${pret} RON</p>
                        <p style="margin-bottom:0.7em;">${descriere}</p>
                    </div>
                `;
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
                // Close modal logic
                modal.querySelector('.modal-close').onclick = () => {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                };
                modal.querySelector('.modal-overlay').onclick = () => {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                };
                document.addEventListener('keydown', function escListener(e) {
                    if (modal.classList.contains('active') && (e.key === 'Escape' || e.key === 'Esc')) {
                        modal.classList.remove('active');
                        document.body.style.overflow = '';
                        document.removeEventListener('keydown', escListener);
                    }
                });
            });
        });
    }

    // === Open modal if hash matches a product on load or hashchange ===
    function openModalFromHash() {
        if (window.location.hash.startsWith('#artc-')) {
            const id = window.location.hash.replace('#artc-', '');
            const article = document.querySelector(`article[data-produs-id="${id}"]`);
            if (article) {
                showModalProdus(article);
            }
        }
    }
    window.addEventListener('hashchange', openModalFromHash);
    openModalFromHash();

    // Add hover and click animation to all .btn-compara
    function addComparaBtnAnimations() {
        document.querySelectorAll('.btn-compara').forEach(btn => {
            btn.onmouseenter = function() {
                btn.style.transform = 'scale(1.08)';
                btn.style.transition = 'transform 0.15s';
            };
            btn.onmouseleave = function() {
                btn.style.transform = '';
            };
            btn.onmousedown = function() {
                btn.style.transform = 'scale(0.95)';
            };
            btn.onmouseup = function() {
                btn.style.transform = 'scale(1.08)';
            };
        });
    }
    addComparaBtnAnimations();

    function addComparaListeners() {
        document.querySelectorAll('.btn-compara').forEach(btn => {
            btn.removeEventListener('click', handleComparaClick);
            btn.addEventListener('click', handleComparaClick);
        });
    }

    // === COMPARARE ===
    function showContainerComparare() {
        let container = document.getElementById('container-comparare');
        const produseComparate = JSON.parse(localStorage.getItem('produseComparate') || '[]');
        if (!produseComparate.length) {
            if (container) container.remove();
            return;
        }
        if (!container) {
            container = document.createElement('div');
            container.id = 'container-comparare';
            container.style.position = 'fixed';
            container.style.bottom = '2em';
            container.style.right = '2em';
            container.style.zIndex = '99999';
            container.style.background = 'var(--secondary-color, #ff7878)';
            container.style.color = 'var(--background-color, #ffd1bc)';
            container.style.padding = '1.2em 2em';
            container.style.borderRadius = '1.5em';
            container.style.boxShadow = '0 4px 24px 0 rgba(0,0,0,0.18)';
            container.style.fontWeight = 'bold';
            container.style.fontSize = '1.1em';
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.gap = '1em';
            document.body.appendChild(container);
        }
        let html = '<span>Compari:</span>' + produseComparate.map((prod, idx) =>
            `<span class="produs-comparat" style="margin-right:0.5em;display:inline-flex;align-items:center;gap:0.2em;">
                <span>${prod.nume}</span>
                <button class="sterge-produs-comparat" data-idx="${idx}" style="background:transparent;border:none;color:inherit;font-size:1.2em;cursor:pointer;line-height:1;">&times;</button>
            </span>`
        ).join('');
        if (produseComparate.length === 2) {
            html += '<button id="btn-afiseaza-comparare" class="btn btn-compara-custom btn-compara" style="margin-left:1em;">afișează</button>';
        }
        html += '<button id="inchide-comparare" style="margin-left:1em;background:transparent;border:none;color:inherit;font-size:1.2em;cursor:pointer;">&times;</button>';
        container.innerHTML = html;
        // Stergere individuala
        container.querySelectorAll('.sterge-produs-comparat').forEach(btn => {
            btn.onclick = function() {
                const idx = parseInt(this.getAttribute('data-idx'));
                let produse = JSON.parse(localStorage.getItem('produseComparate') || '[]');
                produse.splice(idx, 1);
                localStorage.setItem('produseComparate', JSON.stringify(produse));
                localStorage.setItem('produsComparatLastClick', Date.now().toString());
                showContainerComparare();
                enableComparaButtons();
            };
        });
        // Inchide tot containerul
        container.querySelector('#inchide-comparare').onclick = function() {
            localStorage.removeItem('produseComparate');
            localStorage.removeItem('produsComparatLastClick');
            container.remove();
            enableComparaButtons();
        };
        // Buton afiseaza
        setTimeout(function() {
            const btnAfiseaza = container.querySelector('#btn-afiseaza-comparare');
            if (btnAfiseaza) {
                btnAfiseaza.onclick = function(e) {
                    e.stopPropagation();
                    afiseazaModalComparare();
                };
            }
        }, 0);
        container.style.display = 'flex';
    }

    function handleComparaClick(e) {
        e.stopPropagation();
        const btn = e.currentTarget;
        const produsId = btn.getAttribute('data-produs-id');
        let produs = document.querySelector(`article[data-produs-id="${produsId}"]`);
        let numeProdus = '';
        if (produs) {
            numeProdus = produs.dataset.nume;
        } else {
            const modal = document.getElementById('modal-produs');
            const h2 = modal?.querySelector('.modal-body h2');
            if (h2) numeProdus = h2.textContent.trim();
        }
        let produseComparate = JSON.parse(localStorage.getItem('produseComparate') || '[]');
        // Nu adauga daca deja exista sau sunt 2
        if (produseComparate.find(p => p.id === produsId) || produseComparate.length >= 2) return;
        produseComparate.push({ id: produsId, nume: numeProdus });
        localStorage.setItem('produseComparate', JSON.stringify(produseComparate));
        localStorage.setItem('produsComparatLastClick', Date.now().toString());
        showContainerComparare();
        enableComparaButtons();
    }

    function enableComparaButtons() {
        let produseComparate = JSON.parse(localStorage.getItem('produseComparate') || '[]');
        document.querySelectorAll('.btn-compara').forEach(btn => {
            const produsId = btn.getAttribute('data-produs-id');
            if (
                produseComparate.length >= 2 &&
                !produseComparate.find(p => p.id === produsId)
            ) {
                btn.disabled = true;
                btn.classList.add('disabled');
            } else {
                btn.disabled = false;
                btn.classList.remove('disabled');
            }
        });
    }

    // Show container if already selected (on load)
    function tryShowComparareOnLoad() {
        const produseComparate = JSON.parse(localStorage.getItem('produseComparate') || '[]');
        const lastClick = parseInt(localStorage.getItem('produsComparatLastClick'), 10);
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (produseComparate.length && lastClick && (now - lastClick < oneDay)) {
            showContainerComparare();
            enableComparaButtons();
        } else {
            // If expired, clear
            localStorage.removeItem('produseComparate');
            localStorage.removeItem('produsComparatLastClick');
            const container = document.getElementById('container-comparare');
            if (container) container.remove();
            enableComparaButtons();
        }
    }

    // Auto-hide comparare container after 24h of inactivity
    function setupComparareAutoHide() {
        setInterval(() => {
            const lastClick = parseInt(localStorage.getItem('produsComparatLastClick'), 10);
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            if (lastClick && (now - lastClick >= oneDay)) {
                localStorage.removeItem('produseComparate');
                localStorage.removeItem('produsComparatLastClick');
                const container = document.getElementById('container-comparare');
                if (container) container.remove();
                enableComparaButtons();
            }
        }, 60 * 1000); // check every minute
    }

    function isProductPage() {
        return document.getElementById('produse-container') || document.getElementById('modal-produs');
    }

    if (isProductPage()) {
        tryShowComparareOnLoad();
        addComparaListeners();
        enableComparaButtons();
        setupComparareAutoHide();
    }


    // Modal de comparare
    function afiseazaModalComparare() {
        let modal = document.getElementById('modal-comparare');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-comparare';
            modal.innerHTML = `
                <div class="modal-overlay"></div>
                <div class="modal-content" style="max-width:800px;background:#fff;color:#222;padding:2em 2em 1em 2em;border-radius:1.5em;box-shadow:0 4px 32px 0 rgba(0,0,0,0.18);position:relative;">
                    <button class="modal-close" aria-label="Închide" style="position:absolute;top:1em;right:1em;font-size:2em;background:transparent;border:none;cursor:pointer;">&times;</button>
                    <div class="modal-body"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        const produseComparate = JSON.parse(localStorage.getItem('produseComparate') || '[]');
        if (produseComparate.length !== 2) return;
        // Găsește datele produselor din DOM
        const prod1 = document.querySelector(`article[data-produs-id="${produseComparate[0].id}"]`);
        const prod2 = document.querySelector(`article[data-produs-id="${produseComparate[1].id}"]`);
        if (!prod1 || !prod2) return;
        const data1 = getProdusData(prod1);
        const data2 = getProdusData(prod2);
        // Construiește tabelul de comparație
        const caracteristici = [
            { label: 'Nume', key: 'nume' },
            { label: 'Preț', key: 'pret' },
            { label: 'Categorie', key: 'categorie' },
            { label: 'Subcategorie', key: 'subcategorie' },
            { label: 'Mărime', key: 'marime' },
            { label: 'Materiale', key: 'materiale' },
            { label: 'Culoare', key: 'culoare' },
            { label: 'Ediție limitată', key: 'editie_limitata' },
            { label: 'Adăugat', key: 'data_introdusa' },
            { label: 'Descriere', key: 'descriere' }
        ];
        let table = `<table style="width:100%;border-collapse:collapse;text-align:left;">
            <thead><tr><th style="border-bottom:2px solid #ff7878;"></th><th style="border-bottom:2px solid #ff7878;">${data1.nume}</th><th style="border-bottom:2px solid #ff7878;">${data2.nume}</th></tr></thead><tbody>`;
        caracteristici.forEach(carac => {
            table += `<tr><td style="font-weight:bold;padding:0.4em 0.5em;">${carac.label}</td><td style="padding:0.4em 0.5em;">${data1[carac.key] || ''}</td><td style="padding:0.4em 0.5em;">${data2[carac.key] || ''}</td></tr>`;
        });
        table += '</tbody></table>';
        modal.querySelector('.modal-body').innerHTML = table;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Închidere modal
        modal.querySelector('.modal-close').onclick = () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        };
        modal.querySelector('.modal-overlay').onclick = () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        };
        document.addEventListener('keydown', function escListener(e) {
            if (modal.classList.contains('active') && (e.key === 'Escape' || e.key === 'Esc')) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
                document.removeEventListener('keydown', escListener);
            }
        });
    }

    // Asigură-te că tooltipul este activ după fiecare update
    addComparaTooltip();
    const oldAplicaFiltrare2 = window.aplicaFiltrare;
    window.aplicaFiltrare = function() {
        if (oldAplicaFiltrare2) oldAplicaFiltrare2();
        addComparaListeners();
        enableComparaButtons();
        addComparaBtnAnimations();
        addComparaTooltip();
    };
    const oldSorteazaProduse2 = window.sorteazaProduse;
    window.sorteazaProduse = function(dir) {
        if (oldSorteazaProduse2) oldSorteazaProduse2(dir);
        addComparaListeners();
        enableComparaButtons();
        addComparaBtnAnimations();
        addComparaTooltip();
    };
    if (isProductPage()) {
        tryShowComparareOnLoad();
        addComparaListeners();
        enableComparaButtons();
        setupComparareAutoHide();
        addComparaTooltip();
    }
}); 