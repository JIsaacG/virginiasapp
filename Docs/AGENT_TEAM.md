# Equipo de agentes — CEEVS

Manual de uso del sistema de desarrollo asistido por agentes de este repositorio.

- **Reglas compartidas (versionadas):** `.claude/rules/engineering.md`
- **Definiciones de los agentes:** `.claude/agents/*.md`
- **Resumen en contexto:** sección "Cómo se trabaja aquí" de `CLAUDE.md`

---

## Por qué existe

Un solo agente que programa, se revisa a sí mismo y dice "listo" produce código que
*parece* correcto. El principio de este sistema es el contrario:

> **No confiar en el código porque parece correcto. Confiar en evidencia verificable.**

De ahí sale la regla que lo estructura todo: **el agente que implementa no puede aprobar
su propio trabajo.**

---

## Los siete agentes

| Agente | Rol de escritura | Función |
|---|---|---|
| `planner` | solo lectura | Convierte la petición en criterios de aceptación Given/When/Then, fija alcance y fuera de alcance, clasifica el riesgo. |
| `implementer` | escribe código | Implementa exactamente esos criterios, con el cambio mínimo. Informa VERIFIED / PARTIALLY VERIFIED / UNVERIFIED, nunca DONE. |
| `test-engineer` | escribe pruebas | Intenta demostrar que la implementación está equivocada. Prueba entradas inválidas, estados vacíos, responsive, regresiones. |
| `web-quality` | solo lectura | SEO, Lighthouse, accesibilidad, HTML y enlaces. Reutiliza el tooling que ya existe en vez de duplicarlo. |
| `security-reviewer` | solo lectura | Secretos, XSS, PHP (`api/`), dependencias, archivos sensibles. Redacta siempre los valores. |
| `adversarial-reviewer` | solo lectura | Revisa el **diff**, no los informes de los demás. Clasifica BLOCKER/HIGH/MEDIUM/LOW. Nunca arregla lo que encuentra. |
| `quality-gate` | solo lectura | Árbitro final. Evalúa la evidencia y emite PASS / CONDITIONAL PASS / FAIL. |

### Hasta dónde llega el "solo lectura"

A los cinco agentes de revisión se les quitan `Write` y `Edit` del campo `tools`, lo que
elimina la vía obvia de modificar archivos. **No es un aislamiento a prueba de todo:**
conservan `Bash` y `PowerShell`, con los que se puede escribir un archivo igualmente. La
prohibición está además escrita en su prompt, pero un prompt es contexto, no una barrera.

Si en algún momento hace falta impedirlo de verdad —y no solo desincentivarlo—, el
mecanismo es un hook `PreToolUse` en `.claude/settings.json` que rechace escrituras
cuando el agente activo sea uno de los revisores. No está implementado: es una decisión
del dueño del repositorio, no un descuido.

---

## Cómo invocarlos

Por nombre, en lenguaje natural:

```
Usa el planner para diseñar el cambio de la sección de admisiones.
Pásale esto al implementer.
Que el adversarial-reviewer revise el diff.
Que el quality-gate evalúe la evidencia.
```

Claude Code también los delega solo cuando la tarea encaja con su `description`.

Para una tarea completa de riesgo MEDIUM o HIGH, encadénalos:

```
Ejecuta el pipeline completo para esta petición: planner → implementer →
test-engineer → web-quality → security-reviewer → adversarial-reviewer → quality-gate.
```

---

## Flujo

```
USER REQUEST
   ↓
PLANNER              criterios de aceptación verificables
   ↓
IMPLEMENTER          cambio mínimo; NO aprueba su trabajo
   ↓
TEST ENGINEER        intenta demostrar que está mal
   ↓
WEB QUALITY          SEO, Lighthouse, accesibilidad, HTML, enlaces
   ↓
SECURITY REVIEWER    secretos, XSS, PHP, dependencias
   ↓
ADVERSARIAL REVIEWER revisa el DIFF, no los informes
   ↓
QUALITY GATE         árbitro final
   ↓
PASS / CONDITIONAL PASS / FAIL
```

