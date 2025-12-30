# DIAGRAMA - AGENTE MERCADOLIBRE (Clara) (JOCJm5xLqMjar1YP)

## Arquitectura del Agente

```mermaid
flowchart TB
    subgraph ENTRADA["RECEPCION DE PREGUNTA"]
        A1[Webhook<br/>POST /preguntas] --> A2[AUTH TOKEN1<br/>OAuth MELI]
        A2 --> A3[HTTP Request<br/>GET pregunta]
        A3 --> A4{If2<br/>Ya respondida?}
        A4 -->|SI| A5[FIN]
        A4 -->|NO| A6[Continuar proceso]
    end

    subgraph MEMORIA["SISTEMA DE MEMORIA"]
        A6 --> B1[Insert PostgreSQL<br/>Guardar mensaje]
        B1 --> B2[Select PostgreSQL<br/>Historial usuario]
        B2 --> B3[Aggregate<br/>Consolidar mensajes]
    end

    subgraph CONTEXTO["RECOPILACION DE CONTEXTO"]
        B3 --> C1[Get description<br/>Sub-workflow WOO]
        C1 --> C2[Preguntas Anteriores<br/>API MELI]
        C2 --> C3[Code1<br/>Parsear Q&A]
        C3 --> C4[Aggregate5<br/>Consolidar]
    end

    subgraph IA_BUSQUEDA["BUSQUEDA EN HISTORIAL"]
        C4 --> D1[Search in History<br/>Google Gemini]
        D1 --> D2{isNoEncontrada5<br/>Encontro respuesta?}
        D2 -->|SI| D3[Edit Fields7<br/>Fuente: Preguntas]
        D2 -->|NO| D4[Base Conocimientos<br/>Google Gemini]
    end

    subgraph IA_BASE["BASE DE CONOCIMIENTO"]
        D4 --> E1{isNoEncontrada<br/>Encontro en FAQ?}
        E1 -->|SI| E2[Edit Fields<br/>Fuente: Base]
        E1 -->|NO| E3[Edit Fields5<br/>Fuente: WOO]
    end

    subgraph REFORMULACION["RESPUESTA FINAL"]
        D3 --> F1[Edit Fields6<br/>Consolidar]
        E2 --> F1
        E3 --> F1
        F1 --> F2[Description actual<br/>Google Gemini]
        F2 --> F3{If1<br/>Puede responder?}
    end

    subgraph RESPUESTA_OK["RESPUESTA EXITOSA"]
        F3 -->|SI| G1[answer1<br/>Preparar]
        G1 --> G2[Code/Code2<br/>Formatear fecha]
        G2 --> G3[SEND HTTP ANSWER3<br/>Responder MELI]
        G3 --> G4[Append sheet6<br/>Registrar]
    end

    subgraph NO_ENCONTRADA["NO ENCONTRADA"]
        F3 -->|NO| H1[answer3<br/>Preparar]
        H1 --> H2[Append row sheet<br/>Registrar]
        H2 --> H3[Send Gmail<br/>Notificar equipo]
        H3 --> H4[Wait 9min<br/>Ventana intervencion]
        H4 --> H5[HTTP Request1<br/>Verificar estado]
        H5 --> H6{If<br/>Ya respondida?}
        H6 -->|SI| H7[Update sheet<br/>Respuesta manual]
        H6 -->|NO| H8[SEND ANSWER2<br/>Mensaje generico]
        H8 --> H9[Update sheet1<br/>Respuesta auto]
    end

    style A1 fill:#2196F3
    style D1 fill:#9C27B0
    style D4 fill:#9C27B0
    style F2 fill:#9C27B0
    style G3 fill:#4CAF50
    style H8 fill:#FF9800
```

## Secuencia de Procesamiento

