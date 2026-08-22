type BookingWithUnit = any; // We'll just use any for simplicity, or we can import the type if we know it.

export function getInvoiceHtml(booking: any) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7f7; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
  .header { background-color: #42242C; padding: 40px 20px; text-align: center; color: #f9f3ee; position: relative; }
  .logo-container { background-color: #f9f3ee; display: inline-block; padding: 10px; border-radius: 50%; margin-bottom: 15px; width: 100px; height: 100px; line-height: 100px; text-align: center; }
  .logo { max-width: 80px; max-height: 80px; vertical-align: middle; }
  .title { font-family: "Georgia", serif; font-size: 32px; font-weight: normal; margin: 0; letter-spacing: 1px; color: #f9f3ee; }
  .subtitle { text-transform: uppercase; letter-spacing: 3px; font-size: 11px; margin-top: 10px; color: #d98ba0; }
  .content { padding: 40px; color: #333333; }
  .greeting { font-size: 20px; font-weight: bold; margin-top: 0; color: #42242C; }
  .booking-details { background-color: #faf5f0; border: 1px solid #efe5d8; border-radius: 12px; padding: 25px; margin: 30px 0; }
  .detail-row { display: table; width: 100%; border-bottom: 1px solid #efe5d8; padding: 12px 0; }
  .detail-row:last-child { border-bottom: none; padding-bottom: 0; }
  .detail-label { display: table-cell; font-weight: bold; color: #665b55; font-size: 14px; text-align: left; }
  .detail-value { display: table-cell; text-align: right; font-size: 14px; color: #42242C; }
  
  .rules-section { margin-top: 40px; }
  .rules-title { font-family: "Georgia", serif; font-size: 22px; color: #42242C; margin-bottom: 20px; border-bottom: 2px solid #d98ba0; padding-bottom: 10px; display: inline-block; }
  .rule-item { margin-bottom: 16px; font-size: 14px; line-height: 1.5; color: #555555; clear: both; overflow: hidden; display: flex; align-items: flex-start; gap: 8px;}
  .rule-icon { color: #d0496c; font-size: 14px; margin-top: 3px; flex-shrink: 0; }
  .rule-text { flex-grow: 1; }
  
  .highlight-rule { background-color: #fff0f0; border-left: 4px solid #d0496c; padding: 15px; border-radius: 4px; color: #d0496c; font-weight: bold; margin: 25px 0; font-size: 13px; letter-spacing: 0.5px; }
  
  .access-box { background-color: #42242C; color: #ffffff; padding: 25px; border-radius: 12px; margin-top: 40px; text-align: center; }
  .access-box p { margin: 0; font-size: 14px; line-height: 1.6; }
  .access-box strong { color: #d98ba0; }
  
  .footer { text-align: center; padding: 30px; background-color: #faf5f0; font-size: 12px; color: #888888; }
  .footer a { color: #d0496c; text-decoration: none; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-container">
        <img src="data:image/png;base64,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" alt="Arco Casa Amapa" class="logo" />
      </div>
      <h1 class="title">Casa Amapa</h1>
      <div class="subtitle">Comprobante de Reserva</div>
    </div>
    
    <div class="content">
      <h2 class="greeting">¡Hola ${booking.guestName}!</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #555;">Tu reserva para <strong>${booking.unit.name}</strong> ha sido registrada exitosamente. A continuación, te compartimos los detalles y las normas de la casa.</p>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Llegada</span>
          <span class="detail-value">${new Date(booking.checkIn).toLocaleDateString('es-MX')} a partir de las 3:00 PM</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Salida</span>
          <span class="detail-value">${new Date(booking.checkOut).toLocaleDateString('es-MX')} antes de las 11:00 AM</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Huéspedes</span>
          <span class="detail-value">${booking.guests}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Estimado</span>
          <span class="detail-value">$${booking.totalPrice?.toLocaleString('es-MX')} MXN</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Anticipo Requerido</span>
          <span class="detail-value">${booking.depositPercentage}%</span>
        </div>
      </div>
      
      <div class="rules-section">
        <h3 class="rules-title">Reglas de la Casa</h3>
        
        <div class="rule-item">
          <div class="rule-icon">✧</div>
          <div class="rule-text"><strong>Check-in:</strong> 3:00 PM (Hora del Pacífico).<br/><strong>Check-out:</strong> 11:00 AM (Hora del Pacífico).</div>
        </div>
        
        <div class="rule-item">
          <div class="rule-icon">✧</div>
          <div class="rule-text"><strong>Capacidad máxima:</strong> 12 personas. Máximo 10 adultos; las 2 personas adicionales deberán ser niños de 16 años o menores.</div>
        </div>
        
        <div class="rule-item">
          <div class="rule-icon">✧</div>
          <div class="rule-text"><strong>Mascotas:</strong> No se permiten mascotas en la propiedad.</div>
        </div>
        
        <div class="rule-item">
          <div class="rule-icon">✧</div>
          <div class="rule-text"><strong>Limpieza de Arena:</strong> Es obligatorio enjuagarse la arena utilizando la regadera de la terraza <strong>ANTES</strong> de entrar a los baños de la casa (en específico a las regaderas), antes de subirse a los muebles y antes de entrar a la alberca.</div>
        </div>
        
        <div class="rule-item">
          <div class="rule-icon">✧</div>
          <div class="rule-text"><strong>Estacionamiento:</strong> Se comparte con los 3 departamentos. El espacio es limitado y deberá utilizarse conforme a disponibilidad.</div>
        </div>

        <div class="highlight-rule">
          ⚠️ OBLIGATORIO: NO DEJAR A LOS NIÑOS SOLOS EN EL ÁREA DE LA TERRAZA.
        </div>
      </div>
      
      <div class="access-box">
        <p>Para solicitar tus claves de acceso, por favor comunícate por <strong>WhatsApp</strong> enviando una captura de este comprobante al número:<br/><br/>
        <a href="https://wa.me/523113944729" style="color: #d98ba0; font-size: 18px; font-weight: bold; text-decoration: none;">+52 (311) 394 4729</a></p>
      </div>
    </div>
    
    <div class="footer">
      <p style="margin: 0 0 10px 0;"><strong>Soporte y Contacto</strong></p>
      <p style="margin: 0 0 5px 0;">Email: <a href="mailto:thecurio.dev@hotmail.com">thecurio.dev@hotmail.com</a></p>
      <p style="margin: 0 0 15px 0;">Teléfono: 311 394 4729</p>
      <p style="font-size: 10px; opacity: 0.7;">Casa Amapa · Chacala, Nayarit, México</p>
    </div>
  </div>
</body>
</html>
  `;
}
