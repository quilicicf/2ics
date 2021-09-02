import { EOL } from 'os';
import dateFnsTz from 'date-fns-tz';
import { format } from 'date-fns';
const { utcToZonedTime } = dateFnsTz;
const TZ = Intl.DateTimeFormat()
    .resolvedOptions()
    .timeZone;
function toZonedIcalTime(date) {
    const zoned = utcToZonedTime(date, TZ);
    return format(zoned, `yyyyMMdd'T'HHmmss`);
}
const CALENDAR_HEADER = `BEGIN:VCALENDAR${EOL}VERSION:2.0${EOL}`;
const CALENDAR_FOOTER = `END:VCALENDAR${EOL}`;
const EVENT_FOOTER = `END:VEVENT${EOL}`;
const computeEventHeader = () => `BEGIN:VEVENT${EOL}DTSTAMP:${toZonedIcalTime(new Date())}`;
const computeSummary = (summary) => `SUMMARY:${summary}`;
const computeStart = (dtstart) => `DTSTART:${toZonedIcalTime(dtstart)}`;
const computeEnd = (dtend) => `DTEND:${toZonedIcalTime(dtend)}`;
const computeLocation = (location) => `LOCATION:${location}`;
const computeDescription = (description) => `DESCRIPTION:${description}`;
function toIcsEvent(record) {
    return [
        computeEventHeader(),
        computeSummary(record.summary),
        computeStart(record.dtstart),
        computeEnd(record.dtend),
        ...(!!record.location ? [computeLocation(record.location)] : []),
        ...(!!record.description ? [computeDescription(record.description)] : []),
        EVENT_FOOTER,
    ].join(EOL);
}
export function jsToIcs(records) {
    return [
        CALENDAR_HEADER,
        ...records.map((record) => toIcsEvent(record)),
        CALENDAR_FOOTER,
    ].join(EOL);
}
