# EasySales App

Easy Sales es un sistema de ventas y gestión comercial, orientado a dar comodidad y agilidad a la hora de realizar ventas.

El sistema se compone de 3 elementos para funcionar.
Frontend: Realizado en Angular 16
Backend: Realizado en NodeJs 22.11.0
Base de Datos: mysql

## Ejecutar el proyecto 🚀

Antes de ejecutar el proyecto debes disponer de la app, api, y servidor de base de datos mysql.

`FRONTEND`
Para correr el proyecto de manera local en modo desarrollo ejecutar `ng serve`
Para correr el proyecto de manera local en modo desarrollo pero versión de escritorio con tauri ejecutar `npm run program`

`BACKEND`
Para correr la api de manera local en modo desarrollo ejecutar `npm run dev`

## Dificultades para conectar con la api ⚙️
Si resulta que no puedes conectar con la api, verifica dentro de la app, en la sección de parametros, que la url este apuntando en la dirección donde se ejecuta la api, predeterminadamente deberia ser 127.0.0.1:7500/easysales

## Despliegue 📦
Para generar un instalable usamos Advanced Installer, pero antes debemos buildear los archivos.

`FRONTEND`
Para builder en versión web ejecutar `npm run build:web`
Para builder en versión escritorio ejecutar `npm run package`

`BACKEND`
Para obtener los archivos build ejecutar `npm run build`

## Instalador 📥

Para crear el instalador usar advanced installer, copiar lo generado por el frontend en la carpeta `dist`, y lo generado por el backend en la carpeta `out`

## Instalación 🖥️

Para instalar el sistema seguiremos los siguientes pasos en la PC destino:
1 - Descargar e instalar nodejs v22
2 - Descargar e instalar Visual c++ Redistributable 2019 (necesario para el siguiente paso)
3 - Descargar e instalar mysql community server v8
4 - Realizar la instalación de EasySales.exe (916-931  169-429)
5 - Verificar que exista la variable de entorno para mysql (necesario para el siguiente paso)
5 - Realizar la instalacion de ServidorEasySales.exe
6 - Verificar los permisos de la carpeta si resulta que el sistema no puede escribir en las ubicaciones, ej:al intentar imprimir
7 - Instalar el certificado para correr 127.0.0.1 en https, si el usuario usa mas de una maquina, generar e instalar el certificado a la ip correspondiente
8 - Reiniciar

`IMPORTANTE`
Es necesario tener la variable de entorno para mysql, dentro de path, deberia existir por regla general `c:\\Program Files\MySQL Server 8.4\bin`
Verificar los datos a la hora de instalar la base de datos, la contraseña debe ser la misma que se encuentra en el archivo de config en el proyecto EasySales Api,
se recomienda poner de contraseña 1235 para la base de datos.
Verificar una vez terminada la instalación en la consola que PM2 este corriendo el proyecto de EasySales con el comando `pm2 list`


## Creando una Actualizacion 🌐

Para generar una nueva actualizacion debemos:
1 - Generar los binarios desde el front con npm run program, y desde el api con npm run build
2 - Eliminar los archivos que se encuentran en la carpeta "Actualizacion"
3 - Ejecutar el programa "PreparaActualizacion", que se va a encargar de comparar archivos modificados
4 - Comprimir la carpeta de resultados con ZIP, importante debe ser en ZIP unicamente, la carpeta debe llamarse "Actualizacion"
5 - Subir el archivo a dropox y copiar el link
6 - Pegar el link del archivo en adminServer, actualizar la version y la descripción

`IMPORTANTE`
Agurate de cambiar la version del programa en el script.sql, para no tener problemas a futuro
