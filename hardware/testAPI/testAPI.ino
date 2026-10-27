#include <WiFi.h>
#include <HTTPClient.h>

const char* WIFI_SSID = "Eiei";
const char* WIFI_PASSWORD = "0918175740";

IPAddress SERVER_IP(172, 20, 10, 2);
const uint16_t SERVER_PORT = 3100;

void runDiagnostics() {
  Serial.println("\n========== NETWORK TEST ==========");

  if (WiFi.status() != WL_CONNECTED) {
    Serial.printf("WiFi disconnected. Status: %d\n", WiFi.status());
    Serial.println("Press RESET to reconnect.");
    return;
  }

  Serial.print("SSID:       ");
  Serial.println(WiFi.SSID());

  Serial.print("ESP32 IP:   ");
  Serial.println(WiFi.localIP());

  Serial.print("Subnet:     ");
  Serial.println(WiFi.subnetMask());

  Serial.print("Gateway:    ");
  Serial.println(WiFi.gatewayIP());

  Serial.printf("Signal:     %d dBm\n", WiFi.RSSI());

  Serial.print("Target:     ");
  Serial.print(SERVER_IP);
  Serial.printf(":%u\n", SERVER_PORT);

  // Test whether the PC's backend port is reachable.
  Serial.println("\n[1] Testing TCP connection...");

  WiFiClient probe;
  unsigned long started = millis();

  int connected = probe.connect(SERVER_IP, SERVER_PORT, 5000);

  Serial.printf("TCP test took %lu ms\n", millis() - started);

  if (!connected) {
    probe.stop();

    Serial.println("TCP FAILED: could not connect to the backend port.");
    Serial.println("No HTTP request or authentication happened.");
    Serial.println("Possible causes:");
    Serial.println("  - Incorrect PC IP or port");
    Serial.println("  - Windows firewall blocking the connection");
    Serial.println("  - Backend listening only on localhost");
    Serial.println("  - Hotspot blocking traffic between devices");
    Serial.println("\nType t to retry.");
    return;
  }

  Serial.println("TCP SUCCESS: backend port is reachable.");
  probe.stop();

  // Test the actual HTTP endpoint using a fresh connection.
  Serial.println("\n[2] Testing HTTP GET...");

  WiFiClient client;
  HTTPClient http;

  String url = String("http://") + SERVER_IP.toString()
             + ":" + String(SERVER_PORT) + "/";

  Serial.print("Request URL: ");
  Serial.println(url);

  if (!http.begin(client, url)) {
    Serial.println("HTTP initialization failed.");
    return;
  }

  http.setConnectTimeout(5000);
  http.setTimeout(10000);
  http.setReuse(false);

  started = millis();
  int status = http.GET();

  Serial.printf("HTTP test took %lu ms\n", millis() - started);

  if (status > 0) {
    Serial.printf("HTTP status: %d\n", status);
    Serial.printf("Reported body size: %d bytes\n", http.getSize());

    String body = http.getString();
    Serial.println("Response (first 500 characters):");
    Serial.println(body.substring(0, 500));
  } else {
    Serial.printf("HTTP error code: %d\n", status);
    Serial.print("HTTP error: ");
    Serial.println(HTTPClient::errorToString(status));
  }

  http.end();

  Serial.println("\n========== TEST FINISHED ==========");
  Serial.println("Type t to retry.");
}

void setup() {
  Serial.begin(115200);
  delay(1500);

  Serial.println("\nStarting network diagnostics...");
  Serial.print("Connecting to ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long started = millis();

  while (WiFi.status() != WL_CONNECTED &&
         millis() - started < 20000) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.printf("WiFi timed out. Status: %d\n", WiFi.status());
    Serial.println("Check iPhone hotspot and Maximize Compatibility.");
    Serial.println("Press RESET to retry.");
    return;
  }

  Serial.println("WiFi connected.");
  runDiagnostics();
}

void loop() {
  if (Serial.available()) {
    char command = Serial.read();

    if (command == 't' || command == 'T') {
      runDiagnostics();
    }
  }

  delay(10);
}