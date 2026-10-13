# Cordova con Docker: varias aplicaciones

Un contenedor proporciona las herramientas para todas tus aplicaciones. La carpeta
donde está `docker-compose.yml` se comparte completa con `/workspace`:

```yaml
working_dir: /workspace
volumes:
  - .:/workspace
```

Los cambios en esa carpeta se ven tanto en Windows como en el contenedor.
`app01/` y `app02/` son proyectos independientes y vacíos para desarrollar;
cada uno contiene su propio `www/`, `config.xml`, `package.json` y lockfile.
Sus identificadores Android son diferentes para poder instalar ambos.
`plantilla/` sirve para crear más proyectos con las mismas dependencias.

## 1. Arrancar desde Windows

Descomprime este ZIP en una carpeta nueva. Abre PowerShell en la carpeta que
contiene `docker-compose.yml`, con Docker Desktop iniciado en modo Linux:

```powershell
docker compose up -d --build
docker compose exec cordova bash
```

Entrarás en `/workspace`. La primera construcción descarga las herramientas y
puede tardar. Construir la imagen acepta las licencias del Android SDK.
Para compilar en Docker no necesitas configurar JAVA_HOME ni ANDROID_HOME en Windows.

## 2. Preparar y compilar una aplicación dentro del contenedor

```bash
cd /workspace/app01
npm ci
cordova prepare android
cordova build android --debug
```

`npm ci` instala las dependencias fijadas. `cordova prepare android` restaura
Android y registra automáticamente el plugin de geolocalización: no necesitas
ejecutar `cordova plugin add`. Para comprobarlo: `cordova plugin ls`.

APK en Windows, dentro de la carpeta descomprimida:
`app01/platforms/android/app/build/outputs/apk/debug/app-debug.apk`.
Puedes arrastrarlo al emulador de Android Studio para instalarlo.

Para trabajar en la segunda aplicación:

```bash
cd /workspace/app02
npm ci
cordova prepare android
cordova build android --debug
```

Su APK está en la misma ruta relativa, dentro de `app02/`.
Cada aplicación tiene sus propias dependencias y se compila por separado.

## 3. Crear otra aplicación con geolocalización incluida

Dentro del contenedor:

```bash
cd /workspace
cordova create app03 es.adolfo.app03 App03 --template /workspace/plantilla
cd app03
npm ci
cordova prepare android
cordova build android --debug
```

Para crear más, cambia `app03` (carpeta), `es.adolfo.app03` (identificador único)
y `App03` (nombre visible). La carpeta de destino debe ser nueva o estar vacía.
No necesitas modificar Docker Compose ni reconstruir la imagen al añadir apps.
Referencia: https://cordova.apache.org/docs/en/latest/guide/cli/template.html

## 4. Desarrollo diario

Edita `www/` en Windows con tu editor. Conserva la carga de `cordova.js` antes
de `js/app.js` y usa las APIs nativas a partir de `deviceready`.
El plugin está configurado; tú implementas la interfaz y la petición de ubicación.

Para recompilar tras editar tu código, dentro de la carpeta de esa app:

```bash
cordova build android --debug
```

No hace falta repetir `npm ci` cada vez. Úsalo al instalar el proyecto o restaurar
dependencias a partir del lockfile. Guarda los cambios de `package.json`,
`package-lock.json` y `config.xml` junto con tu código en Git.

Para salir del contenedor: `exit`. Para detenerlo, desde PowerShell en la raíz:
`docker compose stop`. Para volver a usarlo: `docker compose up -d` y
`docker compose exec cordova bash`.

## Aplicaciones que ya tienes

Copia la carpeta fuente de cada proyecto a esta raíz y entra en
`/workspace/NOMBRE_DE_CARPETA`. Conserva sus archivos de configuración y código.
La geolocalización preconfigurada se aplica a las dos apps incluidas y a las creadas
con `plantilla/`; los proyectos importados conservan sus propias dependencias.
Si proceden de Windows, restaura `node_modules`, `platforms` y `plugins` dentro
del contenedor a partir de sus archivos de proyecto, sin reutilizar los generados
en otro entorno. Los proyectos deben ser compatibles con las versiones de la imagen.

## Herramientas y archivos compartidos

Se mantienen las versiones del entorno anterior: Node 22.20.0, Cordova CLI 12,
Java 17, Gradle 8.7, Cordova Android 13.0.0 y geolocalización 5.0.0.
Las apps apuntan al SDK Android 34. Es una base para el curso y APK de depuración.
La imagen incluye los SDK y herramientas de la plantilla anterior y añade
las plataformas Android 35 y 36, y Build Tools 36.0.0. Así también dispone de
los SDK necesarios para proyectos que usen Cordova Android 14 o 15.
El Gradle del sistema inicia el wrapper; cada proyecto descarga la versión de
Gradle que necesita. No copies las preferencias de Gradle, AGP o SDK de una app
Cordova Android 13 a una app Cordova Android 15.

Los volúmenes `npm-cache`, `gradle-cache` y `android-state` guardan cachés y el
estado Android; el código está en el volumen compartido de la raíz. No se instala
ni compila ninguna aplicación automáticamente al arrancar el contenedor.
El `.gitignore` excluye dependencias y archivos generados de todas las apps.
`tooling/` se utiliza al construir la imagen: no tienes que ejecutar npm ahí.

## Corregir «No usable Android build tools ... Recommended version is 36.0.0»

Ese mensaje significa que el proyecto necesita Build Tools 36.0.0, ausentes en
la imagen anterior. Cordova Android 15 requiere también SDK Platform 36.
Esta revisión instala ambos al construir la imagen.

Si ya tienes proyectos, sustituye únicamente el `Dockerfile` de tu carpeta raíz
por el de este ZIP. Conserva tus carpetas de aplicaciones. Sal del contenedor
con `exit` y ejecuta en PowerShell, desde la raíz:

```powershell
docker compose up -d --build --force-recreate
docker compose exec cordova bash
```

Dentro del contenedor, para la aplicación del error:

```bash
cd /workspace/E2
cordova platform ls
cordova requirements android
cordova build android --debug
```

No es necesario eliminar la plataforma Android ni tus dependencias para instalar
el SDK faltante. Si solo quieres corregir el contenedor que está en ejecución,
puedes instalarlo ahí con `sdkmanager "platforms;android-36" "build-tools;36.0.0"`
y volver a compilar. Esa instalación manual se pierde al recrear el contenedor;
la modificación del Dockerfile conserva la solución en futuras construcciones.

El comando del laboratorio `cordova platform add android` no fija una versión.
Para nuevos proyectos del curso fuera de la plantilla, usa
`cordova platform add android@13.0.0` si quieres mantener el entorno SDK 34.
No lo ejecutes para cambiar una app existente sin revisar antes su configuración.
Las apps incluidas y las creadas con `--template /workspace/plantilla` ya fijan 13.0.0.

Referencia de requisitos de Cordova Android 15:
https://cordova.apache.org/announcements/2026/03/06/cordova-android-15.0.0.html

Validación de esta revisión: configuración del volumen raíz y paquetes SDK
revisados. La compilación completa de la imagen y del APK requiere Docker y no
se ha ejecutado en el entorno donde se preparó este ZIP.
