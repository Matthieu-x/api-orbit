# Orbit API

## Instalar

```
npm install
```

Las variables ya estan cargadas en `.env` (Turso, hCaptcha). Revisa `ADMIN_DEFAULT_PASSWORD` en `.env`
para saber la contrasena inicial de las dos cuentas admin (matthieu-x@admin.orbit y amilcargit@admin.orbit),
y cambiala despues de tu primer login.

## Correr

```
npm start
```

El servidor levanta en `http://localhost:3000`. Al iniciar crea las tablas en Turso (`users`, `sessions`,
`notifications`) y las dos cuentas admin si no existen.

## Estructura

- `server.js` — servidor Express, paginas protegidas y manejo de 404
- `db/` — cliente Turso y creacion de tablas
- `middleware/` — sesiones (auth.js) y validacion de API key (apiKeyAuth.js)
- `routes/` — auth, perfil/notificaciones, admin, y el endpoint publico `/api/v1`
- `public/` — paginas y JS del cliente

## Notas

- Las sesiones se guardan en la tabla `sessions` de Turso (sin JWT); la cookie solo lleva el token.
- Las contrasenas se guardan en texto plano a proposito, para que el panel de admin pueda mostrarlas.
- Cada usuario normal tiene 100 solicitudes diarias que se renuevan automaticamente a la medianoche.
- El endpoint de ejemplo es `GET /api/v1/consulta?apikey=ORBIT-XXXXXXXXXX&texto=...`.
