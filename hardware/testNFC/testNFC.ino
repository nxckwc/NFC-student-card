#include <Wire.h>
#include <Adafruit_PN532.h>

// Define I2C pins (Adjust these to match your board wiring)
#define SDA_PIN 5
#define SCL_PIN 6

// Define IRQ and Reset pins. 
// If you didn't wire IRQ and RST to your microcontroller, set them to -1.
#define IRQ_PIN -1
#define RST_PIN -1

// Initialize the PN532 for I2C
Adafruit_PN532 nfc(IRQ_PIN, RST_PIN);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.printf("initialized");

  // Initialize I2C with custom pins (common for ESP32)
  Wire.begin(SDA_PIN, SCL_PIN);

  // Initialize communication with the PN532 module
  nfc.begin();

  uint32_t version = nfc.getFirmwareVersion();
  if (!version) {
    Serial.println("❌ PN532 not found! Check your wiring, power (3.3V/5V), and I2C/DIP switches.");
    while (1) {
      delay(1000);
    }
  }

  // Print successfully found firmware details
  Serial.printf("✅ Found chip PN5%02X firmware %d.%d\n", 
                (version >> 24) & 0xFF,
                (version >> 16) & 0xFF, 
                (version >> 8) & 0xFF);
  
  // Configure the board to read RFID tags
  nfc.SAMConfig();
  Serial.println("🏷️ Waiting for an NFC/RFID card to tap...");
}

void loop() {
  uint8_t uid[7];
  uint8_t uidLen;

  // Try to read a passive target (ISO14443A card/tag) with a 500ms timeout
  if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLen, 500)) {
    Serial.print("💳 UID: ");
    for (uint8_t i = 0; i < uidLen; i++) {
      Serial.printf("%02X ", uid[i]);
    }
    Serial.println();
    
    // Delay to prevent spamming the serial monitor when a card rests on the reader
    delay(1000);
  }
}