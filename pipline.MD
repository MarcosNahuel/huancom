# Pipeline ETL - Analisis de Efectividad de Agentes de IA

## Documento de Replicacion para Implementaciones Similares

**Version:** 1.0
**Fecha:** Diciembre 2025
**Basado en:** Analisis del Agente WhatsApp (AGENTE DE IA WHATSAPP 08-10)

---

## 1. VISION GENERAL

### 1.1 Objetivo del Pipeline

Este pipeline permite:
- Extraer datos de ejecuciones de workflows n8n
- Transformar datos crudos en metricas accionables
- Cargar resultados en formatos visualizables (JSON, HTML Dashboard, Excel)
- Analizar efectividad de agentes de IA conversacionales
- Generar reportes automatizados de rendimiento

### 1.2 Arquitectura del Pipeline

```
+-------------------+     +-------------------+     +-------------------+
|     EXTRACT       |     |    TRANSFORM      |     |      LOAD         |
+-------------------+     +-------------------+     +-------------------+
|                   |     |                   |     |                   |
| - n8n API         |---->| - Metricas KPI    |---->| - JSON Results    |
| - Executions      |     | - Timeline        |     | - HTML Dashboard  |
| - Workflow Data   |     | - Error Analysis  |     | - Excel Reports   |
| - Error Logs      |     | - Client Tracking |     | - Visualizations  |
|                   |     | - Node Metrics    |     |                   |
+-------------------+     +-------------------+     +-------------------+
         |                        |                        |
         v                        v                        v
+-------------------------------------------------------------------+
|                     ANALISIS DE EFECTIVIDAD                       |
+-------------------------------------------------------------------+
| - Tasa de Exito          - Tendencias Temporales                  |
| - Tiempos de Respuesta   - Patrones de Error                      |
| - Engagement Clientes    - Recomendaciones Automaticas            |
+-------------------------------------------------------------------+
```

---

## 2. FASE 1: EXTRACCION (EXTRACT)

### 2.1 Configuracion de Conexion

```javascript
// config.js - Configuracion de conexion a n8n
const config = {
  n8n: {
    apiUrl: 'https://[TU-INSTANCIA].easypanel.host/api/v1',
    apiKey: '[TU-API-KEY]',
    workflowId: '[ID-DEL-WORKFLOW]'
  },
  limits: {
    maxExecutions: 250,  // Maximo de ejecuciones a traer
    includeData: true     // Incluir datos detallados
  }
};

module.exports = config;
```

### 2.2 Script de Extraccion

```javascript
// extract_executions.cjs
const https = require('https');
const config = require('./config');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'X-N8N-API-KEY': config.n8n.apiKey,
        'Accept': 'application/json'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function extractExecutions() {
  const url = new URL(`${config.n8n.apiUrl}/executions`);
  url.searchParams.append('workflowId', config.n8n.workflowId);
  url.searchParams.append('limit', config.limits.maxExecutions);
  url.searchParams.append('includeData', config.limits.includeData);

  const data = await makeRequest(url.toString());
  return data.data || [];
}

module.exports = { extractExecutions, makeRequest };
```

### 2.3 Datos Extraidos

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | string | ID unico de ejecucion |
| `status` | string | 'success' o 'error' |
| `startedAt` | ISO Date | Inicio de ejecucion |
| `stoppedAt` | ISO Date | Fin de ejecucion |
| `mode` | string | 'webhook', 'manual', etc. |
| `data.resultData.runData` | object | Datos de cada nodo ejecutado |
| `data.resultData.error` | object | Detalles del error (si aplica) |

---

## 3. FASE 2: TRANSFORMACION (TRANSFORM)

### 3.1 Metricas Principales (KPIs)

```javascript
// transform_metrics.cjs
function calculateMetrics(executions) {
  const metrics = {
    // Metricas de volumen
    total: executions.length,
    successful: 0,
    failed: 0,

    // Metricas de tiempo
    durations: [],
    averageDuration: 0,
    medianDuration: 0,
    maxDuration: 0,
    minDuration: Infinity,

    // Metricas de errores
    errors: [],
    errorsByNode: {},
    errorsByType: {},

    // Metricas de distribucion temporal
    hourlyDistribution: {},
    dailyDistribution: {},

    // Metricas de clientes
    uniqueClients: new Set(),
    clientConversations: {},
    conversationTimeline: [],

    // Metricas de conversacion
    conversationMetrics: {
      totalMessages: 0,
      totalResponses: 0,
      averageMessagesPerConversation: 0,
      conversationsWithMemory: 0
    },

    // Metricas por nodo
    nodeMetrics: {}
  };

  executions.forEach(exec => {
    processExecution(exec, metrics);
  });

  // Calcular agregaciones finales
  calculateAggregates(metrics);

  return metrics;
}
```

