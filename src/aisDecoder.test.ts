import { AisReceiver } from './aisDecoder'; // Adjust import path as needed

describe('AIS Decoder Validated Sentences', () => {
    let decoder: AisReceiver;

    const testSentences = {
        // Single-part position message (Type 1) with valid checksum
        positionType1: '!AIVDM,1,1,,A,15MvraP000PD;88MdQG@4?vN0<3B,0*74',

        // Single-part static message (Type 5) with valid checksum
        staticType5: '!AIVDM,1,1,,B,55NBsi02>tE>4TpF221@E:20h4@D222222222221@8HQC16Ch0:RA7kADPBp888888888880,0*25',

        // Multi-part static message (Type 5) with valid checksums
        staticType5Part1: '!AIVDM,2,1,5,B,55NBsi02>tE>4TpF221@E:20h4@D222222222221@8HQC16Ch0:RA7kAD,0*79',
        staticType5Part2: '!AIVDM,2,2,5,B,PBp888888888880,2*78',
    };

    beforeEach(() => {
        decoder = new AisReceiver();
    });

    test('decodes single-part position message (Type 1)', (done) => {
        decoder.once('position', (msg) => {
            try {
                expect(msg.type).toBe(1);
                done();
            } catch (err) {
                done(err);
            }
        });
        decoder.onMessage(testSentences.positionType1);
    });

    test('decodes single-part static message (Type 5)', (done) => {
        decoder.once('static', (msg) => {
            try {
                expect(msg.type).toBe(5);
                done();
            } catch (err) {
                done(err);
            }
        });
        decoder.onMessage(testSentences.staticType5);
    });

    test('decodes multi-part static message (Type 5)', (done) => {
        decoder.once('static', (msg) => {
            try {
                expect(msg.type).toBe(5);
                done();
            } catch (err) {
                done(err);
            }
        });
        decoder.onMessage(testSentences.staticType5Part1);
        decoder.onMessage(testSentences.staticType5Part2);
    });
});