Cuando aparece un problema, el trabajo **vuelve al Implementer**; el revisor no lo arregla:

```
REVIEWER → IMPLEMENTER → TESTS → REVIEWER → QUALITY GATE
```

Nunca:

```
IMPLEMENTER → IMPLEMENTER DICE DONE → MERGE
```

---

## Proporcional al riesgo

El sistema no debe convertir un cambio de una palabra en una operación de treinta minutos.

| Riesgo | Ejemplos | Pipeline | Comando |
|---|---|---|---|
| **LOW** | corregir un texto, un color, un `alt`, un enlace | Implementer + revisión rápida | `npm run verify:low` |
| **MEDIUM** | layout, navegación, CSS o JS compartido, contenido nuevo con i18n | Planner → Implementer → Tests → Web Quality → Adversarial → Quality Gate | `npm run verify:medium` |
| **HIGH** | formularios, `api/`, autenticación, MySQL, solicitudes de admisión, panel admin, claves `ceevs_*`, `.htaccess` | Completo, con Security Reviewer y Lighthouse | `npm run verify:high` |

Ante la duda entre dos niveles, sube al mayor.

---

## Verificación disponible

```bash
npm run verify:low       # secretos, sintaxis JS/PHP, validador de páginas, SEO
npm run verify:medium    # + auditoría de dependencias de producción
npm run verify:high      # + Lighthouse CI
npm run verify -- --level=high --verbose   # con la salida completa de cada check

npm run check:js         # node --check sobre js/ y scripts/ (sin vendor)
npm run check:php        # php -l sobre api/
npm run check:secrets    # archivos sensibles versionados + patrones de credenciales
npm run check:pages      # python generate-pages.py
npm run seo:check        # metadatos, sitemap, robots, JSON-LD, enlaces internos
npm run seo:lighthouse   # Lighthouse CI (requiere Chrome)
npm run seo:production   # comprobación del sitio ya publicado
```

`verify` imprime un informe con la misma forma que el del Quality Gate y clasifica cada
check como **PASS · FAIL · NOT AVAILABLE · NOT APPLICABLE**. Nunca hay un "casi".

### Qué NO existe en este repositorio

Declararlo evita que un agente invente comandos:

| Herramienta | Estado |
|---|---|
| Runner de tests (`npm test`) | **No existe.** No hay suite. |
| Linter (ESLint/Prettier) | No instalado. |
| Validador HTML W3C | No instalado. `generate-pages.py` cubre la estructura del proyecto. |
| axe / accesibilidad automatizada | No instalado. La categoría `accessibility` de Lighthouse es la cobertura disponible. |
| Mutation testing | **NOT APPLICABLE** mientras el sitio siga siendo mayoritariamente contenido y presentación sin tests que mutar. |
| Build | **NOT APPLICABLE.** El sitio se publica tal cual; `dist/` vía `minify.py` es opcional. |

---

## Sobre el escáner de secretos

`scripts/check-secrets.mjs` mira **solo archivos versionados** (`git ls-files`), que son los
únicos que acaban publicados. Un `.env` en disco pero ignorado no es una fuga.

Comprueba dos cosas: rutas que nunca deben versionarse (`.env`, `api/db-config.php`,
`server-data/`, `uploads/`, claves privadas) y patrones de credenciales en el contenido.
**Los valores se redactan siempre**; nunca se imprime un secreto completo.

Los hallazgos revisados y aceptados viven en la lista `ACKNOWLEDGED` del propio script,
ancladas a la **huella SHA-256 del valor**, no al archivo. Esto importa: aceptar
"este archivo" en bloque silenciaría también cualquier credencial que alguien añadiera
mañana. Con la huella, un valor distinto vuelve a bloquear.

Para aceptar un hallazgo hace falta escribir la razón. Si no puedes escribirla, no lo aceptes.
**Nunca silencies un hallazgo borrando el patrón que lo detecta.**

---

## CI

`.github/workflows/seo-quality.yml` tiene dos trabajos, para no pagar dos veces por lo mismo:

- **`gate` — puerta rápida.** Se ejecuta en cada PR, en cada push a `main` y a mano.
  Secretos, sintaxis JS, sintaxis PHP, validador de páginas, SEO y dependencias de
  producción. Sin navegador, sin red hacia el sitio. Minutos de CPU: pocos.
- **`lighthouse` — auditoría completa.** Solo en `main` y en ejecución manual. Necesita
  Chrome y tarda. Sube los informes como artefacto durante 14 días.

Para forzar Lighthouse sobre una rama: lanzar el workflow a mano (`workflow_dispatch`) con
la opción *full* activada.

> **Cambio de comportamiento respecto a la configuración anterior:** antes Lighthouse se
> ejecutaba también en cada PR. Ahora no. Si prefieres recuperarlo, quita la condición `if:`
> del trabajo `lighthouse`.

---

## Plantillas de informe

### Implementer

```
IMPLEMENTATION REPORT

Task: ...
Risk: LOW | MEDIUM | HIGH
Files changed: ...
Acceptance criteria addressed: ...
Tests added or modified: ...
Commands executed: ...
Results: ...
Known risks: ...
Status: VERIFIED | PARTIALLY VERIFIED | UNVERIFIED
```

### Adversarial Reviewer

```
ADVERSARIAL REVIEW

BLOCKERS: ...
HIGH: ...
MEDIUM: ...
LOW: ...
Missing tests: ...
Security concerns: ...
SEO concerns: ...
Accessibility concerns: ...
Verdict: APPROVE | REQUEST CHANGES
```

### Quality Gate

```
QUALITY GATE

Acceptance criteria / Tests / Regression tests / HTML validation / Broken links /
SEO checks / Lighthouse / Accessibility / Dependency audit / Secret scan /
Security review / Build / Mutation testing / Adversarial review
  → PASS · FAIL · NOT AVAILABLE · NOT APPLICABLE (cada línea con el comando que la respalda)

Known risks: ...
FINAL DECISION: PASS | CONDITIONAL PASS | FAIL
```

---

## Definition of Done

Solo se puede marcar DONE cuando se cumplen las ocho:

1. Criterios de aceptación satisfechos.
2. Checks aplicables ejecutados.
3. Sin pruebas relevantes fallando.
4. Sin BLOCKERs abiertos.
5. Sin vulnerabilidades graves introducidas.
6. Adversarial Reviewer en APPROVE.
7. Quality Gate en PASS.
8. Existe evidencia de los resultados.

Si falta evidencia: `UNVERIFIED` o `PARTIALLY VERIFIED`. Nunca DONE.

---

## Ampliaciones evaluadas y NO instaladas

Cada dependencia nueva tiene que justificarse. Estas se consideraron y se dejaron fuera a
propósito; están aquí para que la decisión no haya que rehacerla cada vez:

| Herramienta | Por qué no (todavía) |
|---|---|
| **Playwright** (smoke tests) | Descarga ~300 MB de navegadores. Sin suite de tests que la aproveche, el coste supera al valor. **Recomendada** en cuanto haya que proteger flujos reales: el asistente de 7 pasos de `preinscripcion.html` es el primer candidato claro. |
| **Vitest / Jest** | El JS del sitio son scripts globales sin módulos ni exports: habría que refactorizarlos para poder importarlos. Para lógica pura aislada, un script `node` en `tests/` no cuesta ninguna dependencia. |
| **ESLint** | Valor real, pero 29 archivos existentes generarían cientos de avisos de golpe y el ruido enterraría los hallazgos. Introducir con `--max-warnings` progresivo si se decide. |
| **html-validate / W3C** | Las páginas ya pasan `generate-pages.py` y los asserts de Lighthouse. Añadiría una tercera fuente de verdad sobre lo mismo. |
| **axe-core** | Lighthouse ya ejecuta axe internamente en su categoría de accesibilidad. Instalarlo aparte duplicaría la señal. |
| **gitleaks / trufflehog** | `scripts/check-secrets.mjs` cubre este repositorio concreto sin dependencias y con acuses de recibo documentados. |
| **Stryker (mutation)** | Sin suite de tests no hay nada que mutar. `NOT APPLICABLE`. |