### 3.2 Procesamiento de Ejecuciones

```javascript
function processExecution(exec, metrics) {
  const startedAt = new Date(exec.startedAt);
  const stoppedAt = new Date(exec.stoppedAt);
  const duration = (stoppedAt - startedAt) / 1000; // en segundos

  // 1. Estado y duracion
  if (exec.status === 'success') {
    metrics.successful++;
  } else {
    metrics.failed++;
    extractErrorInfo(exec, metrics);
  }

  metrics.durations.push(duration);
  metrics.maxDuration = Math.max(metrics.maxDuration, duration);
  metrics.minDuration = Math.min(metrics.minDuration, duration);

  // 2. Distribucion temporal
  const hour = (startedAt.getUTCHours() - 5 + 24) % 24; // UTC-5 (Colombia)
  const hourKey = `${hour.toString().padStart(2, '0')}:00`;
  metrics.hourlyDistribution[hourKey] = (metrics.hourlyDistribution[hourKey] || 0) + 1;

  const dayKey = startedAt.toISOString().split('T')[0];
  metrics.dailyDistribution[dayKey] = (metrics.dailyDistribution[dayKey] || 0) + 1;

  // 3. Datos de workflow
  if (exec.data?.resultData?.runData) {
    processRunData(exec, metrics, duration);
  }
}
```

### 3.3 Extraccion de Datos de Cliente

```javascript
function processRunData(exec, metrics, duration) {
  const runData = exec.data.resultData.runData;

  // Extraer datos del webhook
  let clientId = null;
  let chatId = null;
  let messageText = null;

  // Buscar en nodos de entrada (Webhook, Extract Data)
  const webhookNodes = ['Webhook1', 'Webhook', '0. Extract Webhook Data1'];

  webhookNodes.forEach(nodeName => {
    if (runData[nodeName]) {
      runData[nodeName].forEach(run => {
        if (run.data?.main?.[0]) {
          run.data.main[0].forEach(item => {
            if (item.json) {
              // Formato Kommo/amoCRM
              clientId = item.json.body?.['message[add][0][contact_id]'] ||
                        item.json.contact_id || clientId;
              chatId = item.json.body?.['message[add][0][chat_id]'] ||
                      item.json.chat_id || chatId;
              messageText = item.json.body?.['message[add][0][text]'] ||
                           item.json.message_text || messageText;
            }
          });
        }
      });
    }
  });

  // Registrar cliente y conversacion
  if (clientId) {
    registerClientInteraction(metrics, clientId, chatId, messageText, exec, duration);
  }

  // Metricas por nodo
  Object.keys(runData).forEach(nodeName => {
    processNodeMetrics(runData[nodeName], nodeName, metrics);
  });

  // Metricas de memoria de conversacion
  if (runData['Postgres Chat Memory']) {
    processMemoryMetrics(runData['Postgres Chat Memory'], metrics);
  }
}
```

### 3.4 Tracking de Clientes

```javascript
function registerClientInteraction(metrics, clientId, chatId, messageText, exec, duration) {
  metrics.uniqueClients.add(clientId);

  if (!metrics.clientConversations[clientId]) {
    metrics.clientConversations[clientId] = {
      firstSeen: exec.startedAt,
      lastSeen: exec.startedAt,
      totalInteractions: 0,
      successful: 0,
      failed: 0,
      chatIds: new Set(),
      messages: [],
      averageDuration: 0,
      totalDuration: 0
    };
  }

  const client = metrics.clientConversations[clientId];
  client.lastSeen = exec.stoppedAt;
  client.totalInteractions++;
  client.totalDuration += duration;
  client.averageDuration = client.totalDuration / client.totalInteractions;

  if (chatId) client.chatIds.add(chatId);
  if (exec.status === 'success') client.successful++;
  else client.failed++;

  if (messageText) {
    client.messages.push({
      text: messageText,
      timestamp: exec.startedAt,
      executionId: exec.id
    });
  }

  // Timeline de conversaciones
  metrics.conversationTimeline.push({
    executionId: exec.id,
    clientId: clientId,
    chatId: chatId,
    timestamp: exec.startedAt,
    duration: duration,
    status: exec.status,
    messageText: messageText?.substring(0, 100) || null,
    finished: exec.status === 'success'
  });
}
```

### 3.5 Analisis de Errores

