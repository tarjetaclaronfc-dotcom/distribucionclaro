const $ = (id) => document.getElementById(id);

function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

async function loadProfile() {
    // Para Distribución usamos el DNI directamente como ID
    const profileId = getQueryParam("id") || "38244814"; 

    try {
        const res = await fetch("data/data.json", { cache: "no-store" });
        if (!res.ok) throw new Error("Error en base de datos.");

        const data = await res.json();
        const p = data[profileId];

        if (!p) {
            $("profileName").textContent = "No encontrado";
            $("profileRole").textContent = "ID INVÁLIDO";
            return;
        }

        // Renderizado
        if (p.foto) $("profilePhoto").src = p.foto;
        $("profileName").textContent = p.nombre;
        $("profileRole").textContent = p.rol;
        $("profileDni").textContent = p.dni;

        // WhatsApp
        if (p.whatsapp) {
            const cleanPhone = p.whatsapp.replace(/\s/g, '');
            const msg = encodeURIComponent(p.mensaje || "¡Hola! Vengo desde tu Tarjeta de Distribución Claro 👋");
            const waLink = `https://wa.me/549${cleanPhone}?text=${msg}`;
            $("btnWhatsapp").href = waLink;
            $("floatBot").href = waLink;
        }

        // Email
        if (p.email) {
            $("btnEmail").href = `mailto:${p.email}`;
            $("btnEmail").style.display = "flex";
        }

    } catch (e) {
        console.error("Error cargando perfil:", e);
    }
}

document.addEventListener("DOMContentLoaded", loadProfile);