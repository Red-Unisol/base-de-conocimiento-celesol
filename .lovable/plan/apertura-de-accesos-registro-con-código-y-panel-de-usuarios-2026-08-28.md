# Apertura de accesos: registro con código y panel de usuarios

Objetivo: abrir la base de conocimiento al resto de la mutual con registro propio, roles y una sección reservada para Sistemas.

## Qué se hace

1. **Tu cuenta admin queda intacta.** `alquimia.laboratories@gmail.com` conserva el rol de administrador y todos los permisos de carga.
2. **Registro con correo y código de verificación.** En `/auth`, la persona escribe su correo, recibe un código de 6 dígitos y lo ingresa para entrar. Sin contraseña, sin restricción de dominio. Al validar el código queda dentro de inmediato, sin aprobación previa.
3. **Rol por defecto "usuario".** Toda cuenta nueva se registra automáticamente con ese rol: lee todo el material salvo la sección reservada.
4. **Panel "Usuarios" visible sólo para el admin.** Lista de personas registradas con correo, fecha de alta y último ingreso, buscador, y controles para asignar o quitar los roles **usuario**, **IT** y **administrador**. También permite dar de baja un acceso.
5. **Sección "Sistemas" restringida.** Sólo la ven quienes tengan el rol **IT**, más el administrador. Para el resto, ni aparece en el menú lateral ni en la grilla de categorías, y el acceso directo por URL queda bloqueado también desde la base de datos.

## Cómo queda cada rol

| Rol | Puede |
| --- | --- |
| usuario | Ver todas las categorías y procesos, salvo Sistemas |
| IT | Lo anterior + la sección Sistemas |
| administrador | Todo, más carga/edición de material y el panel de usuarios |

## Detalle técnico

- **Auth**: se desactiva la autoconfirmación y se habilita el alta; el ingreso pasa a `signInWithOtp` + `verifyOtp` (canal email, código). Se ajusta la plantilla del correo de acceso para que muestre el código, no un enlace.
- **Migración**:
  - se agregan los valores `usuario` e `it` al tipo de roles existente;
  - tabla `profiles` (id, email, alta, último ingreso) alimentada por un disparador en el alta de usuario, que además inserta el rol `usuario`;
  - se conserva el disparador que otorga `admin` al correo semilla;
  - `user_roles` pasa a admitir alta y baja de filas sólo para administradores (hoy están denegadas), y `profiles` se lee por su dueño o por admin;
  - columna `required_role` en `categories`, con valor `it` para Sistemas, y función `security definer` en el esquema `private` que decide visibilidad; las políticas de lectura de `categories`, `processes`, `process_tags` y `attachments` la usan.
- **Frontend**: `useIsAdmin` se generaliza a `useRoles`; el menú lateral y la grilla filtran categorías restringidas; nueva ruta `/admin/usuarios` con guardia de admin; `/auth` se reescribe al flujo de dos pasos (correo → código) con reenvío del código.

## Nota

El acceso por contraseña se reemplaza por el código; tu cuenta admin entra por el mismo camino, sin necesidad de recordar la contraseña.