```javascript
function extractErrorInfo(exec, metrics) {
  if (exec.data?.resultData?.error) {
    const error = exec.data.resultData.error;

    const errorInfo = {
      executionId: exec.id,
      message: error.message || 'Unknown error',
      node: error.node || 'Unknown',
      timestamp: exec.stoppedAt,
      duration: ((new Date(exec.stoppedAt) - new Date(exec.startedAt)) / 1000).toFixed(2)
    };

    metrics.errors.push(errorInfo);

    // Agrupar por nodo
    const nodeName = error.node || 'Unknown';
    metrics.errorsByNode[nodeName] = (metrics.errorsByNode[nodeName] || 0) + 1;

    // Agrupar por tipo de mensaje
    const errorType = categorizeError(error.message);
    metrics.errorsByType[errorType] = (metrics.errorsByType[errorType] || 0) + 1;
  }
}

function categorizeError(message) {
  if (!message) return 'Unknown';

  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('bad request') || lowerMsg.includes('invalid')) {
    return 'Validation Error';
  }
  if (lowerMsg.includes('timeout') || lowerMsg.includes('timed out')) {
    return 'Timeout';
  }
  if (lowerMsg.includes('rate limit') || lowerMsg.includes('too many')) {
    return 'Rate Limit';
  }
  if (lowerMsg.includes('not found') || lowerMsg.includes('404')) {
    return 'Not Found';
  }
  if (lowerMsg.includes('unauthorized') || lowerMsg.includes('forbidden')) {
    return 'Auth Error';
  }
  if (lowerMsg.includes('output') || lowerMsg.includes('parser')) {
    return 'Output Parser Error';
  }
  if (lowerMsg.includes('upload') || lowerMsg.includes('file')) {
    return 'File Upload Error';
  }

  return 'Other';
}
```

### 3.6 Calculo de Agregaciones

```javascript
function calculateAggregates(metrics) {
  // Promedios de duracion
  if (metrics.durations.length > 0) {
    metrics.averageDuration =
      metrics.durations.reduce((a, b) => a + b, 0) / metrics.durations.length;

    const sorted = [...metrics.durations].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    metrics.medianDuration = sorted.length % 2
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  // Promedios por nodo
  Object.keys(metrics.nodeMetrics).forEach(nodeName => {
    const node = metrics.nodeMetrics[nodeName];
    if (node.executions > 0) {
      node.avgTime = node.totalTime / node.executions;
    }
  });

  // Promedio de mensajes por conversacion
  if (metrics.conversationMetrics.conversationsWithMemory > 0) {
    metrics.conversationMetrics.averageMessagesPerConversation =
      metrics.conversationMetrics.totalMessages /
      metrics.conversationMetrics.conversationsWithMemory;
  }

  // Ordenar timeline
  metrics.conversationTimeline.sort((a, b) =>
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  // Convertir Sets a Arrays para JSON
  metrics.uniqueClients = Array.from(metrics.uniqueClients);
  Object.keys(metrics.clientConversations).forEach(clientId => {
    metrics.clientConversations[clientId].chatIds =
      Array.from(metrics.clientConversations[clientId].chatIds);
  });
}
```

---

## 4. FASE 3: CARGA (LOAD)

### 4.1 Exportar a JSON

```javascript
// load_results.cjs
const fs = require('fs');
const path = require('path');

function exportToJSON(metrics, executions, workflowInfo) {
  const output = {
    workflow: workflowInfo,
    analysisDate: new Date().toISOString(),
    summary: {
      total: metrics.total,
      successful: metrics.successful,
      failed: metrics.failed,
      successRate: ((metrics.successful / metrics.total) * 100).toFixed(2) + '%',
      averageDuration: metrics.averageDuration.toFixed(2) + 's',
      medianDuration: metrics.medianDuration.toFixed(2) + 's',
      uniqueClients: metrics.uniqueClients.length,
      totalMessages: metrics.conversationMetrics.totalMessages
    },
    metrics: metrics,
    executions: executions.map(exec => ({
      id: exec.id,
      status: exec.status,
      startedAt: exec.startedAt,
      stoppedAt: exec.stoppedAt,
      duration: ((new Date(exec.stoppedAt) - new Date(exec.startedAt)) / 1000).toFixed(2) + 's',
      mode: exec.mode
    }))
  };

  const outputPath = path.join(__dirname, 'data/workflow_analysis_results.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  return outputPath;
}
```

### 4.2 Generar Dashboard HTML

