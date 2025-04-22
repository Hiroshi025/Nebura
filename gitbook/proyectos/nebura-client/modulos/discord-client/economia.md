# Economia

{% hint style="warning" %}
Ultima Actualizacion `22/04/2025`
{% endhint %}

El sistema de economía de **Nebura Client** es una funcionalidad avanzada que permite a los usuarios interactuar con un sistema económico virtual dentro de un servidor de Discord. Este sistema incluye comandos para gestionar balances, inventarios, tiendas, y una variedad de juegos y mecánicas para ganar o perder dinero virtual.

***

### Funcionalidades Principales

#### Gestión de Economía

* **Balance**: Consulta el saldo de un usuario.
* **Pagar**: Transfiere dinero a otro usuario.
* **Estado Económico**: Consulta el estado económico de un usuario, incluyendo su posición en el ranking del servidor.

#### Inventario

* **Ver Inventario**: Consulta los objetos que un usuario ha comprado en la tienda.
* **Usar Objeto**: Utiliza un objeto del inventario, lo que puede otorgar roles o dinero.

#### Tienda

* **Añadir Artículo**: Agrega un nuevo artículo a la tienda del servidor.
* **Ver Tienda**: Consulta los artículos disponibles en la tienda.
* **Comprar Artículo**: Compra un artículo de la tienda.
* **Eliminar Artículo**: Elimina un artículo de la tienda.

***

### Juegos de Economía

#### 1. **Ruleta** (`/roulette`)

* Apuesta en un número (0-36) o un color (rojo, negro o verde).
* Gana dinero si el resultado coincide con tu apuesta.
* Incluye opciones como "Doble o Nada" para aumentar el riesgo y las recompensas.

#### 2. **Cara o Cruz** (`/coinflip`)

* Lanza una moneda y apuesta por el resultado (cara o cruz).
* Gana o pierde dinero dependiendo del resultado.

#### 3. **Tragaperras** (`/slots`)

* Juega en una máquina tragaperras.
* Gira los carretes y gana dinero si obtienes combinaciones ganadoras.

#### 4. **Duelo** (`/duel`)

* Reta a otro usuario a un duelo.
* Ambos jugadores apuestan una cantidad de dinero, y el ganador se lleva todo.

#### 5. **Piedra, Papel o Tijera** (`/rps`)

* Juega un clásico juego de Piedra, Papel o Tijera contra otro usuario.
* Apuesta dinero y gana si derrotas a tu oponente.

#### 6. **Recompensa Diaria** (`/daily`)

* Obtén una recompensa diaria eligiendo una carta entre `1`, `2`, `3` o `4`.
* Puedes duplicar tus ganancias con la opción "Apuesta x10".

#### 7. **Robar** (`economy rob <user>`)

* Intenta robar dinero de otro usuario.
* El éxito depende de un porcentaje de probabilidad, y puedes perder dinero si fallas.

***

### Mecánicas Adicionales

* **Roles y Dinero en la Tienda**: Los artículos de la tienda pueden otorgar roles o dinero al ser utilizados.
* **Ranking Económico**: Los usuarios pueden competir por el primer lugar en el ranking económico del servidor.
* **Multiplicadores de Riesgo**: Algunos juegos, como la ruleta, incluyen multiplicadores de riesgo que aumentan las recompensas por rachas ganadoras.

***

### Comandos Disponibles

#### Slash Commands

* `/economy balance [user]`: Consulta el saldo de un usuario.
* `/economy pay <user> <amount>`: Paga una cantidad de dinero a otro usuario.
* `/economy inventory view [page]`: Consulta tu inventario.
* `/economy inventory use_item <identifier>`: Usa un objeto de tu inventario.
* `/economy shop add`: Añade un artículo a la tienda.
* `/economy shop view [page]`: Consulta los artículos de la tienda.
* `/economy shop buy <identifier>`: Compra un artículo de la tienda.
* `/economy shop remove <identifier>`: Elimina un artículo de la tienda.
* `/economy daily [card]`: Obtén tu recompensa diaria.
* `/economy roulette <bet> <number> <color>`: Juega a la ruleta.
* `/economy coinflip <bet>`: Juega a cara o cruz.
* `/economy slots <bet>`: Juega a la máquina tragaperras.
* `/economy duel <user> <bet>`: Reta a otro usuario a un duelo.
* `/economy rps <user> <bet>`: Juega Piedra, Papel o Tijera.
* `/economy state [user]`: Consulta el estado económico de un usuario.

#### Comandos de Mensaje

* `economy balance <user>`: Consulta el saldo de un usuario.
* `economy inventory view <page>`: Consulta el inventario de un usuario.
* `economy inventory use_item <identifier>`: Usa un objeto del inventario.
* `economy rob <user>`: Intenta robar dinero de otro usuario.
* `economy daily`: Obtén tu recompensa diaria.

***

### Ejemplo de Uso

1.  **Comprar un artículo en la tienda**:

    `/economy shop buy --identifier "item123"`
2.  **Jugar a la ruleta**:

    `/economy roulette --bet 100 --number 7 --color red`
3.  **Reta a un duelo**:

    `/economy duel --user @usuario --bet 500`

***

¡Explora todas las funcionalidades del sistema de economía y compite con otros usuarios para convertirte en el más rico del servidor!&#x20;

