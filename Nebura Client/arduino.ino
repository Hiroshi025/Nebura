#include "HX711.h"
#include <Wire.h> 
#include <LiquidCrystal_I2C.h>
#include <EEPROM.h>
#include <PCF8574.h>
#include <Adafruit_PWMServoDriver.h> // Librería para controlar el brazo robótico

// Define los pines de conexión
const byte DT = 3; // Pin de datos de la balanza
const byte CLK = 2; // Pin de reloj de la balanza
const byte modo = 7; // Botón para cambiar modos
const byte tara = 6; // Botón para tarar la balanza

// Configuración adicional para el proyecto
const byte led = 4;       // LED indicador
const byte electro1 = 8;  // Salida para la electroválvula de la tolva (HIGH = cerrada)
const byte electro2 = 9;  // Salida para el pistón (HIGH = extendido)
const byte electro3 = 5;  // Salida para el sellador
const byte sensor1 = 10;  // Sensor de proximidad de frasco bajo tolva
const byte sensor2 = 11;  // Sensor de conteo de frascos
const byte led2 = 13;     // LED indicador de conteo
const byte sensor3 = 12;  // Sensor de zona de sellado

// ************ Configuración del brazo robótico ************
const byte numServos = 6; // Número de servomotores
Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver(0x40); // Dirección I2C del controlador PCA9685

// Posiciones de los servos (en pulsos PWM)
int servoMin[numServos] = {150, 150, 150, 150, 150, 150}; // Valores mínimos para cada servo
int servoMax[numServos] = {600, 600, 600, 600, 600, 600}; // Valores máximos para cada servo
int servoPos[numServos] = {375, 375, 375, 375, 375, 375}; // Posiciones iniciales (centro)

// Secuencia de movimientos para el brazo
const int movimientos[][6] = {
  {375, 375, 375, 375, 375, 375}, // Posición inicial (brazo centrado y elevado)
  {400, 350, 450, 500, 300, 375}, // Posición para agarrar (brazo extendido hacia la plataforma a 40 cm)
  {375, 400, 500, 450, 375, 375}  // Posición para soltar (brazo elevado y ligeramente hacia un lado)
};
int movimientoActual = 0; // Índice del movimiento actual
bool brazoActivo = false; // Indica si el brazo está activo
unsigned long tiempoMovimientoBrazo = 0; // Tiempo de referencia para movimientos del brazo
const unsigned long tiempoEntreMovimientos = 1000; // Tiempo entre movimientos del brazo (1 segundo)
// ************ Fin de configuración del brazo robótico ************

// Variables de conteo
int frascos = 0; // Contador de frascos
int cajas = 0; // Contador de cajas
bool estadoAnteriorSensor2 = LOW; // Estado anterior del sensor de conteo

// Variables para control de tiempo
unsigned long tiempoPiston = 0; // Tiempo de referencia para el pistón
unsigned long tiempoSellador = 0; // Tiempo de referencia para el sellador
const unsigned long tiempoRetraccionPiston = 2000; // Tiempo de retracción del pistón (2 segundos)
const unsigned long tiempoEsperaSellado = 5000;    // Tiempo de espera antes de sellar (5 segundos)
const unsigned long tiempoDuracionSellado = 3000;  // Duración del sellado (3 segundos)

// Variables para el estado del sistema
enum EstadoSistema {
  ESPERANDO_FRASCO,
  LLENANDO_FRASCO,
  EXPULSANDO_FRASCO,
  FRASCO_EN_BANDA,
  ESPERANDO_SELLADO,
  SELLANDO_FRASCO
};
EstadoSistema estadoActual = ESPERANDO_FRASCO; // Estado inicial del sistema

// Configuración de la balanza
int peso_conocido[4] = {500, 1000, 3000, 5000}; // Pesos conocidos para calibración
long escala; // Factor de escala de la balanza
const float limite_peso = 2000; // Límite de peso para activar el pistón
const float peso_minimo = 50;   // Peso mínimo para considerar un frasco presente

