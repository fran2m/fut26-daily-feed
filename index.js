import axios from "axios";

// URL del webhook (desde tus secrets)
const webhookUrl = process.env.WEBHOOK_URL;

// Fecha de hoy (formato DD/MM/YYYY)
const fecha = new Date().toLocaleDateString("es-ES");

// Función principal
async function main() {
  try {
    // Llamadas a fut.gg
    const [sbcData, objectivesData, playersData] = await Promise.all([
      axios.get("https://www.fut.gg/api/fc-25/sbc/"),
      axios.get("https://www.fut.gg/api/fc-25/objectives/"),
      axios.get("https://www.fut.gg/api/fc-25/players/latest/"),
    ]);

    // Extraemos los nombres
    const sbcs = sbcData.data?.items?.slice(0, 10).map((sbc) => sbc.name) || [];
    const objetivos = objectivesData.data?.items?.slice(0, 5).map((obj) => obj.name) || [];
    const jugadores = playersData.data?.slice(0, 10).map((player) => player.name) || [];

    // Creamos el mensaje bonito
    let mensaje = `🆕 **NUEVO CONTENIDO ${fecha}**\n\n`;

    if (sbcs.length) {
      mensaje += `**SBC NUEVOS:**\n${sbcs.map((s) => `- ${s}`).join("\n")}\n\n`;
    } else mensaje += `**SBC NUEVOS:** No hay SBC nuevos hoy.\n\n`;

    if (objetivos.length) {
      mensaje += `**OBJETIVOS NUEVOS:**\n${objetivos.map((o) => `- ${o}`).join("\n")}\n\n`;
    } else mensaje += `**OBJETIVOS NUEVOS:** No hay nuevos objetivos hoy.\n\n`;

    if (jugadores.length) {
      mensaje += `**JUGADORES NUEVOS:**\n${jugadores.map((j) => `- ${j}`).join("\n")}\n\n`;
    } else mensaje += `**JUGADORES NUEVOS:** No hay nuevos jugadores hoy.\n\n`;

    // Enviamos el mensaje a Discord
    await axios.post(webhookUrl, { content: mensaje });
    console.log("✅ Mensaje enviado correctamente a Discord");

  } catch (error) {
    console.error("❌ Error al obtener datos o enviar mensaje:", error.message);
  }
}

// Ejecutamos
main();