```javascript
function generateHTMLDashboard(metrics) {
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard - Agente IA</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f7fa;
      color: #333;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .kpi-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
      text-align: center;
    }
    .kpi-value { font-size: 2.5rem; font-weight: bold; color: #667eea; }
    .kpi-label { color: #666; font-size: 0.9rem; margin-top: 5px; }
    .chart-container {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
    }
    .chart-title { font-size: 1.2rem; margin-bottom: 15px; color: #333; }
    .success { color: #10b981; }
    .error { color: #ef4444; }
    .warning { color: #f59e0b; }
    /* ... mas estilos ... */
  </style>
</head>
<body>
  <div class="header">
    <h1>Dashboard - Agente de IA</h1>
    <p>Analisis de Efectividad</p>
  </div>

  <div class="container">
    <!-- KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-value">${metrics.total}</div>
        <div class="kpi-label">Ejecuciones Totales</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value success">${((metrics.successful/metrics.total)*100).toFixed(1)}%</div>
        <div class="kpi-label">Tasa de Exito</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value">${metrics.averageDuration.toFixed(1)}s</div>
        <div class="kpi-label">Tiempo Promedio</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value">${metrics.uniqueClients.length}</div>
        <div class="kpi-label">Clientes Unicos</div>
      </div>
    </div>

    <!-- Graficos -->
    <div class="chart-container">
      <h3 class="chart-title">Distribucion Horaria</h3>
      <canvas id="hourlyChart"></canvas>
    </div>

    <div class="chart-container">
      <h3 class="chart-title">Ejecuciones por Dia</h3>
      <canvas id="dailyChart"></canvas>
    </div>

    <div class="chart-container">
      <h3 class="chart-title">Distribucion de Tiempos</h3>
      <canvas id="durationChart"></canvas>
    </div>
  </div>

  <script>
    // Datos para graficos
    const hourlyData = ${JSON.stringify(metrics.hourlyDistribution)};
    const dailyData = ${JSON.stringify(metrics.dailyDistribution)};
    const durations = ${JSON.stringify(metrics.durations)};

    // Inicializar graficos con Chart.js
    // ... codigo de inicializacion ...
  </script>
</body>
</html>
  `;

  fs.writeFileSync('dashboard_agente.html', html);
}
```

### 4.3 Exportar a Excel

```javascript
// Usando la libreria xlsx o similares
const XLSX = require('xlsx');

