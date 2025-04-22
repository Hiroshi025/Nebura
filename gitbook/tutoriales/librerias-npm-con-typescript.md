# Librerias NPM con  Typescript

## Introducción

Muchas librerías populares en npm están escritas en JavaScript y no incluyen tipos TypeScript nativos. Este tutorial te mostrará cómo integrar y usar estas librerías en tu proyecto TypeScript de manera efectiva.

## Prerrequisitos

* Node.js y npm instalados
* Proyecto TypeScript configurado
* Conocimiento básico de TypeScript

### Paso 1: Instalar la librería JavaScript

Primero, instala la librería como lo harías normalmente con npm:

```bash
npm install nombre-de-la-libreria
```

### Paso 2: Buscar tipos TypeScript (DefinitelyTyped)

Muchas librerías populares tienen tipos TypeScript disponibles en DefinitelyTyped. Puedes buscarlos con:

```bash
npm install --save-dev @types/nombre-de-la-libreria
```

Si existe un paquete `@types`, esto proporcionará autocompletado y verificación de tipos.

### Paso 3: Usar la librería cuando no hay tipos disponibles

Si no hay tipos disponibles, tienes varias opciones:

#### Opción 1: Declaración de tipo implícito (más simple)

```typescript
// @ts-ignore
import libreria from 'nombre-de-la-libreria';
```

O mejor:

```typescript
const libreria = require('nombre-de-la-libreria') as any;
```

#### Opción 2: Crear una declaración de tipo básica

1. Crea un archivo `types.d.ts` en tu proyecto
2. Agrega:

```typescript
declare module 'nombre-de-la-libreria' {
  const content: any;
  export default content;
}
```

#### Opción 3: Crear una declaración de tipo más detallada

Para una mejor experiencia de desarrollo, puedes definir tipos manualmente:

```typescript
declare module 'nombre-de-la-libreria' {
  export function funcionEjemplo(param: string): number;
  export interface EjemploInterface {
    prop1: string;
    prop2: boolean;
  }
}
```

### Paso 4: Configurar tsconfig.json

Asegúrate de que tu `tsconfig.json` tenga:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "esModuleInterop": true,
    "allowJs": true,
    "skipLibCheck": true
  }
}
```

* `esModuleInterop`: permite importar módulos CommonJS más fácilmente
* `allowJs`: permite incluir archivos JavaScript
* `skipLibCheck`: omite la verificación de tipos en archivos de declaración

### Paso 5: Usar la librería en tu código

Ahora puedes usar la librería con seguridad de tipos:

```typescript
import * as lib from 'nombre-de-la-libreria';

// O si es un módulo CommonJS
const lib = require('nombre-de-la-libreria');

// Usar la librería con aserción de tipo si es necesario
(lib as any).metodoJavaScript();
```

### Paso 6: Contribuir a DefinitelyTyped (opcional)

Si creas buenas definiciones de tipo para una librería popular, considera contribuirlas a DefinitelyTyped:

1. Clona el repositorio DefinitelyTyped
2. Crea una nueva carpeta para tus tipos
3. Sigue las guías de contribución
4. Envía un pull request

## Consejos avanzados

#### Extender tipos existentes

Si una librería tiene tipos pero faltan algunas definiciones:

```typescript
import 'nombre-de-la-libreria';

declare module 'nombre-de-la-libreria' {
  interface TipoExistente {
    nuevaPropiedad: string;
  }
}
```

#### Usar tipos genéricos para APIs dinámicas

Para APIs muy dinámicas, puedes usar tipos genéricos:

```typescript
function usarLibreria<T>(config: T): T & { resultado: string } {
  const lib = require('nombre-de-la-libreria') as any;
  return lib(config);
}
```

## Conclusión

Integrar librerías JavaScript en TypeScript es totalmente posible, incluso cuando no tienen soporte nativo para tipos. Con estas técnicas podrás aprovechar el ecosistema npm completo mientras mantienes los beneficios de TypeScript.

## Recursos adicionales

* [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped)
* [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
* [TypeScript Handbook: Working with JavaScript](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)