// Crear los objetos para LCDs, balanza y PCF8574
LiquidCrystal_I2C lcd(0x27, 16, 2);    // LCD principal
LiquidCrystal_I2C lcd2(0x3F, 16, 2);   // LCD secundario
HX711 balanza; // Objeto para la balanza
PCF8574 pcf8574(0x20); // Objeto para el expansor de pines

// ************ Funciones del brazo robótico ************
// Función para mover un servo a un ángulo específico
void moverServo(byte servo, int angulo) {
  // Limitar el ángulo a los valores mínimos y máximos
  angulo = constrain(angulo, servoMin[servo], servoMax[servo]);
  servoPos[servo] = angulo; // Actualizar la posición del servo
  pwm.setPWM(servo, 0, angulo); // Enviar señal PWM al servo
}

// Función para ejecutar la secuencia de movimientos del brazo
void ejecutarSecuenciaBrazo() {
  if (millis() - tiempoMovimientoBrazo >= tiempoEntreMovimientos) {
    tiempoMovimientoBrazo = millis(); // Actualizar tiempo de referencia
    
    // Mover todos los servos a la posición actual
    for (byte i = 0; i < numServos; i++) {
      moverServo(i, movimientos[movimientoActual][i]);
    }
    
    // Avanzar a la siguiente posición de la secuencia
    movimientoActual++;
    if (movimientoActual >= sizeof(movimientos)/sizeof(movimientos[0])) {
      movimientoActual = 0; // Reiniciar la secuencia
      brazoActivo = false; // Secuencia completada
    }
  }
}

// Función para activar el brazo robótico
void activarBrazo() {
  if (!brazoActivo) {
    brazoActivo = true; // Activar el brazo
    movimientoActual = 0; // Reiniciar la secuencia
    tiempoMovimientoBrazo = millis(); // Actualizar tiempo de referencia
    lcd2.setCursor(0, 1);
    lcd2.print("Brazo Activo   ");
    Serial.println("DEBUG: Brazo robótico activado."); // Mensaje de depuración
  }
}
// ************ Fin de funciones del brazo robótico ************

// Función de Anti-debounce para evitar rebotes en botones
void anti_debounce(byte boton) {
  delay(100); // Esperar 100 ms
  while (digitalRead(boton)); // Esperar a que el botón se suelte
  delay(100); // Esperar otros 100 ms
}

// Función de calibración y ajuste de la balanza
void calibration() {
  int i = 0, cal = 1;
  long adc_lecture;

  lcd.setCursor(2, 0);
  lcd.print("Calibracion de");
  lcd.setCursor(4, 1);
  lcd.print("Balanza");
  delay(1500);
  
  balanza.read();
  balanza.set_scale();
  balanza.tare(20);
  
  lcd.clear();

  while (cal == 1) {
    lcd.setCursor(1, 0);
    lcd.print("Peso Conocido:");
    lcd.setCursor(1, 1);
    lcd.print(peso_conocido[i]);
    lcd.print(" g        ");

    if (digitalRead(tara)) {
      anti_debounce(tara);
      i = (i > 2) ? 0 : i + 1;
    }

    if (digitalRead(modo)) {
      lcd.clear();
      lcd.setCursor(1, 0);
      lcd.print("Ponga el Peso");
      lcd.setCursor(1, 1);
      lcd.print("y espere ...");
      delay(2000);

      adc_lecture = balanza.get_value(100);
      escala = adc_lecture / peso_conocido[i];
      EEPROM.put(0, escala);
      delay(100);
      cal = 0;
      lcd.clear();
    }
  }
  Serial.println("DEBUG: Calibración completada.");
}

// Función para actualizar la información en la pantalla LCD secundaria
void actualizarLCD() {
  lcd2.clear();
  lcd2.setCursor(0, 0);
  lcd2.print("Frascos: ");
  lcd2.print(frascos);
  lcd2.setCursor(0, 1);
  lcd2.print("Cajas: ");
  lcd2.print(cajas);
  Serial.print("DEBUG: Frascos: ");
  Serial.print(frascos);
  Serial.print(", Cajas: ");
  Serial.println(cajas);
}

