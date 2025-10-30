import axios from "axios";

const webhookUrl = process.env.WEBHOOK_URL;

// 🔹 Fuente de datos Paletools
const BASE_URL = "https://fc26.paletools.io/database";

async function getDailyContent() {
  try {
    const [sbcRes, objRes, playerRes] = await Promise.all([
      axios.get(`${BASE_URL}/sbc?_limit=5`),
      axios.get(`${BASE_URL}/objective?_limit=5`),
      axios.get(`${BASE_URL}/player?_limit=5`),
    ]);

    return {
      sbcs: sbcRes.data || [],
      objectives: objRes.data || [],
      players: playerRes.data || [],
    };
  } catch (error) {
    console.error("❌ Error al obtener contenido:", error.response?.status, error.message);
    return null;
  }
}

function formatContent(data) {
  if (!data || (!data.sbcs.length && !data.objectives.length && !data.players.length)) {
    return "⚠️ No se encontró contenido nuevo hoy.";
  }

  const sbcs = data.sbcs.length
    ? data.sbcs.map(s => `• ${s.name || s.title || s.id}`).join("\n")
    : "— Ninguno —";

  const objectives = data.objectives.length
    ? data.objectives.map(o => `• ${o.name || o.title || o.id}`).join("\n")
    : "— Ninguno —";

  const players = data.players.length
    ? data.players.map(p => `• ${p.name || "Jugador desconocido"} (${p.rating || "?"})`).join("\n")
    : "— Ninguno —";

  return `**📢 NUEVO CONTENIDO FC26 ULTIMATE TEAM**
📅 ${new Date().toLocaleDateString("es-ES")}

**🧩 SBC NUEVOS:**
${sbcs}

**🎯 OBJETIVOS NUEVOS:**
${objectives}

**👟 JUGADORES NUEVOS:**
${players}`;
}

async function sendToDiscord(content) {
  try {
    await axios.post(webhookUrl, { content });
    console.log("✅ Mensaje enviado correctamente a Discord");
  } catch (error) {
    console.error("❌ Error al enviar a Discord:", error.message);
  }
}

(async () => {
  const data = await getDailyContent();
  const message = formatContent(data);
  await sendToDiscord(message);
})();
