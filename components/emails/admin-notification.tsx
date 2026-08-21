import * as React from 'react';
import { Html, Body, Head, Heading, Hr, Container, Preview, Section, Text } from '@react-email/components';

interface AdminNotificationProps {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  apartmentName: string;
  checkIn: Date;
  checkOut: Date;
  amount: number;
  guests: number;
}

export const AdminNotificationEmail = ({
  guestName,
  guestEmail,
  guestPhone,
  apartmentName,
  checkIn,
  checkOut,
  amount,
  guests
}: AdminNotificationProps) => (
  <Html>
    <Head />
    <Preview>Nueva Reserva Recibida - Casa Amapa</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Casa Amapa - Admin</Heading>
        <Text style={text}>Tienes una nueva reserva confirmada para <strong>{apartmentName}</strong>.</Text>
        
        <Section style={detailsContainer}>
          <Text style={sectionTitle}>Detalles del Huésped</Text>
          <Text style={detailsText}><strong>Nombre:</strong> {guestName}</Text>
          <Text style={detailsText}><strong>Email:</strong> {guestEmail}</Text>
          <Text style={detailsText}><strong>Teléfono:</strong> {guestPhone}</Text>
          <Text style={detailsText}><strong>Total de huéspedes:</strong> {guests}</Text>
        </Section>
        
        <Section style={detailsContainer}>
          <Text style={sectionTitle}>Detalles de la Reserva</Text>
          <Text style={detailsText}><strong>Unidad:</strong> {apartmentName}</Text>
          <Text style={detailsText}><strong>Llegada:</strong> {checkIn.toLocaleDateString('es-MX')}</Text>
          <Text style={detailsText}><strong>Salida:</strong> {checkOut.toLocaleDateString('es-MX')}</Text>
          <Text style={detailsText}><strong>Total pagado:</strong> {amount.toLocaleString('es-MX')} MXN</Text>
        </Section>
        
        <Hr style={hr} />
        <Text style={footer}>
          Notificación automática del Panel de Administración de Casa Amapa.
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f7f5f2', 
  fontFamily: 'Inter, -apple-system, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '580px',
};

const h1 = {
  color: '#5e3a50', 
  fontSize: '24px',
  fontWeight: 'normal',
  textAlign: 'center' as const,
  margin: '30px 0',
  fontStyle: 'italic',
};

const text = {
  color: '#3d2438',
  fontSize: '16px',
  lineHeight: '24px',
};

const sectionTitle = {
  ...text,
  fontWeight: 'bold',
  borderBottom: '1px solid #eaeaea',
  paddingBottom: '8px',
  marginBottom: '12px'
};

const detailsContainer = {
  padding: '24px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  margin: '24px 0',
  border: '1px solid #eaeaea',
};

const detailsText = {
  ...text,
  margin: '8px 0',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '20px',
  fontStyle: 'italic',
};
