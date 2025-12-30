# DIAGRAMA - ACTUALIZADOR DE ESTADO (nwxle9rOLTNWgH9i)

## Flujo Principal

```mermaid
flowchart TB
    subgraph ACTUALIZADOR["ACTUALIZADOR DE ORDENES"]
        A1[WooCommerce Trigger<br/>order.updated] --> A2[Get row in sheet<br/>Buscar por ID WOO]
        A2 --> A3{If<br/>row_number existe?}
        A3 -->|SI| A4[Update row in sheet<br/>Solo actualiza ESTADO]
        A3 -->|NO| A5[Append or update row<br/>Crea registro completo]
    end

    subgraph CREADOR["CREADOR DE ORDENES"]
        B1[WooCommerce Trigger1<br/>order.created] --> B2[Wait<br/>8 minutos]
        B2 --> B3[Get row in sheet1<br/>Verificar existencia]
        B3 --> B4{If1<br/>row_number existe?}
        B4 -->|SI| B5[No hacer nada]
        B4 -->|NO| B6[Append or update row<br/>Crear nuevo registro]
    end

    subgraph SHEETS["GOOGLE SHEETS - PEDIDOS"]
        C1[(Spreadsheet<br/>1lL0qYGaM...)]
    end

    A4 --> C1
    A5 --> C1
    B6 --> C1

    style A1 fill:#4CAF50
    style B1 fill:#4CAF50
    style C1 fill:#FFC107
```

## Estructura de Datos

```mermaid
erDiagram
    PEDIDOS {
        string ID_ORDER_MERCADOLIBRE
        int PEDIDO_DE_WOOCOMERCE PK
        string Fecha_de_venta
        int Unidades
        float Precio_unitario
        float Ingresos_por_productos
        string SKU
        string Titulo_de_la_publicacion
        string Datos_personales
        string Tipo_y_numero_documento
        string Direccion
        string Comprador
        string DNI
        string Domicilio
        string Ciudad
        string Estado
        string Codigo_postal
        string Pais
        string Forma_de_entrega
        string Transportista
        string Numero_de_seguimiento
        string ESTADO_DE_PEDIDO
        string Timestamp
    }
```

## Secuencia de Eventos

```mermaid
sequenceDiagram
    participant WOO as WooCommerce
    participant N8N as n8n Workflow
    participant GS as Google Sheets

    Note over WOO,GS: Escenario 1: Orden Actualizada
    WOO->>N8N: Webhook order.updated
    N8N->>GS: Buscar pedido por ID
    GS-->>N8N: Resultado (existe/no existe)
    alt Existe
        N8N->>GS: UPDATE solo estado
    else No existe
        N8N->>GS: APPEND nuevo registro
    end

    Note over WOO,GS: Escenario 2: Orden Nueva
    WOO->>N8N: Webhook order.created
    N8N->>N8N: Wait 8 minutos
    N8N->>GS: Verificar existencia
    GS-->>N8N: Resultado
    alt No existe
        N8N->>GS: APPEND nuevo registro
    else Ya existe
        N8N->>N8N: Ignorar (duplicado)
    end
```

## Campos Mapeados

| Campo Google Sheets | Origen WooCommerce | Transformacion |
|--------------------|--------------------|----------------|
| PEDIDO DE WOOCOMERCE | json.id | Directo |
| Fecha de venta | date_created | toLocaleString('es-AR') |
| Unidades | line_items[].quantity | reduce sum |
| Precio unitario | total / unidades | Calculado |
| Ingresos | total | Directo |
| SKU | line_items[].sku | join(', ') |
| Titulo | shipping_lines.meta_data.value | Regex parse |
| Datos personales | shipping.first_name + billing.last_name | Concatenado |
| Estado | status | Directo |
| Timestamp | date_created | Formato personalizado |
