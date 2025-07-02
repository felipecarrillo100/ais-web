import { AisReceiver } from './aisDecoder';
import { encodeStaticMessage, encodePositionMessage, AisStaticMessage, AisPositionMessage } from './aisEncoder';

describe('AIS Encoder Integration with Encoder for Crosscheck', () => {
    let decoder: AisReceiver;

    beforeEach(() => {
        decoder = new AisReceiver();
    });

    test('decodes encoded static message', done => {
        const vesselStatic: AisStaticMessage = {
            mmsi: 123456789,
            name: 'TESTSHIP',
            callsign: 'CALL123',
            destination: 'ROTTERDAM',
            imo: 9876543,
            shipType: 70,
            dimensionToBow: 50,
            dimensionToStern: 20,
            dimensionToPort: 5,
            dimensionToStarboard: 5,
            epfd: 1,
            etaMonth: 7,
            etaDay: 1,
            etaHour: 12,
            etaMinute: 0,
            draught: 5.2,
            dteAvailable: true,
            repeat: 0,
            aisVersion: 0,
            channel: 'A',
        };

        const staticMsgs = encodeStaticMessage(vesselStatic);

        decoder.once('static', msg => {
            try {
                expect(msg.mmsi).toBe(vesselStatic.mmsi);
                expect(msg.name).toBe(vesselStatic.name);
                expect(msg.callsign).toBe(vesselStatic.callsign);
                expect(msg.destination).toBe(vesselStatic.destination);
                done();
            } catch (err) {
                done(err);
            }
        });

        for (const sentence of staticMsgs) {
            decoder.onMessage(sentence);
        }
    });

    test('decodes encoded position message', done => {
        const vesselPosition: AisPositionMessage = {
            mmsi: 123456789,
            navStatus: 0,
            rateOfTurn: 0,
            sog: 10.0,
            accuracy: true,
            lon: 4.48,
            lat: 51.92,
            cog: 90.0,
            heading: 90,
            timestamp: 60,
            specialManoeuvre: 0,
            raim: false,
            radio: 0,
            repeat: 0,
            channel: 'A',
        };

        const positionMsgs = encodePositionMessage(vesselPosition);

        decoder.once('position', msg => {
            try {
                expect(msg.mmsi).toBe(vesselPosition.mmsi);
                expect(msg.lat).toBeCloseTo(vesselPosition.lat, 4);
                expect(msg.lon).toBeCloseTo(vesselPosition.lon, 4);
                done();
            } catch (err) {
                done(err);
            }
        });

        for (const sentence of positionMsgs) {
            decoder.onMessage(sentence);
        }
    });


});
