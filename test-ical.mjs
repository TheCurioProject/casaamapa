import ical from 'node-ical';
const data = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CasaAmapa//Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Casa Amapa
X-WR-TIMEZONE:America/Mexico_City
BEGIN:VEVENT
UID:sync-init-agua@amapachacala.com
DTSTAMP:20260822T222847Z
DTSTART;VALUE=DATE:20200101
DTEND;VALUE=DATE:20200102
SUMMARY:Calendar Sync Initialization
END:VEVENT
END:VCALENDAR`;

try {
  const events = ical.sync.parseICS(data);
  console.log("Parsed events:", Object.keys(events).length);
  console.log(events);
} catch (e) {
  console.error("Parse error:", e);
}
