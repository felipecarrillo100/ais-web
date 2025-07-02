import {
    encodePositionMessage,
    encodeStaticMessage,
    AisPositionMessage,
    AisStaticMessage
} from './aisEncoder';

describe('Minimal AIS Encoder Tests', () => {
    test('encodes AisPositionMessage into AIVDM sentence(s)', () => {
        const msg: AisPositionMessage = {
            mmsi: 123456789,
            navStatus: 0,
            rateOfTurn: 0,
            sog: 10.0,
            accuracy: true,
            lon: 4.48,
            lat: 51.92,
            cog: 90,
            heading: 90,
            timestamp: 60,
        };

        const result = encodePositionMessage(msg);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toContain('!AIVDM');
    });

    test('encodes AisStaticMessage into AIVDM sentence(s)', () => {
        const msg: AisStaticMessage = {
            mmsi: 123456789,
            imo: 9876543,
            callsign: 'CALL123',
            name: 'TESTSHIP',
            shipType: 70,
            dimensionToBow: 50,
            dimensionToStern: 20,
            dimensionToPort: 5,
            dimensionToStarboard: 5,
            etaMonth: 7,
            etaDay: 1,
            etaHour: 12,
            etaMinute: 0,
            draught: 5.2,
            destination: 'ROTTERDAM',
        };

        const result = encodeStaticMessage(msg);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toContain('!AIVDM');
    });
});
