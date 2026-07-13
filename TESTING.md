# Guía de uso de las APIs — Tamagotchi Backend

Cómo levantar el servidor y usar cada endpoint, incluido el pipeline de interacción (`/interact`), el guardarropa y la petición de desnudarse (`/clothing/request-removal`).

## 1. Prerrequisitos y arranque

- `credentials/firebase-key.json` (clave de servicio de Firebase) y `.env` con al menos `GEMINI_API_KEY`.
- `npm install` y luego:

```powershell
npm run dev
# → 🐾 Tamagotchi backend running on port 3000
Invoke-RestMethod http://localhost:3000/health   # → status: ok
```

> En PowerShell usa `Invoke-RestMethod` (el alias `curl` de PowerShell no es curl real; si quieres curl clásico usa `curl.exe`).

## 2. Flujo recomendado de primera vez

```powershell
# 1) Sembrar el catálogo de ropa (idempotente, se puede repetir)
Invoke-RestMethod -Method Post -Uri http://localhost:3000/clothing/init

# 2) Crear la mascota
Invoke-RestMethod -Method Post -Uri http://localhost:3000/pets `
  -ContentType "application/json" `
  -Body (@{ petId = "mia"; name = "Mia"; neuroPresetId = "maidHevel"; bodyPresetId = "petite149" } | ConvertTo-Json)

# 3) Vestirla
Invoke-RestMethod -Method Post -Uri http://localhost:3000/pets/mia/clothing/equip `
  -ContentType "application/json" `
  -Body (@{ itemIds = @("vestidoTirantes", "sostenLigero", "bragasLigeras", "mediasNegras") } | ConvertTo-Json)

# 4) Hablarle
Invoke-RestMethod -Method Post -Uri http://localhost:3000/pets/mia/interact `
  -ContentType "application/json" `
  -Body (@{ message = "Hola Mia... me quedo mirando tu vestido" } | ConvertTo-Json)
```

**Presets de personalidad** (`neuroPresetId`): `maidTsundere`, `maidYandere`, `maidDeredere`, `maidHevel`, `emotionless`.
**Presets de cuerpo** (`bodyPresetId`): `tall170`, `petite149`.
Toda mascota nace con la memoria de persona **"Amo" (master)**: el usuario es su Amo.

## 3. Catálogo de ropa

| Endpoint | Método | Descripción |
|---|---|---|
| `/clothing/init` | POST | Siembra el catálogo desde los presets (idempotente) |
| `/clothing` | GET | Lista el catálogo completo |

Prendas del catálogo:

| id | Prenda | Cubre partes | Oculta zonas |
|---|---|---|---|
| `mediasNegras` | Medias negras semitransparentes | piernas y pies | feet, backOfKnees |
| `bragasLigeras` | Bragas ligeras | — | vulva, labios, perineo, zona anal, glúteos |
| `sostenLigero` | Sostén ligero | — | pechos, pezones |
| `vestidoTirantes` | Vestido delgado de tirantes | torso | pechos, pezones, ombligo, espalda baja, glúteos, muslos internos |

La ropa tiene dos niveles de cobertura: `covers` (partes enteras del cuerpo) y `coversZones` (zonas íntimas). Una zona sin prenda que la oculte está **EXPUESTA** y la IA la describirá explícitamente; una parte sin ropa está **DESNUDA**.

## 4. Guardarropa de la mascota

| Endpoint | Método | Body | Descripción |
|---|---|---|---|
| `/pets/:petId/clothing/equip` | POST | `{ "itemIds": ["vestidoTirantes"] }` o `{ "itemId": "..." }` | Ponerle prendas (valida que existan en el catálogo) |
| `/pets/:petId/clothing/unequip` | POST | `{ "itemIds": [...] }` | Quitarle prendas directamente (sin IA) |
| `/pets/:petId/clothing/request-removal` | POST | `{ "message": "...", "itemIds"?: [...], "context"?: {} }` | **Pedirle** que se quite ropa: la IA decide según sus datos |

### request-removal: cómo decide

1. Se calcula una **disposición numérica** (0-1) desde sus datos reales: `0.45·oxitocina + 0.25·excitación + 0.15·dopamina − 0.35·cortisol + sesgo de personalidad` (Hevel +0.35 obediencia absoluta, Yandere +0.15, Deredere +0.10, Tsundere −0.15, Emotionless 0).
2. La IA decide **en personaje** con esa guía (< 0.3 casi seguro se niega, > 0.6 probablemente acepta).
3. Se valida: solo puede quitarse prendas que realmente lleva; si acepta con disposición < 0.15, se **anula** la aceptación (`overridden: true`).
4. Si acepta: las prendas salen de `equippedItemIds` y los deltas de stats se aplican **en la misma transacción atómica**; luego responde describiendo su nueva exposición.

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/pets/mia/clothing/request-removal `
  -ContentType "application/json" `
  -Body (@{ message = "Mia, quítate el vestido para mí"; itemIds = @("vestidoTirantes") } | ConvertTo-Json)
