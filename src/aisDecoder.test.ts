import {AisReceiver, StaticVoyageMessage} from './aisDecoder';
import {
    encodeStaticMessage,
    encodePositionMessage,
    AisStaticMessage,
    AisPositionMessage,
} from './aisEncoder';

describe('AIS Decoder Tests', () => {
    let decoder: AisReceiver;

    beforeEach(() => {
        decoder = new AisReceiver();
    });

    describe('Position Messages', () => {
        test('decodes encoded position message', (done) => {
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

            decoder.once('position', (msg) => {
                expect.assertions(5);
                try {
                    expect(msg.mmsi).toBe(vesselPosition.mmsi);
                    expect(msg.lat).toBeCloseTo(vesselPosition.lat, 4);
                    expect(msg.lon).toBeCloseTo(vesselPosition.lon, 4);
                    expect(msg.courseOverGround).toBeCloseTo(vesselPosition.cog, 1);
                    expect(msg.heading).toBe(vesselPosition.heading);
                    done();
                } catch (err) {
                    done(err);
                }
            });

            for (const sentence of positionMsgs) {
                decoder.onMessage(sentence);
            }
        });

        test('decodes encoded position message with 10-digit MMSI', (done) => {
            const vesselPosition: AisPositionMessage = {
                mmsi: 1000000000,
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

            decoder.once('position', (msg) => {
                expect.assertions(3);
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

    describe('Static Messages', () => {
        test('decodes encoded static message', (done) => {
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

            decoder.once('static', (msg) => {
                expect.assertions(4);
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
    });

    describe('Static Messages from Strings', () => {
        test('decodes encoded static message', (done) => {

            const vesselStatic = {
                mmsi: 123456789,
                name: "TEST SHIP",
                callsign: "CALL123",
                destination: "PORT OF CALL"
            }
            const staticMsgs = [
                "!AIVDM,2,1,2,A,51mg=5@2Fe3t<4hk7;=@E=B1<PU00000000000161@D577?os@D3lU83i`0h,0*0F",
                "!AIVDM,2,2,2,A,C3000000000,6*52"
            ];

            decoder.once('static', (msg) => {
                expect.assertions(4);
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
    });


    test('encode and decode static message preserves epfd and dteAvailable', (done) => {
        const originalMsg: AisStaticMessage = {
            mmsi: 123456789,
            imo: 9876543,
            callsign: 'CALL123',
            name: 'TEST VESSEL',
            shipType: 70,
            dimensionToBow: 10,
            dimensionToStern: 20,
            dimensionToPort: 5,
            dimensionToStarboard: 5,
            epfd: 7,
            etaMonth: 12,
            etaDay: 24,
            etaHour: 18,
            etaMinute: 30,
            draught: 5.4,
            destination: 'PORT NAME',
            dteAvailable: true,
            aisVersion: 1,
            repeat: 0,
            channel: 'A',
        };

        // Encode the message into AIS NMEA sentences (array of strings)
        const sentences = encodeStaticMessage(originalMsg);

        // Listen once for the decoded 'static' event
        decoder.once('static', (decodedMsg: StaticVoyageMessage) => {
            try {
                expect(decodedMsg.mmsi).toBe(originalMsg.mmsi);
                expect(decodedMsg.epfd).toBe(originalMsg.epfd);
                expect(decodedMsg.dteAvailable).toBe(originalMsg.dteAvailable);
                expect(decodedMsg.callsign.trim()).toBe(originalMsg.callsign);
                expect(decodedMsg.name.trim()).toBe(originalMsg.name);
                expect(decodedMsg.destination.trim()).toBe(originalMsg.destination);
                done();
            } catch (err) {
                done(err);
            }
        });

        // Feed all encoded sentences to the decoder (simulate multipart handling)
        sentences.forEach(sentence => decoder.onMessage(sentence));
    });

});
