# **ais-web**

**Lightweight, Fast, and Zero-Dependency AIS Encoder and Decoder for the Web**

---

## **Overview**

ais-web is a **minimalistic and performant TypeScript library** designed to **encode and decode AIS (Automatic Identification System) messages** in web applications.

Built with a focus on **accuracy**, **speed**, and **ease of integration**, ais-web provides essential tools to work with AIS NMEA AIVDM/AIVDO sentences, enabling developers to build real-time maritime tracking, monitoring, and navigation solutions.

Perfect for web apps, dashboards, simulators, or testing tools needing AIS data handling without bulky dependencies.

---

## **Features**

### **🚀 Lightweight and Fast**
- Compact TypeScript implementation optimized for modern web environments.
- Zero dependencies — just import and use.

### **📡 Full AIS Position and Static Message Support**
- Supports AIS message types 1, 2, 3 (Position Reports) and 5 (Static and Voyage Data).
- Robust multi-part AIS message reassembly with configurable timeout.

### **🔧 Intuitive API**
- Simple functions to encode vessel data into AIS NMEA sentences.
- Event-driven AIS decoding with clear callbacks for position and static messages.
- Handles AIS-specific bitfield encoding and 6-bit ASCII payloads internally.

### **🌍 Global Position Coverage**
- Accurate encoding and decoding of vessel positions anywhere in the world.
- Supports realistic vessel navigation parameters: speed, course, heading, navigation status, and more.

### **🧪 Comprehensive Test Suite**
- Includes independent, region-specific tests for position decoding across multiple world regions.
- Uses the encoder output as input for the decoder tests, ensuring round-trip accuracy.

---

## **Quick Start**

### Install
```shell
npm install ais-web
```

### Usage

```typescript
import { AisReceiver } from 'ais-web';
import { encodePositionMessage, AisPositionMessage } from 'ais-web';

// Define vessel position data
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
  timestamp: Date.now(),
};

// Encode position to AIS NMEA sentences
const sentences = encodePositionMessage(vessel);

// Setup AIS decoder
const decoder = new AisReceiver();

decoder.on('position', (msg) => {
  console.log('Decoded position message:', msg);
});

// Feed encoded sentences to decoder
sentences.forEach(sentence => decoder.onMessage(sentence));
```

---

## **Why Choose ais-web?**

- **Zero Dependencies**: Lightweight codebase, no bulky libraries.
- **Web-Optimized**: Runs smoothly in browsers and Node.js environments.
- **Accurate AIS Handling**: Covers essential AIS message types for maritime applications.
- **Simple API**: Easy to integrate with event-driven decoding and straightforward encoding.
- **Robust Testing**: Verified correctness across global vessel positions and AIS message scenarios.

---

## **What’s Included**

- AIS Encoder for position and static messages.
- AIS Decoder supporting single-part and multi-part messages.
- Event-driven architecture with position and static message events.
- Checksum validation for AIS NMEA sentences.
- Timeout-based multi-part message reassembly.

---

## **Limitations**

- Currently supports only AIS message types 1, 2, 3 (Position Reports) and 5 (Static and Voyage Data).
- Some rare AIS message types and proprietary extensions are not implemented.
- Assumes valid NMEA sentence input; malformed sentences may cause decoding failures.
- Radio and special maneuver fields have default basic handling.
- Real-time network integration and AIS data stream management are left to the user’s application layer.

---

## **Testing**

- Each world region’s position decoding is tested independently to ensure precision and reliability.
- Test cases cover typical vessel parameters like MMSI, lat/lon, speed (SOG), course (COG), heading, and navigation status.
- Test suite leverages the encoder to generate real AIS sentences for decoding verification.
- Use `npm test` to run the full suite and verify AIS message handling correctness.

---

## **Contributing**

Contributions, bug reports, and feature requests are welcome! Please open issues or submit pull requests on GitHub.

---

## **License**

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

---

**ais-web: Simplifying AIS encoding and decoding for your maritime web applications.**