```

Respuesta:

```json
{
  "accepted": true,
  "removedItemIds": ["vestidoTirantes"],
  "reason": "es la voluntad de mi Amo",
  "overridden": false,
  "message": "C-como ordene, Amo...",
  "action": "Baja la mirada y desliza los tirantes por sus hombros; el vestido cae. Bajo él, el sostén ligero...",
  "emotion": "sumisa",
  "intensity": 0.7,
  "gazeTarget": null,
  "memorySaved": true,
  "state": { "...": "...", "equippedItemIds": ["sostenLigero","bragasLigeras","mediasNegras"], "nakedParts": [...] }
}
```

Consejos de prueba: con `maidHevel` recién creada casi siempre acepta (oxitocina 0.85 + sesgo 0.35). Para forzar un rechazo usa `maidTsundere` o sube `neuroState.cortisol` a 0.9 en la consola de Firebase.

## 5. Interacción principal: POST /pets/:petId/interact

Body: `{ "message": "...", "context"?: {} }`. El mensaje **siempre debe indicar hacia dónde miras** — la IA describe esa parte según los datos reales.

Pipeline interno: contexto completo (stats, ropa, zonas expuestas, órganos, memorias) → la IA propone afecciones/deltas/recuerdo → **validación numérica** (rechaza lo no respaldado, recorta deltas) → aplicación atómica en DB → respuesta desde el estado ya actualizado + directiva oculta de memoria consumida en el servidor.

Respuesta — la voz de la IA llega **en dos canales**:

```json
{
  "message": "Ah... ¿m-mis manos? No es nada del otro mundo...",   // SOLO diálogo
  "action": "Esconde las manos tras la espalda; los dedos finos asoman tras la tela...", // narración: qué ves y qué siente
  "emotion": "verguenza",
  "intensity": 0.6,
  "gazeTarget": "hands",
  "afflictions": [ { "id": "estres", "severity": 0.28, "evidence": {...} } ],
  "rejectedAfflictions": ["fiebre"],
  "memoryUsedId": null,
  "memorySaved": false,
  "state": { "neuroState": {...}, "physicalState": {...}, "arousalState": {...}, "equippedItemIds": [...], "nakedParts": [...], "isFullyNaked": false }
}
```

Reglas que cumple la IA: responde siempre en español; **nunca dice números ni temperaturas** (si tiene frío, dice que tiene frío); si la parte/zona mirada está desnuda la describe explícitamente según los datos (pezones si miras sus pechos expuestos, etc.); si está vestida describe la prenda; `gazeTarget` se valida contra partes/zonas/órganos reales.

## 6. Ciclo de vida y acciones básicas

| Endpoint | Método | Body | Descripción |
|---|---|---|---|
| `/pets` | POST | `{ petId?, name, neuroPresetId, bodyPresetId }` | Crear/inicializar (idempotente) |
| `/pets/:petId` | GET | — | Leer la mascota |
| `/pets/:petId/feed` | POST | `{ "nutrition": 0.5 }` | Comer: sube glucosa, baja cortisol |
| `/pets/:petId/play` | POST | `{ "intensity": 0.6 }` | Jugar: sube dopamina/oxitocina, gasta glucosa |
| `/pets/:petId/sleep` | POST | `{ "hours": 0.8 }` | Dormir: recupera fatiga |
| `/pets/:petId/wake` | POST | — | Despertar |
| `/pets/:petId/think` | POST | `{ "context"?: {} }` | Pensamiento autónomo (flujo viejo) |
| `/pets/:petId/talk` | POST | `{ "message": "..." }` | Charla simple (flujo viejo, sin validación) |

## 7. Forzar afecciones para probar la validación

Umbrales (de `AssessPetState.js`): hambre glucosa < 0.35 · deshidratación < 0.45 · estrés cortisol > 0.55 · somnolencia melatonina > 0.6 · agotamiento fatiga > 0.6 · dolor HP < 60 · excitación arousal > 0.4 · frío superficial piel desnuda < 35.5 °C.

- Vía API: jugar 3-4 veces con `intensity: 1.0` baja la glucosa y sube la fatiga → aparecen `hambre` y `agotamiento`.
- Vía consola de Firebase: edita `pets/mia` directamente (p. ej. `physicalState.bloodGlucose = 0.05`) para casos extremos.

Ningún stat neuro se mueve más de ±0.15 por interacción (±0.2 arousal, ±0.1 físicos), aunque la IA proponga más.

## 8. Errores esperados

- Pet inexistente → `404 {"error":"Pet xxx not found"}` (también en feed/play/sleep/wake).
- Sin `message` → `400 {"error":"message is required"}`.
- `equip` con item no catalogado → `400` con la lista de ids desconocidos (siembra antes con `/clothing/init`).
- Sin `GEMINI_API_KEY` → el servidor no arranca.
- JSON malformado de Gemini → no rompe: la evaluación degrada a "sin propuesta", la respuesta a neutral y la decisión de desnudarse a **rechazo**.

## 9. Rastro en Firestore tras cada interacción

- `pets/mia` → stats + `lastThought` (con `message` y `action`).
- `pets/mia/eventLog` → entrada por interacción (`speak`) o petición de ropa (`action`/`undress_requested` con `accepted`, `removedItemIds`, `disposition`).
- `pets/mia/memories/{tipo}/entries` → memorias nuevas si `memorySaved: true`; al crearla: 5 emociones núcleo, preferencias/experiencias de personalidad y la persona **"Amo"**.
- `pets/mia/specialOrgans` y `pets/mia/erogenousZones` → sembrados al crear.
