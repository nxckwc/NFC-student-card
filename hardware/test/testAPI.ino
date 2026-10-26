#include <WiFi.h>
#include <HTTPClient.h>

const char* WIFI_SSID = "Fasai64_5G";
const char* WIFI_PASSWORD = "02102531";

// Backend address, not the Next.js frontend.
// Replace this example IP with your computer's LAN IPv4.
const char* API_BASE = "http://192.168.1.100:3100";

// Use the reader's database ID and its own deviceToken.
// This is NOT READER_DEVICE_SECRET.
const char* READER_ID = "YOUR_READER_ID";
const char* READER_TOKEN = "YOUR_READER_DEVICE_TOKEN";

// Replace with a real card UID: lowercase hex, no spaces.
const char* TEST_CARD_UID = "04a1b2c3d4";

void testScan(const char* cardUid) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    WiFi.reconnect();
    return;
  }

  WiFiClient client;
  HTTPClient http;

  String url = String(API_BASE) + "/admin/reader/scan";

  if (!http.begin(client, url)) {
    Serial.println("Failed to initialize HTTP request.");
    return;
  }

  http.setConnectTimeout(5000);
  http.setTimeout(10000);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Reader-Token", READER_TOKEN);

  String body = "{\"readerId\":\"";
  body += READER_ID;
  body += "\",\"cardUid\":\"";
  body += cardUid;
  body += "\",\"dryRun\":true}";

  Serial.println("Sending test scan...");

  int status = http.POST(body);

  if (status > 0) {
    Serial.printf("HTTP status: %d\n", status);
    Serial.println(http.getString());
  } else {
    Serial.printf(
      "Connection error: %s\n",
      HTTPClient::errorToString(status).c_str()
    );
  }

  http.end();
  Serial.println("\nType t to test again.");
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to WiFi");

  unsigned long started = millis();

  while (WiFi.status() != WL_CONNECTED &&
         millis() - started < 20000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("\nESP32 IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection timed out. Check credentials.");
  }

  Serial.println("Type t in Serial Monitor to test the API.");
}

void loop() {
  if (Serial.available()) {
    char input = Serial.read();

    if (input == 't' || input == 'T') {
      testScan(TEST_CARD_UID);
    }
  }

  delay(10);
}