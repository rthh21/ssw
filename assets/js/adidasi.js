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
    
    const produseContainer = document.getElementById('produse-container');
    const produse = Array.from(document.querySelectorAll('.produs'));

    inpPret.addEventListener('input', function() {
        valPret.textContent = this.value;
    });

    function valideazaInput(input) {
        if (input.id === 'inp-descriere' && /\d/.test(input.value)) {
            alert("Cuvântul cheie din descriere nu poate conține cifre.");
            input.classList.add('invalid');
            return false;
        }
        input.classList.remove('invalid');
        return true;
    }

    btnFiltreaza.addEventListener('click', function() {
        if (inpDescriere.value.trim() !== '' && !valideazaInput(inpDescriere)) return;
        
        const valNume = inpNume.value.toLowerCase().trim();
        const valDescriere = inpDescriere.value.toLowerCase().trim();
        const valPret = parseFloat(inpPret.value);
        const valCategorie = inpCategorie.value;
        const valSubcategorie = document.querySelector('input[name="subcategorie"]:checked').value;
        const valCuloare = inpCuloare.value.toLowerCase().trim();
        const valNoutati = inpNoutati.checked;
        const dataNoutati = new Date('2025-01-01');
        const valMaterialeSelectate = Array.from(inpMateriale.selectedOptions).map(opt => opt.value);

        produse.forEach(produs => {
            const numeProdus = produs.dataset.nume;
            const descriereProdus = produs.dataset.descriere;
            const pretProdus = parseFloat(produs.dataset.pret);
            const categorieProdus = produs.dataset.categorie;
            const subcategorieProdus = produs.dataset.subcategorie;
            const culoareProdus = produs.dataset.culoare;
            const dataProdus = new Date(produs.dataset.data_introdusa);
            const materialeProdus = produs.dataset.materiale.split(',');

            let vizibil = true;

            if (valNume && !numeProdus.startsWith(valNume)) vizibil = false;
            if (valDescriere && !descriereProdus.includes(valDescriere)) vizibil = false;
            if (pretProdus > valPret) vizibil = false;
            if (valCategorie !== 'toate' && categorieProdus !== valCategorie) vizibil = false;
            if (valSubcategorie !== 'toate' && subcategorieProdus !== valSubcategorie) vizibil = false;
            if (valCuloare && culoareProdus !== valCuloare) vizibil = false;
            if (valNoutati && dataProdus < dataNoutati) vizibil = false;
            if (valMaterialeSelectate.length > 0 && !valMaterialeSelectate.some(mat => materialeProdus.includes(mat))) {
                vizibil = false;
            }
            
            produs.style.display = vizibil ? 'flex' : 'none';
        });
    });

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
        }
    });
}); 