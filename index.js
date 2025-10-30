import axios from "axios";

const webhookUrl = process.env.WEBHOOK_URL;

// 🔹 Fuente de datos — Fut.gg (actualizada para FC26)
const API_URL = "https://api.fut.gg/api/fc25/content";

async function getDailyContent() {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("❌ Error al obtener contenido:", error.message);
    return null;
  }
}

async function sendToDiscord(content) {
  try {
    await axios.post(webhookUrl, {
      content,
    });
    console.log("✅ Mensaje enviado correctamente a Discord");
  } catch (error) {
    console.error("❌ Error al enviar a Discord:", error.message);
  }
}

function formatContent(data) {
  if (!data) return "⚠️ No se encontró contenido nuevo hoy.";

  const sbcs = data.sbc?.slice(0, 5).map(s => `• ${s.name}`).join("\n") || "— Ninguno —";
  const objectives = data.objectives?.slice(0, 5).map(o => `• ${o.name}`).join("\n") || "— Ninguno —";
  const players = data.players?.slice(0, 5).map(p => `• ${p.name} (${p.rating})`).join("\n") || "— Ninguno —";

  return `**NUEVO CONTENIDO FC26 ULTIMATE TEAM**
📅 ${new Date().toLocaleDateString("es-ES")}

**SBC NUEVOS:**
${sbcs}

**OBJETIVOS NUEVOS:**
${objectives}

**JUGADORES NUEVOS:**
${players}`;
}

(async () => {
  const data = await getDailyContent();
  const message = formatContent(data);
  await sendToDiscord(message);
})();
