# Recuperar el acceso a la cuenta admin

Tu cuenta `alquimia.laboratories@gmail.com` existe, está confirmada y tiene rol de administrador. La contraseña no se puede consultar: se guarda cifrada (hash irreversible), así que la única salida es establecer una nueva.

## Qué se hace

1. Se define una contraseña nueva para esa cuenta directamente en el backend (sin correo de confirmación, coherente con la etapa privada actual).
2. Se verifica el ingreso en `/auth` con el correo y la contraseña nueva.
3. Se confirma que la cuenta conserva el rol de administrador y ve el panel de carga.

## Contraseña a usar

Salvo que indiques otra, se usa una temporal segura: `Unisol2026!Base` — la podés cambiar después desde el ingreso.

## Detalle técnico

- Actualización de la credencial vía Auth Admin API del backend gestionado (no se toca el esquema `auth` con SQL directo).
- Sin cambios en RLS, buckets ni en el resto de la app.

## Nota

Si preferís otra contraseña, decímela y la uso en lugar de la temporal.