function exportToExcel(metrics, outputPath) {
  const workbook = XLSX.utils.book_new();

  // Hoja 1: Resumen
  const summaryData = [
    ['Metrica', 'Valor'],
    ['Total Ejecuciones', metrics.total],
    ['Exitosas', metrics.successful],
    ['Fallidas', metrics.failed],
    ['Tasa de Exito', `${((metrics.successful/metrics.total)*100).toFixed(2)}%`],
    ['Tiempo Promedio', `${metrics.averageDuration.toFixed(2)}s`],
    ['Tiempo Mediano', `${metrics.medianDuration.toFixed(2)}s`],
    ['Clientes Unicos', metrics.uniqueClients.length]
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

  // Hoja 2: Distribucion Diaria
  const dailyData = [['Fecha', 'Ejecuciones']];
  Object.entries(metrics.dailyDistribution)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([date, count]) => dailyData.push([date, count]));
  const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
  XLSX.utils.book_append_sheet(workbook, dailySheet, 'Por Dia');

  // Hoja 3: Errores
  const errorData = [['Nodo', 'Cantidad de Errores']];
  Object.entries(metrics.errorsByNode)
    .sort(([,a], [,b]) => b - a)
    .forEach(([node, count]) => errorData.push([node, count]));
  const errorSheet = XLSX.utils.aoa_to_sheet(errorData);
  XLSX.utils.book_append_sheet(workbook, errorSheet, 'Errores');

  // Hoja 4: Clientes
  const clientData = [['Cliente ID', 'Interacciones', 'Exitosas', 'Fallidas', 'Tiempo Promedio']];
  Object.entries(metrics.clientConversations)
    .sort(([,a], [,b]) => b.totalInteractions - a.totalInteractions)
    .forEach(([id, client]) => {
      clientData.push([
        id,
        client.totalInteractions,
        client.successful,
        client.failed,
        `${client.averageDuration.toFixed(2)}s`
      ]);
    });
  const clientSheet = XLSX.utils.aoa_to_sheet(clientData);
  XLSX.utils.book_append_sheet(workbook, clientSheet, 'Clientes');

  XLSX.writeFile(workbook, outputPath);
}
```

---

## 5. VISUALIZACIONES

### 5.1 Graficos Requeridos

| Grafico | Tipo | Datos | Uso |
|---------|------|-------|-----|
| **Ejecuciones por Dia** | Linea/Barras | `dailyDistribution` | Tendencias temporales |
| **Distribucion Horaria** | Barras | `hourlyDistribution` | Identificar picos |
| **Tasa de Exito** | Dona/Pie | `successful/failed` | KPI principal |
| **Tiempos de Respuesta** | Histograma | `durations` | Rendimiento |
| **Errores por Nodo** | Barras Horizontales | `errorsByNode` | Identificar problemas |
| **Mapa de Calor** | Heatmap | `hourly x daily` | Patrones de uso |

### 5.2 Mapa de Calor (Heatmap)

```javascript
function generateHeatmapData(executions) {
  const heatmap = {};

  // Crear matriz 24 horas x 7 dias
  const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

  executions.forEach(exec => {
    const date = new Date(exec.startedAt);
    const dayOfWeek = days[date.getUTCDay()];
    const hour = (date.getUTCHours() - 5 + 24) % 24; // UTC-5

    const key = `${dayOfWeek}-${hour}`;
    heatmap[key] = (heatmap[key] || 0) + 1;
  });

  // Convertir a formato para visualizacion
  const data = [];
  days.forEach((day, dayIndex) => {
    for (let hour = 0; hour < 24; hour++) {
      data.push({
        x: hour,
        y: dayIndex,
        value: heatmap[`${day}-${hour}`] || 0
      });
    }
  });

  return data;
}
```

### 5.3 Serie Temporal

```javascript
function generateTimeSeriesData(metrics) {
  // Ordenar fechas
  const dates = Object.keys(metrics.dailyDistribution).sort();

  // Calcular metricas acumuladas
  let cumulativeTotal = 0;
  let cumulativeSuccess = 0;

  const series = {
    labels: dates,
    datasets: {
      total: [],
      cumulative: [],
      successRate: []
    }
  };

  // Calcular success por dia (requiere datos adicionales)
  dates.forEach(date => {
    const count = metrics.dailyDistribution[date];
    cumulativeTotal += count;

    series.datasets.total.push(count);
    series.datasets.cumulative.push(cumulativeTotal);

    // Calcular tasa de exito del dia (aproximada)
    series.datasets.successRate.push(
      (metrics.successful / metrics.total * 100).toFixed(1)
    );
  });

  return series;
}
```

---

## 6. METRICAS DE EFECTIVIDAD

### 6.1 KPIs Principales

| KPI | Formula | Objetivo | Alerta |
|-----|---------|----------|--------|
| **Tasa de Exito** | `(exitosas / total) * 100` | > 95% | < 90% |
| **Tiempo Promedio** | `sum(duraciones) / total` | < 45s | > 60s |
| **Tiempo Mediano** | `mediana(duraciones)` | < 35s | > 50s |
| **Errores/Dia** | `errores / dias` | < 1 | > 3 |
| **Clientes Unicos** | `count(distinct contact_id)` | Creciente | Decreciente |
| **Engagement** | `interacciones / clientes` | > 5 | < 2 |
| **Retencion** | `clientes_recurrentes / total` | > 50% | < 30% |

### 6.2 Benchmarks de Industria

| Metrica | Agente WhatsApp Actual | Benchmark Industria | Evaluacion |
|---------|------------------------|---------------------|------------|
| Tasa de Exito | 97.6% | > 95% | Excelente |
| Tiempo Respuesta | 45.7s | < 30s | Mejorable |
| Error Rate | 2.4% | < 5% | Excelente |
| Engagement | 10.25 | > 5 | Excelente |

### 6.3 Calculadora de Efectividad

```javascript
function calculateEffectivenessScore(metrics) {
  const weights = {
    successRate: 0.35,      // 35% del score
    responseTime: 0.25,     // 25% del score
    engagement: 0.20,       // 20% del score
    errorHandling: 0.10,    // 10% del score
    reliability: 0.10       // 10% del score
  };

  // Calcular componentes (normalizados 0-100)
  const successRate = (metrics.successful / metrics.total) * 100;

  // Tiempo de respuesta (inverso, menor es mejor)
  // 0s = 100, 60s = 50, 120s+ = 0
  const responseTimeScore = Math.max(0, 100 - (metrics.averageDuration / 60) * 50);

  // Engagement
  const engagement = metrics.uniqueClients.length > 0
    ? Math.min(100, (metrics.total / metrics.uniqueClients.length) * 10)
    : 0;

  // Error handling (basado en recuperacion)
  const errorHandlingScore = metrics.failed > 0
    ? Math.max(0, 100 - (metrics.failed / metrics.total * 100 * 5))
    : 100;

  // Confiabilidad (consistencia)
  const stdDev = calculateStdDev(metrics.durations);
  const reliabilityScore = Math.max(0, 100 - (stdDev / metrics.averageDuration * 50));

  // Score final ponderado
  const finalScore =
    (successRate * weights.successRate) +
    (responseTimeScore * weights.responseTime) +
    (engagement * weights.engagement) +
    (errorHandlingScore * weights.errorHandling) +
    (reliabilityScore * weights.reliability);

  return {
    overall: finalScore.toFixed(1),
    components: {
      successRate: successRate.toFixed(1),
      responseTime: responseTimeScore.toFixed(1),
      engagement: engagement.toFixed(1),
      errorHandling: errorHandlingScore.toFixed(1),
      reliability: reliabilityScore.toFixed(1)
    },
    rating: getEffectivenessRating(finalScore)
  };
}

