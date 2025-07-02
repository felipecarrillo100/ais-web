// bitUtils.ts
/**
 * Utility functions for AIS bitfield encoding and decoding.
 */

const AIS_6BIT_CHAR_CODES: { [char: string]: number } = {
    '@': 0, 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9,
    'J': 10, 'K': 11, 'L': 12, 'M': 13, 'N': 14, 'O': 15, 'P': 16, 'Q': 17, 'R': 18,
    'S': 19, 'T': 20, 'U': 21, 'V': 22, 'W': 23, 'X': 24, 'Y': 25, 'Z': 26,
    '[': 27, '\\': 28, ']': 29, '^': 30, '_': 31,
    ' ': 32,
    '!': 33, '"': 34, '#': 35, '$': 36, '%': 37, '&': 38, '\'': 39, '(': 40, ')': 41, '*': 42,
    '+': 43, ',': 44, '-': 45, '.': 46, '/': 47,
    '0': 48, '1': 49, '2': 50, '3': 51, '4': 52, '5': 53, '6': 54, '7': 55, '8': 56, '9': 57,
    ':': 58, ';': 59, '<': 60, '=': 61, '>': 62, '?': 63,
};

export function encodeBitField(fields: Array<{ value: any; length: number; signed?: boolean; ascii?: boolean }>): string {
    let bits = '';
    for (const field of fields) {
        if (field.ascii) {
            // Ensure uppercase and pad with '@' (code 0) to required length in characters
            let str = String(field.value).toUpperCase().padEnd(field.length / 6, '@');
            for (const ch of str) {
                const code = AIS_6BIT_CHAR_CODES[ch] ?? 0; // fallback to '@' if unknown
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
