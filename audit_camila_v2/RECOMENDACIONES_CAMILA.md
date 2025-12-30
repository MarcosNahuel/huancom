# RECOMENDACIONES - CAMILA IA
## HUANGCOM GROUP - Plan de Acción

---

## PRIORIDAD 1: CRÍTICO - Captura de Datos

### Problema
Camila NO está pidiendo nombre + email a los leads, perdiendo oportunidades de seguimiento.

### Solución Propuesta

**Modificar el prompt para ser más explícito:**

```markdown
## REGLA OBLIGATORIA DE CAPTURA DE DATOS

ANTES de finalizar CUALQUIER respuesta donde hayas:
- Recomendado un producto
- Dado un precio
- Respondido una consulta técnica
- Ofrecido derivar a un técnico

DEBES verificar si YA tienes nombre + email del cliente.

SI NO TIENES DATOS → AGREGAR AL FINAL:
"Para darte seguimiento, ¿me pasás tu nombre completo y correo?"

NO ENVÍES la respuesta sin esta pregunta si no hay datos capturados.
```

**Agregar validación forzada en el prompt:**

```markdown
## CHECKLIST OBLIGATORIO (ejecutar mentalmente antes de cada respuesta)

□ ¿Ya tengo nombre + email de este cliente?
  → SI: Continuar normal
  → NO: ¿Es una interacción significativa (producto/precio/técnica)?
        → SI: DEBO pedir datos al final
        → NO: Puedo no pedir
```

### Implementación Técnica

1. En el nodo "AI Agent1", modificar el system prompt para incluir las reglas anteriores
2. Agregar un IF node después del AI Agent que valide si se ejecutó la herramienta "Datos"
3. Si no se ejecutó "Datos" y hay keywords comerciales (precio, producto, kit, etc.), loggear alerta

---

## PRIORIDAD 2: CRÍTICO - Ejecución de Handoff

### Problema
Camila promete derivar a técnico pero NO ejecuta la herramienta Handoff.

### Solución Propuesta

**Modificar instrucción de Handoff:**

```markdown
## REGLA DE HANDOFF

CUANDO digas cualquiera de estas frases:
- "¿Te comunico con..."
- "¿Te paso con..."
- "Te derivo con..."
- "Voy a comunicarte con..."

Y el cliente responda afirmativamente (sí, dale, bueno, ok, claro, etc.)

DEBES INMEDIATAMENTE ejecutar la herramienta Handoff.

NO RESPONDAS con texto adicional hasta que Handoff se ejecute.
```

**Agregar trigger words en el workflow:**

Crear un nodo que detecte si Camila dijo "te comunico" o similar y el siguiente mensaje del cliente es afirmativo → forzar Handoff.

---

## PRIORIDAD 3: ALTO - Uso de base_datos

### Problema
Camila responde de memoria en preguntas técnicas en lugar de consultar base_datos.

### Solución Propuesta

**Agregar lista de triggers para base_datos:**

```markdown
## CUÁNDO USAR base_datos (OBLIGATORIO)

SIEMPRE ejecutar base_datos cuando el cliente pregunte sobre:
- Dimensionamiento (cuántos paneles, qué potencia, etc.)
- Cálculos (kWh, litros, metros, voltaje, etc.)
- Instalación (cómo instalar, qué materiales, etc.)
- Comparaciones técnicas (diferencia entre X e Y)
- Mantenimiento (cada cuánto, cómo limpiar, etc.)
- Compatibilidad (funciona con, sirve para, etc.)
- Vida útil (cuánto dura, garantía, etc.)

SI no encontrás info en base_datos:
"No tengo esa información exacta. ¿Te comunico con un técnico?"
→ Y EJECUTAR Handoff si dice que sí
```

---

## PRIORIDAD 4: MEDIO - Mensajes más Cortos

### Problema
Algunos mensajes de Camila exceden 4 líneas.

### Solución

**Agregar instrucción más estricta:**

```markdown
## FORMATO DE RESPUESTA

MÁXIMO 4 líneas por mensaje. Si necesitás más info:
1. Dar lo más importante primero
2. Preguntar si quiere más detalles
3. Expandir SOLO si lo pide
```

---

## PRIORIDAD 5: MEDIO - Personalización con Datos Existentes

### Problema
Cuando Kommo ya tiene datos del contacto, Camila no los usa.

### Solución

**Pasar datos del contacto al prompt:**

En el nodo "Edit Fields" antes del AI Agent, agregar:

