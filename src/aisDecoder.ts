// aisDecoder.ts
import { EventEmitter } from 'events';

export interface PositionMessage {
    type: 1 | 2 | 3;
    mmsi: number;
    navStatus: number;
    rot: number;
    sog: number;
    accuracy: boolean;
    lon: number;
    lat: number;
    cog: number;
    heading: number;
    timestamp: number;
}

export interface StaticVoyageMessage {
    type: 5;
    mmsi: number;
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
    dte: number;
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

    public onMessage(sentence: string) {
        const match = sentence.match(/^!(AIVDM|AIVDO),(\d+),(\d+),([^,]*),([AB]),([^,]*),(\d+)\*([0-9A-F]{2})/i);
        if (!match) return;

        const [, , totalStr, partStr, seqId, , payload, fillBitsStr] = match;
        if (!this.verifyChecksum(sentence)) return;

        const total = parseInt(totalStr, 10);
        const part = parseInt(partStr, 10);
        const fillBits = parseInt(fillBitsStr, 10);
        const key = seqId || 'noprefix';

        if (total === 1) {
            const bits = this.payloadToBits(payload, fillBits);
            this.processBits(bits);
            return;
        }

        let entry = this.multipartBuffers.get(key);
        if (!entry) {
            entry = {
                total,
                receivedParts: new Map(),
                fillBits,
                timer: setTimeout(() => this.multipartBuffers.delete(key), AisReceiver.MULTIPART_TIMEOUT_MS),
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
                if (!partPayload) return;
                fullPayload += partPayload;
            }
            const bits = this.payloadToBits(fullPayload, entry.fillBits);
            this.processBits(bits);
        }
    }

    private processBits(bits: string) {
        const type = this.readUInt(bits, 0, 6);
        const mmsi = this.readUInt(bits, 8, 30);
        if (type === 5) {
            const msg = this.decodeType5(bits, mmsi);
            if (msg) this.emit('static', msg);
        } else if ([1, 2, 3].includes(type)) {
            const msg = this.decodePosition(bits, type as 1 | 2 | 3, mmsi);
            if (msg) this.emit('position', msg);
        }
    }

    private verifyChecksum(sentence: string): boolean {
        const star = sentence.indexOf('*');
        const without = sentence.slice(1, star);
        const expected = sentence.slice(star + 1).toUpperCase();
        let checksum = 0;
        for (const ch of without) checksum ^= ch.charCodeAt(0);
        return checksum.toString(16).toUpperCase().padStart(2, '0') === expected;
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

    private decodePosition(bits: string, type: 1 | 2 | 3, mmsi: number): PositionMessage | null {
        if (bits.length < 168) return null;
        return {
            type,
            mmsi,
            navStatus: this.readUInt(bits, 38, 4),
            rot: this.readInt(bits, 42, 8),
            sog: this.readUInt(bits, 50, 10) / 10,
            accuracy: this.readUInt(bits, 60, 1) === 1,
            lon: this.readInt(bits, 61, 28) / 600000,
            lat: this.readInt(bits, 89, 27) / 600000,
            cog: this.readUInt(bits, 116, 12) / 10,
            heading: this.readUInt(bits, 128, 9),
            timestamp: this.readUInt(bits, 137, 6),
        };
    }

    private decodeType5(bits: string, mmsi: number): StaticVoyageMessage & { repeat: number; aisVersion: number } | null {
        if (bits.length < 424) return null;

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
            etaMonth: this.readUInt(bits,274, 4),
            etaDay:this.readUInt(bits,278, 5),
            etaHour:this.readUInt(bits,283, 5),
            etaMinute: this.readUInt(bits,288, 6),
            draught: this.readUInt(bits, 294, 8) / 10,
            destination: this.decodeText(bits, 302, 20),
            dte: this.readUInt(bits, 422, 1),
        };
    }


    private readUInt(bits: string, start: number, length: number): number {
        return parseInt(bits.slice(start, start + length), 2);
    }

    private readInt(bits: string, start: number, length: number): number {
        const value = bits.slice(start, start + length);
        if (value[0] === '0') return parseInt(value, 2);
        const inverted = [...value].map(b => (b === '0' ? '1' : '0')).join('');
        return -(parseInt(inverted, 2) + 1);
    }

    private decodeText(bits: string, start: number, chars: number): string {
        let text = '';
        for (let i = 0; i < chars; i++) {
            const slice = bits.slice(start + i * 6, start + (i + 1) * 6);
            if (slice.length < 6) break;
            let val = parseInt(slice, 2);
            if (val < 32) text += String.fromCharCode(val + 64); // A-Z or space
            else text += String.fromCharCode(val);
        }
        return text.trim().replace(/@/g, ' ');
    }
}
