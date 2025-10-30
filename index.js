import axios from "axios";

const webhookUrl = process.env.WEBHOOK_URL;

// 🔹 Fuente de datos actualizada para FC26
const API_URL = "https://api.fut.gg/api/fc26/content";

async function getDailyContent() {
  try {
    const response = await axios.get(API_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FC26FeedBot/1.0)",
      },
    });

    const data = response.data;

    if (!data || !data.sections) {
      console.error("⚠️ Estructura inesperada de la API:", data);
      return null;
    }

    // Extraemos secciones relevantes
    const sbcs = data.sections.find(s => s.slug?.includes("sbc"));
    const objectives = data.sections.find(s => s.slug?.includes("objectives"));
    const players = data.sections.find(s => s.slug?.includes("players"));

    return {
      sbcs: sbcs?.items || [],
      objectives: objectives?.items || [],
      players: players?.items || [],
    };
  } catch (error) {
    console.error("❌ Error al obtener contenido:", error.message);
    return null;
  }
}

function formatContent(data) {
  if (!data) return "⚠️ No se encontró contenido nuevo hoy.";

  const sbcList = data.sbcs.length
    ? data.sbcs.slice(0, 5).map(s => `• ${s.title || s.name}`).join("\n")
    : "— Ninguno —";

  const objectiveList = data.objectives.length
    ? data.objectives.slice(0, 5).map(o => `• ${o.title || o.name}`).join("\n")
    : "— Ninguno —";

  const playerList = data.players.length
    ? data.players.slice(0, 5).map(p => `• ${p.name || p.title} (${p.rating || "?"})`).join("\n")
    : "— Ninguno —";

  return `**⚽ NUEVO CONTENIDO FC26 ULTIMATE TEAM**
📅 ${new Date().toLocaleDateString("es-ES")}

**SBC NUEVOS:**
${sbcList}

**OBJETIVOS NUEVOS:**
${objectiveList}

**JUGADORES NUEVOS:**
${playerList}`;
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

(async () => {
  const data = await getDailyContent();
  const message = formatContent(data);
  await sendToDiscord(message);
})();
