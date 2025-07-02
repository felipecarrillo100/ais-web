// bitUtils.ts
/**
 * Utility functions for AIS bitfield encoding and decoding.
 */

export function encodeBitField(fields: Array<{ value: any; length: number; signed?: boolean; ascii?: boolean }>): string {
    let bits = '';
    for (const field of fields) {
        if (field.ascii) {
            let str = String(field.value).toUpperCase().padEnd(field.length / 6, '@');
            for (const ch of str) {
                const code = Math.max(0, Math.min(63, ch.charCodeAt(0) - 64));
                bits += code.toString(2).padStart(6, '0');
            }
        } else {
            let val = Number(field.value);
            if (field.signed) {
                const max = 1 << (field.length - 1);
                if (val < 0) val = (1 << field.length) + val;
                else if (val >= max) val = max - 1;
            }
            bits += val.toString(2).padStart(field.length, '0');
        }
    }
    return bits;
}

export function to6BitAscii(bits: string): string {
    const chunks = bits.match(/.{1,6}/g) || [];
    return chunks.map(b => {
        const val = parseInt(b.padEnd(6, '0'), 2);
        return String.fromCharCode(val + 48 + (val > 39 ? 8 : 0));
    }).join('');
}

export function from6BitAscii(payload: string, fillBits: number): string {
    let bits = '';
    for (const ch of payload) {
        const val = ch.charCodeAt(0);
        let sixbit = val - 48;
        if (sixbit > 39) sixbit -= 8;
        bits += sixbit.toString(2).padStart(6, '0');
    }
    return bits.slice(0, bits.length - fillBits);
}

export function parseBitField(bits: string, fields: Array<{ key: string; start: number; length: number; signed?: boolean; ascii?: boolean }>): any {
    const result: any = {};
    for (const field of fields) {
        const segment = bits.slice(field.start, field.start + field.length);
        if (field.ascii) {
            let str = '';
            for (let i = 0; i < segment.length; i += 6) {
                const val = parseInt(segment.slice(i, i + 6), 2);
                str += String.fromCharCode(val + 64);
            }
            result[field.key] = str.trim().replace(/@+$/, '');
        } else {
            let val = parseInt(segment, 2);
            if (field.signed) {
                const max = 1 << (field.length - 1);
                if (val >= max) val -= (1 << field.length);
            }
            result[field.key] = val;
        }
    }
    return result;
}
