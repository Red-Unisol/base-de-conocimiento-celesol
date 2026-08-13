# Acceso sin confirmación de correo + rol de administrador

Objetivo: que puedas entrar ya mismo con `alquimia.laboratories@gmail.com` y una contraseña, sin pasar por la confirmación por email, y con permisos completos de carga.

## Qué se hace

1. **Desactivar la confirmación de correo** en la autenticación del proyecto (auto-confirmación de altas). Al crear la cuenta en `/auth`, la sesión arranca de inmediato.
2. **Asignar el rol de administrador** a tu cuenta apenas exista, con una regla en la base que otorga `admin` a ese correo exacto tanto si la cuenta ya está creada como si la creás después.
3. **Ajustar el texto de `/auth`**: el aviso "revisá tu correo" ya no aplica; pasa a indicar que la cuenta queda activa al instante.

## Detalle técnico

- `supabase--configure_auth`: `auto_confirm_email = true`, sin habilitar usuarios anónimos ni cambiar el resto.
- Migración: función `security definer` que inserta en `user_roles` el rol `admin` cuando el correo es `alquimia.laboratories@gmail.com`, más disparador en alta de usuario; y un `INSERT ... ON CONFLICT DO NOTHING` para cubrir el caso de que la cuenta ya exista.
- Sin cambios en RLS ni en los buckets: siguen siendo lectura para autenticados y escritura sólo admin.

## Nota de seguridad

La autoconfirmación y la regla por correo fijo son adecuadas para esta etapa privada. Antes de abrir la app al resto de la mutual conviene volver a exigir confirmación de correo y pasar la asignación de roles a un panel de administración.

## Después de aprobar

Entrás a `/auth`, pestaña "Crear cuenta", con tu correo y la contraseña que elijas; quedás dentro y con el panel de carga habilitado.
