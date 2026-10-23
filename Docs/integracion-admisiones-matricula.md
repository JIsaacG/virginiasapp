# Integración de Admisiones con Matrícula

La pestaña **Pre-inscripciones y admisiones** de `admin.html` conserva la bandeja y el expediente oficial existentes. Desde el detalle de cada solicitud el personal programa el examen y la entrevista, registra sus resultados, determina la decisión y puede autorizar la matrícula.

## Comprobaciones antes de matricular

Matrícula consulta `POST /api/matricula-admisiones.php` por HTTPS. Envía JSON con `parent_email`, `year` y un `request_id` aleatorio de 32 dígitos hexadecimales, más `X-CEEVS-Timestamp` y `X-CEEVS-Signature`. La firma es HMAC-SHA256 del texto `timestamp + LF + ruta + LF + cuerpo JSON original`; PHP rechaza marcas de tiempo con más de 60 segundos, cuerpos alterados, firmas inválidas e identificadores repetidos. La respuesta se autentica mediante TLS y solo entrega aspirantes que cumplen todos estos requisitos:

- El correo del padre o la madre coincide con la cuenta autenticada en el Portal de Padres.
- El ciclo incluye el año lectivo activo.
- La solicitud tiene nombre, fecha de nacimiento, grado y DNI hondureño de 13 dígitos.
- La decisión de admisión, el examen y la entrevista están aprobados.
- El personal autorizó explícitamente la matrícula.

Matrícula vuelve a consultar Admisiones al generar el resumen y al confirmar; en la confirmación hace una última consulta antes de insertar. Un identificador enviado por el navegador o una autorización antigua no sustituye la comprobación vigente. Si falla la red, la respuesta no coincide con el esquema esperado o no hay candidatos autorizados, Matrícula deniega el paso.

El proyecto no establece un puntaje mínimo de examen. La nota registrada es informativa (0–100) y el personal registra por separado el resultado **APROBADO/REPROBADO**. No se debe inferir “APROBADO” de la nota hasta que la institución defina ese umbral.

## Variables necesarias en los servidores

Configurar fuera del repositorio y por el mecanismo de secretos del hosting:

| Servicio | Variable | Uso |
|---|---|---|
| PHP de Virginia Sapp | `CEEVS_MATRICULA_SHARED_SECRET` | Clave HMAC para autenticar consultas entrantes de Matrícula; mínimo 32 caracteres. |
| Servicio Matrícula | `ADMISSIONS_API_URL` | URL HTTPS completa de `https://virginiasapp.edu.hn/api/matricula-admisiones.php`. |
| Servicio Matrícula | `MATRICULA_ADMISSIONS_SHARED_SECRET` | La misma clave HMAC configurada en PHP; mínimo 32 caracteres. |
| Servicio Matrícula | `MATRICULA_IDENTITY_HASH_KEY` | Clave institucional independiente para proteger el DNI en Matrícula; mínimo 32 caracteres. |
| PHP de Virginia Sapp | `CEEVS_PARENT_PORTAL_URL` | URL HTTPS institucional incluida en el correo de acceso al Portal de Padres. |

No reutilizar la clave de DNI como clave HMAC. No escribir valores de estas variables en Git, HTML, JavaScript, bitácoras o tickets. Coordinar una rotación de la clave HMAC en ambos servidores.

## Notificaciones

La programación se guarda antes de intentar enviar el correo. El panel muestra si el servidor de correo aceptó el envío; eso no confirma la entrega al buzón. El enlace al Portal de Padres solo se puede notificar cuando la solicitud cumple los requisitos vigentes de matrícula.

Este cambio agrega código y documentación locales. La configuración de variables, el despliegue, la base de datos y los servicios activos requieren el procedimiento operativo del hosting y no se realizan desde el repositorio.
