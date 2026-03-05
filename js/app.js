// Atajo para document.getElementById
const $ = (id) => document.getElementById(id);
let qrGenerated = false;

/**
 * Carga los datos del perfil desde el JSON basándose en el ID de la URL
 */
async function loadProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    // ID por defecto si no hay uno en la URL (DNI de Victor Hugo)
    const profileId = urlParams.get("id") || "38244814"; 

    try {
        const res = await fetch("data/data.json", { cache: "no-store" });
        if (!res.ok) throw new Error("No se pudo cargar el JSON");
        
        const data = await res.json();
        const p = data[profileId];

        if (!p) {
            $("profileName").textContent = "Perfil no encontrado";
            return;
        }

        // --- Renderizado de información básica ---
        if (p.foto) $("profilePhoto").src = p.foto;
        $("profileName").textContent = p.nombre;
        $("profileRole").textContent = p.rol;

        // --- Configuración de enlaces dinámicos ---
        
        // WhatsApp (Limpia espacios del número)
        const cleanPhone = p.whatsapp.replace(/\s/g, '');
        const waMsg = encodeURIComponent(p.mensaje || "¡Hola! Vi tu tarjeta digital de Claro.");
        const waLink = `https://wa.me/549${cleanPhone}?text=${waMsg}`;

        // Link de llamada directa
        const callLink = `tel:${cleanPhone}`;

        // Link de Email
        const emailLink = `mailto:${p.email}`;

        // Asignar a los elementos del DOM
        if($("btnCall")) $("btnCall").href = callLink;
        if($("btnWhatsappHeader")) $("btnWhatsappHeader").href = waLink;
        if($("btnWhatsappFooter")) $("btnWhatsappFooter").href = waLink;
        if($("btnEmailFooter")) $("btnEmailFooter").href = emailLink;

    } catch (error) {
        console.error("Error al cargar el perfil:", error);
    }
}

/**
 * Genera y muestra el modal con el código QR
 */
function openQR() {
    $("qrModal").style.display = "flex";
    
    // Solo generamos el QR una vez por sesión de carga
    if (!qrGenerated) {
        new QRCode($("qrcode"), {
            text: window.location.href, // Usa la URL exacta del asesor actual
            width: 200,
            height: 200,
            colorDark: "#e60012", // Rojo oficial Claro
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        qrGenerated = true;
    }
}

/**
 * Cierra el modal del QR
 */
function closeQR() {
    $("qrModal").style.display = "none";
}

// Cerrar el modal si el usuario hace clic fuera del contenido blanco
window.onclick = function(event) {
    if (event.target == $("qrModal")) {
        closeQR();
    }
}

/**
 * Genera y descarga el archivo VCF (V-Card) con los datos del asesor actual
 */
async function generateVCard() {
    const urlParams = new URLSearchParams(window.location.search);
    const profileId = urlParams.get("id") || "38244814"; 

    try {
        const res = await fetch("data/data.json");
        const data = await res.json();
        const p = data[profileId];

        if (!p) return alert("Error: No se encontraron datos para generar el contacto.");

        // Limpiar el número de teléfono (solo números)
        const tel = p.whatsapp.replace(/\D/g, '');
        
        // --- CORRECCIÓN: Nombre con "Claro Distribución" ---
        const nombreParaVCard = `${p.nombre} - Claro Distribución`;

        // Construcción del formato VCF (Estándar internacional)
        const vcard = [
            "BEGIN:VCARD",
            "VERSION:3.0",
            `FN:${nombreParaVCard}`,
            `N:;${nombreParaVCard};;;`,
            `ORG:Claro Argentina;Distribución Tucumán`,
            `TITLE:${p.rol || "Asesor Comercial"}`,
            `TEL;TYPE=CELL;TYPE=VOICE;TYPE=pref:+549${tel}`,
            `EMAIL;TYPE=INTERNET:${p.email}`,
            `URL:${window.location.href}`,
            "END:VCARD"
        ].join("\n");

        // Crear el archivo para descargar
        const blob = new Blob([vcard], { type: "text/vcard" });
        const url = window.URL.createObjectURL(blob);
        
        const newLink = document.createElement("a");
        // Nombre del archivo prolijo
        newLink.download = `${p.nombre.replace(/ /g, "_")}_Claro_Distribucion.vcf`;
        newLink.href = url;
        
        // Simular clic para descargar
        document.body.appendChild(newLink);
        newLink.click();
        document.body.removeChild(newLink);
        
        // Liberar memoria
        window.URL.revokeObjectURL(url);

    } catch (e) {
        console.error("Error al generar VCard:", e);
        alert("Hubo un problema al generar el contacto.");
    }
}

// Inicializar la carga cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", loadProfile);