import { EOL } from 'os';
import dateFnsTz from 'date-fns-tz';
import { format } from 'date-fns';

const { utcToZonedTime } = dateFnsTz;

const TZ = Intl.DateTimeFormat()
  .resolvedOptions()
  .timeZone;

function toZonedIcalTime (date: Date): string {
  const zoned = utcToZonedTime(date, TZ);
  return format(zoned, `yyyyMMdd'T'HHmmss`);
}

const CALENDAR_HEADER = `BEGIN:VCALENDAR${EOL}VERSION:2.0${EOL}`;
const CALENDAR_FOOTER = `END:VCALENDAR${EOL}`;
const EVENT_FOOTER = `END:VEVENT${EOL}`;

const computeEventHeader = () => `BEGIN:VEVENT${EOL}DTSTAMP:${toZonedIcalTime(new Date())}`;
const computeSummary = (summary: string) => `SUMMARY:${summary}`;
const computeStart = (dtstart: Date) => `DTSTART:${toZonedIcalTime(dtstart)}`;
const computeEnd = (dtend: Date) => `DTEND:${toZonedIcalTime(dtend)}`;

const computeLocation = (location: string) => `LOCATION:${location}`;
const computeDescription = (description: string) => `DESCRIPTION:${description}`;

function toIcsEvent (record: Record<string, any>): string {
  return [
    computeEventHeader(),
    computeSummary(record.summary),
    computeStart(record.dtstart),
    computeEnd(record.dtend),
    ...(!!record.location ? [ computeLocation(record.location) ] : []),
    ...(!!record.description ? [ computeDescription(record.description) ] : []),
    EVENT_FOOTER,
  ].join(EOL);
}

export function jsToIcs (records: Record<string, any>): string {
  return [
    CALENDAR_HEADER,
    ...records.map((record: Record<string, any>) => toIcsEvent(record)),
    CALENDAR_FOOTER,
  ].join(EOL);
}
