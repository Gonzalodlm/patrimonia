# Patrimonia

Patrimonia ([patrimonia.uy](https://patrimonia.uy)) es una web gratuita y de código abierto que enseña a armar una cartera de inversión a largo plazo y un plan para el patrimonio. No cobra, no vende productos y no recibe comisiones. Es una guía educativa, no un asesoramiento.

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

## Licencia

Código bajo licencia MIT (ver `LICENSE`). Los supuestos de mercado son de J.P. Morgan Asset Management y no forman parte de esta licencia.
