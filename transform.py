#!/usr/bin/env python3
"""
Transform script for CEEVS website restructuring.
Uses exact line numbers from grep analysis.
"""

INPUT_FILE  = 'ceevs-v2 (3).html'
OUTPUT_FILE = 'ceevs-v2 (3).html'
COPY_FILE   = 'index.html'

with open(INPUT_FILE, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')

# ═══════════════════════════════════════════════════════
# EXACT LINE BOUNDARIES (1-indexed from grep, convert to 0-indexed)
# ═══════════════════════════════════════════════════════
# Line numbers from grep (1-indexed):
# </style> = line 1671
# <body> = line 1673
# Cursor/HUD/Toast: 1674-1721
# Navbar comment: 1723, mobile menu ends at 1780
# Hero comment: 1782, hero ends at 1873
# Marquee: 1875-1895
# Historia comment: 1897, ends 1930
# Niveles comment: 1932, ends 1994
# Misión comment: 1996, ends 2010 (it's a div, not section)
# Valores comment: 2012, ends 2071
# Quiz comment: 2073, ends 2214
# Admisiones comment: 2216, ends 2294
# Padres comment: 2296, ends 2311
# FAQ comment: 2313, ends 2386
# Testimonios comment: 2388, ends 2443
# Galería comment: 2445, ends 2581
# Contacto comment: 2583, ends 2672
# Footer comment: 2674, ends 2727
# <script>: line 2732
# </script>: line 3682
# WA FAB comment: 3683
# </body>: 3691
# </html>: 3692

def L(n):
    """Convert 1-indexed line to 0-indexed."""
    return n - 1

# Extract sections (0-indexed, inclusive start, exclusive end)
head_and_css     = lines[0:L(1671)]          # Everything up to but not including </style>
style_close      = lines[L(1671)]            # </style>
head_close_body  = lines[L(1672):L(1674)]    # </head>\n<body>

cursor_hud_toast = lines[L(1674):L(1723)]    # Cursor + HUD + Toast (up to navbar comment)
navbar           = lines[L(1723):L(1782)]    # Navbar + mobile menu (up to hero comment)
hero             = lines[L(1782):L(1875)]    # Hero section + blank line (up to marquee)
marquee          = lines[L(1875):L(1897)]    # Marquee (up to historia comment)
historia         = lines[L(1897):L(1932)]    # Historia section (up to niveles comment)
niveles          = lines[L(1932):L(1996)]    # Niveles section (up to mision comment)
mision           = lines[L(1996):L(2012)]    # Misión/Visión (up to valores comment)
valores          = lines[L(2012):L(2073)]    # Valores (up to quiz comment)
quiz             = lines[L(2073):L(2216)]    # Quiz (up to admisiones comment)
admisiones       = lines[L(2216):L(2296)]    # Admisiones (up to padres comment)
padres           = lines[L(2296):L(2313)]    # Padres Band (up to FAQ comment) -- WILL BE REPLACED
faq              = lines[L(2313):L(2388)]    # FAQ (up to testimonios comment)
testimonios      = lines[L(2388):L(2445)]    # Testimonios (up to galeria comment)
galeria          = lines[L(2445):L(2583)]    # Galería (up to contacto comment)
contacto         = lines[L(2583):L(2674)]    # Contacto (up to footer comment)
footer_sec       = lines[L(2674):L(2728)]    # Footer (includes </footer> + blank)
pre_script       = lines[L(2728):L(2732)]    # Blank lines before <script>
script_block     = lines[L(2732):L(3683)]    # <script>...</script>
wa_fab           = lines[L(3683):L(3692)]    # WA FAB + </body>
html_close       = lines[L(3692):]           # </html>

print("Section extraction check:")
print(f"  cursor_hud_toast: {len(cursor_hud_toast)} lines")
print(f"  navbar: {len(navbar)} lines")
print(f"  hero: {len(hero)} lines")
print(f"  marquee: {len(marquee)} lines")
print(f"  historia: {len(historia)} lines")
print(f"  niveles: {len(niveles)} lines")
print(f"  mision: {len(mision)} lines")
print(f"  valores: {len(valores)} lines")
print(f"  quiz: {len(quiz)} lines")
print(f"  admisiones: {len(admisiones)} lines")
print(f"  padres: {len(padres)} lines")
print(f"  faq: {len(faq)} lines")
print(f"  testimonios: {len(testimonios)} lines")
print(f"  galeria: {len(galeria)} lines")
print(f"  contacto: {len(contacto)} lines")
print(f"  footer: {len(footer_sec)} lines")
print(f"  script: {len(script_block)} lines")
print(f"  wa_fab: {len(wa_fab)} lines")

# ═══════════════════════════════════════════════════════
# NEW CSS for new sections
# ═══════════════════════════════════════════════════════

new_css = """
/* ═══════════════════════════════════════
   FILOSOFÍA EDUCATIVA
═══════════════════════════════════════ */
.filosofia { background:var(--cream); padding:110px 8vw; }
.filosofia-text { text-align:center; margin-bottom:56px; }
.filosofia-title { font-family:'Playfair Display',serif; font-size:clamp(34px,4vw,54px); font-weight:700; color:var(--forest); line-height:1.12; margin-bottom:20px; }
.filosofia-title em { color:var(--gold); font-style:italic; }
.filosofia-desc { font-size:15px; color:var(--muted); line-height:1.8; max-width:680px; margin:0 auto; }
.filosofia-pillars { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
.filosofia-pillar { background:var(--white); border-radius:var(--rl); padding:32px 24px; border:1.5px solid transparent; transition:all .3s; text-align:center; }
.filosofia-pillar:hover { border-color:rgba(171,100,35,.3); box-shadow:0 12px 36px rgba(65,36,4,.1); transform:translateY(-3px); }
.fp-icon { font-size:32px; margin-bottom:14px; display:block; }
.filosofia-pillar h3 { font-family:'Playfair Display',serif; font-size:18px; font-weight:700; color:var(--forest); margin-bottom:10px; }
.filosofia-pillar p { font-size:13.5px; color:var(--muted); line-height:1.7; }

/* ═══════════════════════════════════════
   DECLARACIÓN DE FE
═══════════════════════════════════════ */
.declaracion-fe { background:var(--forest); padding:110px 8vw; position:relative; overflow:hidden; }
.declaracion-fe::before { content:'✝'; position:absolute; right:5vw; top:50%; transform:translateY(-50%); font-size:clamp(200px,22vw,400px); color:rgba(171,100,35,.04); pointer-events:none; user-select:none; line-height:1; }
.declaracion-inner { position:relative; z-index:1; }
.declaracion-title { font-family:'Playfair Display',serif; font-size:clamp(34px,4vw,54px); font-weight:700; color:#fff; line-height:1.12; margin-bottom:16px; text-align:center; }
.declaracion-title em { color:var(--gold2); font-style:italic; }
.declaracion-intro { font-size:15px; color:rgba(255,255,255,.5); line-height:1.8; max-width:600px; margin:0 auto 56px; text-align:center; }
.declaracion-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
.declaracion-card { background:rgba(255,255,255,.04); border:1px solid rgba(171,100,35,.15); border-radius:var(--rl); padding:28px 24px; transition:all .3s; }
.declaracion-card:hover { border-color:rgba(171,100,35,.4); background:rgba(255,255,255,.06); transform:translateY(-2px); }
.dc-num { font-family:'Playfair Display',serif; font-size:24px; font-weight:900; color:var(--gold2); margin-bottom:12px; }
.declaracion-card h3 { font-size:16px; font-weight:700; color:#fff; margin-bottom:8px; }
.declaracion-card p { font-size:13px; color:rgba(255,255,255,.55); line-height:1.7; }

/* ═══════════════════════════════════════
   PERFIL DEL EGRESADO
═══════════════════════════════════════ */
.perfil-egresado { background:var(--parch); padding:110px 8vw; }
.perfil-top { text-align:center; margin-bottom:56px; }
.perfil-top h2 { font-family:'Playfair Display',serif; font-size:clamp(34px,4vw,54px); font-weight:700; color:var(--forest); line-height:1.12; margin-bottom:16px; }
.perfil-top h2 em { color:var(--gold); font-style:italic; }
.perfil-top p { font-size:15px; color:var(--muted); line-height:1.8; max-width:600px; margin:0 auto; }
.perfil-traits { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
.perfil-trait { background:var(--white); border-radius:var(--rl); padding:32px 24px; border:1.5px solid transparent; transition:all .3s; text-align:center; }
.perfil-trait:hover { border-color:rgba(171,100,35,.3); box-shadow:0 12px 36px rgba(65,36,4,.1); transform:translateY(-3px); }
.pt-icon { font-size:32px; margin-bottom:14px; display:block; }
.perfil-trait h3 { font-family:'Playfair Display',serif; font-size:18px; font-weight:700; color:var(--forest); margin-bottom:10px; }
.perfil-trait p { font-size:13.5px; color:var(--muted); line-height:1.7; }

/* ═══════════════════════════════════════
   PORTAL EDUCATIVO
═══════════════════════════════════════ */
.portal-educativo { background:var(--forest); padding:80px 8vw; border-top:2px solid rgba(171,100,35,.18); border-bottom:2px solid rgba(171,100,35,.18); }
.portal-header { text-align:center; margin-bottom:48px; }
.portal-header h2 { font-family:'Playfair Display',serif; font-size:clamp(28px,3.5vw,46px); font-weight:700; color:#fff; line-height:1.1; }
.portal-header h2 em { color:var(--gold2); font-style:italic; }
.portal-header p { font-size:14.5px; color:rgba(255,255,255,.45); margin-top:14px; max-width:540px; margin-left:auto; margin-right:auto; }
.portal-cards { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
.portal-card { background:rgba(255,255,255,.04); border:1px solid rgba(171,100,35,.2); border-radius:var(--rl); padding:36px 28px; text-align:center; transition:all .3s; display:flex; flex-direction:column; }
.portal-card:hover { border-color:var(--gold); background:rgba(255,255,255,.06); transform:translateY(-3px); box-shadow:0 16px 48px rgba(0,0,0,.2); }
.pc-icon { font-size:36px; margin-bottom:16px; display:block; }
.portal-card h3 { font-family:'Playfair Display',serif; font-size:20px; font-weight:700; color:#fff; margin-bottom:10px; }
.portal-card p { font-size:13.5px; color:rgba(255,255,255,.55); line-height:1.7; margin-bottom:14px; }
.pc-user { font-size:11px; color:var(--gold); letter-spacing:.06em; display:block; margin-bottom:20px; font-weight:600; }
.btn-portal { display:inline-block; padding:12px 24px; background:var(--gold); border:none; border-radius:8px; font-size:13px; font-weight:600; color:var(--forest); cursor:pointer; font-family:'Outfit',sans-serif; transition:all .2s; text-decoration:none; margin-top:auto; }
.btn-portal:hover { background:var(--gold2); transform:translateY(-1px); box-shadow:0 8px 24px rgba(171,100,35,.35); }

/* ═══════════════════════════════════════
   DEVOCIONAL
═══════════════════════════════════════ */
.devocional { background:var(--parch); padding:64px 8vw; text-align:center; }
.devocional-inner { max-width:640px; margin:0 auto; }
.devocional-cross { font-size:32px; color:var(--gold); margin-bottom:12px; }
.devocional-label { font-size:10px; font-weight:700; color:var(--gold); letter-spacing:.14em; text-transform:uppercase; margin-bottom:20px; }
.devocional-verse { font-family:'Playfair Display',serif; font-size:clamp(20px,2.5vw,30px); font-weight:400; font-style:italic; color:var(--forest); line-height:1.6; margin-bottom:16px; border:none; padding:0; }
.devocional-cite { font-size:13px; color:var(--muted); font-style:normal; letter-spacing:.04em; }

/* ═══════════════════════════════════════
   EXALUMNOS
═══════════════════════════════════════ */
.exalumnos-section { background:var(--cream); padding:80px 8vw; }
.exalumnos-inner { max-width:800px; margin:0 auto; }
.exalumnos-text { margin-bottom:32px; }
.exalumnos-text h2 { font-family:'Playfair Display',serif; font-size:clamp(28px,3.5vw,46px); font-weight:700; color:var(--forest); line-height:1.12; margin-bottom:18px; }
.exalumnos-text h2 em { color:var(--gold); font-style:italic; }
.exalumnos-text p { font-size:15px; color:var(--muted); line-height:1.8; margin-bottom:12px; }

/* ═══════════════════════════════════════
   EMPLEOS
═══════════════════════════════════════ */
.empleos-section { background:var(--forest); padding:56px 8vw; }
.empleos-inner { max-width:700px; margin:0 auto; text-align:center; }
.empleos-icon { font-size:36px; margin-bottom:14px; }
.empleos-inner h3 { font-family:'Playfair Display',serif; font-size:clamp(22px,2.5vw,32px); font-weight:700; color:#fff; margin-bottom:14px; }
.empleos-inner p { font-size:14px; color:rgba(255,255,255,.5); line-height:1.75; margin-bottom:28px; }

/* ═══════════════════════════════════════
   NEW SECTIONS — RESPONSIVE
═══════════════════════════════════════ */
@media(max-width:1100px){
  .filosofia-pillars{ grid-template-columns:repeat(2,1fr); }
  .declaracion-grid{ grid-template-columns:repeat(2,1fr); }
  .perfil-traits{ grid-template-columns:repeat(2,1fr); }
  .portal-cards{ grid-template-columns:repeat(2,1fr); }
}
@media(max-width:900px){
  .filosofia{ padding:72px 6vw; }
  .declaracion-fe{ padding:72px 6vw; }
  .perfil-egresado{ padding:72px 6vw; }
  .portal-educativo{ padding:56px 6vw; }
  .devocional{ padding:48px 6vw; }
  .exalumnos-section{ padding:56px 6vw; }
  .empleos-section{ padding:44px 6vw; }
  .declaracion-grid{ grid-template-columns:1fr; }
  .portal-cards{ grid-template-columns:1fr; }
}
@media(max-width:600px){
  .filosofia{ padding:56px 5vw; }
  .filosofia-title{ font-size:clamp(28px,8vw,40px); }
  .filosofia-pillars{ grid-template-columns:1fr; gap:12px; }
  .filosofia-pillar{ padding:24px 18px; }
  .declaracion-fe{ padding:56px 5vw; }
  .declaracion-title{ font-size:clamp(28px,8vw,40px); }
  .declaracion-grid{ gap:10px; }
  .declaracion-card{ padding:22px 18px; }
  .perfil-egresado{ padding:56px 5vw; }
  .perfil-top h2{ font-size:clamp(28px,8vw,40px); }
  .perfil-traits{ grid-template-columns:1fr; gap:12px; }
  .perfil-trait{ padding:24px 18px; }
  .portal-educativo{ padding:48px 5vw; }
  .portal-header h2{ font-size:clamp(24px,7vw,36px); }
  .portal-cards{ gap:12px; }
  .portal-card{ padding:28px 20px; }
  .devocional{ padding:40px 5vw; }
  .devocional-verse{ font-size:clamp(18px,5vw,24px); }
  .exalumnos-section{ padding:48px 5vw; }
  .exalumnos-text h2{ font-size:clamp(24px,7vw,36px); }
  .empleos-section{ padding:36px 5vw; }
}
@media(max-width:390px){
  .filosofia{ padding:48px 4vw; }
  .declaracion-fe{ padding:48px 4vw; }
  .perfil-egresado{ padding:48px 4vw; }
  .portal-educativo{ padding:40px 4vw; }
  .devocional{ padding:36px 4vw; }
  .exalumnos-section{ padding:40px 4vw; }
  .empleos-section{ padding:32px 4vw; }
}
"""

# ═══════════════════════════════════════════════════════
# NEW HTML SECTIONS
# ═══════════════════════════════════════════════════════

filosofia_html = """
<!-- ─── FILOSOFÍA EDUCATIVA ─── -->
<section class="filosofia" id="filosofia">
  <div class="section-label"><span>Filosofía educativa</span></div>
  <div class="filosofia-grid">
    <div class="filosofia-text reveal">
      <h2 class="filosofia-title">Formación <em>integral</em> con propósito eterno</h2>
      <p class="filosofia-desc">En el Instituto Evangélico Virginia Sapp creemos que la verdadera educación transforma al ser humano en todas sus dimensiones. Nuestra filosofía se fundamenta en principios bíblicos que orientan cada aspecto de la formación académica, espiritual y social de nuestros estudiantes.</p>
    </div>
    <div class="filosofia-pillars">
      <div class="filosofia-pillar reveal">
        <div class="fp-icon">📖</div>
        <h3>Principios Bíblicos</h3>
        <p>Toda enseñanza parte de la Palabra de Dios como fuente de verdad, sabiduría y dirección para la vida.</p>
      </div>
      <div class="filosofia-pillar reveal">
        <div class="fp-icon">🏆</div>
        <h3>Excelencia Académica</h3>
        <p>Preparamos estudiantes competentes, con pensamiento crítico, capacidad investigativa y dominio bilingüe.</p>
      </div>
      <div class="filosofia-pillar reveal">
        <div class="fp-icon">🌱</div>
        <h3>Formación del Carácter</h3>
        <p>Desarrollamos integridad, disciplina, respeto y responsabilidad social desde la primera infancia.</p>
      </div>
      <div class="filosofia-pillar reveal">
        <div class="fp-icon">🌍</div>
        <h3>Liderazgo Transformador</h3>
        <p>Formamos líderes con visión de servicio, capaces de impactar positivamente Honduras y el mundo.</p>
      </div>
      <div class="filosofia-pillar reveal">
        <div class="fp-icon">💡</div>
        <h3>Innovación Pedagógica</h3>
        <p>Integramos metodologías activas y tecnología educativa, manteniendo siempre nuestros fundamentos de fe.</p>
      </div>
      <div class="filosofia-pillar reveal">
        <div class="fp-icon">❤️</div>
        <h3>Comunidad de Amor</h3>
        <p>Cada estudiante es valorado como hijo de Dios, en un ambiente de cuidado, respeto y pertenencia.</p>
      </div>
    </div>
  </div>
</section>
"""

declaracion_html = """
<!-- ─── DECLARACIÓN DE FE ─── -->
<section class="declaracion-fe" id="declaracion-fe">
  <div class="declaracion-inner">
    <div class="section-label" style="justify-content:center"><span style="color:var(--gold2)">Identidad cristiana</span></div>
    <h2 class="declaracion-title reveal">Lo que <em>creemos</em></h2>
    <p class="declaracion-intro reveal">Como institución evangélica Cristocéntrica, nuestra fe es el fundamento de todo lo que somos y hacemos. Estas convicciones guían nuestra misión educativa.</p>
    <div class="declaracion-grid reveal">
      <div class="declaracion-card">
        <div class="dc-num">I</div>
        <h3>La Biblia</h3>
        <p>Creemos que la Biblia es la Palabra de Dios inspirada, infalible y la máxima autoridad en materia de fe, conducta y enseñanza.</p>
      </div>
      <div class="declaracion-card">
        <div class="dc-num">II</div>
        <h3>Dios Trino</h3>
        <p>Creemos en un solo Dios que se manifiesta en tres personas: Padre, Hijo y Espíritu Santo, creador y sustentador de todo.</p>
      </div>
      <div class="declaracion-card">
        <div class="dc-num">III</div>
        <h3>Jesucristo</h3>
        <p>Creemos en Jesucristo como Señor y Salvador, Dios encarnado, quien murió y resucitó para la redención de la humanidad.</p>
      </div>
      <div class="declaracion-card">
        <div class="dc-num">IV</div>
        <h3>Formación Integral</h3>
        <p>Creemos que la educación debe formar al ser humano de manera integral: espiritual, moral, intelectual, social y físicamente.</p>
      </div>
      <div class="declaracion-card">
        <div class="dc-num">V</div>
        <h3>Servicio al Prójimo</h3>
        <p>Creemos en el llamado a servir a los demás con amor, compasión y generosidad, siguiendo el ejemplo de Cristo.</p>
      </div>
      <div class="declaracion-card">
        <div class="dc-num">VI</div>
        <h3>Transformación Social</h3>
        <p>Creemos que la educación cristiana contribuye a la transformación positiva de la sociedad hondureña y del mundo.</p>
      </div>
    </div>
  </div>
</section>
"""

perfil_html = """
<!-- ─── PERFIL DEL EGRESADO ─── -->
<section class="perfil-egresado" id="perfil-egresado">
  <div class="perfil-inner">
    <div class="section-label"><span>Perfil del egresado</span></div>
    <div class="perfil-top reveal">
      <h2>Así formamos a los <em>líderes</em> del mañana</h2>
      <p>Cada estudiante que egresa del Instituto Virginia Sapp lleva consigo herramientas académicas, espirituales y de carácter para transformar su entorno.</p>
    </div>
    <div class="perfil-traits reveal">
      <div class="perfil-trait">
        <div class="pt-icon">🎓</div>
        <h3>Excelencia Académica</h3>
        <p>Dominio bilingüe, pensamiento analítico y preparación sólida para la educación superior.</p>
      </div>
      <div class="perfil-trait">
        <div class="pt-icon">✝️</div>
        <h3>Fundamento Espiritual</h3>
        <p>Fe personal en Cristo, conocimiento bíblico y convicción de principios eternos.</p>
      </div>
      <div class="perfil-trait">
        <div class="pt-icon">🤝</div>
        <h3>Liderazgo Servicial</h3>
        <p>Capacidad de liderar con humildad, integridad y compromiso con el bienestar de su comunidad.</p>
      </div>
      <div class="perfil-trait">
        <div class="pt-icon">🌎</div>
        <h3>Responsabilidad Social</h3>
        <p>Conciencia cívica, sensibilidad social y compromiso con el desarrollo de Honduras.</p>
      </div>
      <div class="perfil-trait">
        <div class="pt-icon">💡</div>
        <h3>Pensamiento Crítico</h3>
        <p>Capacidad para analizar, cuestionar constructivamente y proponer soluciones innovadoras.</p>
      </div>
      <div class="perfil-trait">
        <div class="pt-icon">❤️</div>
        <h3>Carácter Íntegro</h3>
        <p>Valores sólidos, disciplina personal y coherencia entre convicciones y acciones.</p>
      </div>
    </div>
  </div>
</section>
"""

portal_html = """
<!-- ─── PORTAL EDUCATIVO ─── -->
<section class="portal-educativo" id="portal-educativo">
  <div class="portal-inner">
    <div class="section-label" style="justify-content:center"><span style="color:var(--gold2)">Accesos institucionales</span></div>
    <div class="portal-header reveal">
      <h2>Portal <em>Educativo</em></h2>
      <p>Accede a las herramientas digitales del Instituto Virginia Sapp. Si ya eres parte de nuestra comunidad educativa, estos son tus accesos directos.</p>
    </div>
    <div class="portal-cards reveal">
      <div class="portal-card">
        <div class="pc-icon">🖥️</div>
        <h3>Plataforma Académica</h3>
        <p>Consulta calificaciones, comunicados, tareas y reportes de progreso escolar en tiempo real.</p>
        <span class="pc-user">Para padres de familia y estudiantes activos</span>
        <a href="https://portal.edubox.app/login/virginiasapp" target="_blank" rel="noopener" class="btn-portal">Ingresar a la plataforma →</a>
      </div>
      <div class="portal-card">
        <div class="pc-icon">📋</div>
        <h3>Matrícula en Línea</h3>
        <p>Realiza el proceso de matrícula y renovación de forma rápida y segura desde cualquier lugar.</p>
        <span class="pc-user">Para familias con matrícula activa o en proceso</span>
        <a href="https://virginiasapp.edubox.app/core_sc/control_matricula_login/" target="_blank" rel="noopener" class="btn-portal">Ir a matrícula →</a>
      </div>
      <div class="portal-card">
        <div class="pc-icon">📝</div>
        <h3>Solicitud de Admisión</h3>
        <p>Inicia el proceso de admisión para tu hijo/a. Completa la solicitud y nuestro equipo te contactará.</p>
        <span class="pc-user">Para familias nuevas interesadas en CEEVS</span>
        <a href="#contacto" class="btn-portal">Solicitar admisión →</a>
      </div>
    </div>
  </div>
</section>
"""

devocional_html = """
<!-- ─── DEVOCIONAL / VERSÍCULO DEL DÍA ─── -->
<section class="devocional" id="devocional">
  <div class="devocional-inner reveal">
    <div class="devocional-cross">✝</div>
    <div class="devocional-label">Versículo del día</div>
    <blockquote class="devocional-verse">
      «Instruye al niño en su camino, y aun cuando fuere viejo no se apartará de él.»
    </blockquote>
    <cite class="devocional-cite">— Proverbios 22:6 (RVR1960)</cite>
    <!-- FUTURA INTEGRACIÓN: Conectar con API de versículos para rotación diaria automática -->
  </div>
</section>
"""

exalumnos_html = """
<!-- ─── EXALUMNOS ─── -->
<section class="exalumnos-section" id="exalumnos">
  <div class="exalumnos-inner">
    <div class="section-label"><span>Comunidad de egresados</span></div>
    <div class="exalumnos-content reveal">
      <div class="exalumnos-text">
        <h2>Una vez Virginia Sapp, <em>siempre</em> Virginia Sapp</h2>
        <p>Más de seis décadas de egresados que llevan con orgullo el sello CEEVS. Nuestra comunidad de exalumnos es testimonio vivo de una formación que trasciende las aulas.</p>
        <p>Si eres exalumno/a del Instituto Evangélico Virginia Sapp, te invitamos a mantenerte conectado con tu alma máter. Comparte tu historia, inspira a las nuevas generaciones y sigue siendo parte de esta familia.</p>
      </div>
      <div class="exalumnos-cta">
        <a href="#contacto" class="btn-cta-main">Contactar como exalumno/a</a>
      </div>
    </div>
  </div>
</section>
"""

empleos_html = """
<!-- ─── EMPLEOS ─── -->
<section class="empleos-section" id="empleos">
  <div class="empleos-inner reveal">
    <div class="empleos-icon">👩‍🏫</div>
    <h3>Forma parte de nuestro equipo</h3>
    <p>En el Instituto Evangélico Virginia Sapp buscamos profesionales comprometidos con la educación cristiana, la excelencia académica y la formación integral. Si compartes nuestra visión, nos encantaría conocerte.</p>
    <a href="#contacto" class="btn-cta-ghost" style="border-color:rgba(171,100,35,.4);color:var(--gold2);">Enviar hoja de vida →</a>
  </div>
</section>
"""


# ═══════════════════════════════════════════════════════
# MODIFY EXISTING SECTIONS
# ═══════════════════════════════════════════════════════

def join(arr):
    return '\n'.join(arr)

# --- Modify navbar: update CTA and links ---
navbar_str = join(navbar)

# Replace Plataforma nav ghost button with Portal Educativo
navbar_str = navbar_str.replace(
    'href="https://portal.edubox.app/login/virginiasapp" target="_blank" rel="noopener" class="btn-nav-ghost"',
    'href="#portal-educativo" class="btn-nav-ghost"'
)
navbar_str = navbar_str.replace(
    '🖥&nbsp; Plataforma',
    '🖥&nbsp; Portal'
)

# Add Filosofía link to desktop nav
navbar_str = navbar_str.replace(
    '<li><a href="#niveles">Niveles</a></li>',
    '<li><a href="#filosofia">Filosofía</a></li>\n    <li><a href="#niveles">Niveles</a></li>'
)

# Add Portal to desktop nav
navbar_str = navbar_str.replace(
    '<li><a href="#contacto">Contacto</a></li>',
    '<li><a href="#portal-educativo">Portal</a></li>\n    <li><a href="#contacto">Contacto</a></li>'
)

# Update mobile menu: add Filosofía and Portal links
navbar_str = navbar_str.replace(
    '<a href="#historia" onclick="toggleMobileMenu()"><span class="mm-num">02</span> Historia</a>',
    '<a href="#historia" onclick="toggleMobileMenu()"><span class="mm-num">02</span> Historia</a>\n      <a href="#filosofia" onclick="toggleMobileMenu()"><span class="mm-num">03</span> Filosofía</a>'
)
# Renumber remaining mobile links
navbar_str = navbar_str.replace('<span class="mm-num">03</span> Niveles', '<span class="mm-num">04</span> Niveles')
navbar_str = navbar_str.replace('<span class="mm-num">04</span> Admisiones', '<span class="mm-num">05</span> Admisiones')
navbar_str = navbar_str.replace('<span class="mm-num">05</span> Galería', '<span class="mm-num">06</span> Galería')
# Replace old 06 Contacto with Portal + Contacto
navbar_str = navbar_str.replace(
    '<a href="#contacto" onclick="toggleMobileMenu()"><span class="mm-num">06</span> Contacto</a>',
    '<a href="#portal-educativo" onclick="toggleMobileMenu()"><span class="mm-num">07</span> Portal</a>\n      <a href="#contacto" onclick="toggleMobileMenu()"><span class="mm-num">08</span> Contacto</a>'
)

# Update mobile menu platform button
navbar_str = navbar_str.replace(
    'href="https://portal.edubox.app/login/virginiasapp" target="_blank" rel="noopener" class="mm-btn-ghost"',
    'href="#portal-educativo" class="mm-btn-ghost"'
)
navbar_str = navbar_str.replace(
    '>🖥&nbsp; Plataforma académica</a>',
    '>🖥&nbsp; Portal Educativo</a>'
)


# --- Modify Hero: improve copy ---
hero_str = join(hero)
hero_str = hero_str.replace(
    '<span class="line3">Educación Cristocéntrica desde 1962</span>',
    '<span class="line3">Educación Cristocéntrica Bilingüe · Tegucigalpa, Honduras</span>'
)


# --- Modify Footer: add new links ---
footer_str = join(footer_sec)
footer_str = footer_str.replace(
    '<li><a href="#testimonios">Testimonios</a></li>',
    '<li><a href="#testimonios">Testimonios</a></li>\n      <li><a href="#exalumnos">Exalumnos</a></li>\n      <li><a href="#empleos">Empleos</a></li>'
)


# --- Modify Script: add section XP for new sections ---
script_str = join(script_block)

script_str = script_str.replace(
    "const sectionXP = {historia:10,niveles:8,valores:5,quiz:0,admisiones:10,galeria:5,testimonios:5,contacto:8};",
    "const sectionXP = {historia:10,filosofia:5,'declaracion-fe':5,niveles:8,valores:5,'perfil-egresado':5,quiz:0,admisiones:10,'portal-educativo':3,galeria:5,testimonios:5,exalumnos:3,contacto:8};"
)

script_str = script_str.replace(
    "const sectionBadge = {historia:'history',niveles:'explorer',valores:'explorer',contacto:'contact'};",
    "const sectionBadge = {historia:'history',filosofia:'explorer',niveles:'explorer',valores:'explorer','perfil-egresado':'knower',contacto:'contact'};"
)

script_str = script_str.replace(
    "['historia','niveles','valores','admisiones','galeria','testimonios','contacto'].forEach(id=>{",
    "['historia','filosofia','declaracion-fe','niveles','valores','perfil-egresado','admisiones','portal-educativo','galeria','testimonios','exalumnos','contacto'].forEach(id=>{"
)

script_str = script_str.replace(
    "valores:['✦','¡Conociste nuestros valores!','+5 XP'],",
    "valores:['✦','¡Conociste nuestros valores!','+5 XP'],\n        filosofia:['📖','¡Exploraste nuestra filosofía!','+5 XP · Fundamentos de CEEVS'],\n        'declaracion-fe':['✝️','¡Conociste nuestra fe!','+5 XP · Identidad cristiana'],\n        'perfil-egresado':['🎓','¡Viste el perfil del egresado!','+5 XP'],\n        'portal-educativo':['🖥️','¡Revisaste el portal!','+3 XP'],\n        exalumnos:['🏫','¡Comunidad de egresados!','+3 XP'],"
)


# ═══════════════════════════════════════════════════════
# ASSEMBLE FINAL FILE
# ═══════════════════════════════════════════════════════
# New section order:
# Hero → Marquee → Historia → Misión/Visión → Filosofía → Declaración de Fe
# → Valores → Perfil Egresado → Niveles → Quiz → Admisiones → Portal Educativo
# → Galería → Testimonios → Exalumnos → Empleos → FAQ → Devocional → Contacto → Footer

# Build final file by concatenating all parts with proper line endings
final_lines = []

# 1. Head + CSS + new CSS + </style>
final_lines.extend(head_and_css)
final_lines.extend(new_css.split('\n'))
final_lines.append(style_close)

# 2. </head><body>
final_lines.extend(head_close_body)

# 3. Body sections in new order
final_lines.extend(cursor_hud_toast)
final_lines.extend(navbar_str.split('\n'))
final_lines.extend(hero_str.split('\n'))
final_lines.extend(marquee)
final_lines.extend(historia)
final_lines.extend(mision)              # Moved up (was after niveles)
final_lines.extend(filosofia_html.split('\n'))   # NEW
final_lines.extend(declaracion_html.split('\n')) # NEW
final_lines.extend(valores)
final_lines.extend(perfil_html.split('\n'))      # NEW
final_lines.extend(niveles)             # Moved down (was after historia)
final_lines.extend(quiz)
final_lines.extend(admisiones)
final_lines.extend(portal_html.split('\n'))      # NEW (replaces padres band)
final_lines.extend(galeria)             # Moved up (was after testimonios)
final_lines.extend(testimonios)         # Moved down (was before galeria)
final_lines.extend(exalumnos_html.split('\n'))   # NEW
final_lines.extend(empleos_html.split('\n'))     # NEW
final_lines.extend(faq)                 # Moved down (was before testimonios)
final_lines.extend(devocional_html.split('\n'))  # NEW
final_lines.extend(contacto)
final_lines.extend(footer_str.split('\n'))

# 4. Script block
final_lines.extend(pre_script)
final_lines.extend(script_str.split('\n'))

# 5. WA FAB + closing
final_lines.extend(wa_fab)
final_lines.extend(html_close)

final = '\n'.join(final_lines)

# Write output
with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    f.write(final)

with open(COPY_FILE, 'w', encoding='utf-8') as f:
    f.write(final)

total_lines = len(final.split('\n'))
print(f"\nTransformation complete!")
print(f"   Output: {OUTPUT_FILE}")
print(f"   Copy:   {COPY_FILE}")
print(f"   Total lines: {total_lines}")
print(f"\nNew section order:")
print("   1. Hero → 2. Marquee → 3. Historia → 4. Misión/Visión")
print("   5. Filosofía (NEW) → 6. Declaración de Fe (NEW)")
print("   7. Valores → 8. Perfil Egresado (NEW) → 9. Niveles")
print("   10. Quiz → 11. Admisiones → 12. Portal Educativo (NEW)")
print("   13. Galería → 14. Testimonios → 15. Exalumnos (NEW)")
print("   16. Empleos (NEW) → 17. FAQ → 18. Devocional (NEW)")
print("   19. Contacto → 20. Footer")
