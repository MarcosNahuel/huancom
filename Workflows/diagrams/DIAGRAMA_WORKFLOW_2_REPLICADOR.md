# DIAGRAMA - REPLICADOR DE PEDIDOS MELI a WOO (e77BVblQZV7FBmm1)

## Flujo Principal

```mermaid
flowchart TB
    subgraph ENTRADA["ENTRADA Y VALIDACION"]
        A1[Webhook<br/>POST /woocommercemeli] --> A2[Code<br/>Calcular delay 0-290s]
        A2 --> A3[Wait<br/>Delay variable]
        A3 --> A4{If<br/>actions vacio Y<br/>no es /collections?}
        A4 -->|NO| A5[FIN - Ignorar]
        A4 -->|SI| A6[AUTH TOKEN<br/>OAuth refresh]
    end

    subgraph API_MELI["CONSULTA API MELI"]
        A6 --> B1[HTTP Request<br/>GET /orders/id]
        B1 --> B2[Get row in sheet<br/>Verificar duplicado]
        B2 --> B3{If1<br/>Ya existe?}
        B3 -->|SI| B4[NoOp]
        B3 -->|NO| B5[Append row<br/>Registro inicial]
    end

    subgraph PROCESAMIENTO["PROCESAMIENTO DE ORDEN"]
        B5 --> C1{If3<br/>Es /orders/?}
        C1 -->|SI| C2[HTTP Request2<br/>GET /shipments/id]
        C2 --> C3[HTTP Request3<br/>MercadoPago search]
        C3 --> C4{If4<br/>logistic_type existe?}
    end

    subgraph TIPOS_ENVIO["TIPOS DE ENVIO"]
        C4 -->|SI| D1{If2<br/>fulfillment?}
        C4 -->|NO| D4[PAQAR Flow]

        D1 -->|SI| D2[FULL Flow]
        D1 -->|NO| D3[MELI ENVIO Flow]
    end

    subgraph FULL["MERCADO ENVIOS FULL"]
        D2 --> E1[Get products1<br/>Buscar por SKU]
        E1 --> E2[Create order1<br/>Cupon FULL]
        E2 --> E3[Update sheet1]
    end

    subgraph MELI["MERCADO ENVIOS STANDARD"]
        D3 --> F1[Get products<br/>Buscar por SKU]
        F1 --> F2[Create order<br/>Cupon MERCADOENVIO]
        F2 --> F3[Update sheet]
    end

    subgraph PAQAR["ENVIO POR TU CUENTA"]
        D4 --> G1[Get products3<br/>Buscar por SKU]
        G1 --> G2[Create order3<br/>Cupon PAQAR]
        G2 --> G3[Update sheet3]
    end

    style A1 fill:#2196F3
    style E2 fill:#9C27B0
    style F2 fill:#4CAF50
    style G2 fill:#FF9800
```

## Secuencia de Replicacion

```mermaid
sequenceDiagram
    participant MELI as MercadoLibre
    participant WH as Webhook n8n
    participant AUTH as OAuth Service
    participant API as MELI API
    participant MP as MercadoPago
    participant GS as Google Sheets
    participant WOO as WooCommerce

    MELI->>WH: Notificacion nueva orden
    WH->>WH: Calcular delay (0-290s)
    WH->>WH: Wait delay
    WH->>AUTH: Refresh token
    AUTH-->>WH: Access token
    WH->>API: GET /orders/{id}
    API-->>WH: Datos de orden
    WH->>GS: Verificar si existe
    GS-->>WH: No existe
    WH->>GS: Crear registro inicial
    WH->>API: GET /shipments/{id}
    API-->>WH: Datos de envio
    WH->>MP: Search payment
    MP-->>WH: Info pago

    alt FULL
        WH->>WOO: GET products by SKU
        WOO-->>WH: Producto WOO
        WH->>WOO: POST create order (FULL)
        WH->>GS: Update con datos WOO
    else MELI ENVIO
        WH->>WOO: GET products by SKU
        WOO-->>WH: Producto WOO
        WH->>WOO: POST create order (MERCADOENVIO)
        WH->>GS: Update con datos WOO
    else PAQAR
        WH->>WOO: GET products by SKU
        WOO-->>WH: Producto WOO
        WH->>WOO: POST create order (PAQAR)
        WH->>GS: Update con datos WOO
    end
```

## Mecanismo Anti-Duplicacion

```mermaid
flowchart LR
    subgraph TIEMPO["DISTRIBUCION DE DELAY"]
        T0["Segundo 0 = 0s"]
        T1["Segundo 1 = 5s"]
        T2["Segundo 2 = 10s"]
        T3["..."]
        T59["Segundo 59 = 290s"]
    end

    subgraph VERIFICACION["DOBLE VERIFICACION"]
        V1[Buscar en Sheets<br/>por ID ORDER MELI]
        V2{Existe?}
        V3[Procesar]
        V4[Ignorar]
        V1 --> V2
        V2 -->|NO| V3
        V2 -->|SI| V4
    end
```

## Estructura de Orden WooCommerce Generada

```json
{
  "status": "on-hold",
  "payment_method_title": "Mercadolibre",
  "transaction_id": "{pack_id|order_id}",
  "customer_note": "PEDIDO DE MERCADOLIBRE\n{TIPO_ENVIO}\nVENTA #{id}\nCOMPRADOR: {nickname}\nPRODUCTO: ({qty}) {title}\nSKU: {sku}\nTOTAL: ${amount}\nTRACKING: {url}",
  "billing": {
    "first_name": "{buyer.first_name}",
    "last_name": "{buyer.last_name}",
    "company": "{buyer.nickname}",
    "address_1": "{receiver_address.address_line}",
    "city": "{city}, {state}",
    "postcode": "{zip_code}",
    "country": "AR"
  },
  "shipping": { "...similar..." },
  "line_items": [{
    "product_id": "{woo_product_id}",
    "quantity": "{meli_qty}",
    "subtotal": "{unit_price / 1.21 * qty}"
  }],
  "coupon_lines": [{
    "code": "FULL|MERCADOENVIO|PAQAR"
  }]
}
```

## Mapeo de Tipos de Logistica

| logistic_type MELI | Cupon WOO | Caracteristicas |
|-------------------|-----------|-----------------|
| fulfillment | FULL | Stock en deposito MELI, envio gestionado por MELI |
| cross_docking | MERCADOENVIO | Retira MELI de vendedor |
| drop_off | MERCADOENVIO | Vendedor lleva a sucursal |
| xd_drop_off | MERCADOENVIO | Similar drop_off |
| (error/vacio) | PAQAR | Envio por cuenta del vendedor |