// Función para controlar la banda transportadora
void controlBanda(bool activar) {
  pcf8574.write(0, activar ? LOW : HIGH); // LOW activa la banda
  Serial.print("DEBUG: Banda transportadora ");
  Serial.println(activar ? "activada" : "detenida");
}

// Función para verificar condiciones de seguridad
bool condicionesSeguridad() {
  // Verificar si hay un frasco en la zona de sellado mientras se está llenando otro
  if ((estadoActual == LLENANDO_FRASCO || estadoActual == EXPULSANDO_FRASCO) && 
      digitalRead(sensor3) == HIGH) {
    lcd.setCursor(0, 1);
    lcd.print("ALERTA: Bloqueo ");
    return false;
  }
  
  // Verificar si el sellador se activó incorrectamente
  if (digitalRead(electro3) == HIGH && estadoActual != SELLANDO_FRASCO) {
    lcd.setCursor(0, 1);
    lcd.print("ALERTA: Sellador");
    digitalWrite(electro3, LOW);
    return false;
  }
  
  return true;
}

void setup() {
  // Inicialización de la comunicación serial para depuración
  Serial.begin(9600);
  
  // Configuración de la balanza
  balanza.begin(DT, CLK);
  pcf8574.begin();
  
  // ************ Inicialización del brazo robótico ************
  pwm.begin();
  pwm.setPWMFreq(60);  // Frecuencia PWM para servos (60Hz)
  
  // Posicionar todos los servos en posición inicial
  for (byte i = 0; i < numServos; i++) {
    moverServo(i, servoPos[i]);
  }
  // ************ Fin de inicialización del brazo robótico ************
  
  // Configuración de pines
  pinMode(electro1, OUTPUT);
  pinMode(electro2, OUTPUT);
  pinMode(electro3, OUTPUT);
  pinMode(sensor1, INPUT);
  pinMode(led, OUTPUT);
  pinMode(modo, INPUT);
  pinMode(tara, INPUT);
  pinMode(sensor2, INPUT);
  pinMode(led2, OUTPUT);
  pinMode(sensor3, INPUT);

  // Configurar PCF8574
  pcf8574.setButtonMask(0xF0); // Pines 4-7 como entradas
  
  // Inicializar actuadores en estado seguro
  digitalWrite(electro1, HIGH); // Tolva cerrada
  digitalWrite(electro2, LOW);  // Pistón retraído
  digitalWrite(electro3, LOW);  // Sellador desactivado
  controlBanda(false);          // Banda detenida
  digitalWrite(led, HIGH);      // LED indicador encendido
  
  // Inicialización de LCDs
  lcd.init();
  lcd.backlight();
  lcd2.init();
  lcd2.backlight();
  
  // Cargar datos de EEPROM
  EEPROM.get(0, escala);
  EEPROM.get(2, cajas);
  actualizarLCD();
  
  // Calibración si se presionan ambos botones
  if (digitalRead(modo) && digitalRead(tara)) {
    calibration();
  }
  
  // Mensaje inicial
  lcd.setCursor(1, 0);
  lcd.print("Retire el Peso");
  lcd.setCursor(1, 1);
  lcd.print("y Espere");
  delay(2000);
  
  balanza.set_scale(escala);
  balanza.tare(20);
  
  lcd.clear();
  lcd.setCursor(1, 0);
  lcd.print("Sistema Listo");
  delay(1000);
  lcd.clear();
  Serial.println("DEBUG: Sistema inicializado.");
}

