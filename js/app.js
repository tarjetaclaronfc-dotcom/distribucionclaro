// Atajo para document.getElementById
const $ = (id) => document.getElementById(id);

let qrGenerated = false;
let currentProfile = null;
let currentProfileId = null;

/**
 * Envía eventos a Google Analytics si gtag está disponible
 */
function trackEvent(eventName, params = {}) {
    if (typeof window.gtag === "function") {
        window.gtag("event", eventName, params);
    }
}

/**
 * Devuelve el ID del perfil desde la URL o uno por defecto
 */
function getProfileIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("id") || "38244814";
}

/**
 * Asigna listeners de medición a los botones principales
 */
function setupTrackingEvents(profile, profileId) {
    const cleanPhone = profile.whatsapp.replace(/\D/g, "");
    const vendedorNombre = profile.nombre || "";
    const vendedorRol = profile.rol || "";

    const commonData = {
        vendedor_id: profileId,
        vendedor_nombre: vendedorNombre,
        vendedor_rol: vendedorRol
    };

    const btnCall = $("btnCall");
    const btnWhatsappHeader = $("btnWhatsappHeader");
    const btnWhatsappFooter = $("btnWhatsappFooter");
    const btnEmailFooter = $("btnEmailFooter");

    if (btnCall) {
        btnCall.addEventListener("click", function () {
            trackEvent("click_llamada", {
                ...commonData,
                telefono: cleanPhone
            });
        });
    }

    if (btnWhatsappHeader) {
        btnWhatsappHeader.addEventListener("click", function () {
            trackEvent("click_whatsapp_header", {
                ...commonData,
                telefono: cleanPhone
            });
        });
    }

    if (btnWhatsappFooter) {
        btnWhatsappFooter.addEventListener("click", function () {
            trackEvent("click_whatsapp_footer", {
                ...commonData,
                telefono: cleanPhone
            });
        });
    }

    if (btnEmailFooter) {
        btnEmailFooter.addEventListener("click", function () {
            trackEvent("click_email", {
                ...commonData,
                email: profile.email || ""
            });
        });
    }
}

/**
 * Carga los datos del perfil desde el JSON basándose en el ID de la URL
 */
async function loadProfile() {
    currentProfileId = getProfileIdFromUrl();

    try {
        const res = await fetch("data/data.json", { cache: "no-store" });
        if (!res.ok) throw new Error("No se pudo cargar el JSON");

        const data = await res.json();
        const p = data[currentProfileId];

        if (!p) {
            if ($("profileName")) $("profileName").textContent = "Perfil no encontrado";
            if ($("profileRole")) $("profileRole").textContent = "Sin información";
            return;
        }

        currentProfile = p;

        // --- Renderizado de información básica ---
        if (p.foto && $("profilePhoto")) $("profilePhoto").src = p.foto;
        if ($("profileName")) $("profileName").textContent = p.nombre || "Sin nombre";
        if ($("profileRole")) $("profileRole").textContent = p.rol || "Asesor Distribución";

        // --- Configuración de enlaces dinámicos ---
        const cleanPhone = p.whatsapp.replace(/\D/g, "");
        const waMsg = encodeURIComponent(p.mensaje || "¡Hola! Vi tu tarjeta digital de Claro.");
        const waLink = `https://wa.me/549${cleanPhone}?text=${waMsg}`;
        const callLink = `tel:${cleanPhone}`;
        const emailLink = `mailto:${p.email}`;

        // --- Asignar a los elementos del DOM ---
        if ($("btnCall")) $("btnCall").href = callLink;
        if ($("btnWhatsappHeader")) $("btnWhatsappHeader").href = waLink;
        if ($("btnWhatsappFooter")) $("btnWhatsappFooter").href = waLink;
        if ($("btnEmailFooter")) $("btnEmailFooter").href = emailLink;

        // --- Evento de visita al perfil ---
        trackEvent("ver_perfil_vendedor", {
            vendedor_id: currentProfileId,
            vendedor_nombre: p.nombre || "",
            vendedor_rol: p.rol || "",
            page_location: window.location.href
        });

        // --- Configurar tracking de botones ---
        setupTrackingEvents(p, currentProfileId);

    } catch (error) {
        console.error("Error al cargar el perfil:", error);
        if ($("profileName")) $("profileName").textContent = "Error al cargar perfil";
        if ($("profileRole")) $("profileRole").textContent = "Intente nuevamente";
    }
}

/**
 * Genera y muestra el modal con el código QR
 */
function openQR() {
    if ($("qrModal")) {
        $("qrModal").style.display = "flex";
    }

    if (currentProfile && currentProfileId) {
        trackEvent("abrir_qr", {
            vendedor_id: currentProfileId,
            vendedor_nombre: currentProfile.nombre || "",
            vendedor_rol: currentProfile.rol || ""
        });
    }

    // Solo generamos el QR una vez por sesión de carga
    if (!qrGenerated && $("qrcode")) {
        new QRCode($("qrcode"), {
            text: window.location.href,
            width: 200,
            height: 200,
            colorDark: "#e60012",
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
    if ($("qrModal")) {
        $("qrModal").style.display = "none";
    }
}

/**
 * Genera y descarga el archivo VCF (V-Card) con los datos del asesor actual
 */
async function generateVCard() {
    const profileId = getProfileIdFromUrl();

    try {
        const res = await fetch("data/data.json", { cache: "no-store" });
        if (!res.ok) throw new Error("No se pudo cargar el JSON");

        const data = await res.json();
        const p = data[profileId];

        if (!p) {
            alert("Error: No se encontraron datos para generar el contacto.");
            return;
        }

        const tel = p.whatsapp.replace(/\D/g, "");
        const nombreParaVCard = `${p.nombre} - Claro Distribución`;

        const vcard = [
            "BEGIN:VCARD",
            "VERSION:3.0",
            `FN:${nombreParaVCard}`,
            `N:;${nombreParaVCard};;;`,
            "ORG:Claro Argentina;Distribución Tucumán",
            `TITLE:${p.rol || "Asesor Comercial"}`,
            `TEL;TYPE=CELL;TYPE=VOICE;TYPE=pref:+549${tel}`,
            `EMAIL;TYPE=INTERNET:${p.email || ""}`,
            `URL:${window.location.href}`,
            "END:VCARD"
        ].join("\n");

        const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
        const url = window.URL.createObjectURL(blob);

        const newLink = document.createElement("a");
        newLink.download = `${(p.nombre || "contacto").replace(/\s+/g, "_")}_Claro_Distribucion.vcf`;
        newLink.href = url;

        document.body.appendChild(newLink);
        newLink.click();
        document.body.removeChild(newLink);

        window.URL.revokeObjectURL(url);

        // --- Evento GA: guardó contacto ---
        trackEvent("guardar_contacto", {
            vendedor_id: profileId,
            vendedor_nombre: p.nombre || "",
            vendedor_rol: p.rol || ""
        });

    } catch (e) {
        console.error("Error al generar VCard:", e);
        alert("Hubo un problema al generar el contacto.");
    }
}

/**
 * Cerrar el modal si el usuario hace clic fuera del contenido
 */
window.addEventListener("click", function (event) {
    if (event.target === $("qrModal")) {
        closeQR();
    }
});

// Inicializar la carga cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", loadProfile);