function getEffectivenessRating(score) {
  if (score >= 90) return { label: 'Excelente', color: '#10b981', emoji: 'star' };
  if (score >= 80) return { label: 'Muy Bueno', color: '#3b82f6', emoji: 'thumbs_up' };
  if (score >= 70) return { label: 'Bueno', color: '#f59e0b', emoji: 'ok_hand' };
  if (score >= 60) return { label: 'Aceptable', color: '#f97316', emoji: 'warning' };
  return { label: 'Necesita Mejoras', color: '#ef4444', emoji: 'x' };
}

function calculateStdDev(values) {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
}
```

---

## 7. ALERTAS Y RECOMENDACIONES AUTOMATICAS

### 7.1 Sistema de Alertas

```javascript
function generateAlerts(metrics) {
  const alerts = [];

  // Alerta: Tasa de error alta
  const errorRate = (metrics.failed / metrics.total) * 100;
  if (errorRate > 5) {
    alerts.push({
      severity: 'critical',
      type: 'error_rate',
      message: `Tasa de error alta: ${errorRate.toFixed(1)}% (umbral: 5%)`,
      action: 'Revisar logs de errores y nodos fallidos'
    });
  } else if (errorRate > 2) {
    alerts.push({
      severity: 'warning',
      type: 'error_rate',
      message: `Tasa de error moderada: ${errorRate.toFixed(1)}%`,
      action: 'Monitorear tendencia de errores'
    });
  }

  // Alerta: Tiempo de respuesta lento
  if (metrics.averageDuration > 60) {
    alerts.push({
      severity: 'warning',
      type: 'response_time',
      message: `Tiempo promedio alto: ${metrics.averageDuration.toFixed(1)}s`,
      action: 'Optimizar nodos lentos, revisar llamadas a APIs externas'
    });
  }

  // Alerta: Nodo problematico
  Object.entries(metrics.errorsByNode).forEach(([node, count]) => {
    if (count >= 3) {
      alerts.push({
        severity: 'critical',
        type: 'node_errors',
        message: `Nodo "${node}" con ${count} errores`,
        action: `Revisar configuracion y logica del nodo ${node}`
      });
    }
  });

  // Alerta: Caida de volumen
  const dates = Object.keys(metrics.dailyDistribution).sort();
  if (dates.length >= 2) {
    const lastDay = metrics.dailyDistribution[dates[dates.length - 1]];
    const prevDay = metrics.dailyDistribution[dates[dates.length - 2]];
    const dropPercent = ((prevDay - lastDay) / prevDay) * 100;

    if (dropPercent > 50) {
      alerts.push({
        severity: 'warning',
        type: 'volume_drop',
        message: `Caida de volumen: ${dropPercent.toFixed(0)}% respecto al dia anterior`,
        action: 'Verificar que el webhook este activo y funcionando'
      });
    }
  }

  return alerts;
}
```

### 7.2 Recomendaciones Automaticas

```javascript
function generateRecommendations(metrics) {
  const recommendations = [];

  // Analizar patrones y generar recomendaciones

  // 1. Optimizacion de tiempos
  if (metrics.averageDuration > 45) {
    const slowestNodes = Object.entries(metrics.nodeMetrics)
      .filter(([, data]) => data.avgTime > 1000) // > 1 segundo
      .sort(([,a], [,b]) => b.avgTime - a.avgTime)
      .slice(0, 3);

    recommendations.push({
      category: 'performance',
      priority: 'high',
      title: 'Optimizar Tiempo de Respuesta',
      description: 'El tiempo promedio es mayor a 45 segundos',
      actions: [
        `Revisar nodos lentos: ${slowestNodes.map(([n]) => n).join(', ')}`,
        'Implementar cache para consultas frecuentes',
        'Considerar procesamiento paralelo donde sea posible'
      ]
    });
  }

  // 2. Manejo de errores
  const topErrorNode = Object.entries(metrics.errorsByNode)
    .sort(([,a], [,b]) => b - a)[0];

  if (topErrorNode && topErrorNode[1] > 1) {
    recommendations.push({
      category: 'reliability',
      priority: 'critical',
      title: `Mejorar Manejo de Errores en "${topErrorNode[0]}"`,
      description: `${topErrorNode[1]} errores detectados en este nodo`,
      actions: [
        'Agregar validacion de datos antes del nodo',
        'Implementar retry logic con backoff exponencial',
        'Agregar fallback alternativo para casos de error'
      ]
    });
  }

  // 3. Engagement de clientes
  const avgInteractions = metrics.total / metrics.uniqueClients.length;
  if (avgInteractions < 5) {
    recommendations.push({
      category: 'engagement',
      priority: 'medium',
      title: 'Mejorar Engagement de Clientes',
      description: `Promedio de ${avgInteractions.toFixed(1)} interacciones por cliente`,
      actions: [
        'Revisar calidad de respuestas del agente IA',
        'Implementar seguimiento proactivo',
        'Agregar funcionalidades de valor (catalogo, promociones)'
      ]
    });
  }

  // 4. Monitoreo
  recommendations.push({
    category: 'monitoring',
    priority: 'medium',
    title: 'Implementar Monitoreo Continuo',
    description: 'Recomendacion estandar para produccion',
    actions: [
      'Configurar alertas automaticas para errores',
      'Implementar dashboard en tiempo real',
      'Programar reportes automaticos diarios/semanales'
    ]
  });

  return recommendations;
}
```

---

## 8. SCRIPT COMPLETO DE PIPELINE

### 8.1 Archivo Principal

```javascript
// pipeline_etl.cjs
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuracion
const config = {
  n8n: {
    apiUrl: 'https://[TU-INSTANCIA].easypanel.host/api/v1',
    apiKey: '[TU-API-KEY]',
    workflowId: '[WORKFLOW-ID]'
  },
  output: {
    dir: './output',
    jsonFile: 'analysis_results.json',
    htmlFile: 'dashboard.html',
    excelFile: 'report.xlsx'
  }
};

