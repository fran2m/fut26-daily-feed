const fs = require('fs');
const axios = require('axios');
const { execSync } = require('child_process');

const WEBHOOK_URL = process.env.WEBHOOK_URL;
if (!WEBHOOK_URL) {
  console.error("ERROR: Pon tu WEBHOOK_URL en Secrets de GitHub Actions (WEBHOOK_URL).");
  process.exit(1);
}

const LAST_FILE = 'last.json';

// ---------- Helper: lee last.json ----------
function readLast() {
  if (!fs.existsSync(LAST_FILE)) {
    return { sbcs: [], objetivos: [], jugadores: [] };
  }
  return JSON.parse(fs.readFileSync(LAST_FILE, 'utf8'));
}

// ---------- Helper: guarda last.json ----------
function saveLast(data) {
  fs.writeFileSync(LAST_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ---------- COMPARADOR: devuelve elementos nuevos ----------
function diffArrays(oldArr, newArr) {
  const setOld = new Set(oldArr);
  return newArr.filter(x => !setOld.has(x));
}

// ---------- Construye mensaje para Discord ----------
function buildMessage(newSbcs, newObj, newJugs) {
  const hoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  let mensaje = `🆕 *NUEVO CONTENIDO ${hoy}*\n\n`;

  mensaje += `*SBC nuevos:*\n`;
  mensaje += newSbcs.length ? newSbcs.map(s => `- ${s}`).join('\n') : '- Ninguno';
  mensaje += '\n\n';

  mensaje += `*Objetivos nuevos:*\n`;
  mensaje += newObj.length ? newObj.map(o => `- ${o}`).join('\n') : '- Ninguno';
  mensaje += '\n\n';

  mensaje += `*Jugadores nuevos:*\n`;
  mensaje += newJugs.length ? newJugs.map(j => `- ${j}`).join('\n') : '- Ninguno';
  mensaje += '\n\n';

  return mensaje;
}

// ---------- ENVÍO al webhook ----------
async function sendToDiscord(message) {
  try {
    await axios.post(WEBHOOK_URL, { content: message });
    console.log("Mensaje enviado a Discord.");
  } catch (err) {
    console.error("Error enviando a Discord:", err.response ? err.response.data : err.message);
    throw err;
  }
}

/*
  ---- AQUÍ está la parte que debes adaptar ----
  fetchCurrentData() debe devolver un objeto:
  {
    sbcs: [ "titulo sbc 1", "titulo sbc 2", ... ],
    objetivos: [ "titulo objetivo 1", ... ],
    jugadores: [ "Nombre Jugador 1", ... ]
  }
  Puedes hacer scraping o llamar a una API. Ejemplo de estructura abajo (simulada).
*/
async function fetchCurrentData() {
  // --- EJEMPLO SIMULADO: sustitúyelo por tu fetch real ---
  // Por ejemplo: fetch a fut.gg / futbin / tu API y parsear los títulos/links.
  return {
    sbcs: [
      "Icono max 87",       // ejemplo
      "Mejora x10 84+"
    ],
    objetivos: [
      "Puntos de Rush"
    ],
    jugadores: [
      "Vidic (Icono Metamorfo 95)"
    ]
  };
}

// ---------- MAIN ----------
(async () => {
  try {
    const last = readLast();
    console.log("Último guardado:", last);

    const current = await fetchCurrentData();
    console.log("Datos actuales:", current);

    // Comparar
    const newSbcs = diffArrays(last.sbcs || [], current.sbcs || []);
    const newObj = diffArrays(last.objetivos || [], current.objetivos || []);
    const newJugs = diffArrays(last.jugadores || [], current.jugadores || []);

    console.log("Novedades detectadas:", { newSbcs, newObj, newJugs });

    // Si no hay novedades -> NO enviar nada
    if (newSbcs.length === 0 && newObj.length === 0 && newJugs.length === 0) {
      console.log("No hay nuevas entradas. No se enviará mensaje.");
      process.exit(0);
    }

    // Construir y enviar mensaje
    const message = buildMessage(newSbcs, newObj, newJugs);
    await sendToDiscord(message);

    // Actualizar last.json con los datos actuales (no sólo añadir nuevos)
    saveLast(current);

    // Commit y push del last.json actualizado
    try {
      execSync('git config user.name "github-actions[bot]"');
      execSync('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"');
      execSync('git add ' + LAST_FILE);
      execSync('git commit -m "Actualiza last.json con novedades" || true'); // evita fallo si no hay cambios
      execSync('git push');
      console.log("last.json actualizado y enviado al repo.");
    } catch (gitErr) {
      console.error("Error al commitear/pushear last.json:", gitErr.message);
    }

  } catch (err) {
    console.error("Error general:", err);
    process.exit(1);
  }
})();
