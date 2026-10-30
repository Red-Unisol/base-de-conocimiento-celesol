# Restablecer contraseña con aviso al administrador

## Qué va a ver el usuario
- En la pantalla de ingreso aparece el enlace **«¿Olvidaste tu contraseña?»**.
- Escribe su correo (cualquier dominio) y envía. Ve el mensaje: «Tu pedido fue enviado al administrador. Te va a contactar con una contraseña nueva».
- No se manda ningún correo al usuario; así se evita el problema de los correos institucionales que no llegan.
- El mensaje es siempre el mismo, exista o no la cuenta, para no revelar qué correos están registrados.

## Qué va a ver el administrador
- En el menú lateral, junto a **Usuarios registrados**, aparece un número con los pedidos pendientes.
- En esa página hay un recuadro nuevo, **«Pedidos de restablecimiento de contraseña»**, con correo, nombre y fecha de cada pedido.
- En cada pedido, el administrador escribe una contraseña nueva y toca **«Restablecer»**. La contraseña se cambia al instante y el pedido queda como resuelto, con la fecha y el nombre de quien lo resolvió.
- También puede **«Descartar»** un pedido (por ejemplo, si el correo no existe).
- El administrador le pasa la contraseña nueva al usuario por un canal seguro, como ya se hace con el alta directa.

## Límites
- El aviso al administrador queda **dentro de la aplicación**, no llega por correo. Para mandarlo por correo hace falta configurar primero un dominio de envío propio (por ejemplo @redunisol.com.ar). Se puede agregar más adelante.
- Para evitar abusos, un mismo correo no puede generar más de un pedido pendiente a la vez.

## Detalles técnicos
- Tabla nueva `password_reset_requests` (id, email, user_id nullable, status `pendiente|resuelto|descartado`, created_at, resolved_at, resolved_by). RLS: sólo admin puede leer/actualizar; sin insert directo desde el cliente.
- Server fn pública `requestPasswordReset({ email })`: valida con zod, busca el usuario en `profiles` con el cliente admin dentro del handler, inserta el pedido si no hay uno pendiente y siempre responde lo mismo.
- Server fns con `requireSupabaseAuth` en `src/lib/users.functions.ts`: `listResetRequests`, `adminResetPassword({ requestId, password })` (verifica rol admin con `has_role`/`user_roles` vía `context.supabase`, luego `auth.admin.updateUserById`) y `dismissResetRequest`.
- UI: diálogo/sección en `src/routes/auth.tsx`; recuadro y contador en `admin.usuarios.tsx` y en el sidebar.
- Test pequeño de la regla «un solo pedido pendiente por correo» y validación de contraseña mínima.