// Funciones de utilidad
// ... (incluir todas las funciones anteriores)

// Funcion principal del pipeline
async function runPipeline() {
  console.log('='.repeat(60));
  console.log('PIPELINE ETL - ANALISIS DE EFECTIVIDAD');
  console.log('='.repeat(60));
  console.log();

  try {
    // FASE 1: EXTRACT
    console.log('[1/4] EXTRACCION DE DATOS...');
    const executions = await extractExecutions();
    console.log(`     Extraidas ${executions.length} ejecuciones`);

    // FASE 2: TRANSFORM
    console.log('[2/4] TRANSFORMACION DE METRICAS...');
    const metrics = calculateMetrics(executions);
    console.log(`     ${metrics.successful} exitosas, ${metrics.failed} fallidas`);

    // Efectividad
    const effectiveness = calculateEffectivenessScore(metrics);
    console.log(`     Score de efectividad: ${effectiveness.overall}/100`);

    // Alertas
    const alerts = generateAlerts(metrics);
    console.log(`     ${alerts.length} alertas generadas`);

    // Recomendaciones
    const recommendations = generateRecommendations(metrics);
    console.log(`     ${recommendations.length} recomendaciones`);

    // FASE 3: LOAD
    console.log('[3/4] GENERANDO OUTPUTS...');

    // Crear directorio si no existe
    if (!fs.existsSync(config.output.dir)) {
      fs.mkdirSync(config.output.dir, { recursive: true });
    }

    // JSON
    const jsonPath = path.join(config.output.dir, config.output.jsonFile);
    exportToJSON(metrics, executions, {
      id: config.n8n.workflowId,
      name: 'Workflow Analizado',
      effectiveness,
      alerts,
      recommendations
    });
    console.log(`     JSON: ${jsonPath}`);

    // HTML Dashboard
    const htmlPath = path.join(config.output.dir, config.output.htmlFile);
    generateHTMLDashboard(metrics);
    console.log(`     HTML: ${htmlPath}`);

    // FASE 4: REPORTE
    console.log('[4/4] RESUMEN DEL ANALISIS');
    console.log();
    console.log('='.repeat(60));
    printSummary(metrics, effectiveness, alerts);
    console.log('='.repeat(60));

    console.log();
    console.log('Pipeline completado exitosamente!');

  } catch (error) {
    console.error('ERROR en pipeline:', error.message);
    process.exit(1);
  }
}

function printSummary(metrics, effectiveness, alerts) {
  console.log(`
METRICAS PRINCIPALES:
  Total Ejecuciones:     ${metrics.total}
  Tasa de Exito:         ${((metrics.successful/metrics.total)*100).toFixed(1)}%
  Tiempo Promedio:       ${metrics.averageDuration.toFixed(2)}s
  Clientes Unicos:       ${metrics.uniqueClients.length}
  Mensajes Procesados:   ${metrics.conversationMetrics.totalMessages}

SCORE DE EFECTIVIDAD:   ${effectiveness.overall}/100 (${effectiveness.rating.label})
  - Tasa de Exito:       ${effectiveness.components.successRate}
  - Tiempo Respuesta:    ${effectiveness.components.responseTime}
  - Engagement:          ${effectiveness.components.engagement}
  - Manejo de Errores:   ${effectiveness.components.errorHandling}
  - Confiabilidad:       ${effectiveness.components.reliability}

ALERTAS: ${alerts.length > 0 ? '' : 'Ninguna'}
${alerts.map(a => `  [${a.severity.toUpperCase()}] ${a.message}`).join('\n')}
`);
}

