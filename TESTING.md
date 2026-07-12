# Guía de pruebas — Tamagotchi Backend

Cómo levantar el servidor y probar cada endpoint, en especial el nuevo pipeline de interacción (`/interact`).

## 1. Prerrequisitos

- `credentials/firebase-key.json` — clave de cuenta de servicio de Firebase (ya existe en el repo).
- `.env` con al menos:
  ```
  GEMINI_API_KEY=tu_clave
  GEMINI_MODEL=gemini-1.5-flash     # opcional
  PORT=3000                          # opcional
  ```
- Dependencias instaladas: `npm install`.

## 2. Arrancar

```powershell
npm run dev
# → 🐾 Tamagotchi backend running on http://localhost:3000
```

Comprobar que responde:

```powershell
Invoke-RestMethod http://localhost:3000/health
# → status: ok
```

> En PowerShell usa `Invoke-RestMethod` (el alias `curl` de PowerShell NO es curl real).
> Si prefieres curl clásico, usa `curl.exe`.

## 3. Crear la mascota

Presets de personalidad (`neuroPresetId`): `maidTsundere`, `maidYandere`, `maidDeredere`, `maidHevel`, `emotionless`.
Presets de cuerpo (`bodyPresetId`): `tall170`, `petite149`.

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/pets `
  -ContentType "application/json" `
  -Body (@{ petId = "mia"; name = "Mia"; neuroPresetId = "maidTsundere"; bodyPresetId = "petite149" } | ConvertTo-Json)
```

Esto crea `pets/mia` y siembra las subcolecciones: `specialOrgans`, `erogenousZones` (24 zonas a progreso 0), `memories/coreEmotions` (5 emociones), y las preferencias/experiencias de la personalidad. Es idempotente: repetir la llamada no duplica nada.

Verificar:

```powershell
Invoke-RestMethod http://localhost:3000/pets/mia
```

## 4. El endpoint principal: POST /pets/:petId/interact

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/pets/mia/interact `
  -ContentType "application/json" `
  -Body (@{ message = "Hola Mia, me quedo mirando tus brazos... ¿cómo estás?" } | ConvertTo-Json)
```

Qué pasa por dentro (los 5 pasos):

1. Carga pet + ropa equipada + memorias + zonas; calcula cobertura (qué está desnudo) y afecciones numéricas.
2. Gemini (llamada 1) propone afecciones, deltas de stats y si usa un recuerdo.
3. El dominio valida: afecciones sin respaldo numérico se rechazan, deltas se recortan a los límites.
4. Los deltas aprobados se aplican en una transacción atómica y se relee el pet.
5. Gemini (llamada 2) responde en español, en personaje, describiendo la parte del cuerpo que miras; su directiva oculta `saveMemory` se consume en el servidor.

Respuesta esperada (forma):

```json
{
  "thought": { "emotion": "...", "message": "respuesta en español", "intensity": 0.6 },
  "gazeTarget": "leftArm",
  "afflictions": [ { "id": "estres", "label": "Estrés", "severity": 0.28, "evidence": {...} } ],
  "rejectedAfflictions": [ "fiebre" ],
  "memoryUsedId": null,
  "memorySaved": false,
  "state": { "neuroState": {...}, "physicalState": {...}, "arousalState": {...}, "nakedParts": [...], "isFullyNaked": true }
}
```

Qué mirar en cada prueba:

- **Mirada**: el mensaje debe indicar hacia dónde miras ("miro tu torso", "observo tus pies") → `gazeTarget` debe ser esa parte y `thought.message` debe describirla con los datos reales (ropa o desnudez, temperatura, detalles).
- **Validación**: `rejectedAfflictions` lista lo que la IA alucinó y los números no respaldan. Con un pet recién creado casi todo debería rechazarse (está sano).
- **Deltas**: compara `state.neuroState` entre llamadas; ningún stat debe moverse más de 0.15 por interacción (0.2 para arousal, 0.1 para físicos).
- **Memoria oculta**: di algo significativo ("recuerda que odio las tormentas") → `memorySaved: true` y en Firestore aparece el doc en `pets/mia/memories/ephemeral/entries` (o `experiences`/`preferences`). El contenido oculto nunca aparece en la respuesta HTTP.

