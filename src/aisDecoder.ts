// aisDecoder.ts
import { EventEmitter } from 'events';

export interface PositionMessage {
    type: 1 | 2 | 3;
    channel: string;
    repeat: number;
    mmsi: number;
    navStatus: number;
    rateOfTurn: number;
    speedOverGround: number;
    accuracy: boolean;
    lon: number;
    lat: number;
    courseOverGround: number;
    heading: number;
    utcSecond: number;
    specialManoeuvre: number;
    raim: boolean;
    radio: number;
}

export interface StaticVoyageMessage {
    type: 5;
    mmsi: number;
    repeat: number;
    aisVersion: number;
    imo: number;
    callsign: string;
    name: string;
    shipType: number;
    dimensionToBow: number;
    dimensionToStern: number;
    dimensionToPort: number;
    dimensionToStarboard: number;
    etaMonth: number;
    etaDay: number;
    etaHour: number;
    etaMinute: number;
    draught: number;
    destination: string;
    dteAvailable: boolean;
    channel: string;
}

export type AisDecodedMessage = PositionMessage | StaticVoyageMessage;

type MultipartBufferKey = string;

interface MultipartBufferEntry {
    total: number;
    receivedParts: Map<number, string>;
    fillBits: number;
    timer: NodeJS.Timeout;
}

export class AisReceiver extends EventEmitter {
    private multipartBuffers = new Map<MultipartBufferKey, MultipartBufferEntry>();
    private static MULTIPART_TIMEOUT_MS = 30000;

    /**
     * Process one AIS sentence.
     * @param sentence Raw NMEA AIS sentence, e.g. "!AIVDM,1,1,,A,...*hh"
     * @param enableChecksum Whether to verify the checksum (default: true)
     */
    public onMessage(sentence: string, enableChecksum = true) {
        console.log(`Received sentence: ${sentence}`);

        const match = sentence.match(/^!(AIVDM|AIVDO),(\d+),(\d+),([^,]*),([AB]),([^,]*),(\d+)\*([0-9A-F]{2})/i);
        if (!match) {
            console.warn('Sentence does not match AIS NMEA format');
            return;
        }

        if (enableChecksum && !this.verifyChecksum(sentence)) {
            console.warn('Checksum failed for:', sentence);
            return;
        }

        const [, , totalStr, partStr, seqId, channel, payload, fillBitsStr] = match;
        const total = parseInt(totalStr, 10);
        const part = parseInt(partStr, 10);
        const fillBits = parseInt(fillBitsStr, 10);
        const key = seqId || 'noprefix';

        console.log(`Message total: ${total}, part: ${part}, seqId: ${seqId}, channel: ${channel}`);

        if (total === 1) {
            // Single part message - decode immediately
            const bits = this.payloadToBits(payload, fillBits);
            this.processBits(bits, channel);
            return;
        }

        // Multipart message - buffer parts until all received
        let entry = this.multipartBuffers.get(key);
        if (!entry) {
            entry = {
                total,
                receivedParts: new Map<number, string>(),
                fillBits,
                timer: setTimeout(() => {
                    console.warn(`Multipart message timed out for key ${key}`);
                    this.multipartBuffers.delete(key);
                }, AisReceiver.MULTIPART_TIMEOUT_MS),
            };
            this.multipartBuffers.set(key, entry);
        }

        entry.receivedParts.set(part, payload);

        if (entry.receivedParts.size === total) {
            clearTimeout(entry.timer);
            this.multipartBuffers.delete(key);
            let fullPayload = '';
            for (let i = 1; i <= total; i++) {
                const partPayload = entry.receivedParts.get(i);
                if (!partPayload) {
                    console.warn(`Missing part ${i} in multipart message for key ${key}`);
                    return;
                }
                fullPayload += partPayload;
            }
            const bits = this.payloadToBits(fullPayload, entry.fillBits);
            this.processBits(bits, channel);
        }
    }

    private verifyChecksum(sentence: string): boolean {
        const starIndex = sentence.indexOf('*');
        if (starIndex === -1) {
            console.warn('No checksum found');
            return false;
        }
        // XOR of characters between '!' and '*', exclusive
        const toCheck = sentence.slice(1, starIndex);
        let checksum = 0;
        for (let i = 0; i < toCheck.length; i++) {
            checksum ^= toCheck.charCodeAt(i);
        }
        const expected = sentence.slice(starIndex + 1).toUpperCase();
        const calculated = checksum.toString(16).toUpperCase().padStart(2, '0');
        if (calculated !== expected) {
            console.warn(`Checksum mismatch: calculated ${calculated}, expected ${expected}`);
            return false;
        }
        return true;
    }

