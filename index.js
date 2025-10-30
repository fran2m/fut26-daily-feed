import axios from "axios";

const webhookUrl = process.env.WEBHOOK_URL;

// ✅ Fuente alternativa: EAFC Tracker (sin bloqueo)
const API_URL = "https://www.eafc24tracker.com/api/fc26/content";

async function getDailyContent() {
  try {
    const response = await axios.get(API_URL);
    console.log("🔍 Datos recibidos:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error al obtener contenido:", error.message);
    return null;
  }
}

async function sendToDiscord(content) {
  try {
    await axios.post(webhookUrl, { content });
    console.log("✅ Mensaje enviado correctamente a Discord");
  } catch (error) {
    console.error("❌ Error al enviar a Discord:", error.message);
  }
}

function formatContent(data) {
  if (!data || Object.keys(data).length === 0)
    return "⚠️ No se encontró contenido nuevo hoy (sin datos de la API).";

  const sbcs = data.sbc?.map(s => `• ${s.name}`).join("\n") || "— Ninguno —";
  const objectives = data.objectives?.map(o => `• ${o.name}`).join("\n") || "— Ninguno —";
  const players = data.players?.map(p => `• ${p.name} (${p.rating})`).join("\n") || "— Ninguno —";

  return `**🟢 NUEVO CONTENIDO FC26 ULTIMATE TEAM**
📅 ${new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long" })}

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
