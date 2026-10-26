# Casa Amapa

Sistema de reservas de Casa Amapa construido con Next.js 16, Prisma/PostgreSQL,
Stripe, Resend e iCal. El flujo de pago está diseñado para ejecución serverless:
el webhook es la fuente principal de confirmación y un cron reconcilia Stripe,
reintenta correos y expira checkouts abandonados sin borrar el historial.

Las reservas realizadas en el sitio web siempre se cobran al 100% mediante
Stripe. La configuración de anticipo se usa exclusivamente como valor
predeterminado para reservas manuales e invoices creados desde administración.

## Desarrollo

```bash
npm install
cp .env.example .env.local
npx prisma generate
npm run dev
```

## Variables obligatorias en producción

Consulta `.env.example`. En Vercel deben existir, como mínimo:

- `DATABASE_URL` mediante un pooler compatible con serverless y `DIRECT_URL` para migraciones.
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` y `STRIPE_WEBHOOK_SECRET`, todos del mismo modo (live o test).
- `RESEND_API_KEY`, `EMAIL_FROM` con dominio verificado y `ADMIN_EMAIL` como respaldo.
- `AUTH_SECRET` y `CRON_SECRET` con valores aleatorios largos.

Las variables `NEXT_PUBLIC_*` se fijan durante el build; cualquier cambio exige un
nuevo deployment.

## Migraciones y despliegue

La migración debe ejecutarse antes de activar una versión que use las columnas
nuevas:

```bash
npx prisma validate
npx prisma migrate deploy
npx prisma generate
npm run build
```

No se debe usar `prisma db push` en producción. El deployment de Vercel necesita
un plan que acepte las frecuencias definidas en `vercel.json` (reconciliación de
pagos cada 10 minutos y sincronización iCal cada 30 minutos).

### Release candidate y Stripe Test

Antes de publicar en `main`, crea una rama de release y un deployment Preview de
Vercel. El entorno Preview debe usar recursos completamente separados:

- Una rama/proyecto de Supabase sin datos reales para `DATABASE_URL` y `DIRECT_URL`.
- `STRIPE_SECRET_KEY=sk_test_...` y
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...` de la misma cuenta sandbox.
- Un endpoint webhook de Stripe Test apuntando a la URL estable de la rama Preview
  y su propio `STRIPE_WEBHOOK_SECRET=whsec_...`.
- Valores Preview independientes para `AUTH_SECRET`, `CRON_SECRET`, correo y
  cualquier almacenamiento de archivos.

Ejecuta `prisma migrate deploy` y el seed en esa base aislada. Los crons de Vercel
no se ejecutan en Preview, por lo que durante QA deben invocarse manualmente con
`Authorization: Bearer <CRON_SECRET>`. Si el Preview tiene Deployment Protection,
el webhook de Stripe necesita un bypass de automatización de Vercel en su URL.

Solo después de validar pago exitoso, pago rechazado, webhook, reconciliación,
invoice, correo, calendario y liberación de fechas se debe promover el mismo
commit a Production. Las variables de Production deben conservar las claves
`pk_live_...`, `sk_live_...` y el `whsec_...` del endpoint productivo.

## Stripe

En Stripe Workbench registra un endpoint de webhook snapshot:

```text
https://www.casaamapa.com/api/webhooks/stripe
```

Eventos requeridos:

- `payment_intent.succeeded`
- `payment_intent.processing`
- `payment_intent.payment_failed`
- `payment_intent.canceled`

El `whsec_...` de ese endpoint debe ser exactamente `STRIPE_WEBHOOK_SECRET` del
entorno Production de Vercel. Tras desplegar, realiza un pago de prueba, comprueba
un HTTP 200 en Stripe Workbench y revisa `/admin/stripe`: debe aparecer el evento,
la reserva confirmada y cero elementos en “Atención”.

## Calendarios OTA

Las URLs que Casa Amapa entrega a Airbnb/Booking son:

```text
https://www.casaamapa.com/api/ical/export/<unitId>/calendar.ics
```

El feed solo publica reservas confirmadas y bloqueos manuales, nunca datos del
huésped. Las importaciones OTA se reemplazan de forma atómica únicamente después
de descargar y analizar correctamente el calendario remoto.

## Recuperación de incidentes

Nunca borres una reserva pendiente para “destrabar” fechas. El cron consulta su
PaymentIntent antes de expirar el registro. Si Stripe muestra un cobro que no está
en la base, conserva el PaymentIntent y el correo del cliente, revisa sus metadata
y los eventos del webhook, y crea la reserva manual solo después de comprobar que
no haya solapamientos.