    private payloadToBits(payload: string, fillBits: number): string {
        let bits = '';
        for (const c of payload) {
            let val = c.charCodeAt(0) - 48;
            if (val > 40) val -= 8;
            bits += val.toString(2).padStart(6, '0');
        }
        return fillBits > 0 ? bits.slice(0, -fillBits) : bits;
    }

    private processBits(bits: string, channel: string) {
        const type = this.readUInt(bits, 0, 6);
        const mmsi = this.readUInt(bits, 8, 30);
        console.log(`Decoded message type: ${type}, MMSI: ${mmsi}`);

        if (type === 5) {
            const msg = this.decodeType5(bits, mmsi, channel);
            if (msg) {
                console.log('Emitting static message:', msg);
                this.emit('static', msg);
            }
        } else if ([1, 2, 3].includes(type)) {
            const msg = this.decodePosition(bits, type as 1 | 2 | 3, mmsi, channel);
            if (msg) {
                console.log('Emitting position message:', msg);
                this.emit('position', msg);
            }
        } else {
            console.warn(`Unsupported AIS message type: ${type}`);
        }
    }

    private decodePosition(
        bits: string,
        type: 1 | 2 | 3,
        mmsi: number,
        channel: string
    ): PositionMessage | null {
        if (bits.length < 168) {
            console.warn('Not enough bits for position message');
            return null;
        }
        return {
            type,
            channel,
            repeat: this.readUInt(bits, 6, 2),
            mmsi,
            navStatus: this.readUInt(bits, 38, 4),
            rateOfTurn: this.readInt(bits, 42, 8),
            speedOverGround: this.readUInt(bits, 50, 10) / 10,
            accuracy: this.readUInt(bits, 60, 1) === 1,
            lon: this.readInt(bits, 61, 28) / 600000,
            lat: this.readInt(bits, 89, 27) / 600000,
            courseOverGround: this.readUInt(bits, 116, 12) / 10,
            heading: this.readUInt(bits, 128, 9),
            utcSecond: this.readUInt(bits, 137, 6),
            specialManoeuvre: this.readUInt(bits, 143, 2),
            raim: this.readUInt(bits, 145, 1) === 1,
            radio: this.readUInt(bits, 146, 19),
        };
    }

    private decodeType5(
        bits: string,
        mmsi: number,
        channel: string
    ): StaticVoyageMessage & { repeat: number; aisVersion: number } | null {
        if (bits.length < 424) {
            console.warn('Not enough bits for type 5 message');
            return null;
        }

        return {
            type: 5,
            mmsi,
            repeat: this.readUInt(bits, 6, 2),
            aisVersion: this.readUInt(bits, 38, 2),
            imo: this.readUInt(bits, 40, 30),
            callsign: this.decodeText(bits, 70, 7),
            name: this.decodeText(bits, 112, 20),
            shipType: this.readUInt(bits, 232, 8),
            dimensionToBow: this.readUInt(bits, 240, 9),
            dimensionToStern: this.readUInt(bits, 249, 9),
            dimensionToPort: this.readUInt(bits, 258, 6),
            dimensionToStarboard: this.readUInt(bits, 264, 6),
            etaMonth: this.readUInt(bits, 274, 4),
            etaDay: this.readUInt(bits, 278, 5),
            etaHour: this.readUInt(bits, 283, 5),
            etaMinute: this.readUInt(bits, 288, 6),
            draught: this.readUInt(bits, 294, 8) / 10,
            destination: this.decodeText(bits, 302, 20),
            dteAvailable: this.readUInt(bits, 422, 1) === 1,
            channel,
        };
    }

    private readUInt(bits: string, start: number, length: number): number {
        return parseInt(bits.slice(start, start + length), 2);
    }

    private readInt(bits: string, start: number, length: number): number {
        const value = bits.slice(start, start + length);
        if (value[0] === '0') return parseInt(value, 2);
        // Two's complement conversion for negative numbers
        const inverted = [...value].map((b) => (b === '0' ? '1' : '0')).join('');
        return -(parseInt(inverted, 2) + 1);
    }

    private decodeText(bits: string, start: number, chars: number): string {
        const AIS_6BIT_TABLE = [
            '@', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
            'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U',
            'V', 'W', 'X', 'Y', 'Z', '[', '\\', ']', '^', '_', ' ',
            '!', '"', '#', '$', '%', '&', '\'', '(', ')', '*', '+',
            ',', '-', '.', '/', '0', '1', '2', '3', '4', '5', '6',
            '7', '8', '9', ':', ';', '<', '=', '>', '?'
        ];

        let text = '';
        for (let i = 0; i < chars; i++) {
            const slice = bits.slice(start + i * 6, start + (i + 1) * 6);
            if (slice.length < 6) break;
            const val = parseInt(slice, 2);
            text += AIS_6BIT_TABLE[val] || ' ';
        }
        return text.replace(/@+$/g, ' ').trim();
    }
}
