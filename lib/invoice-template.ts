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
  .rule-item { margin-bottom: 16px; font-size: 14px; line-height: 1.5; color: #555555; clear: both; overflow: hidden; display: flex; align-items: flex-start; gap: 12px;}
  .rule-icon { color: #d0496c; font-size: 18px; margin-top: 2px; flex-shrink: 0; }
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
        <img src="https://amapachacala.com/images/arco.png" alt="Arco Casa Amapa" class="logo" />
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
      <p style="font-size: 10px; opacity: 0.7;">Casa Amapa · Zihuatanejo, Guerrero, México</p>
    </div>
  </div>
</body>
</html>
  `;
}
