window.addEventListener('DOMContentLoaded', function() {
    const themeSwitch = document.getElementById('themeSwitch');
    const themeIcon = document.getElementById('theme-icon');
    const html = document.documentElement;
    // Inițializare temă la încărcare
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    if(themeSwitch) themeSwitch.checked = savedTheme === 'dark';
    if(themeSwitch) themeSwitch.addEventListener('change', function() {
        setTheme(this.checked ? 'dark' : 'light');
    });
    function setTheme(theme) {
        html.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (themeIcon) {
            if (theme === 'dark') {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            } else {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            }
        }
    }
}); 