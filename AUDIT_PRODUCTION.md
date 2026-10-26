# Auditoría de producción — Casa Amapa

Fecha: 25 de octubre de 2026
Producción observada: `https://www.casaamapa.com` (Vercel)

## Conclusión ejecutiva

El incidente es consistente con una pérdida de estado entre Stripe y PostgreSQL.
La implementación anterior creaba la reserva primero, pero no guardaba el ID del
PaymentIntent. Después eliminaba físicamente cualquier reserva `pending` con más
de 15 minutos sin consultar Stripe. Si el webhook no llegaba, se retrasaba o tenía
una configuración distinta, el pago quedaba exitoso en Stripe mientras la reserva
seguía pendiente y finalmente desaparecía de la base.

La consulta de solo lectura a producción encontró tres reservas, todas manuales y
confirmadas, y cero reservas enlazadas a un PaymentIntent. La reserva web afectada
ya no existe en PostgreSQL. El propietario confirmó que ya la registró manualmente,
por lo que su recuperación queda fuera de esta corrección; el objetivo es prevenir
que el incidente se repita en reservas futuras.

## Hallazgos críticos y corrección

| Severidad | Hallazgo | Estado |
|---|---|---|
| Crítica | El cron borraba físicamente reservas pendientes sin verificar Stripe. | Corregido: reconciliación con Stripe y estados `expired`/`payment_failed`; nunca se elimina el historial. |
| Crítica | El PaymentIntent no se guardaba en `stripe_payment_intent_id`. | Corregido: vínculo único, metadata e idempotency key desde la creación. |
| Crítica | El monto y `totalPrice` llegaban desde el navegador y podían manipularse. | Corregido: tarifa diaria, comisión y cobro total se calculan en una transacción del servidor. |
| Crítica | La cuenta de producción `admin` conserva la contraseña conocida incluida anteriormente en el seed. | Código corregido y cambio añadido a Ajustes; rotación en producción pendiente. |
| Alta | El endpoint de limpieza era público y cualquier visitante podía dispararlo. | Corregido: exige `Authorization: Bearer CRON_SECRET`. |
| Alta | La pantalla decía “Reserva confirmada” sin verificar el pago. | Corregido: consulta Stripe en servidor y distingue confirmado, procesando y error. |
| Alta | El huésped intentaba enviar su invoice mediante un endpoint administrativo, por lo que recibía 401. | Corregido: webhook/reconciliador envían el comprobante; la UI ya no llama el endpoint admin. |
| Alta | Un fallo de Resend hacía fallar todo el webhook y podía duplicar correos en reintentos. | Corregido: correo fuera de la confirmación transaccional, idempotencia de Resend y reintento por cron. |
| Alta | La configuración administrativa de anticipo podía mezclarse con el checkout público. | Corregido: Stripe siempre cobra 100% en la web; el anticipo solo aplica a reservas manuales e invoices externos. |
| Alta | Una estancia de una noche podía guardar `checkIn === checkOut`. | Corregido: checkout real al día siguiente y constraint SQL `check_out > check_in`. |
| Alta | La exclusión SQL solo evitaba dobles reservas dentro de la misma unidad, no Casa completa vs departamento. | Corregido: advisory lock transaccional de toda la propiedad más comprobación cruzada. |
| Alta | iCal de exportación publicaba cualquier estado distinto de `cancelled`, incluidos pagos fallidos/expirados. | Corregido: solo `confirmed`/`attention_required`. |
| Alta | El feed iCal alternativo exponía el nombre del huésped. | Corregido: resumen anónimo `Reservado`. |
| Alta | Cron y sincronización manual analizaban `DTEND` de forma distinta; el cron podía bloquear una noche extra. | Corregido: un solo parser, `DTEND` exclusivo convertido una vez. |
| Alta | Reemplazo de OTA y descarga no tenían la misma protección/validación. | Corregido: descarga HTTPS con timeout, límite, validación SSRF y reemplazo atómico solo tras parseo correcto. |
| Alta | El panel Stripe mostraba “Conexión activa” de manera estática. | Corregido: muestra variables presentes, estados reales, fallos de notificación y último webhook. |
| Media | Cancelar desde administración borraba reservas pagadas y su auditoría. | Corregido: cancelación lógica; se conserva pago y se indica revisión de reembolso. |
| Media | El pool PostgreSQL no estaba limitado explícitamente para funciones serverless. | Corregido: pool pequeño, timeout e instancia global reutilizable. |
| Media | Cambios de esquema habían llegado por `db push`; las dos migraciones registradas no podían reconstruir la base real. | Corregido: migración idempotente de catch-up y nuevas tablas/campos de pago. |
| Media | El seed contenía una contraseña débil conocida. | Corregido: exige `ADMIN_INITIAL_PASSWORD` de al menos 12 caracteres y no rota usuarios existentes. |

