# DOCUMENTACION INTEGRAL - SISTEMA DE AUTOMATIZACION HUANGCOM

## Resumen Ejecutivo del Negocio

**HUANGCOM** es una empresa argentina lider en el mercado de Energias Renovables con mas de 30 anos de experiencia. Se posicionan como fabricantes e importadores, realizando ventas mayoristas y minoristas.

### Productos Comercializados:
- Paneles Solares
- Termotanques Solares
- Climatizadores de Piscinas
- Bombas Solares
- Baterias
- Inversores
- Controladores
- Aerogeneradores

### Canales de Venta:
1. **WooCommerce** (huangcom.com) - Tienda propia
2. **MercadoLibre Argentina** - Marketplace

---

## Arquitectura General del Sistema

```
+------------------+     +-------------------+     +------------------+
|   MERCADOLIBRE   |     |      n8n          |     |   WOOCOMMERCE    |
|    (Ventas)      |<--->|  (Orquestador)    |<--->|    (Tienda)      |
+------------------+     +-------------------+     +------------------+
        |                        |                        |
        v                        v                        v
+------------------+     +-------------------+     +------------------+
|   API MELI       |     |  Google Sheets    |     |   API WOO        |
+------------------+     | (Registro PEDIDOS)|     +------------------+
        |                +-------------------+
        v                        |
+------------------+             v
| MercadoPago API  |     +-------------------+
+------------------+     |    PostgreSQL     |
                         | (Memoria Agente)  |
                         +-------------------+
```

---

# WORKFLOW 1: ACTUALIZADOR DE ESTADO
**ID:** `nwxle9rOLTNWgH9i`
**Estado:** ACTIVO
**Creado:** 2025-08-18
**Ultima actualizacion:** 2025-11-05

## Objetivo
Sincronizar el estado de los pedidos de WooCommerce con una hoja de Google Sheets (PEDIDOS), manteniendo un registro centralizado de todas las ordenes.

## Flujo de Trabajo

### Rama 1: ACTUALIZADOR DE ORDENES (Orden Actualizada)
```
WooCommerce Trigger (order.updated)
        |
        v
Get row(s) in sheet (Buscar por ID de pedido WOO)
        |
        v
    If (row_number existe?)
       /        \
     SI          NO
      |           |
      v           v
Update row    Append or update row
(Solo estado)  (Datos completos)
```

### Rama 2: CREADOR DE ORDENES (Orden Nueva)
```
WooCommerce Trigger1 (order.created)
        |
        v
    Wait (8 minutos)  <-- IMPORTANTE: Espera para evitar duplicados
        |
        v
Get row(s) in sheet1 (Verificar si ya existe)
        |
        v
    If1 (row_number existe?)
       /        \
     SI          NO
      |           |
      v           v
   (nada)    Append or update row in sheet1
```

## Datos Registrados en Google Sheets
| Campo | Fuente |
|-------|--------|
| PEDIDO DE WOOCOMERCE | order.id |
| Fecha de venta | date_created (formateado) |
| Unidades | line_items.quantity (suma) |
| Precio unitario | total / cantidad |
| Ingresos totales | total |
| SKU | line_items.sku |
| Titulo publicacion | shipping_lines meta_data |
| Datos cliente | billing.first_name + last_name |
| Direccion completa | billing.address_1, city, state, postcode |
| Estado del pedido | status |
| Forma de entrega | PAQAR (hardcoded) |
| Transportista | Correo Argentino |
| Timestamp | ANo.MES.DIA HORA:MINUTOS |

## Integraciones
- **WooCommerce API** (credencial: WooCommerce account 2)
- **Google Sheets OAuth2** (credencial: infomorgado@gmail.com)
- **Spreadsheet ID:** `1lL0qYGaM9Ao1CENKaSLHWkDT_0OlqwDR9684oShOzBs`

## Estado de Ejecuciones
**Ultimas 10 ejecuciones: TODAS EXITOSAS**
- No se detectaron errores en el periodo analizado

---

# WORKFLOW 2: REPLICADOR DE PEDIDOS MELI a WOO
**ID:** `e77BVblQZV7FBmm1`
**Estado:** ACTIVO
**Creado:** 2025-08-18
**Ultima actualizacion:** 2025-10-14

