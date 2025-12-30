Sos Claude Code en modo auditor forense (n8n + LLM) y evaluador de desempeño comercial.
Tu trabajo NO es dar opiniones generales: es producir evidencia, casos reproducibles y un diagnóstico técnico+conversacional.

CONTEXTO
Estoy auditando a “Camila” (vendedora) porque el cliente dice:
- Responde largo, da vueltas, no resuelve ni vende
- No ofrece los productos que el cliente quiere ofrecer
- Deriva por falta de info cuando no debería
- A veces pide datos varias veces
- Cumple tiempos pero la calidad comercial no convence

Yo (Nacho) NO estoy seguro de que las conversaciones estén mal.
Necesito que revises de forma extremadamente detallada logs + ejecuciones + conversaciones para confirmar con evidencia.

WORKFLOWS
- Camila principal: https://n8n.huangcom.com/workflow/slIWaAf2mVITzuTZ
- Camila MercadoLibre (si aplica / comparar): https://n8n.huangcom.com/workflow/JOCJm5xLqMjar1YP
- Herramienta base_datos: https://n8n.huangcom.com/workflow/yHBPQa1EEahuhoMr
- Herramienta productos: https://n8n.huangcom.com/workflow/yhyOQjPFUaMqzhs5

AUTENTICACIÓN
- API key SOLO desde variable de entorno: N8N_API_KEY
- NO imprimirla. NO guardarla. NO commitearla.
- Si falta, frenar.

OBJETIVO PRINCIPAL
Determinar con evidencia:
1) Si Camila está cumpliendo su función de VENDEDORA (consultiva) en conversaciones reales.
2) Si usa bien las herramientas (productos/base_datos) y si los outputs están correctos.
3) Si cuando “no encuentra” es:
   A) porque la info no existe (data gap real)
   B) porque la herramienta respondió pero Camila la ignoró o la interpretó mal (agent gap)
   C) porque el flujo no está llamando la herramienta correcta o la está llamando mal (flow gap)
4) Si deriva a soporte por buenas razones o por falta de capacidad del bot (derivation bug).

IMPORTANTE: NO ACEPTES SUPOSICIONES
- Cada conclusión debe citar ejecución_id + nodo + input/output + fragmento de conversación.
- Si no hay evidencia, decir “no se puede demostrar”.

MÉTODO (sin saturar logs, pero profundo)
Trabajar por 3 capas, por lotes:

CAPA 1: SELECCIÓN INTELIGENTE DE CASOS (50–100)
- Listar ejecuciones recientes (mínimo 100 si existen).
- Seleccionar 50 a 100 ejecuciones representativas, con muestreo estratificado:
  1) 20 casos “pregunta por producto puntual”
  2) 15 casos “consulta general / categoría / recomendación”
  3) 10 casos “precio/stock/envío/garantía”
  4) 5 casos “derivaciones a soporte”
  (si hay más datos, expandir)
- Además: detectar outliers (respuestas muy largas, múltiples repreguntas, tool outputs vacíos).

CAPA 2: ANÁLISIS FORENSE POR EJECUCIÓN (profundo)
Para cada ejecución seleccionada:
A) Conversación
- Capturar transcript completo (user/assistant) con timestamps si existen
- Medir: longitud por mensaje, cantidad de turnos, si repite preguntas
- Etiquetar intención del usuario (producto puntual / recomendación / objeción / postventa / etc.)
B) Herramientas / Logs
- Identificar nodos que llaman productos/base_datos/subworkflows
- Extraer input exacto que se envió a cada herramienta
- Extraer output (resumido, pero conservar campos claves: nombre, sku, precio, stock, compatibilidad, atributos, descripción, FAQ, enlaces, etc.)
- Comparar output vs respuesta final:
  - ¿qué info disponible NO se usó?
  - ¿qué info se inventó?
  - ¿se interpretó mal?
C) Decisiones
- Si deriva a soporte: validar si realmente se agotaron herramientas
- Si no deriva: validar si dio solución/CTA comercial real

