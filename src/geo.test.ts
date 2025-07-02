import {AisPositionMessage, encodePositionMessage} from './aisEncoder';
import {AisReceiver} from './aisDecoder';

describe('GEO Tests', () => {

    describe('AIS Position Message Decoding Tests for Different World Regions', () => {

        test('San Francisco, USA: Decode single position message and verify MMSI, lat, lon, speed, course, heading, navStatus', (done) => {
            const vessel: AisPositionMessage = {
                mmsi: 123456789,
                lat: 37.7749,
                lon: -122.4194,
                sog: 12.3,
                cog: 45,
                heading: 44,
                navStatus: 0,
                rateOfTurn: 0,
                accuracy: false,
                timestamp: 0
            };
            const decoder = new AisReceiver();

            decoder.once('position', (msg) => {
                try {
                    expect(msg.mmsi).toBe(vessel.mmsi);
                    expect(msg.lat).toBeCloseTo(vessel.lat, 3);
                    expect(msg.lon).toBeCloseTo(vessel.lon, 3);
                    expect(msg.speedOverGround).toBeCloseTo(vessel.sog, 1);
                    expect(msg.courseOverGround).toBeCloseTo(vessel.cog, 0);
                    expect(msg.heading).toBe(vessel.heading);
                    expect(msg.navStatus).toBe(vessel.navStatus);
                    done();
                } catch (error) {
                    done(error);
                }
            });

            const sentences = encodePositionMessage(vessel);
            sentences.forEach(s => decoder.onMessage(s));
        });

        test('London, UK: Decode single position message and validate position and navigation fields for UK waters', (done) => {
            const vessel: AisPositionMessage = {
                mmsi: 234567890,
                lat: 51.5074,
                lon: -0.1278,
                sog: 8.5,
                cog: 120,
                heading: 118,
                navStatus: 3,
                rateOfTurn: 0,
                accuracy: false,
                timestamp: 0
            };
            const decoder = new AisReceiver();

            decoder.once('position', (msg) => {
                try {
                    expect(msg.mmsi).toBe(vessel.mmsi);
                    expect(msg.lat).toBeCloseTo(vessel.lat, 3);
                    expect(msg.lon).toBeCloseTo(vessel.lon, 3);
                    expect(msg.speedOverGround).toBeCloseTo(vessel.sog, 1);
                    expect(msg.courseOverGround).toBeCloseTo(vessel.cog, 0);
                    expect(msg.heading).toBe(vessel.heading);
                    expect(msg.navStatus).toBe(vessel.navStatus);
                    done();
                } catch (error) {
                    done(error);
                }
            });

            const sentences = encodePositionMessage(vessel);
            sentences.forEach(s => decoder.onMessage(s));
        });

        test('Tokyo, Japan: Verify decoder correctly processes position messages in Asia-Pacific region', (done) => {
            const vessel: AisPositionMessage = {
                mmsi: 345678901,
                lat: 35.6895,
                lon: 139.6917,
                sog: 15.7,
                cog: 270,
                heading: 270,
                navStatus: 1,
                rateOfTurn: 0,
                accuracy: false,
                timestamp: 0
            };
            const decoder = new AisReceiver();

            decoder.once('position', (msg) => {
                try {
                    expect(msg.mmsi).toBe(vessel.mmsi);
                    expect(msg.lat).toBeCloseTo(vessel.lat, 3);
                    expect(msg.lon).toBeCloseTo(vessel.lon, 3);
                    expect(msg.speedOverGround).toBeCloseTo(vessel.sog, 1);
                    expect(msg.courseOverGround).toBeCloseTo(vessel.cog, 0);
                    expect(msg.heading).toBe(vessel.heading);
                    expect(msg.navStatus).toBe(vessel.navStatus);
                    done();
                } catch (error) {
                    done(error);
                }
            });

            const sentences = encodePositionMessage(vessel);
            sentences.forEach(s => decoder.onMessage(s));
        });

        test('Sydney, Australia: Test position decoding for vessels operating in Southern Hemisphere', (done) => {
            const vessel: AisPositionMessage = {
                mmsi: 456789012,
                lat: -33.8688,
                lon: 151.2093,
                sog: 7.8,
                cog: 330,
                heading: 330,
                navStatus: 5,
                rateOfTurn: 0,
                accuracy: false,
                timestamp: 0
            };
            const decoder = new AisReceiver();

            decoder.once('position', (msg) => {
                try {
                    expect(msg.mmsi).toBe(vessel.mmsi);
                    expect(msg.lat).toBeCloseTo(vessel.lat, 3);
                    expect(msg.lon).toBeCloseTo(vessel.lon, 3);
                    expect(msg.speedOverGround).toBeCloseTo(vessel.sog, 1);
                    expect(msg.courseOverGround).toBeCloseTo(vessel.cog, 0);
                    expect(msg.heading).toBe(vessel.heading);
                    expect(msg.navStatus).toBe(vessel.navStatus);
                    done();
                } catch (error) {
                    done(error);
                }
            });

            const sentences = encodePositionMessage(vessel);
            sentences.forEach(s => decoder.onMessage(s));
        });

        test('Nairobi, Kenya: Confirm decoding works near the equator with heading unavailable', (done) => {
            const vessel: AisPositionMessage = {
                mmsi: 567890123,
                lat: -1.2921,
                lon: 36.8219,
                sog: 0,
                cog: 0,
                heading: 511, // AIS standard: 511 means unavailable
                navStatus: 15,
                rateOfTurn: 0,
                accuracy: false,
                timestamp: 0
            };
            const decoder = new AisReceiver();

            decoder.once('position', (msg) => {
                try {
                    expect(msg.mmsi).toBe(vessel.mmsi);
                    expect(msg.lat).toBeCloseTo(vessel.lat, 3);
                    expect(msg.lon).toBeCloseTo(vessel.lon, 3);
                    expect(msg.speedOverGround).toBeCloseTo(vessel.sog, 1);
                    expect(msg.courseOverGround).toBeCloseTo(vessel.cog, 0);
                    expect(msg.heading).toBe(vessel.heading);
                    expect(msg.navStatus).toBe(vessel.navStatus);
                    done();
                } catch (error) {
                    done(error);
                }
            });

            const sentences = encodePositionMessage(vessel);
            sentences.forEach(s => decoder.onMessage(s));
        });
    });

    describe('AIS Position Message Decoding Tests for Geographic Edge Cases', () => {

        test('North Pole: Decode single position message and verify MMSI, lat, lon, speed, course, heading, navStatus', (done) => {
            const vessel: AisPositionMessage = {
                mmsi: 111111111,
                lat: 90.0,
                lon: 0.0,
                sog: 0,
                cog: 0,
                heading: 511,    // Heading unavailable at the pole
                navStatus: 0,
                rateOfTurn: 0,
                accuracy: false,
                timestamp: 0,
            };
            const decoder = new AisReceiver();

            decoder.once('position', (msg) => {
                try {
                    expect(msg.mmsi).toBe(vessel.mmsi);
                    expect(msg.lat).toBeCloseTo(vessel.lat, 3);
                    expect(msg.lon).toBeCloseTo(vessel.lon, 3);
                    expect(msg.speedOverGround).toBeCloseTo(vessel.sog, 1);
                    expect(msg.courseOverGround).toBeCloseTo(vessel.cog, 0);
                    expect(msg.heading).toBe(vessel.heading);
                    expect(msg.navStatus).toBe(vessel.navStatus);
                    done();
                } catch (error) {
                    done(error);
                }
            });

            const sentences = encodePositionMessage(vessel);
            sentences.forEach((s) => decoder.onMessage(s));
        });

        test('South Pole: Decode single position message and verify MMSI, lat, lon, speed, course, heading, navStatus', (done) => {
            const vessel: AisPositionMessage = {
                mmsi: 222222222,
                lat: -90.0,
                lon: 0.0,
                sog: 0,
                cog: 0,
                heading: 511, // Heading unavailable at the pole
                navStatus: 0,
                rateOfTurn: 0,
                accuracy: false,
                timestamp: 0,
            };
            const decoder = new AisReceiver();

            decoder.once('position', (msg) => {
                try {
                    expect(msg.mmsi).toBe(vessel.mmsi);
                    expect(msg.lat).toBeCloseTo(vessel.lat, 3);
                    expect(msg.lon).toBeCloseTo(vessel.lon, 3);
                    expect(msg.speedOverGround).toBeCloseTo(vessel.sog, 1);
                    expect(msg.courseOverGround).toBeCloseTo(vessel.cog, 0);
                    expect(msg.heading).toBe(vessel.heading);
                    expect(msg.navStatus).toBe(vessel.navStatus);
                    done();
                } catch (error) {
                    done(error);
                }
            });

            const sentences = encodePositionMessage(vessel);
            sentences.forEach((s) => decoder.onMessage(s));
        });

        test('International Date Line East (+180°): Decode single position message and verify MMSI, lat, lon, speed, course, heading, navStatus', (done) => {
            const vessel: AisPositionMessage = {
                mmsi: 333333333,
                lat: 0.0,
                lon: 180.0,
                sog: 10.5,
                cog: 90,
                heading: 90,
                navStatus: 0,
                rateOfTurn: 0,
                accuracy: false,
                timestamp: 0,
            };
            const decoder = new AisReceiver();

            decoder.once('position', (msg) => {
                try {
                    expect(msg.mmsi).toBe(vessel.mmsi);
                    expect(msg.lat).toBeCloseTo(vessel.lat, 3);
                    expect(msg.lon).toBeCloseTo(vessel.lon, 3);
                    expect(msg.speedOverGround).toBeCloseTo(vessel.sog, 1);
                    expect(msg.courseOverGround).toBeCloseTo(vessel.cog, 0);
                    expect(msg.heading).toBe(vessel.heading);
                    expect(msg.navStatus).toBe(vessel.navStatus);
                    done();
                } catch (error) {
                    done(error);
                }
            });

            const sentences = encodePositionMessage(vessel);
            sentences.forEach((s) => decoder.onMessage(s));
        });

        test('International Date Line West (-180°): Decode single position message and verify MMSI, lat, lon, speed, course, heading, navStatus', (done) => {
            const vessel: AisPositionMessage = {
                mmsi: 444444444,
                lat: 0.0,
                lon: -180.0,
                sog: 10.5,
                cog: 270,
                heading: 270,
                navStatus: 0,
                rateOfTurn: 0,
                accuracy: false,
                timestamp: 0,
            };
            const decoder = new AisReceiver();

            decoder.once('position', (msg) => {
                try {
                    expect(msg.mmsi).toBe(vessel.mmsi);
                    expect(msg.lat).toBeCloseTo(vessel.lat, 3);
                    expect(msg.lon).toBeCloseTo(vessel.lon, 3);
                    expect(msg.speedOverGround).toBeCloseTo(vessel.sog, 1);
                    expect(msg.courseOverGround).toBeCloseTo(vessel.cog, 0);
                    expect(msg.heading).toBe(vessel.heading);
                    expect(msg.navStatus).toBe(vessel.navStatus);
                    done();
                } catch (error) {
                    done(error);
                }
            });

            const sentences = encodePositionMessage(vessel);
            sentences.forEach((s) => decoder.onMessage(s));
        });
    });

});
