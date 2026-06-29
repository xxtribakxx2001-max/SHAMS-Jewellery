# SHAMS — شمس | Stripe Checkout Integration

## 🚀 Configuración de Stripe

### 1. Crear cuenta Stripe

1. Ve a https://dashboard.stripe.com/register
2. Completa el registro con tu email y datos de negocio
3. **Importante:** Activa tu cuenta proporcionando:
   - Información de la empresa (SHAMS)
   - Dirección fiscal
   - Cuenta bancaria para recibir pagos

### 2. Obtener API Keys

1. Entra en: https://dashboard.stripe.com/test/apikeys
2. Copia tu **Secret Key** (empieza con `sk_test_...` en modo prueba)
3. **NO compartas esta key públicamente — es privada**

### 3. Configurar en Vercel

#### Opción A: Desde Dashboard de Vercel (recomendado)

1. Ve a tu proyecto en Vercel: https://vercel.com/xxtribakxx2001-max/shams-jewellery
2. Settings → Environment Variables
3. Añade nueva variable:
   - **Name:** `STRIPE_SECRET_KEY`
   - **Value:** tu Secret Key de Stripe (ej. `sk_test_51X...`)
   - **Environments:** Production, Preview, Development (marca todas)
4. Guarda y redeploy el proyecto

#### Opción B: Desde CLI

```bash
cd ~/SHAMS-Jewellery
vercel env add STRIPE_SECRET_KEY
# Pega tu Secret Key cuando te lo pida
# Selecciona: Production, Preview, Development
```

### 4. Deploy a Vercel

```bash
cd ~/SHAMS-Jewellery
git add .
git commit -m "Add Stripe Checkout integration"
git push origin main

# Si no está conectado a Vercel:
vercel --prod
```

## 🧪 Modo Prueba (Test Mode)

Stripe empieza en **Test Mode** automáticamente. Esto significa:

- ✅ Puedes probar pagos sin dinero real
- ✅ Usa tarjetas de prueba de Stripe
- ✅ No se cobran comisiones
- ⚠️ Los pagos NO son reales

### Tarjetas de prueba

```
Tarjeta válida:
  Número: 4242 4242 4242 4242
  Fecha: cualquier fecha futura (ej. 12/25)
  CVV: cualquier 3 dígitos (ej. 123)
  ZIP: cualquier código (ej. 12345)

Tarjeta rechazada:
  Número: 4000 0000 0000 0002

Requiere autenticación 3D Secure:
  Número: 4000 0025 0000 3155
```

Más tarjetas: https://stripe.com/docs/testing

## 🔴 Modo Producción (Live Mode)

**Requisitos:**
- Cuenta Stripe activada (datos fiscales + cuenta bancaria verificada)
- Negocio aprobado por Stripe (puede tardar 1-2 días)

**Pasos:**

1. En Stripe Dashboard, cambia de "Test mode" a "Live mode" (toggle arriba a la derecha)
2. Ve a: https://dashboard.stripe.com/apikeys
3. Copia tu **Secret Key LIVE** (empieza con `sk_live_...`)
4. En Vercel → Settings → Environment Variables
5. **REEMPLAZA** el valor de `STRIPE_SECRET_KEY` con la key LIVE
6. Guarda y redeploy

⚠️ **Ahora los pagos son REALES y se cobran comisiones de Stripe:**
- 1.5% + 0.25€ por transacción (tarjetas europeas)
- El dinero llega a tu cuenta bancaria en 2-7 días

## 📧 Confirmar Email después de Pago

Por defecto, Stripe envía un recibo automático al comprador.

**Para personalizar el email:**

1. Stripe Dashboard → Settings → Emails
2. Activa "Customer emails"
3. Personaliza el template con el logo de SHAMS y tu texto

**Para recibir notificación tú (vendedor):**

1. Stripe Dashboard → Settings → Notifications
2. Activa "Successful payments"
3. Añade tu email (ismael@shamsjewellery.com o el que prefieras)

## 🔒 Seguridad

- ✅ La Secret Key está en variable de entorno (no en código)
- ✅ La pasarela de pago es de Stripe (PCI compliant)
- ✅ No guardamos datos de tarjetas — Stripe lo maneja todo
- ✅ HTTPS obligatorio (Vercel lo da automáticamente)

## 📊 Ver Pagos

**Test mode:**
https://dashboard.stripe.com/test/payments

**Live mode:**
https://dashboard.stripe.com/payments

Aquí ves:
- Pagos completados
- Email del comprador
- Dirección de envío
- Productos comprados (en metadata)
- Estado del pago

## 🛠️ Solución de Problemas

### Error: "No Stripe API key"

→ La variable `STRIPE_SECRET_KEY` no está en Vercel. Ve a paso 3.

### Error: "Invalid API key"

→ Estás usando una key de Test mode en Live o viceversa. Verifica que:
- Test mode key empieza con `sk_test_`
- Live mode key empieza con `sk_live_`

### Pago funciona pero no recibo email

→ Verifica en Stripe Dashboard → Settings → Emails que "Customer emails" está activado.

### Página "success.html" no se ve bien

→ Verifica que el archivo `success.html` está en la raíz del proyecto (no en carpeta `api/`).

## 📞 Soporte

- Documentación Stripe: https://stripe.com/docs
- Dashboard: https://dashboard.stripe.com
- Soporte 24/7: https://support.stripe.com

---

**Creado por ITO LabAgent**
https://itolabagent.org
