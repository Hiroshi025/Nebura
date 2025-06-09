# Licencias

Recopilando información del área de trabajoFiltrando a la información más relevanteClaro, te explico el flujo y la lógica de los endpoints relacionados con licencias, cómo un usuario puede usarlas y posibles errores de lógica.

***

### Funcionamiento de los Endpoints

Los endpoints principales para licencias están definidos en licences.routes.ts y gestionados por el controlador `LicenseController`:

#### 1. **Creación de licencia**

* **POST `/api/v1/license/`**
* Solo admins autenticados pueden crear licencias.
* El controlador espera un body con los datos de la licencia (`CreateLicenseDto`).
* Se almacena en la base de datos y se devuelve la licencia creada.

#### 2. **Consulta de licencias**

* **GET `/api/v1/license/`**\
  Devuelve todas las licencias (solo admins).
* **GET `/api/v1/license/:id`**\
  Devuelve una licencia por su ID (requiere autenticación).
* **GET `/api/v1/license/user/:userId`**\
  Devuelve todas las licencias de un usuario (requiere autenticación).

#### 3. **Actualización y eliminación**

* **PUT `/api/v1/license/:id`**\
  Actualiza una licencia por ID (solo admins).
* **DELETE `/api/v1/license/:id`**\
  Elimina una licencia por ID (solo admins).

#### 4. **Validación de licencia**

* **POST `/api/v1/license/validate/:key`**\
  Público. Recibe el HWID en el body y la clave de licencia en la URL.\
  Llama a `LicenseService.validateLicense`.

#### 5. **Información extendida**

* **GET `/api/v1/license/info/:licenseKey`**\
  Devuelve información extendida de la licencia (requiere autenticación).

***

### ¿Cómo puede un usuario usar su licencia?

1. **El admin crea la licencia** y se la entrega al usuario (clave y HWID).
2. **El usuario realiza una petición** al endpoint de validación:
   * **POST `/api/v1/license/validate/:key`**
   * En el body debe enviar su HWID.
   * Si la licencia es válida, activa y el HWID coincide, la respuesta será `{ valid: true }`.
   * Si no, recibirá un error o `{ valid: false }`.

***

### Lógica de validación

En `LicenseService.validateLicense`:

1. Busca la licencia por clave.
2. Verifica:
   * Que exista.
   * Que no esté expirada (`validUntil < new Date()`).
   * Que el HWID esté en la lista de la licencia.
3. Si falla alguna, retorna `false`.
4. Si pasa, incrementa el contador de peticiones (`requestCount`).
5. Retorna `true` solo si el contador de peticiones es menor al límite (`requestLimit`).