```javascript
{
  "context": {
    "client_name": "{{ $json._embedded.contacts[0].name }}",
    "client_email": "{{ $json._embedded.contacts[0].custom_fields_values.find(f => f.field_code === 'EMAIL')?.values[0]?.value }}",
    "client_phone": "{{ $json._embedded.contacts[0].custom_fields_values.find(f => f.field_code === 'PHONE')?.values[0]?.value }}"
  }
}
```

**Agregar al prompt:**

```markdown
## DATOS DEL CLIENTE (si disponibles)

Nombre: {{ context.client_name }}
Email: {{ context.client_email }}
Teléfono: {{ context.client_phone }}

SI hay nombre → Usarlo para saludar: "Hola [nombre]"
SI hay todos los datos → NO pedir datos de nuevo
```

---

## PLAN DE IMPLEMENTACIÓN

### Fase 1: Inmediato (1-2 días)
1. ✅ Modificar prompt para captura de datos obligatoria
2. ✅ Agregar regla de Handoff explícita
3. ✅ Testear con 10 conversaciones manuales

### Fase 2: Corto plazo (3-5 días)
1. Agregar triggers de base_datos
2. Implementar logging de herramientas no usadas
3. Crear alertas cuando no se capture datos

### Fase 3: Mediano plazo (1-2 semanas)
1. Implementar personalización con datos de Kommo
2. Crear dashboard de métricas de captura
3. A/B test de diferentes versiones del prompt

---

## PROMPT OPTIMIZADO v3.1 (Cambios sugeridos)

### Sección a AGREGAR después de §2.B:

```markdown
### G) REGLA DE ORO COMERCIAL (NO NEGOCIABLE)

26. **SIEMPRE pedir datos** al final de cualquier respuesta donde hayas:
    - Recomendado un producto
    - Dado un precio o link
    - Respondido una consulta técnica significativa
    - Ofrecido derivar a un técnico

    FORMATO: "Para darte seguimiento, ¿me pasás tu nombre completo y correo?"

27. **SIEMPRE ejecutar Handoff** cuando:
    - Dijiste "te comunico con" / "te paso con" / "te derivo"
    - Y el cliente respondió afirmativamente

    NO respondas con más texto. EJECUTA Handoff primero.

28. **SIEMPRE usar base_datos** para:
    - Cálculos y dimensionamiento
    - Preguntas de "cuánto", "cuántos", "qué potencia"
    - Comparaciones técnicas
    - Dudas de instalación o mantenimiento
```

### Modificar §9 CHECKLIST PRE-ENVÍO:

```markdown
## 9. CHECKLIST PRE-ENVÍO (OBLIGATORIO)

ANTES de enviar CUALQUIER respuesta, verificar:

✅ ¿Ejecuté Memoria al inicio?
✅ ¿Hay datos (nombre + email) en Memoria?
   → NO + interacción significativa = PEDIR AL FINAL
   → SÍ = no pedir
✅ ¿Era pregunta técnica? → ¿Usé base_datos?
✅ ¿Ofrecí derivar y cliente dijo sí? → ¿Ejecuté Handoff?
✅ ¿Mi mensaje tiene más de 4 líneas? → ACORTAR
✅ ¿Hice más de 1 pregunta? → ELIMINAR EXTRA
```

---

## MÉTRICAS A MONITOREAR POST-IMPLEMENTACIÓN

| Métrica | Baseline | Target 7 días | Target 30 días |
|---------|----------|---------------|----------------|
| Tasa captura datos | 0% | 40% | 65% |
| Handoffs ejecutados | 0% | 70% | 90% |
| Uso de base_datos | 20% | 50% | 70% |
| Mensajes <4 líneas | 70% | 85% | 90% |

---

## TESTING RECOMENDADO

### Casos de Prueba Manuales

1. **Test captura datos - Consulta producto**
   - Enviar: "Hola, cuánto sale un panel de 400W?"
   - Esperado: Respuesta + precio + "¿me pasás tu nombre y correo?"

2. **Test captura datos - Consulta técnica**
   - Enviar: "Cuántos paneles necesito para 300kWh mensuales?"
   - Esperado: Respuesta de base_datos + recomendación + pedir datos

3. **Test Handoff**
   - Enviar: "Necesito hablar con un técnico"
   - Esperado: "¿Te comunico con el equipo técnico?"
   - Responder: "Sí"
   - Esperado: Ejecutar Handoff

4. **Test datos existentes**
   - Usar contacto con datos completos en Kommo
   - Enviar: "Hola"
   - Esperado: "Hola [nombre], ¿en qué puedo ayudarte?"

---

**Documento generado por**: Claude Opus 4.5
**Fecha**: 29 de Diciembre 2025
**Versión**: 1.0
