import * as React from 'react';
import { Html, Body, Head, Heading, Hr, Container, Preview, Section, Text } from '@react-email/components';

interface BookingConfirmationProps {
  guestName: string;
  apartmentName: string;
  checkIn: Date;
  checkOut: Date;
  amount: number;
}

export const BookingConfirmationEmail = ({
  guestName,
  apartmentName,
  checkIn,
  checkOut,
  amount
}: BookingConfirmationProps) => (
  <Html>
    <Head />
    <Preview>Confirmación de tu reserva en Casa Amapa</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Casa Amapa</Heading>
        <Text style={text}>Hola {guestName},</Text>
        <Text style={text}>
          Tu reservación en el departamento <strong>{apartmentName}</strong> está confirmada.
        </Text>
        <Section style={detailsContainer}>
          <Text style={detailsText}><strong>Llegada:</strong> {checkIn.toLocaleDateString('es-MX')}</Text>
          <Text style={detailsText}><strong>Salida:</strong> {checkOut.toLocaleDateString('es-MX')}</Text>
          <Text style={detailsText}><strong>Total pagado (MXN):</strong> ${amount}</Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Si tienes alguna pregunta sobre tu estancia o cómo llegar, no dudes en responder a este correo.
          <br />
          Nos vemos pronto en Chacala.
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f7f5f2', // var(--color-sand) equivalent
  fontFamily: 'Inter, -apple-system, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '580px',
};

const h1 = {
  color: '#5e3a50', // var(--color-rose-3) equivalent
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
