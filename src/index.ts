import { encodePositionMessage, encodeStaticMessage } from './aisEncoder';
import { AisReceiver } from './aisDecoder';

const vesselStatic = {
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
};

const vesselPosition = {
    mmsi: 123456789,
    navStatus: 0,
    rot: 0,
    sog: 10.0,
    positionAccuracy: 1,
    lon: 4.48,
    lat: 51.92,
    cog: 90.0,
    trueHeading: 90,
    timestamp: 60,
};

const decoder = new AisReceiver();

decoder.on('static', msg => {
    console.log('Decoded Static Message:', msg);
});

decoder.on('position', msg => {
    console.log('Decoded Position Message:', msg);
});

const staticMsgs = encodeStaticMessage(vesselStatic);
console.log(staticMsgs)

const positionMsgs = encodePositionMessage(vesselPosition);
console.log(positionMsgs);

const parts = [];
parts.push('!AIVDM,2,1,7,A,57lof8`2F5HeT<eC:204e86373:222222222221@8HQC16Ch0:RA7kAD,0*28');
parts.push('!AIVDM,2,2,7,A,PBp888888888880,2*79');


[...staticMsgs, ...positionMsgs, ... parts].forEach(sentence => decoder.onMessage(sentence));
