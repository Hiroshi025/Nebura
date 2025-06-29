# Sistema de Inventario y Tienda

El sistema de tienda e inventario permite a los usuarios de un servidor de Discord comprar, gestionar y utilizar objetos virtuales. Este sistema está dividido en dos módulos principales: **Shop** (tienda) e **Inventory** (inventario).

***

### **1. Tienda (Shop)**

El módulo de la tienda permite a los administradores gestionar los objetos disponibles para la compra y a los usuarios adquirirlos. Los objetos pueden otorgar roles, dinero virtual o simplemente ser coleccionables.

#### **Comandos principales**

**1.1. `/shop add`**

* **Descripción**: Permite a los administradores agregar un nuevo objeto a la tienda.
* **Parámetros**:
  * `name`: Nombre del objeto.
  * `description`: Descripción del objeto.
  * `price`: Precio del objeto en la moneda virtual.
  * `identifier`: Identificador único del objeto (opcional, se genera automáticamente si no se proporciona).
  * `role`: Rol que se otorga al comprar el objeto (opcional).
  * `money`: Cantidad de dinero que se otorga al comprar el objeto (opcional).
* **Requisitos**:
  * El usuario debe tener permisos de **Administrar Servidor**.
*   **Ejemplo de uso**:

    ```
    /shop add --name "VIP Role" --description "Grants access to VIP channels" --price 1000 --role @VIP
    ```

**1.2. `/shop view`**

* **Descripción**: Muestra los objetos disponibles en la tienda.
* **Parámetros**:
  * `page`: Número de página para paginar los resultados (opcional).
* **Funcionamiento**:
  * Los objetos se muestran en bloques de 5 por página.
  * Cada objeto incluye su nombre, descripción, precio, identificador y beneficios (rol o dinero).
*   **Ejemplo de uso**:

    ```
    /shop view --page 1
    ```

**1.3. `/shop buy`**

* **Descripción**: Permite a los usuarios comprar un objeto de la tienda.
* **Parámetros**:
  * `identifier`: Identificador único del objeto que se desea comprar.
* **Funcionamiento**:
  * Verifica que el usuario tenga suficiente dinero para realizar la compra.
  * Si el objeto otorga un rol, este se asigna al usuario.
  * Si el objeto otorga dinero, este se añade al balance del usuario.
  * El objeto comprado se añade al inventario del usuario.
*   **Ejemplo de uso**:

    ```
    /shop buy --identifier "vip_role"
    ```

**1.4. `/shop remove`**

* **Descripción**: Permite a los administradores eliminar un objeto de la tienda.
* **Parámetros**:
  * `identifier`: Identificador único del objeto que se desea eliminar.
* **Requisitos**:
  * El usuario debe tener permisos de **Administrar Servidor**.
*   **Ejemplo de uso**:

    ```
    /shop remove --identifier "vip_role"
    ```

***

### **2. Inventario (Inventory)**

El módulo de inventario permite a los usuarios gestionar los objetos que han comprado en la tienda. Los objetos pueden ser utilizados para obtener sus beneficios (roles o dinero).

#### **Comandos principales**

**2.1. `/inventory view`**

* **Descripción**: Muestra los objetos que el usuario tiene en su inventario.
* **Parámetros**:
  * `page`: Número de página para paginar los resultados (opcional).
* **Funcionamiento**:
  * Los objetos se muestran en bloques de 5 por página.
  * Cada objeto incluye su nombre, descripción, identificador y beneficios (rol o dinero).
*   **Ejemplo de uso**:

    ```
    /inventory view --page 1
    ```

**2.2. `/inventory use_item`**

* **Descripción**: Permite a los usuarios utilizar un objeto de su inventario.
* **Parámetros**:
  * `identifier`: Identificador único del objeto que se desea usar.
* **Funcionamiento**:
  * Si el objeto otorga un rol, este se asigna al usuario y el objeto se elimina del inventario.
  * Si el objeto otorga dinero, este se añade al balance del usuario y el objeto se elimina del inventario.
  * Si el objeto no tiene un uso definido, se notifica al usuario.
*   **Ejemplo de uso**:

    ```
    /inventory use_item --identifier "vip_role"
    ```

***

### **3. Flujo de compra y uso de objetos**

1. **Agregar un objeto a la tienda**:
   * Un administrador utiliza el comando `/shop add` para agregar un nuevo objeto.
   * El objeto queda disponible para que los usuarios lo compren.
2. **Ver la tienda**:
   * Los usuarios utilizan el comando `/shop view` para explorar los objetos disponibles.
3. **Comprar un objeto**:
   * Un usuario utiliza el comando `/shop buy` con el identificador del objeto deseado.
   * El sistema verifica que el usuario tenga suficiente dinero y que el objeto exista.
   * El objeto se añade al inventario del usuario.
4. **Ver el inventario**:
   * El usuario utiliza el comando `/inventory view` para ver los objetos que posee.
5. **Usar un objeto**:
   * El usuario utiliza el comando `/inventory use_item` con el identificador del objeto.
   * Si el objeto otorga un rol, este se asigna al usuario.
   * Si el objeto otorga dinero, este se añade al balance del usuario.
   * El objeto se elimina del inventario tras su uso.

***

### **4. Validaciones y restricciones**

* **Permisos**:
  * Solo los administradores pueden agregar o eliminar objetos de la tienda.
  * Los usuarios solo pueden comprar y usar objetos.
* **Balance del usuario**:
  * Antes de comprar un objeto, se verifica que el usuario tenga suficiente dinero.
* **Inventario**:
  * Un usuario no puede comprar un objeto que ya posee.
  * Los objetos sin beneficios definidos no pueden ser utilizados.
* **Paginación**:
  * Tanto en la tienda como en el inventario, los resultados se dividen en páginas para facilitar la navegación.

***

### **5. Ejemplo práctico**

#### **Escenario**: Un servidor quiere vender un rol VIP.

1.  **Agregar el rol a la tienda**:

    ```
    /shop add --name "VIP Role" --description "Grants access to VIP channels" --price 1000 --role @VIP
    ```
2.  **Un usuario revisa la tienda**:

    ```
    /shop view --page 1
    ```
3.  **El usuario compra el rol**:

    ```
    /shop buy --identifier "vip_role"
    ```
4.  **El usuario revisa su inventario**:

    ```
    /inventory view --page 1
    ```
5.  **El usuario utiliza el objeto**:

    ```
    /inventory use_item --identifier "vip_role"
    ```
6. **Resultado**:
   * El usuario recibe el rol VIP.
   * El objeto se elimina de su inventario.

***

### **6. Resumen**

El sistema de tienda e inventario es una herramienta poderosa para gamificar la experiencia de los usuarios en un servidor de Discord. Permite a los administradores ofrecer recompensas personalizadas y a los usuarios participar en una economía virtual. ¡Explora las posibilidades y personaliza tu servidor! 🎉