## Objetivo
Replicar automaticamente las ventas de MercadoLibre como pedidos en WooCommerce, sincronizando el inventario y manteniendo un registro unificado.

## Diagrama de Flujo Principal

```
Webhook (POST /woocommercemeli)
        |
        v
    Code (Calcula delay 0-290 seg segun segundo actual)
        |
        v
    Wait (delay variable)  <-- Anti-duplicacion
        |
        v
    If (actions vacio Y no es /collections?)
        |
        v
AUTH TOKEN (OAuth MercadoLibre - refresh_token)
        |
        v
HTTP Request (GET /orders/{id} de MELI)
        |
        v
Get row(s) in sheet (Verificar si ya existe en registro)
        |
        v
    If1 (Ya existe?)
       /        \
     SI          NO
      |           |
      v           v
   NoOp      Append row in sheet (Registro inicial)
                  |
                  v
              If3 (Es orden valida /orders/?)
                  |
                  v
        HTTP Request2 (GET /shipments/{id})
                  |
                  v  (bifurcacion por tipo de envio)
           +------+------+
           |      |      |
           v      v      v
         FULL   MELI   PAQAR
         ENVIO  ENVIO  (por tu cuenta)
```

### Sub-flujo por Tipo de Logistica

#### Fulfillment (FULL)
```
If2 (logistic_type == "fulfillment")
        |
        v
Get many products1 (Buscar en WOO por SKU)
        |
        v
Create an order1 (Orden WOO con cupon "FULL")
        |
        v
Update row in sheet1 (Actualizar registro)
```

#### MercadoEnvios Standard
```
If4 (logistic_type existe pero no es fulfillment)
        |
        v
Get many products (Buscar en WOO por SKU)
        |
        v
Create an order (Orden WOO con cupon "MERCADOENVIO")
        |
        v
Update row in sheet (Actualizar registro)
```

#### Envio por tu cuenta (PAQAR)
```
HTTP Request2 Error Output (sin shipping)
        |
        v
Get many products3 (Buscar en WOO por SKU)
        |
        v
Create an order3 (Orden WOO con cupon "PAQAR")
        |
        v
Update row in sheet3 (Actualizar registro)
```

## Mecanismo Anti-Duplicacion
El workflow implementa un sistema sofisticado para evitar duplicados:

1. **Delay Variable por Segundo**: Un nodo Code genera delays de 0-290 segundos basado en el segundo actual
2. **Verificacion en Google Sheets**: Antes de procesar, verifica si la orden ya existe
3. **Filtro de Webhook**: Ignora notificaciones sin actions o de tipo /collections

## Datos de Orden en WooCommerce
- **customerNote**: Incluye info completa de MELI (pack_id, buyer, producto, SKU, tracking)
- **paymentMethodTitle**: "Mercadolibre"
- **status**: "on-hold"
- **transactionID**: pack_id o order_id de MELI
- **Cupon aplicado**: FULL, MERCADOENVIO, o PAQAR segun tipo

## Integraciones
- **MercadoLibre API** (OAuth con refresh_token)
- **MercadoPago API** (para buscar pagos)
- **WooCommerce API** (2 credenciales: lectura y escritura)
- **Google Sheets** (registro de ordenes)

## Credenciales MercadoLibre
- **Client ID:** 7891057817005105
- **Redirect URI:** https://juan-n8n.zfis90.easypanel.host/webhook/MeliWoocommerce

## Estado de Ejecuciones
**Ultimas 10 ejecuciones: TODAS EXITOSAS**

---

# WORKFLOW 3: AGENTE MERCADOLIBRE (Clara)
**ID:** `JOCJm5xLqMjar1YP`
**Estado:** ACTIVO
**Creado:** 2025-08-04
**Ultima actualizacion:** 2025-12-01

## Objetivo
Responder automaticamente preguntas de clientes en MercadoLibre usando IA (Google Gemini), con capacidad de consultar multiples fuentes de informacion.

## Arquitectura del Agente