## Evidencia de producción

- `casaamapa.com` redirige a `www.casaamapa.com` y responde desde Vercel.
- El webhook existe y tiene secret configurado: una petición POST sin firma responde
  400 `Missing stripe signature`/equivalente, no 500 por configuración ausente.
- El cron iCal exige autenticación y responde 401 sin bearer token.
- El feed `tierra` responde 200, `text/calendar` y sin caché.
- Las tres fuentes OTA configuradas se descargaron en modo lectura. Resultado:
  Agua 2/2 eventos, Aire 2/2, Tierra 4/4, sin diferencias de fechas frente a la base.
- PostgreSQL registra tres reservas, todas manuales/confirmadas, ninguna con
  PaymentIntent. No existe ya el registro de la reserva web del incidente.
- Producción tiene 50% como anticipo administrativo predeterminado. Ese valor es
  exclusivo de reservas manuales; el checkout web debe cobrar siempre el 100%.
- La cuenta admin acepta la contraseña conocida del antiguo seed.

## Garantías incorporadas

1. Checkout: validación y precio total (100%) en servidor, lock global, reserva pendiente con
   expiración, creación Stripe idempotente y enlace persistido.
2. Confirmación: webhook firmado como vía principal; retorno del navegador como
   reconciliación secundaria; cron como tercera red de seguridad.
3. Fulfillment: solo un PaymentIntent `succeeded` confirma; después se bloquean
   feeds y se envían emails idempotentes.
4. Auditoría: eventos Stripe, errores y timestamps de correo quedan persistidos.
5. Serverless: ninguna tarea depende de memoria local o de que el navegador siga
   abierto; los crons de Vercel corrigen estados incompletos. En Hobby operan una
   vez al día; frecuencias de 10/30 minutos requieren Vercel Pro.

## Límites de la sincronización OTA

Este proyecto usa iCal, no APIs directas de Airbnb/Booking. Casa Amapa publica el
bloqueo inmediatamente después de confirmar, pero cada OTA decide cuándo volver a
leer el feed; iCal no garantiza bloqueo instantáneo. Para garantía en segundos se
necesita un channel manager o las APIs oficiales de cada OTA.

## Estado después del despliegue

1. Rotar de inmediato la contraseña `admin` de producción.
2. Las migraciones `20261025223000_harden_booking_payments` y
   `20261025234500_include_attention_in_booking_lock` ya fueron aplicadas; el diff
   contra producción está vacío. El código que utiliza esas columnas quedó desplegado
   en Vercel desde `main`.
3. Confirmar en Stripe Workbench el endpoint exacto
   `https://www.casaamapa.com/api/webhooks/stripe`, eventos requeridos y `whsec_`
   del mismo entorno live.
4. Confirmar en Resend que el dominio de `EMAIL_FROM` está verificado.
5. Ejecutar una reserva live de monto controlado, verificar 200 del webhook,
   registro confirmado, feed iCal, correo del huésped/admin y luego reembolsarla.
6. El dominio público, disponibilidad, páginas de departamentos y feed iCal
   respondieron correctamente en las pruebas de humo posteriores al despliegue.

## Verificación local realizada

- `npx prisma validate`: correcto.
- `npx tsc --noEmit`: correcto.
- `npm test`: 8/8 pruebas correctas (fechas, iCal, checkout web al 100%, orden de eventos Stripe e invoice manual).
- `npm audit --omit=dev`: 0 vulnerabilidades tras actualizar Next.js 16.4.3 y Prisma 7.10.1.
- `next build --webpack`: correcto, 19 páginas generadas.
- Lint de módulos críticos nuevos: correcto.
- Lint global: aún falla por 120 hallazgos preexistentes/principalmente UI
  (69 errores y 51 warnings). No bloquean el build, pero deben resolverse como
  deuda de calidad antes de imponer lint como gate de CI.
