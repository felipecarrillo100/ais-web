/**
 * AIS Encoder: Generates AIVDM sentences for AIS Message Types 1 and 5
 * Complies with ITU-R M.1371
 */
import { encodeBitField, to6BitAscii } from './bitUtils';

export interface AisPositionMessage {
    mmsi: number;
    navStatus: number;
    rateOfTurn: number;
    sog: number;
    accuracy: boolean;
    lon: number;
    lat: number;
    cog: number;
    heading: number;
    timestamp: number;
    specialManoeuvre?: number;
    raim?: boolean;
    radio?: number;
    repeat?: number;
    channel?: 'A' | 'B';
}

export interface AisStaticMessage {
    mmsi: number;
    imo: number;
    callsign: string;
    name: string;
    shipType: number;
    dimensionToBow: number;
    dimensionToStern: number;
    dimensionToPort: number;
    dimensionToStarboard: number;
    epfd?: number;
    etaMonth: number;
    etaDay: number;
    etaHour: number;
    etaMinute: number;
    draught: number;
    destination: string;
    dteAvailable?: boolean;
    repeat?: number;
    aisVersion?: number;
    channel?: 'A' | 'B';
}

export function encodePositionMessage(msg: AisPositionMessage): string[] {
    const repeat = msg.repeat ?? 0;
    const specialManoeuvre = msg.specialManoeuvre ?? 0;
    const raim = msg.raim ?? false;
    const radio = msg.radio ?? 0;
    const channel = msg.channel ?? 'A';
    const accuracy = msg.accuracy ? 1 : 0;

    const bits = encodeBitField([
        { value: 1, length: 6 }, // message type 1
        { value: repeat, length: 2 }, // repeat indicator
        { value: msg.mmsi, length: 30 },
        { value: msg.navStatus, length: 4 },
        { value: msg.rateOfTurn, length: 8, signed: true },
        { value: Math.floor(msg.sog * 10), length: 10 },
        { value: accuracy, length: 1 },
        { value: Math.floor(msg.lon * 600000), length: 28, signed: true },
        { value: Math.floor(msg.lat * 600000), length: 27, signed: true },
        { value: Math.floor(msg.cog * 10), length: 12 },
        { value: msg.heading, length: 9 },
        { value: msg.timestamp, length: 6 },
        { value: specialManoeuvre, length: 2 },
        { value: raim ? 1 : 0, length: 1 },
        { value: radio, length: 19 },
    ]);
    return encodePayload(bits, 1, channel);
}

export function encodeStaticMessage(msg: AisStaticMessage): string[] {
    const repeat = msg.repeat ?? 0;
    const aisVersion = msg.aisVersion ?? 0;
    const epfd = msg.epfd ?? 0;
    // dteAvailable: true means available = 0, false means not available = 1 (inverted for AIS)
    const dteAvailable = msg.dteAvailable === false ? 1 : 0;
    const channel = msg.channel ?? 'A';

    const bits = encodeBitField([
        { value: 5, length: 6 }, // message type 5
        { value: repeat, length: 2 },
        { value: msg.mmsi, length: 30 },
        { value: aisVersion, length: 2 },
        { value: msg.imo, length: 30 },
        { value: msg.callsign, length: 42, ascii: true },
        { value: msg.name, length: 120, ascii: true },
        { value: msg.shipType, length: 8 },
        { value: msg.dimensionToBow, length: 9 },
        { value: msg.dimensionToStern, length: 9 },
        { value: msg.dimensionToPort, length: 6 },
        { value: msg.dimensionToStarboard, length: 6 },
        { value: epfd, length: 4 },
        { value: msg.etaMonth, length: 4 },
        { value: msg.etaDay, length: 5 },
        { value: msg.etaHour, length: 5 },
        { value: msg.etaMinute, length: 6 },
        { value: Math.floor(msg.draught * 10), length: 8 },
        { value: msg.destination, length: 120, ascii: true },
        { value: dteAvailable, length: 1 },
        { value: 0, length: 1 }, // spare
    ]);
    return encodePayload(bits, 5, channel);
}

function encodePayload(bits: string, messageType: number, channel: 'A' | 'B'): string[] {
    const payload = to6BitAscii(bits);
    const maxPayload = 60;
    const sentences: string[] = [];
    const total = Math.ceil(payload.length / maxPayload);
    const seqId = Math.floor(Math.random() * 9) + 1;

    for (let i = 0; i < total; i++) {
        const part = payload.slice(i * maxPayload, (i + 1) * maxPayload);
        const totalBits = part.length * 6;
        const fillBits = (8 - (totalBits % 8)) % 8;
        const line = `!AIVDM,${total},${i + 1},${seqId},${channel},${part},${fillBits}`;
        sentences.push(`${line}*${checksum(line)}`);
    }
    return sentences;
}

function checksum(sentence: string): string {
    let chk = 0;
    for (let i = 1; i < sentence.length; i++) {
        if (sentence[i] === '*') break;
        chk ^= sentence.charCodeAt(i);
    }
    return chk.toString(16).toUpperCase().padStart(2, '0');
}
