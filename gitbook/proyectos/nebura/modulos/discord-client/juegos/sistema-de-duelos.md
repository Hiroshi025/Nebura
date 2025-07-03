# Sistema de Duelos

Este sistema de duelos está diseñado para un bot de Discord, permitiendo a los usuarios enfrentarse en combates interactivos con mecánicas estratégicas.&#x20;

***

### **¿Cómo jugar?**

1. **Iniciar un duelo**:
   * Un usuario desafía a otro utilizando el comando `/duelo`.
   * Se debe especificar al oponente y una apuesta mínima de $500.
2. **Selección de terreno**:
   * El retador elige el terreno donde se llevará a cabo el duelo. Cada terreno tiene efectos únicos que pueden influir en el combate.
3. **Selección de clase**:
   * Ambos jugadores seleccionan una clase de personaje. Cada clase tiene habilidades pasivas y especiales que afectan la estrategia del duelo.
4. **Inicio del duelo**:
   * Los jugadores toman turnos para realizar acciones como atacar, defenderse, usar habilidades especiales o realizar rituales de sacrificio.
5. **Finalización del duelo**:
   * El duelo termina cuando uno de los jugadores pierde toda su vida o si ambos quedan inactivos. El ganador recibe la apuesta acumulada.

***

### **Mecánicas del juego**

#### **1. Terrenos**

Los terrenos afectan el combate con modificadores únicos. Los disponibles son:

* **Bosque encantado** (`forest`):
  * **Efectos**: +15% evasión, +5% probabilidad de fallar ataques.
  * **Evento especial**: "Una ráfaga de viento desvía algunos ataques".
* **Montañas escarpadas** (`mountain`):
  * **Efectos**: +20% defensa, -5% evasión.
  * **Evento especial**: "¡Caen rocas que afectan a ambos combatientes!".
* **Volcán en erupción** (`volcano`):
  * **Efectos**: +30% daño de fuego, -10% defensa.
  * **Evento especial**: "¡Explosiones de lava causan daño aleatorio!".
* **Llanuras abiertas** (`plains`):
  * **Efectos**: Terreno neutral sin modificadores.
* **Desierto ardiente** (`desert`):
  * **Efectos**: +10% probabilidad de fallar ataques, +15% daño de fuego.
  * **Evento especial**: "¡Tormentas de arena reducen la visibilidad!".
* **Cementerio maldito** (`graveyard`):
  * **Efectos**: +5% probabilidad de crítico, bonificaciones para habilidades de no-muertos.
  * **Evento especial**: "¡Los espíritus interfieren con los ataques!".

***

#### **2. Clases de personajes**

Cada jugador elige una clase con habilidades únicas:

* **Guerrero** (`warrior`):
  * **Pasiva**: 10% de reducción de daño.
  * **Habilidad especial**: "Golpe crítico" (30% de probabilidad de infligir daño doble).
* **Mago** (`mage`):
  * **Pasiva**: Los hechizos se cargan un 20% más rápido.
  * **Habilidad especial**: "Escudo mágico" (absorbe el 50% del daño recibido durante 2 turnos).
* **Asesino** (`assassin`):
  * **Pasiva**: 10% de probabilidad de evadir ataques.
  * **Habilidad especial**: "Ataque sorpresa" (ignora la defensa del oponente y tiene 25% de probabilidad de crítico).
* **Arquero** (`archer`):
  * **Pasiva**: +5% de probabilidad de crítico.
  * **Habilidad especial**: "Lluvia de flechas" (ataques múltiples que ignoran parcialmente la defensa).
* **Clérigo** (`cleric`):
  * **Pasiva**: Regenera 2% de HP cada turno.
  * **Habilidad especial**: "Sanación divina" (restaura el 30% del HP máximo y elimina efectos negativos).

***

#### **3. Acciones disponibles**

Durante su turno, los jugadores pueden realizar las siguientes acciones:

* **Ataque básico**:
  * Realiza un ataque estándar con daño moderado.
  * Puede fallar o ser crítico dependiendo de las probabilidades.
* **Ataque fuerte**:
  * Realiza un ataque más poderoso a cambio de $200.
  * Mayor probabilidad de crítico, pero también puede fallar.
* **Defenderse**:
  * Incrementa la defensa del jugador durante el turno.
  * Los guerreros reciben un bono adicional al defenderse.
* **Habilidad especial**:
  * Activa la habilidad única de la clase del jugador.
  * Tiene un tiempo de enfriamiento antes de poder usarse nuevamente.
* **Ritual de sacrificio**:
  * Permite al jugador sacrificar a otro usuario del servidor por $1000.
  * Si el sacrificio tiene éxito, el jugador obtiene poderes divinos durante 2 turnos.
* **Golpe meteórico**:
  * Invoca un meteorito que inflige daño tanto al jugador como a su oponente.

***

#### **4. Estadísticas y modificadores**

Cada jugador tiene estadísticas que afectan el combate:

* **HP (Puntos de vida)**:
  * Ambos jugadores comienzan con 2500 HP.
  * Se reduce al recibir daño y puede regenerarse con habilidades.
* **Defensa**:
  * Reduce el daño recibido. Puede incrementarse al defenderse.
* **Ataque**:
  * Modificador que aumenta el daño infligido.
* **Evasión**:
  * Probabilidad de evitar un ataque.
* **Crítico**:
  * Probabilidad de infligir daño doble.
* **Regeneración**:
  * Porcentaje de HP que se recupera al inicio del turno.

***

#### **5. Historia del duelo**

El sistema registra los eventos importantes del combate en un registro visible para los jugadores. Ejemplo:

```
🏰 **¡Comienza el duelo épico!** Usuario1 (Guerrero) desafía a Usuario2 (Mago) por $500.
🌍 **Terreno:** Bosque encantado.
🌳 Los árboles susurran secretos antiguos...
⚔️ Los combatientes se preparan para la batalla...
```

***

#### **6. Condiciones de victoria**

El duelo termina cuando:

* Uno de los jugadores pierde toda su vida.
* Ambos jugadores quedan inactivos durante 2 minutos.

El ganador recibe la apuesta acumulada, mientras que el perdedor registra una derrota en su historial.

***

#### **7. Ejemplo de flujo de juego**

1. Usuario1 desafía a Usuario2 con una apuesta de $1000.
2. Usuario1 selecciona el terreno "Volcán en erupción".
3. Usuario1 elige la clase "Guerrero" y Usuario2 elige "Mago".
4. El duelo comienza:
   * Usuario1 realiza un ataque básico, infligiendo 150 de daño.
   * Usuario2 usa "Escudo mágico", reduciendo el daño recibido.
   * Usuario1 intenta un ataque fuerte, pero falla.
   * Usuario2 lanza un "Golpe meteórico", dañando a ambos jugadores.
5. Usuario1 gana el duelo al reducir el HP de Usuario2 a 0.

***

#### **Resumen**

Este sistema de duelos combina estrategia, azar y mecánicas interactivas para ofrecer una experiencia única en Discord. Los jugadores deben elegir cuidadosamente su clase, terreno y acciones para maximizar sus posibilidades de victoria. ¡Prepárate para la batalla! ⚔️
