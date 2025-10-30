import axios from "axios";

const webhookUrl = process.env.WEBHOOK_URL;

const BASE_URL = "https://fc26.paletools.io/database";

async function getDailyContent() {
  try {
    const [sbcRes, objRes, playerRes] = await Promise.all([
      axios.get(`${BASE_URL}/sbc`),
      axios.get(`${BASE_URL}/objectives`),
      axios.get(`${BASE_URL}/player`),
    ]);

    return {
      sbcs: sbcRes.data.slice(0, 5),
      objectives: objRes.data.slice(0, 5),
      players: playerRes.data.slice(0, 5),
    };
  } catch (error) {
    console.error("❌ Error al obtener contenido:", error.message);
    return null;
  }
}

function formatContent(data) {
  if (!data) return "⚠️ No se encontró contenido nuevo hoy.";

  const sbcs = data.sbcs?.map(s => `• ${s.name || s.title || "Sin nombre"}`).join("\n") || "— Ninguno —";
  const objectives = data.objectives?.map(o => `• ${o.name || o.title || "Sin nombre"}`).join("\n") || "— Ninguno —";
  const players = data.players?.map(p => `• ${p.name || "Jugador desconocido"} (${p.rating || "?"})`).join("\n") || "— Ninguno —";

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