void loop() {
  float peso = balanza.get_units(10);
  
  // Mostrar peso actual en LCD principal
  lcd.setCursor(1, 0);
  lcd.print("Peso: ");
  lcd.print(peso, 0);
  lcd.print(" g       ");
  
  // Verificar condiciones de seguridad
  if (!condicionesSeguridad()) {
    // En caso de condición insegura, detener todo
    digitalWrite(electro1, HIGH);
    digitalWrite(electro2, LOW);
    digitalWrite(electro3, LOW);
    controlBanda(false);
    return;
  }
  
  // ************ Control del brazo robótico ************
  // Detección de frasco en sensor2
  if (digitalRead(sensor2) && !estadoAnteriorSensor2) {
    frascos++;
    if (frascos >= 5) {
      frascos = 0;
      cajas++;
      EEPROM.put(2, cajas);
    }
    actualizarLCD();
    
    // Activar secuencia del brazo robótico
    activarBrazo();
    
    digitalWrite(led2, HIGH);
    delay(50);
    digitalWrite(led2, LOW);
  }
  estadoAnteriorSensor2 = digitalRead(sensor2);
  
  // Ejecutar secuencia del brazo si está activo
  if (brazoActivo) {
    ejecutarSecuenciaBrazo();
  }
  // ************ Fin del control del brazo robótico ************
  
  // Máquina de estados principal
  switch (estadoActual) {
    case ESPERANDO_FRASCO:
      if (digitalRead(sensor1)) {
        digitalWrite(electro1, LOW);
        estadoActual = LLENANDO_FRASCO;
        lcd.setCursor(1, 1);
        lcd.print("Llenando...    ");
      }
      break;
      
    case LLENANDO_FRASCO:
      if (peso >= limite_peso) {
        digitalWrite(electro1, HIGH);
        estadoActual = EXPULSANDO_FRASCO;
        tiempoPiston = millis();
        digitalWrite(electro2, HIGH);
        lcd.setCursor(1, 1);
        lcd.print("Expulsando...  ");
      }
      break;
      
    case EXPULSANDO_FRASCO:
      if (millis() - tiempoPiston >= tiempoRetraccionPiston) {
        digitalWrite(electro2, LOW);
        controlBanda(true);
        estadoActual = FRASCO_EN_BANDA;
        lcd.setCursor(1, 1);
        lcd.print("Transportando..");
      }
      break;
      
    case FRASCO_EN_BANDA:
      if (digitalRead(sensor3)) {
        controlBanda(false);
        tiempoSellador = millis();
        estadoActual = ESPERANDO_SELLADO;
        lcd.setCursor(1, 1);
        lcd.print("Preparando sellado");
      }
      
      if (!digitalRead(sensor1)) {
        estadoActual = ESPERANDO_FRASCO;
        lcd.setCursor(1, 1);
        lcd.print("Esperando frasco");
      }
      break;
      
    case ESPERANDO_SELLADO:
      if (millis() - tiempoSellador >= tiempoEsperaSellado) {
        digitalWrite(electro3, HIGH);
        tiempoSellador = millis();
        estadoActual = SELLANDO_FRASCO;
        lcd.setCursor(1, 1);
        lcd.print("Sellando...    ");
      }
      break;
      
    case SELLANDO_FRASCO:
      if (millis() - tiempoSellador >= tiempoDuracionSellado) {
        digitalWrite(electro3, LOW);
        
        if (!digitalRead(sensor3)) {
          controlBanda(true);
          estadoActual = FRASCO_EN_BANDA;
          lcd.setCursor(1, 1);
          lcd.print("Transportando..");
        } else {
          lcd.setCursor(1, 1);
          lcd.print("Esperando salida");
        }
      }
      break;
  }
  
  // Botón de Tara
  if (digitalRead(tara)) {  
    anti_debounce(tara);
    balanza.tare(10);
  }
  
  // Pequeña pausa para evitar sobrecarga
  delay(10);
  Serial.println("DEBUG: Estado actual del sistema: " + String(estadoActual));
}

// ************ Explicación del brazo robótico ************
// El brazo robótico utiliza un controlador PCA9685 para manejar hasta 6 servomotores. 
// Cada servo tiene un rango de movimiento definido por los valores `servoMin` y `servoMax`.
// Las posiciones de los servos se configuran en la matriz `movimientos`, que define una secuencia de pasos.
// La función `activarBrazo` inicia la secuencia, y `ejecutarSecuenciaBrazo` mueve los servos a las posiciones definidas.
// El tiempo entre movimientos está controlado por `tiempoEntreMovimientos`.
// Este diseño permite programar movimientos complejos simplemente ajustando la matriz `movimientos`.