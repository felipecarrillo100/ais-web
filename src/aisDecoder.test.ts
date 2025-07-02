import { AisReceiver } from './aisDecoder';

describe('AIS Decoder Known Valid Sentences', () => {
    let decoder: AisReceiver;

    beforeEach(() => {
        decoder = new AisReceiver();
    });

    test('decodes single-part position message (Type 1)', done => {
        // Known AIS type 1 message with MMSI 366053209 (example)
        const sentence = '!AIVDM,1,1,,A,13aG?P0000G?tO`K>Nq5Owv820S:,0*46';

        decoder.once('position', msg => {
            try {
                expect(msg.mmsi).toBe(366053209);
                expect(msg.lat).toBeCloseTo(37.8055, 3);
                expect(msg.lon).toBeCloseTo(-122.277, 3);
                expect(msg.sog).toBeCloseTo(0, 1);
                done();
            } catch (e) {
                done(e);
            }
        });

        decoder.onMessage(sentence);
    });

    test('decodes single-part static message (Type 5)', done => {
        // Known AIS type 5 message with MMSI 366053209, callsign "WDC6417"
        const sentence = '!AIVDM,1,1,,A,55NBsi02>tE>4TpF221@E:20h4@D,0*7B';

        decoder.once('static', msg => {
            try {
                expect(msg.mmsi).toBe(366053209);
                expect(msg.callsign.trim()).toBe('WDC6417');
                expect(msg.name.trim()).toBe('BRICKPILOT');
                expect(msg.destination.trim()).toBe('SAN FRANCISCO');
                done();
            } catch (e) {
                done(e);
            }
        });

        decoder.onMessage(sentence);
    });

    test('decodes multi-part static message (Type 5)', done => {
        // Valid multipart type 5 static message (2 parts)
        const parts = [
            '!AIVDM,2,1,1,B,55NBsi02>tE>4TpF221@E:20h4@D222222222221@8HQC16Ch0:RA7kAD,0*28',
            '!AIVDM,2,2,1,B,PBp888888888880,2*79',
        ];

        decoder.once('static', msg => {
            try {
                expect(msg.mmsi).toBe(366053209);
                expect(msg.callsign.trim()).toBe('WDC6417');
                expect(msg.name.trim()).toBe('BRICKPILOT');
                expect(msg.destination.trim()).toBe('SAN FRANCISCO');
                done();
            } catch (e) {
                done(e);
            }
        });

        parts.forEach(sentence => decoder.onMessage(sentence));
    });
});
