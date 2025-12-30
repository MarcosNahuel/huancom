# Huangcom Dashboard - Caso de Éxito TRAID Agency

Dashboard interactivo que muestra las métricas de MercadoLibre de Huangcom Group.

## Estructura del Proyecto

```
Dashboard/
├── index.html       # Dashboard principal
├── styles.css       # Estilos CSS
├── app.js           # JavaScript (versión estática)
├── app-live.js      # JavaScript (versión con API)
├── server.js        # Backend Node.js
├── package.json     # Dependencias
└── token.json       # Token de MercadoLibre (auto-generado)
```

## Instalación

```bash
cd Dashboard
npm install
```

## Uso

### Versión Estática (solo frontend)
Abrir `index.html` directamente en el navegador.

### Versión con Backend (datos en tiempo real)

```bash
npm start
```

Abrir http://localhost:3000

## API Endpoints

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/meli/user` | Perfil del usuario |
| `GET /api/meli/reputation` | Reputación del vendedor |
| `GET /api/meli/items` | Productos publicados |
| `GET /api/meli/orders` | Órdenes de venta |
| `GET /api/meli/metrics` | Métricas combinadas |
| `GET /api/health` | Estado del servidor |

## Credenciales MercadoLibre

- **Client ID:** 1479055899419707
- **User ID:** 331914355
- **Tienda:** [HUANGCOM](http://perfil.mercadolibre.com.ar/HUANGCOM)

## Métricas Destacadas

- **1,021** ventas completadas
- **97%** opiniones positivas
- **357** productos activos
- **MercadoLíder Silver**

---

Desarrollado por [TRAID Agency](https://traidagency.com)
