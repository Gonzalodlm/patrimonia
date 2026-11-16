# Patrimonia

Patrimonia ([patrimonia-plum.vercel.app](https://patrimonia-plum.vercel.app); el dominio patrimonia.uy todavía no está comprado) es una web gratuita y de código abierto que enseña a armar una cartera de inversión a largo plazo y un plan para el patrimonio. No cobra, no vende productos y no recibe comisiones. Es una guía educativa, no un asesoramiento.

Este documento está escrito para alguien que no programa.

## Qué hay en cada carpeta

| Carpeta o archivo | Qué es |
|---|---|
| `datos/` | Todo lo que se puede cambiar sin tocar código: supuestos, reglas de las carteras y perfiles. |
| `datos/clases.json` | Las clases de activo que usa Patrimonia, con su nombre en castellano y su nombre en el Excel de J.P. Morgan. |
| `datos/restricciones.json` | Las reglas de cada cartera (simple y diversificada): qué clases usa y cuánto puede pesar cada una. |
| `datos/perfiles.json` | Los cinco perfiles de riesgo y la volatilidad que apunta cada uno. |
| `datos/supuestos.ejemplo.json` | Supuestos **inventados**, para que el sitio funcione sin los datos reales. |
| `datos/supuestos-2027.json` | Los supuestos reales de J.P. Morgan. **No se sube al repositorio** (ver más abajo). |
| `datos/frontera.json` | Se genera solo al compilar. No se edita a mano. |
| `referencia/` | El informe y el Excel de J.P. Morgan. **No se sube al repositorio.** |
| `src/motor/` | El motor que calcula la frontera eficiente. |
| `scripts/` | Los dos programas auxiliares: extraer los supuestos del Excel y generar la frontera. |
| `tests/` | Las pruebas automáticas del motor. |

## Cómo levantar el proyecto en tu computadora

Hace falta tener instalado [Node.js](https://nodejs.org) (versión 24 o más nueva).

1. Abrí una terminal en la carpeta del proyecto.
2. La primera vez, instalá las dependencias: `npm install`
3. Levantá el sitio: `npm run dev`
4. Abrí [http://localhost:3000](http://localhost:3000) en el navegador.

Otros comandos útiles:

| Comando | Qué hace |
|---|---|
| `npm test` | Corre todas las pruebas. Tienen que pasar antes de publicar cualquier cambio. |
| `npm run frontera` | Recalcula `datos/frontera.json` y muestra un resumen. |
| `npm run build` | Compila el sitio como se publica. |

Si no está el archivo de supuestos reales, el sitio usa los de ejemplo y muestra un aviso bien visible. Las pruebas que necesitan los datos reales aparecen como "skipped" (salteadas).

## Cómo actualizar los supuestos cuando salga la edición nueva

J.P. Morgan publica sus *Long-Term Capital Market Assumptions* una vez por año. Para pasar, por ejemplo, a la edición 2028:

1. Guardá el informe y el Excel de la matriz en USD en `referencia/`.
2. Extraé los números del Excel:
   ```
   npm run extraer -- referencia/NOMBRE-DEL-EXCEL.xlsx --edicion 2028 --fecha 2027-09-30
   ```
   La fecha es la de los datos del informe. Esto crea `datos/supuestos-2028.json`. El sitio usa automáticamente la edición más nueva que encuentre.
3. Compará algunos números del archivo nuevo con las páginas de la matriz en el PDF.
4. Corré `npm test`. Las pruebas de referencia de la edición anterior van a fallar, porque los números cambiaron. Eso es esperable: hay que recalcular los valores de referencia con otro programa (por ejemplo cvxpy o scipy) y reemplazarlos en `tests/referencia.test.ts`.
5. Cargá el archivo nuevo en Vercel (ver "Publicación").

Si J.P. Morgan cambia el nombre de alguna clase en el Excel, el paso 2 se detiene y dice cuál no encontró. Corregí el nombre en la columna `nombreInforme` de `datos/clases.json`.

## Cómo cambiar las reglas de las carteras

Todo está en `datos/restricciones.json`. Los números van en porcentaje (20 quiere decir 20%).

- `topeGeneral`: peso máximo de cualquier clase en esa cartera.
- `topes`: topes más bajos para alguna clase en particular. Ejemplo: `{ "oro": 10 }`.
- `proporciones`: reglas dentro de un grupo. Ejemplo: que las acciones grandes de EE.UU. sean al menos la mitad de todas las acciones:
  ```json
  { "clase": "acciones_eeuu_grandes",
    "grupo": ["acciones_eeuu_grandes", "acciones_eeuu_chicas", "acciones_desarrollados_ex_eeuu", "acciones_emergentes"],
    "minimo": 50 }
  ```
- `clases`: qué clases entran en la cartera.

Después de cambiar algo, corré `npm run frontera` para ver el resultado y `npm test` para comprobar que todo sigue bien. Si las reglas no se pueden cumplir todas juntas (por ejemplo, dos clases con tope 40% que tienen que sumar 100%), el programa lo avisa y no compila.

Las pruebas de `tests/referencia.test.ts` sobre la cartera diversificada usan las reglas actuales: si las cambiás, esos valores también hay que recalcularlos.

Los perfiles y su volatilidad objetivo están en `datos/perfiles.json`.

## Cómo cambiar el test de perfil

Las preguntas, opciones y puntajes están en `datos/cuestionario.json`.

- Cada pregunta es de `tolerancia` (cómo reacciona la persona ante una caída) o de `capacidad` (cuánto riesgo puede asumir).
- `umbrales` dice desde cuántos puntos se pasa al perfil siguiente: con `[4, 8, 12, 16]`, de 0 a 3 es Conservador, de 4 a 7 Moderado conservador, y así.
- El perfil final es el más bajo de los dos bloques. Una opción con `perfilMaximo` pone un tope: por ejemplo, si la plata se usa en menos de 3 años, Conservador como máximo.
- Si se agrega una pregunta de tipo `carteras`, la página calcula sola los montos de cada opción a partir de las carteras reales (hoy el test no la usa).

Si cambiás, agregás o sacás preguntas, subí también el número `VERSION` en `src/componentes/plan/estado.ts`: quien ya había hecho el test lo vuelve a hacer, y conserva su situación y sus objetivos.

Después de cambiarlo, corré `npm test`: hay pruebas que comprueban que cada bloque llegue a 20 puntos y que los cortes den el perfil esperado.

## Cómo cambiar los criterios del plan patrimonial

Están en `datos/criterios-plan.json`:

- `plazos`: qué cartera le toca a cada objetivo según cuántos años faltan. Siempre con tope en el perfil de la persona.
- `fondoEmergencia`: cuántos meses de gastos (3, o 6 si en el test respondió ingresos variables o no fijos).
- `deudas`: qué tipos se cancelan siempre antes de invertir y cuáles nunca. Las demás, si su tasa supera el retorno esperado.
- `retiro`: el multiplicador de la regla del 4% (25 veces el gasto anual) y la edad de retiro sugerida.

El orden del plan es fijo: primero el colchón, después las deudas a cancelar y después los objetivos por prioridad (dentro de cada prioridad, el que vence antes). Las probabilidades salen de simular 500 escenarios con una semilla fija, así que los mismos datos dan siempre el mismo resultado.

## Textos con el modelo de lenguaje (Gemini)

La explicación de la cartera y el resumen del plan los redacta Gemini a partir de números ya calculados. El modelo no calcula ni decide nada: si su texto trae un número que no estaba en los datos, se descarta y se muestra el texto de plantilla. Sin clave, o si el modelo falla o tarda, la web usa siempre las plantillas.

Para activarlo:

1. En [Google AI Studio](https://aistudio.google.com) creá una clave de API. Hoy se usa el **plan gratuito** (proyecto sin facturación): Google puede usar y leer lo que se le envía, por eso solo se mandan números anónimos; según sus términos no se puede usar para visitantes de la Unión Europea, Suiza ni Reino Unido; y tiene un cupo diario (unos 500 pedidos con Flash-Lite); cuando se agota, la web usa las plantillas. Si se activa la facturación pasa a ser plan pago: hay que cambiar el texto de la página de privacidad.
2. Si algún día pasás al plan pago, poné un tope de gasto mensual (presupuesto con alerta) en Google Cloud.
3. Cargá la clave como `GEMINI_API_KEY` en Vercel (y en `.env.local` para probar en tu computadora).

Qué se le manda: el perfil, porcentajes y montos ya calculados, y el tipo de cada objetivo (casa, retiro…). Nunca el mail, el nombre de los objetivos ni nada escrito por la persona. El servidor solo acepta pedidos con esa forma exacta, limita los pedidos por IP y guarda en caché las respuestas iguales.

Para cambiar de proveedor alcanza con escribir otra implementación en `src/servidor/modelo/` y elegirla en `src/servidor/modelo/index.ts`. Las instrucciones que recibe el modelo están en `src/textos/instrucciones.ts`.

## Mails del aviso anual (Neon)

Se guarda solo el mail, la fecha y la versión del texto de consentimiento (`src/lib/consentimiento.ts`: si cambiás el texto, cambiá la versión).

Para activarlo:

1. En Vercel, en Storage o en el Marketplace, agregá **Neon** (plan gratuito). Eso carga `DATABASE_URL` en el proyecto.
2. Cargá `SECRETO_BAJAS` con una frase larga al azar. Sirve para firmar los enlaces de baja: no la cambies una vez que mandaste mails.
3. Copiá `DATABASE_URL` y `SECRETO_BAJAS` en `.env.local` y creá la tabla una sola vez: `npm run mails -- crear`.

Una vez por año, para mandar el aviso: `npm run mails -- exportar` crea `suscriptores.csv` con cada mail y su enlace personal para darse de baja (la página `/baja`). Ese enlace tiene que ir en cada mail. El archivo no se sube al repositorio.

## Cómo cambiar la lista de ETFs

Está en `datos/etfs.json`, separada por clase de activo. Para cada ETF: nombre, emisor, ticker, bolsa, ISIN, domicilio, moneda, si acumula o distribuye, costo anual (TER), índice y tipo. Reglas:

- Dentro de cada clase, ordenados alfabéticamente por emisor. Hasta cuatro por clase.
- Verificá cada dato en [justETF](https://www.justetf.com) o en la página del emisor antes de agregarlo, y actualizá la fecha `verificado`.
- `nota` explica en qué se diferencia el ETF del índice que usa el informe, si hace falta.

`npm test` revisa que cada ISIN tenga el dígito verificador correcto, que el orden sea el correcto y que ninguna clase quede sin opciones.

## Cómo funciona el motor, en pocas palabras

Para cada nivel de riesgo, el motor busca la combinación de clases de activo que da el mayor retorno esperado sin pasar ese riesgo y respetando las reglas. Eso es la **frontera eficiente** de Markowitz. Se calcula una sola vez al compilar (200 carteras por cada tipo de cartera, más la de cada perfil) y el navegador solo lee el resultado. Los mismos datos dan siempre las mismas carteras.

- Para optimizar se usa el **retorno aritmético** de cada clase, y la volatilidad y las correlaciones para medir el riesgo.
- Al usuario se le muestra el **retorno compuesto**, que es el que importa para proyectar a muchos años. Se calcula con la fórmula lognormal `(1 + r) / √(1 + σ²/(1 + r)²) − 1`, que reproduce exactamente el retorno compuesto que publica J.P. Morgan para cada clase.
- El **ratio de Sharpe** es (retorno aritmético − el de la liquidez) / volatilidad, como en el informe.

## Los datos de J.P. Morgan y el repositorio público

El informe de J.P. Morgan dice "not for retail distribution" y tiene copyright. Hasta resolver si se pueden publicar los números:

- `referencia/`, `datos/supuestos-*.json` y `datos/frontera.json` están en `.gitignore`: nunca se suben a GitHub.
- En Vercel, los supuestos reales se cargan como una variable de entorno secreta, `SUPUESTOS_JSON_BASE64`, que contiene el archivo de supuestos codificado en base64. Para obtener ese texto, en una terminal Git Bash: `base64 -w0 datos/supuestos-2027.json`. En PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("datos\supuestos-2027.json"))`.

Ojo: aunque los números no estén en el repositorio, el sitio publicado los usa y los muestra (las carteras y el gráfico de las clases). Publicar el sitio con datos reales es, en la práctica, publicarlos.

## Publicar el sitio

1. **GitHub.** El código está en [github.com/Gonzalodlm/patrimonia](https://github.com/Gonzalodlm/patrimonia). Para subir cambios: `git push`. Los archivos de J.P. Morgan no se suben: están en `.gitignore`.
2. **Vercel.** Ya está creado: el proyecto `patrimonia`, conectado al repositorio, publicado en [patrimonia-plum.vercel.app](https://patrimonia-plum.vercel.app). Ya tiene cargadas `SUPUESTOS_JSON_BASE64`, `SECRETO_BAJAS` y `SITIO_URL`. El archivo `.vercelignore` impide que los archivos de J.P. Morgan se suban si alguien publica desde la computadora con `vercel deploy`.
3. **Variables de entorno** (Settings → Environment Variables), ver `.env.example`:
   - `SUPUESTOS_JSON_BASE64`: los supuestos reales (ver «Los datos de J.P. Morgan»). Sin esta variable el sitio sale con los datos de ejemplo y un aviso.
   - `GEMINI_API_KEY`: la clave de Gemini (plan gratuito).
   - `DATABASE_URL`: la carga sola Vercel al agregar Neon desde Storage o el Marketplace.
   - `SECRETO_BAJAS`: una frase larga al azar.
   - `SITIO_URL`: la dirección pública del sitio (la de Vercel, `https://….vercel.app`, hasta tener `https://patrimonia.uy`).
4. **Estadísticas.** En el proyecto de Vercel, pestaña Analytics, activá Web Analytics.
5. **Dominio.** En Settings → Domains agregá `patrimonia.uy` y cargá en tu proveedor del dominio los registros DNS que indique Vercel.
6. Volvé a desplegar (Deployments → Redeploy) para que tome las variables, y recorré el sitio entero una vez.

Cada `git push` a `main` publica una versión nueva. Cada cambio en otra rama genera una vista previa con su propia dirección.

## Seguridad, en pocas palabras

- **Lo que llega al modelo de lenguaje.** La API (`src/app/api/textos`) no reenvía lo que recibe: arma el pedido de nuevo solo con los campos conocidos (`src/textos/pedido.ts`), y cada campo tiene que ser una cifra o un valor de una lista fija. Cualquier otra cosa se descarta. Si agregás un dato nuevo al texto, hay que sumarlo ahí o no llega.
- **Política de contenido.** `next.config.ts` le indica al navegador que solo cargue código, estilos, letras e imágenes del propio sitio, y que solo mande datos al propio sitio. Si algún día sumás un servicio externo (un video, un mapa, otra estadística), hay que agregarlo en esa lista o el navegador lo bloquea.
- **Lo guardado en el navegador.** Se revisa campo por campo al leerlo (`src/componentes/plan/estado.ts`). Si cambiás las preguntas del test, subí el número `VERSION` de ese archivo: así nadie queda con respuestas viejas que ya no significan lo mismo.
- **El formulario del aviso por mail** solo aparece si están cargadas `DATABASE_URL` y `SECRETO_BAJAS`. Sin la base de datos, no se muestra.
- **Dirección del sitio.** Sale de `SITIO_URL` y, si falta, de la dirección que da Vercel. El sitio y el PDF nunca muestran un dominio que todavía no esté comprado.
- En Vercel, las claves conviene cargarlas marcadas como **Sensitive**: así nadie puede volver a leerlas desde el panel.

## Antes de lanzar

- [x] Decidir si se pueden publicar los supuestos de J.P. Morgan: Gonzalo decidió usarlos, sin cobrar (el informe sigue fuera del repositorio).
- [ ] Revisar con un abogado los avisos (`src/lib/avisos.ts`), la página de privacidad y el texto de consentimiento.
- [x] Texto de «Quién lo hace» (`src/componentes/landing/Secciones.tsx`).
- [x] Dirección del repositorio y mail de contacto en `src/lib/sitio.ts`.
- [ ] Comprar el dominio `patrimonia.uy` y apuntarlo a Vercel.
- [ ] Cargar las variables de entorno en Vercel, crear la tabla de mails (`npm run mails -- crear`) y probar una suscripción y una baja.
- [x] Probar que Gemini responde con la clave real (plan gratuito, probado el 14/11/2026).
- [ ] Revisar en la página de privacidad la región donde Neon guarda los mails, una vez creada la base.

## Licencia

Código bajo licencia MIT (ver `LICENSE`). Los supuestos de mercado son de J.P. Morgan Asset Management y no forman parte de esta licencia.