// Ejecutar pipeline
runPipeline();
```

---

## 9. AUTOMATIZACION

### 9.1 Programacion de Ejecucion

```bash
# Cron job (Linux/Mac) - Ejecutar cada hora
0 * * * * cd /path/to/project && node pipeline_etl.cjs >> logs/pipeline.log 2>&1

# Task Scheduler (Windows) - Script .bat
@echo off
cd D:\OneDrive\GitHub\colombia
node pipeline_etl.cjs >> logs\pipeline.log 2>&1
```

### 9.2 Integracion con n8n

Crear un workflow en n8n que ejecute el pipeline:

```
[Schedule Trigger] -> [Execute Command] -> [Send Notification]
     (cada 6h)         node pipeline_etl.cjs    (Email/Slack)
```

### 9.3 Notificaciones

```javascript
async function sendNotification(summary, channel = 'slack') {
  const message = {
    title: 'Reporte de Efectividad - Agente IA',
    text: `
*Score*: ${summary.effectiveness.overall}/100
*Tasa Exito*: ${summary.metrics.successRate}%
*Alertas*: ${summary.alerts.length}
    `,
    color: summary.effectiveness.overall >= 80 ? 'good' : 'warning'
  };

  // Enviar a Slack, Email, etc.
  await sendToSlack(message);
}
```

---

## 10. CHECKLIST DE IMPLEMENTACION

### 10.1 Pre-requisitos

- [ ] Acceso a instancia n8n (URL y API Key)
- [ ] Identificar Workflow ID a analizar
- [ ] Node.js instalado (v16+)
- [ ] Crear estructura de carpetas

### 10.2 Configuracion

- [ ] Crear archivo `config.js` con credenciales
- [ ] Probar conexion a API de n8n
- [ ] Definir periodo de analisis

### 10.3 Pipeline

- [ ] Implementar funciones de extraccion
- [ ] Implementar funciones de transformacion
- [ ] Implementar funciones de carga
- [ ] Probar pipeline completo

### 10.4 Visualizacion

- [ ] Generar dashboard HTML
- [ ] Verificar graficos funcionando
- [ ] Personalizar colores/branding

### 10.5 Automatizacion

- [ ] Configurar ejecucion programada
- [ ] Configurar notificaciones
- [ ] Documentar proceso

---

## 11. ARCHIVOS DE REFERENCIA

### Estructura de Proyecto

```
proyecto-analisis/
├── config.js                 # Configuracion
├── pipeline_etl.cjs          # Script principal
├── lib/
│   ├── extract.cjs           # Funciones de extraccion
│   ├── transform.cjs         # Funciones de transformacion
│   └── load.cjs              # Funciones de carga
├── output/
│   ├── analysis_results.json # Resultados JSON
│   ├── dashboard.html        # Dashboard HTML
│   └── report.xlsx           # Reporte Excel
├── logs/
│   └── pipeline.log          # Logs de ejecucion
└── docs/
    └── PIPELINE_ETL.md       # Este documento
```

### Archivos Generados

| Archivo | Formato | Contenido |
|---------|---------|-----------|
| `analysis_results.json` | JSON | Metricas completas, timeline, clientes |
| `dashboard.html` | HTML | Dashboard interactivo |
| `report.xlsx` | Excel | Resumen, distribucion, errores, clientes |

---

## 12. NOTAS FINALES

### Mantenimiento

- Revisar API key cada 30 dias
- Actualizar umbrales segun crecimiento
- Agregar nuevas metricas segun necesidad

### Escalabilidad

- Para > 1000 ejecuciones: implementar paginacion
- Para multiples workflows: parametrizar workflowId
- Para real-time: considerar WebSocket

### Mejoras Futuras

- Analisis de sentimiento en mensajes
- ML para prediccion de carga
- Comparativas periodo a periodo
- API REST para consultas

---

**Documento creado:** Diciembre 2025
**Basado en:** Implementacion real del Agente WhatsApp
**Workflow ID original:** efEmQrH78M3CiTNG
**Autor:** Claude Code

---

*Este documento es una guia completa para replicar el pipeline de analisis de efectividad en implementaciones similares de agentes de IA conversacionales.*
