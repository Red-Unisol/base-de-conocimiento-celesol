# Varios → Convenios (propuesta para revisión de Álvaro)

Solo propuesta. No se implementa, no se publica y no se toca Drive, permisos, base ni datos hasta que Álvaro la apruebe.

## Qué vería la gente
- En **Varios** aparece una sección nueva, **Convenios**, junto a Proveedores y Fondeadores. No va en Políticas ni en Procesos, y el mapa no cambia.
- Hay **una ficha por convenio** con: entidad u organismo, a qué marca corresponde (**Red Unisol** o **Mutual Celesol**, nunca las dos mezcladas), alcance, tipo de dato (**código general** o **alta/operación por organismo**), estado (**borrador / pendiente / confirmado**), fuente y fecha de última verificación.
- Hay una ficha de referencia **«Codigos Descuento Red Unisol - PORTICO RECUPERADO.xlsx»** que nombra el archivo y lo marca como **archivo pendiente**. No muestra enlace ni ID, no se sube el archivo y no se leen sus hojas.
- El Excel sigue siendo un Excel: la app no copia sus hojas ni lo convierte en una pantalla de operaciones.

## Cómo se suman datos nuevos
- Cada dato nuevo entra como **aporte en revisión**, con fecha, evidencia y nota. Se reutiliza la bandeja «Aportes de asistentes», que ya funciona así.
- Si un administrador lo aprueba, el dato pasa a la ficha **como una versión nueva**. El historial guarda la versión anterior y quién la aprobó. El original nunca se sobrescribe.
- Un dato pendiente sigue marcado como pendiente hasta que alguien lo confirme con su evidencia. Nunca se muestra como si fuera un hecho.

## El archivo Excel (en una etapa posterior, si se aprueba)
- **Opción A (recomendada):** adjuntar versiones .xlsx en un **almacenamiento privado nuevo, solo para convenios**. Solo se aceptan archivos .xlsx, se guardan todas las versiones, nunca se reemplaza una y la descarga es con un enlace que vence en pocos minutos.
- **Opción B:** guardar un enlace de Drive que **ya esté restringido y aprobado**. Ese enlace se guarda en la base, nunca en el código, y solo lo ven los roles autorizados.
- Mientras ninguna opción esté aprobada, la ficha queda con el archivo como **pendiente**.

## Quién accede
- Solo personas con sesión iniciada **y** un rol autorizado. Se propone **admin** más un rol nuevo, «convenios», a definir.
- Cualquier otra persona ve «No tenés acceso» y no recibe ningún dato.

## Cómo probar que el acceso está bien cerrado
1. Sin sesión: la página manda al ingreso, y pedir los datos directamente devuelve una lista vacía.
2. Con un usuario común sin el rol: ve «No tenés acceso». Pedirle a la base las fichas, el historial o los archivos devuelve vacío o rechazado, y abrir un enlace de descarga viejo falla.
3. Con un admin: ve las fichas. Una versión nueva del Excel se agrega sin borrar la anterior.
4. Se revisa que en el código, la vista previa y los registros no aparezca ningún enlace, ID ni dato real.

## Detalles técnicos
- **Qué se reutiliza de Aportes:** hoy `agent_contributions` solo acepta `kind` = policy/process (es una regla de la propia tabla) y `status` = pendiente/revisada. El cambio mínimo es agregar `kind = 'reference'` con un campo opcional `reference_id`, sin tocar la regla de lectura actual («cada uno ve lo propio, el admin ve todo»). No hace falta forzar las categorías Política o Procedimiento.
- **Tablas nuevas:** `reference_records` para las fichas (con `brand`, `kind`, `organismo`, `scope`, `status`, `source`, `verified_at`), `reference_record_versions` (solo se agregan filas, igual que `policy_change_log`) y `reference_files` (ruta y versión).
- **Permisos:** reglas de acceso por rol (`has_role` admin o `convenios`) para leer las tablas y los archivos. Escribir queda solo para admin.
- **Archivos:** no se usa el bucket `agent-recordings`, porque ahí puede leer cualquiera que vea el aporte.
- **Sin sincronización automática con Drive.**

## Decisiones que necesita tomar Álvaro
- Opción A u Opción B para el archivo.
- Qué roles, además de admin, pueden ver Convenios.