```
Webhook (POST /preguntas)
        |
        v
AUTH TOKEN1 (OAuth MercadoLibre)
        |
        v
HTTP Request (GET pregunta de MELI)
        |
        v
If2 (Ya esta respondida?)
        |
     NO |
        v
Insert rows PostgreSQL (Guardar en memoria)
        |
        v
Select rows (Obtener historial del usuario)
        |
        v
Aggregate (Consolidar mensajes anteriores)
        |
        v
Get description for publication (Sub-workflow)
        |
        v
+-------+-------+
|               |
v               v
isNoEncontrada  Continuar
       |
       v
   Consultar Preguntas Anteriores (API MELI)
       |
       v
   Procesar con IA (Google Gemini)
       |
       v
+------+------+------+
|      |      |      |
v      v      v      v
Base   Preguntas  Descripcion  NO ENCONTRADA
Conocim. Anteriores  WooCommerce
```

## Fuentes de Informacion (Jerarquia)

1. **Base de Conocimiento** (FAQ JSON en Notion)
2. **Preguntas Anteriores** (Historial de la misma publicacion)
3. **Descripcion de WooCommerce** (Ficha tecnica del producto)
4. **Historial del Usuario** (PostgreSQL - mensajes previos)

## Agentes de IA Utilizados

### 1. Search in History Questions (Google Gemini)
- **Proposito**: Buscar si la pregunta ya fue respondida antes
- **Output**: Respuesta encontrada o "NO ENCONTRADA"

### 2. Base de Conocimientos (Google Gemini)
- **Proposito**: Consultar FAQ estructurado
- **Incluye**: Productos recomendados con SKU y links

### 3. Description Actual ItemID (Google Gemini)
- **Proposito**: Reformular y estructurar la respuesta final
- **Limite**: 1000 caracteres (limite de MELI)

## Flujo de Respuesta No Encontrada

```
Respuesta = "NO ENCONTRADA" o contiene frase especifica
        |
        v
Append row in sheet (Registrar en Google Sheets)
        |
        v
Send a message (Email a equipo)
        |
        v
Wait (9 minutos)  <-- Ventana para intervencion manual
        |
        v
HTTP Request1 (Verificar si ya fue respondida)
        |
        v
If (status == ANSWERED?)
   /        \
 SI          NO
  |           |
  v           v
Update      SEND HTTP ANSWER2
(Manual)    (Mensaje automatico generico)
```

## Mensaje por Defecto (Si no hay respuesta)
> "Lamentablemente no puedo darte esa respuesta en este momento. De todas formas, nuestro equipo esta disponible para ayudarte cuando lo necesites. No dudes en contactarnos. Clara de HUANGCOM"

## Reglas del Agente Clara

### Estilo
- Tono argentino, tecnico, cordial
- Sin emojis, acentos innecesarios
- Maximo 1000 caracteres
- Firma: "Clara de HUANGCOM"

### Restricciones
- NO incluir contactos externos (email, telefono, redes)
- NO links externos a MercadoLibre
- NO inventar informacion
- NO modificar links que vienen de fuentes autorizadas

### Formato Tecnico
- Unidades unidas al numero: 120m, 30W
- Coma decimal, sin punto de miles
- Conversiones a unidades SI

## Integraciones
- **MercadoLibre API** (preguntas y respuestas)
- **Google Gemini API** (IA)
- **PostgreSQL** (memoria de conversaciones)
- **Google Sheets** (registro de respuestas)
- **Gmail** (notificaciones al equipo)
- **Sub-workflow**: DESCRIPCIONES WOOCOMERCE FINAL

## Credenciales MercadoLibre (Agente)
- **Client ID:** 1479055899419707
- **Redirect URI:** https://juan-n8n.zfis90.easypanel.host/webhook/meli

## Estado de Ejecuciones
**Ultimas 10 ejecuciones: TODAS EXITOSAS**

---

# ANALISIS CRITICO Y RECOMENDACIONES

## Fortalezas del Sistema

