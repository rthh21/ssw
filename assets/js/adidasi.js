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

    // Funcție pentru afișarea/ascunderea mesajului de lipsă produse
    function actualizeazaMesajProduse() {
        const produseVizibile = produse.filter(p => p.style.display !== 'none');
        
        // Verifică dacă există un mesaj deja
        let mesajExistent = produseContainer.querySelector('.alert-warning');
        
        if (produseVizibile.length === 0) {
            // Dacă nu există produse vizibile și nu există deja un mesaj, creează-l
            if (!mesajExistent) {
                const mesaj = document.createElement('div');
                mesaj.className = 'alert alert-warning mesaj-filtrare';
                mesaj.innerHTML = `
                    <i class="bi bi-exclamation-triangle-fill"></i>
                    Nu există produse conform filtrării curente.
                `;
                produseContainer.innerHTML = ''; // Curăță containerul
                produseContainer.appendChild(mesaj);
            }
        } else {
            // Dacă există produse vizibile și există un mesaj, șterge-l
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

    // Funcție pentru eliminarea diacriticelor
    function faraDiacritice(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }

    // Funcție pentru aplicarea filtrelor
    function aplicaFiltrare() {
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

        produse.forEach(produs => {
            const numeProdus = faraDiacritice(produs.dataset.nume);
            const descriereProdus = faraDiacritice(produs.dataset.descriere);
            const pretProdus = parseFloat(produs.dataset.pret);
            const categorieProdus = produs.dataset.categorie;
            const subcategorieProdus = produs.dataset.subcategorie;
            const culoareProdus = faraDiacritice(produs.dataset.culoare);
            const dataProdus = new Date(produs.dataset.data_introdusa);
            const materialeProdus = produs.dataset.materiale.split(',');
            const marimeProdus = produs.dataset.marime;

            let vizibil = true;

            // Căutare fără diacritice pentru nume și descriere
            if (valNume && !numeProdus.includes(valNume)) vizibil = false;
            if (valDescriere && !descriereProdus.includes(valDescriere)) vizibil = false;
            if (pretProdus > valPret) vizibil = false;
            if (valCategorie !== 'toate' && categorieProdus !== valCategorie) vizibil = false;
            if (valSubcategorie !== 'toate' && subcategorieProdus !== valSubcategorie) vizibil = false;
            if (valCuloare && culoareProdus !== valCuloare) vizibil = false;
            if (valNoutati && dataProdus < dataNoutati) vizibil = false;
            if (valMarime !== 'toate' && marimeProdus !== valMarime) vizibil = false;
            if (valMaterialeSelectate.length > 0 && !valMaterialeSelectate.some(mat => materialeProdus.includes(mat))) {
                vizibil = false;
            }
            
            produs.style.display = vizibil ? 'flex' : 'none';
        });

        // Actualizează toate filtrele disponibile după aplicarea filtrelor
        actualizeazaMarimiDisponibile();
        actualizeazaMaterialeDisponibile();
        actualizeazaCategoriiDisponibile();
        actualizeazaMesajProduse();
    }

    // Adaugă clasa 'filtru' la toate elementele de filtrare
    [inpNume, inpDescriere, inpPret, inpCategorie, inpCuloare, inpNoutati, inpMateriale, inpMarime].forEach(el => {
        if (el) el.classList.add('filtru');
    });

    // Adaugă clasa 'filtru' la toate radio butoanele de subcategorie
    document.querySelectorAll('input[name="subcategorie"]').forEach(radio => {
        radio.classList.add('filtru');
    });

    // Adaugă event listener pentru change pe toate elementele cu clasa 'filtru'
    document.querySelectorAll('.filtru').forEach(el => {
        if (el.type === 'range') {
            el.addEventListener('input', aplicaFiltrare); // Pentru range folosim 'input' în loc de 'change'
        } else {
            el.addEventListener('change', aplicaFiltrare);
        }
    });

    // Elimină event listener-ul de click de pe butonul de filtrare
    btnFiltreaza.removeEventListener('click', aplicaFiltrare);

    // Actualizează toate filtrele disponibile la încărcarea paginii
    actualizeazaMarimiDisponibile();
    actualizeazaMaterialeDisponibile();
    actualizeazaCategoriiDisponibile();
    actualizeazaMesajProduse();

    function sorteazaProduse(directie) {
        produse.sort((a, b) => {
            const numeA = a.dataset.nume;
            const numeB = b.dataset.nume;
            const raportA = parseFloat(a.dataset.marime) / parseFloat(a.dataset.pret);
            const raportB = parseFloat(b.dataset.marime) / parseFloat(b.dataset.pret);

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
    
    btnReseteaza.addEventListener('click', function() {
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
            produse.forEach(p => p.style.display = 'flex');
            produse.sort((a,b) => a.dataset.initialOrder - b.dataset.initialOrder);
            produse.forEach(p => produseContainer.appendChild(p));
            
            // Actualizează toate filtrele disponibile după resetare
            actualizeazaMarimiDisponibile();
            actualizeazaMaterialeDisponibile();
            actualizeazaCategoriiDisponibile();
            actualizeazaMesajProduse();
        }
    });

    // === SWITCH TEMA ===
    // Codul pentru nightmode a fost mutat in assets/js/nightmode.js pentru utilizare globala.
}); 