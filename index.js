import axios from "axios";
import * as cheerio from "cheerio";

const webhookUrl = process.env.WEBHOOK_URL;
const PALETOOLS_URL = "https://fc26.paletools.io/daily-content";

async function getDailyContent() {
  try {
    const { data: html } = await axios.get(PALETOOLS_URL);
    const $ = cheerio.load(html);

    const sbcs = [];
    const objectives = [];
    const players = [];

    // Buscar secciones por texto
    $("h2").each((_, el) => {
      const title = $(el).text().toLowerCase();

      if (title.includes("sbc")) {
        $(el).next("ul").find("li").each((_, li) => {
          sbcs.push($(li).text().trim());
        });
      } else if (title.includes("objective")) {
        $(el).next("ul").find("li").each((_, li) => {
          objectives.push($(li).text().trim());
        });
      } else if (title.includes("player")) {
        $(el).next("ul").find("li").each((_, li) => {
          players.push($(li).text().trim());
        });
      }
    });

    return { sbcs, objectives, players };
  } catch (error) {
    console.error("❌ Error al obtener contenido de Paletools:", error.message);
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
  if (!data) return "⚠️ No se pudo obtener contenido nuevo hoy.";

  const sbcs = data.sbcs.length ? data.sbcs.map(s => `• ${s}`).join("\n") : "— Ninguno —";
  const objectives = data.objectives.length ? data.objectives.map(o => `• ${o}`).join("\n") : "— Ninguno —";
  const players = data.players.length ? data.players.map(p => `• ${p}`).join("\n") : "— Ninguno —";

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