## 5. Forzar afecciones para probar la validación

No hay endpoint para setear stats directamente; dos vías:

**A. Con las acciones existentes** (bajan/suben stats reales):

```powershell
# Jugar fuerte 3-4 veces: baja bloodGlucose (~0.2 c/u) y sube cnsFatigue → hambre + agotamiento
Invoke-RestMethod -Method Post -Uri http://localhost:3000/pets/mia/play `
  -ContentType "application/json" -Body (@{ intensity = 1.0 } | ConvertTo-Json)

# Luego interactúa y verifica que "hambre"/"agotamiento" aparecen en afflictions
```

**B. Editando en la consola de Firebase** (más rápido para casos extremos): cambia a mano `physicalState.bloodGlucose = 0.05` o `neuroState.cortisol = 0.9` en el doc `pets/mia` y llama a `/interact`.

Umbrales de referencia (de `AssessPetState.js`): hambre < 0.35 glucosa · deshidratación < 0.45 · estrés > 0.55 cortisol · somnolencia > 0.6 melatonina · agotamiento > 0.6 fatiga · dolor < 60 HP en alguna parte · excitación > 0.4 arousal.

## 6. Probar ropa / desnudez

Aún no hay endpoint para equipar ropa; para probar cobertura:

1. En la consola de Firebase crea un doc en `clothingCatalog`, p. ej. id `maidDress01`:
   ```json
   { "name": "Vestido de maid", "covers": ["torso", "leftArm", "rightArm", "leftLeg", "rightLeg"], "thermalInsulation": 0.4, "physicalDefense": 0.1, "weightGr": 800, "slot": "outer" }
   ```
2. En `pets/mia` pon `equippedItemIds: ["maidDress01"]`.
3. Llama a `/interact` mirando el torso → debe describirlo con el vestido; mirando la cabeza o los pies → debe describirlos desnudos (`nakedParts` lo confirma).

Sin ropa equipada, `isFullyNaked: true` y el prompt le dice a la IA que está desnuda.

## 7. Resto de endpoints

| Endpoint | Body | Qué hace |
|---|---|---|
| `POST /pets/:id/feed` | `{ "nutrition": 0.5 }` | Sube glucosa, baja cortisol |
| `POST /pets/:id/play` | `{ "intensity": 0.6 }` | Sube dopamina/oxitocina, gasta glucosa |
| `POST /pets/:id/sleep` | `{ "hours": 0.8 }` | Recupera fatiga, marca dormida |
| `POST /pets/:id/wake` | — | Despierta |
| `POST /pets/:id/think` | `{ "context": {} }` | Pensamiento autónomo (flujo viejo, prompt en inglés) |
| `POST /pets/:id/talk` | `{ "message": "..." }` | Charla simple (flujo viejo, sin validación ni memorias) |

## 8. Errores esperados

- `POST /pets/xxx/interact` con pet inexistente → `404 {"error":"Pet xxx not found"}`.
- Sin `message` en el body → `400 {"error":"message is required"}`.
- Sin `GEMINI_API_KEY` en `.env` → el servidor no arranca (error explícito).
- Si Gemini devuelve JSON malformado, el pipeline NO se cae: la evaluación degrada a "sin propuesta" y la respuesta a una réplica neutral (`emotion: "confundida"`).

## 9. Rastro en Firestore tras una interacción

- `pets/mia` → stats actualizados + `lastThought`.
- `pets/mia/eventLog` → una entrada `speak` con el mensaje, el `gazeTarget` y si se usó/guardó memoria.
- `pets/mia/memories/{tipo}/entries` → la memoria nueva si `memorySaved: true`.
