const currentPage = window.location.pathname.split('/').pop() || 'index.html';
const taskbarButtons = document.querySelectorAll('.taskbar-button');

taskbarButtons.forEach(button => {
    const buttonPage = button.getAttribute('href').split('/').pop();
    if (buttonPage === currentPage) {
        button.classList.add('active');
    }
});