CAPA 3: EVALUACIÓN DE PERFORMANCE COMERCIAL (scorecards)
Definir un score por conversación (0–5) en estas dimensiones:
1) Resolución (¿respondió lo preguntado y avanzó?)
2) Brevedad útil (¿fue corto y claro sin relleno?)
3) Venta consultiva (¿ofreció producto/alternativa/beneficio/CTA?)
4) Uso de fuentes (¿usó herramientas cuando correspondía?)
5) Control de derivación (¿derivó sólo cuando corresponde?)
6) Experiencia (tono humano, no pide datos repetidos)

Además:
- “Conversion readiness”: ¿dejó al usuario listo para comprar?
- “Missed opportunity”: ¿podía vender y no vendió?

ANÁLISIS ESPECÍFICO DEL “VENDEDOR”
Camila debe cumplir (verificar con evidencia):
- Si el usuario pregunta general → ofrecer 2–4 opciones (por categoría/uso) + 1 pregunta de calificación máxima.
- Si pregunta por producto puntual → responder SOLO sobre ese producto con bullets:
  (beneficios, compatibilidad, medidas/potencia, stock, envío, garantía, instalación si aplica) + CTA corto.
- No mandar párrafos largos.
- No “dar vueltas”: cada respuesta debe tener:
  - Respuesta directa
  - Info clave
  - Próximo paso (CTA o pregunta útil)
- Si falta info → pedir 1 dato preciso (no 3) y no repetir si ya está.

SALIDAS / ENTREGABLES (guardar en ./audit_camila_v2/)
A) report.md
- Resumen ejecutivo (con números reales)
- Hallazgos con evidencia (execution_id + nodo + IO + texto)
- Diagnóstico por causa:
  - data_gap / agent_gap / flow_gap / prompt_gap
- Tabla: “Derivaciones: justificadas vs injustificadas”
- Top 10 oportunidades de mejora ordenadas por impacto comercial

B) conversations/
- 20–30 transcripts completos en .txt (los mejores y los peores)
- Cada transcript con:
  - “Qué preguntó el usuario”
  - “Qué respondió Camila”
  - “Qué herramientas se llamaron”
  - “Qué info había disponible y no se usó”
  - “Qué hubiese respondido una Camila vendedora ideal (máximo 500 caracteres)”

C) tools_trace.csv
- execution_id
- tool_name (productos/base_datos/otros)
- tool_input_summary
- tool_output_summary
- output_empty (y/n)
- was_used_in_final_answer (y/n)

D) scorecards.csv
- execution_id
- intent_type
- resolution_score
- brevity_score
- sales_score
- sources_score
- derivation_score
- ux_score
- notes

E) recommendations.md
- Recomendaciones separadas en:
  1) Cambios de prompt (reglas concretas)
  2) Cambios de flujo n8n (mapeos, fallback, reintentos)
  3) Cambios de herramientas (mejorar outputs, campos faltantes)
  4) Instrumentación (cómo guardar conversaciones y fuente)
- Cada recomendación debe tener: “problema → evidencia → fix → esfuerzo → impacto”

INSTRUMENTACIÓN OBLIGATORIA (si hoy no existe)
Si no se puede saber “de dónde sale la info”, proponer y detallar:
- Cómo loggear por mensaje: tool_calls[], tool_results[], selected_fields[], final_answer_source
- Dónde guardarlo: DB / Google Sheets / Notion / S3 / n8n Data Store
- Cómo exportar conversación completa por cliente en un .txt automáticamente

ARRANQUE PASO A PASO
1) Validar N8N_API_KEY
2) Resolver workflow_id(s) desde los links
3) Listar ejecuciones recientes (100 si se puede)
4) Elegir el set de 50–100 según el muestreo de arriba
5) Analizar 2 ejecuciones completas como “prueba de pipeline” y confirmar que podés extraer:
   - transcript
   - tool IO
   - respuesta final
6) Ejecutar el análisis completo por lotes de 10, generando outputs incrementalmente
7) Al final, completar report.md y recommendations.md

REGLA FINAL
No me digas “parece” o “probablemente”.
Quiero números, evidencia y ejemplos reales.
Si las conversaciones están bien, demostralo con métricas y casos.
Si están mal, demostralo igual.