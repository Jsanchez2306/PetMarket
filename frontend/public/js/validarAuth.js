         // Abrir modal de login automáticamente si viene del middleware de autenticación
                $(document).ready(function() {
                    const urlParams = new URLSearchParams(window.location.search);
                    if (urlParams.get('login') === 'true') {
                        $('#loginModal').modal('show');
                        // Limpiar la URL sin recargar la página
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                });