1. **Arquitectura Robusta**: Sistema bien pensado con multiples capas de verificacion
2. **Anti-duplicacion**: Mecanismos efectivos para evitar ordenes duplicadas
3. **Trazabilidad**: Registro completo en Google Sheets de todas las operaciones
4. **IA Contextual**: El agente Clara tiene acceso a multiples fuentes de informacion
5. **Failsafe**: Ventana de 9 minutos para intervencion humana en respuestas dificiles

## Problemas Identificados

### CRITICO

1. **Refresh Tokens Hardcodeados**
   - Los refresh tokens de MercadoLibre estan hardcodeados en los workflows
   - Riesgo: Cuando expiren, los workflows fallaran
   - **Recomendacion**: Implementar almacenamiento dinamico de tokens (base de datos o n8n credentials)

2. **API Key de MercadoPago Expuesta**
   - `APP_USR-7330094305698274-...` visible en el workflow
   - **Recomendacion**: Mover a credenciales seguras de n8n

### ALTO

3. **Dependencia de Google Sheets como Base de Datos**
   - Riesgo de rate limiting con alto volumen
   - No es transaccional
   - **Recomendacion**: Migrar a PostgreSQL (ya lo usan para memoria del agente)

4. **Delay Fijo de 8 Minutos (Workflow 1)**
   - Puede causar retrasos innecesarios
   - **Recomendacion**: Implementar sistema de verificacion mas inteligente

### MEDIO

5. **Nodos Duplicados**
   - Multiples nodos "Append or update row" casi identicos
   - **Recomendacion**: Consolidar logica usando sub-workflows

6. **Sticky Notes Sin Documentacion Completa**
   - Varios sticky notes vacios o con info parcial
   - **Recomendacion**: Documentar todos los flujos

7. **Email Hardcodeado**
   - `huangcomgroup@gmail.com` hardcodeado en varios lugares
   - **Recomendacion**: Usar variable de entorno

### BAJO

8. **Codigo JavaScript Extenso**
   - Los nodos Code tienen logica compleja inline
   - **Recomendacion**: Externalizar a funciones reutilizables

9. **Nodos "No Operation"**
   - Hay nodos NoOp que podrian eliminarse
   - **Recomendacion**: Limpiar flujo

## Nodos Potencialmente Innecesarios

| Workflow | Nodo | Razon |
|----------|------|-------|
| W1 | Append or update row in sheet2 | Parece no estar conectado |
| W2 | No Operation, do nothing | Solo ocupa espacio |
| W3 | Multiples Edit Fields similares | Podrian consolidarse |

## Sugerencias de Mejora

### Corto Plazo
1. Mover todos los tokens y keys a credenciales de n8n
2. Agregar manejo de errores con notificaciones
3. Implementar logging centralizado

### Mediano Plazo
1. Migrar registro de ordenes de Sheets a PostgreSQL
2. Crear dashboard de monitoreo
3. Implementar retry automatico para fallos de API

### Largo Plazo
1. Separar en microservicios (un workflow por funcion)
2. Implementar cola de mensajes para mejor manejo de carga
3. Agregar tests automatizados

---

# CONCLUSIONES

## Proposito del Negocio

El sistema de automatizacion de HUANGCOM tiene como objetivo principal **unificar las operaciones de venta multicanal** (MercadoLibre + WooCommerce) en un sistema centralizado que:

1. **Sincroniza inventario y pedidos** entre plataformas
2. **Automatiza la atencion al cliente** con IA en MercadoLibre
3. **Mantiene trazabilidad completa** de todas las operaciones
4. **Reduce tiempos de respuesta** y mejora la experiencia del cliente

## Valor Generado

- **Eficiencia operativa**: Eliminacion de trabajo manual de carga de pedidos
- **Consistencia de datos**: Una sola fuente de verdad en Google Sheets
- **Atencion 24/7**: El agente Clara responde preguntas automaticamente
- **Escalabilidad**: Sistema preparado para crecimiento

## Estado General

**SALUDABLE** - Los 3 workflows estan activos y funcionando correctamente segun las ultimas ejecuciones. No se detectaron errores en el periodo analizado.

---

*Documentacion generada automaticamente el 2025-12-09*
*n8n Instance: https://juan-n8n.zfis90.easypanel.host*