```mermaid
sequenceDiagram
    participant MELI as MercadoLibre
    participant N8N as n8n Workflow
    participant PG as PostgreSQL
    participant WOO as WooCommerce
    participant AI as Google Gemini
    participant GS as Google Sheets
    participant MAIL as Gmail

    MELI->>N8N: Webhook nueva pregunta
    N8N->>MELI: GET /questions/{id}
    MELI-->>N8N: Datos pregunta

    alt Ya respondida
        N8N->>N8N: FIN
    else Sin responder
        N8N->>PG: INSERT mensaje
        N8N->>PG: SELECT historial usuario
        PG-->>N8N: Mensajes anteriores

        N8N->>WOO: GET descripcion producto
        WOO-->>N8N: Ficha tecnica

        N8N->>MELI: GET preguntas anteriores
        MELI-->>N8N: Historial Q&A

        N8N->>AI: Buscar en historial
        AI-->>N8N: Respuesta o NO ENCONTRADA

        alt NO ENCONTRADA en historial
            N8N->>AI: Buscar en Base Conocimiento
            AI-->>N8N: Respuesta o NO ENCONTRADA
        end

        N8N->>AI: Reformular respuesta
        AI-->>N8N: Respuesta final

        alt Puede responder
            N8N->>MELI: POST /answers
            N8N->>GS: Registrar respuesta
        else NO ENCONTRADA
            N8N->>GS: Registrar como pendiente
            N8N->>MAIL: Notificar equipo
            N8N->>N8N: Wait 9 minutos
            N8N->>MELI: GET estado pregunta

            alt Respondida manualmente
                N8N->>GS: Actualizar como manual
            else Sin responder
                N8N->>MELI: POST respuesta generica
                N8N->>GS: Actualizar como automatica
            end
        end
    end
```

## Jerarquia de Fuentes de Informacion

```mermaid
flowchart TB
    subgraph PRIORIDAD["ORDEN DE PRIORIDAD"]
        P1["1. FAQ JSON<br/>(Base de Conocimiento)"]
        P2["2. Preguntas Anteriores<br/>(Misma publicacion)"]
        P3["3. Descripcion WooCommerce<br/>(Ficha tecnica)"]
        P4["4. Historial Usuario<br/>(PostgreSQL)"]

        P1 --> P2 --> P3 --> P4
    end

    subgraph REGLAS["REGLAS DE USO"]
        R1["Solo usar datos de fuentes autorizadas"]
        R2["No inventar informacion"]
        R3["Validar SKU y links contra base"]
        R4["Si nada aplica: NO ENCONTRADA"]
    end
```

## Estructura de Respuesta

```mermaid
flowchart LR
    subgraph INPUT["ENTRADA"]
        I1[Pregunta cliente]
        I2[Item ID]
        I3[User ID]
    end

    subgraph PROCESO["PROCESAMIENTO"]
        P1[Contexto recopilado]
        P2[Busqueda IA]
        P3[Reformulacion]
    end

    subgraph OUTPUT["SALIDA"]
        O1["Respuesta tecnica<br/>(max 1000 chars)"]
        O2["Firma: Clara de HUANGCOM"]
    end

    I1 --> P1 --> P2 --> P3 --> O1
    I2 --> P1
    I3 --> P1
    O1 --> O2
```

## Base de Datos PostgreSQL

```mermaid
erDiagram
    MemoriaHistorialMeli {
        serial id PK
        bigint whatsapp "ID usuario MELI"
        text mensaje "Texto de la pregunta"
        timestamp fecha "Fecha del mensaje"
    }
```

## Google Sheets - Registro de Respuestas

| Campo | Descripcion |
|-------|-------------|
| FECHA DE PREGUNTA | Timestamp formateado |
| ESTADO | Respondida por IA / No Encontrada / Respondida |
| PREGUNTA | Texto original del cliente |
| RESPUESTA REFORMULADA | Respuesta final enviada |
| RESPUESTA TECNICA | Respuesta cruda de IA |
| FUENTE CONSULTADA | Base / Preguntas / WOO |
| TITULO DE LA PUBLICACION | Nombre del producto |
| ITEM ID | ID de publicacion MELI |
| LINK DE MERCADOLIBRE | URL de la publicacion |
| SKU | Codigo interno |
| LINK DE HUANGCOM.COM | URL en tienda propia |
| ID USUARIO | ID del comprador |
| ID PREGUNTA | ID unico de la pregunta |

## Prompts de IA Utilizados

### Prompt 1: Busqueda en Historial
- **Objetivo**: Encontrar si la pregunta ya fue respondida
- **Input**: Historial JSON + Pregunta nueva
- **Output**: Respuesta encontrada o "NO ENCONTRADA"

### Prompt 2: Base de Conocimiento
- **Objetivo**: Buscar en FAQ estructurado
- **Categorias**: Bombas, Paneles, Climatizadores, Kits, etc.
- **Output**: Respuesta tecnica o "NO ENCONTRADA"

### Prompt 3: Reformulacion Final
- **Objetivo**: Estructurar respuesta para MELI
- **Restricciones**: Max 1000 chars, sin links externos, firma Clara
- **Output**: Respuesta lista para enviar
