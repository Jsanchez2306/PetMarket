        <script>
            function enviarWhatsApp() {
                const nombre = document.getElementById('nombre').value;
                const numero = document.getElementById('numero').value;
                const interes = document.getElementById('interes').value;
                const comentarios = document.getElementById('comentarios').value;

                const mensaje = `Hola, soy ${nombre}%0A📱 Tel: ${numero}%0A🛒 Me interesa: ${interes}%0A📝 Comentarios: ${comentarios}`;

                const telefonoDestino = "573022547733"; // ← Cambia esto por tu número con indicativo (Ej: 57300XXXXXXX)
                const url = `https://wa.me/${telefonoDestino}?text=${mensaje}`;

                window.open(url, '_blank');
            }
        </script>