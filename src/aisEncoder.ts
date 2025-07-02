// aisEncoder.ts
/**
 * AIS Encoder: Generates AIVDM sentences for AIS Message Types 1 and 5
 * Complies with ITU-R M.1371
 */
import { encodeBitField, to6BitAscii } from './bitUtils';

export interface AisPositionMessage {
    mmsi: number;
    navStatus: number;
    rot: number;
    sog: number;
    positionAccuracy: number;
    lon: number;
    lat: number;
    cog: number;
    trueHeading: number;
    timestamp: number;
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
    epfd: number;
    etaMonth: number;
    etaDay: number;
    etaHour: number;
    etaMinute: number;
    draught: number;
    destination: string;
}

export function encodePositionMessage(msg: AisPositionMessage): string[] {
    const bits = encodeBitField([
        { value: 1, length: 6 }, // message type 1
        { value: 0, length: 2 }, // repeat indicator
        { value: msg.mmsi, length: 30 },
        { value: msg.navStatus, length: 4 },
        { value: msg.rot, length: 8, signed: true },
        { value: Math.round(msg.sog * 10), length: 10 },
        { value: msg.positionAccuracy, length: 1 },
        { value: Math.round(msg.lon * 600000), length: 28, signed: true },
        { value: Math.round(msg.lat * 600000), length: 27, signed: true },
        { value: Math.round(msg.cog * 10), length: 12 },
        { value: msg.trueHeading, length: 9 },
        { value: msg.timestamp, length: 6 },
        { value: 0, length: 4 }, // maneuver indicator
        { value: 0, length: 1 }, // spare
        { value: 0, length: 1 }, // RAIM flag
        { value: 0, length: 19 }, // radio status
    ]);
    return encodePayload(bits, 1);
}

export function encodeStaticMessage(msg: AisStaticMessage): string[] {
    const bits = encodeBitField([
        { value: 5, length: 6 }, // message type 5
        { value: 0, length: 2 },
        { value: msg.mmsi, length: 30 },
        { value: 0, length: 2 }, // AIS version
        { value: msg.imo, length: 30 },
        { value: msg.callsign, length: 42, ascii: true },
        { value: msg.name, length: 120, ascii: true },
        { value: msg.shipType, length: 8 },
        { value: msg.dimensionToBow, length: 9 },
        { value: msg.dimensionToStern, length: 9 },
        { value: msg.dimensionToPort, length: 6 },
        { value: msg.dimensionToStarboard, length: 6 },
        { value: msg.epfd, length: 4 },
        { value: msg.etaMonth, length: 4 },
        { value: msg.etaDay, length: 5 },
        { value: msg.etaHour, length: 5 },
        { value: msg.etaMinute, length: 6 },
        { value: Math.round(msg.draught * 10), length: 8 },
        { value: msg.destination, length: 120, ascii: true },
        { value: 0, length: 1 }, // DTE
        { value: 0, length: 1 }, // spare
    ]);
    return encodePayload(bits, 5);
}

function encodePayload(bits: string, messageType: number): string[] {
    const payload = to6BitAscii(bits);
    const maxPayload = 60;
    const sentences: string[] = [];
    const total = Math.ceil(payload.length / maxPayload);
    const seqId = Math.floor(Math.random() * 9) + 1;

    for (let i = 0; i < total; i++) {
        const part = payload.slice(i * maxPayload, (i + 1) * maxPayload);
        const totalBits = part.length * 6;
        // Fix: fillBits must be number of unused bits to pad to next byte boundary (0-5)
        const fillBits = (8 - (totalBits % 8)) % 8;
        const line = `!AIVDM,${total},${i + 1},${seqId},A,${part},${fillBits}`;
        sentences.push(`${line}*${checksum(line)}`);
    }
    return sentences;
}

function checksum(sentence: string): string {
    let chk = 0;
    // Compute XOR of all characters between '!' and '*' (exclusive)
    for (let i = 1; i < sentence.length; i++) {
        if (sentence[i] === '*') break;
        chk ^= sentence.charCodeAt(i);
    }
    return chk.toString(16).toUpperCase().padStart(2, '0');
}
