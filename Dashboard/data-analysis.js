/**
 * HUANGCOM - Análisis Científico de Datos
 * Estudio de Impacto de Implementación de Workflows
 *
 * Metodología: Análisis de series temporales con identificación de punto de intervención
 */

const fs = require('fs');

// Configuración
const MELI_CONFIG = {
    clientId: '1479055899419707',
    clientSecret: 'Qx8l5JJtL2oGGPGTyfcGIVXAkCVcQcii',
    refreshToken: 'TG-6937fa4658144500017685e7-331914355',
    userId: '331914355'
};

let accessToken = null;

// ==========================================
// FUNCIONES DE API
// ==========================================

async function refreshToken() {
    const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: MELI_CONFIG.clientId,
        client_secret: MELI_CONFIG.clientSecret,
        refresh_token: MELI_CONFIG.refreshToken
    });

    const response = await fetch('https://api.mercadolibre.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });

    const data = await response.json();
    accessToken = data.access_token;

    // Actualizar refresh token para próximas llamadas
    MELI_CONFIG.refreshToken = data.refresh_token;

    console.log('✅ Token obtenido correctamente');
    return accessToken;
}

async function fetchOrders(offset = 0, limit = 50) {
    const url = `https://api.mercadolibre.com/orders/search?seller=${MELI_CONFIG.userId}&order.status=paid&sort=date_desc&offset=${offset}&limit=${limit}`;

    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    return response.json();
}

async function getAllOrders() {
    console.log('\n📊 Descargando dataset completo de órdenes...\n');

    let allOrders = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
        const data = await fetchOrders(offset, limit);

        if (data.results && data.results.length > 0) {
            allOrders = allOrders.concat(data.results);
            console.log(`   Descargadas ${allOrders.length} órdenes...`);
            offset += limit;

            // Limitar a órdenes del último año
            const oldestOrder = new Date(data.results[data.results.length - 1].date_created);
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            if (oldestOrder < oneYearAgo || data.results.length < limit) {
                hasMore = false;
            }

            // Pequeña pausa para no saturar la API
            await new Promise(resolve => setTimeout(resolve, 200));
        } else {
            hasMore = false;
        }
    }

    console.log(`\n✅ Total de órdenes descargadas: ${allOrders.length}\n`);
    return allOrders;
}

// ==========================================
// ANÁLISIS ESTADÍSTICO
// ==========================================

function analyzeOrders(orders) {
    console.log('═'.repeat(60));
    console.log('📈 ANÁLISIS CIENTÍFICO DE DATOS - HUANGCOM GROUP');
    console.log('═'.repeat(60));

    // Filtrar solo órdenes del último año
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const yearOrders = orders.filter(order =>
        new Date(order.date_created) >= oneYearAgo
    );

    console.log(`\n📅 Período de análisis: ${oneYearAgo.toISOString().split('T')[0]} - ${new Date().toISOString().split('T')[0]}`);
    console.log(`📦 Total de órdenes en el período: ${yearOrders.length}`);

    // Agrupar por mes
    const monthlyData = {};
    const dailyData = {};

    yearOrders.forEach(order => {
        const date = new Date(order.date_created);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const dayKey = date.toISOString().split('T')[0];

        // Datos mensuales
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                orders: 0,
                revenue: 0,
                items: 0
            };
        }
        monthlyData[monthKey].orders++;
        monthlyData[monthKey].revenue += order.total_amount || 0;
        monthlyData[monthKey].items += order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

        // Datos diarios
        if (!dailyData[dayKey]) {
            dailyData[dayKey] = { orders: 0, revenue: 0 };
        }
        dailyData[dayKey].orders++;
        dailyData[dayKey].revenue += order.total_amount || 0;
    });

    // Ordenar meses
    const sortedMonths = Object.keys(monthlyData).sort();

    console.log('\n' + '─'.repeat(60));
    console.log('📊 VENTAS MENSUALES (Últimos 12 meses)');
    console.log('─'.repeat(60));
    console.log('\nMes         | Órdenes | Ingresos (ARS)    | Items');
    console.log('─'.repeat(60));

    let totalRevenue = 0;
    let totalOrders = 0;
    let totalItems = 0;

    sortedMonths.forEach(month => {
        const data = monthlyData[month];
        totalRevenue += data.revenue;
        totalOrders += data.orders;
        totalItems += data.items;

        const revenueFormatted = data.revenue.toLocaleString('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0
        });

        console.log(`${month}    |   ${String(data.orders).padStart(3)}   | ${revenueFormatted.padStart(17)} |  ${data.items}`);
    });

    console.log('─'.repeat(60));
    console.log(`TOTAL       |   ${String(totalOrders).padStart(3)}   | ${totalRevenue.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).padStart(17)} |  ${totalItems}`);

    // ==========================================
    // IDENTIFICACIÓN DEL PUNTO DE IMPLEMENTACIÓN
    // ==========================================

    // Hipótesis: La implementación de n8n workflows comenzó cuando se detecta
    // un cambio significativo en el patrón de ventas

    console.log('\n' + '═'.repeat(60));
    console.log('🔬 ANÁLISIS DE PUNTO DE INTERVENCIÓN');
    console.log('═'.repeat(60));

    // Calcular promedio móvil y detectar cambios
    const monthlyOrdersArray = sortedMonths.map(m => ({
        month: m,
        orders: monthlyData[m].orders,
        revenue: monthlyData[m].revenue
    }));

    // Buscar el punto de mayor cambio porcentual positivo
    let maxGrowthPoint = null;
    let maxGrowthRate = 0;

    for (let i = 1; i < monthlyOrdersArray.length; i++) {
        const prev = monthlyOrdersArray[i - 1].orders;
        const curr = monthlyOrdersArray[i].orders;

        if (prev > 0) {
            const growthRate = ((curr - prev) / prev) * 100;
            if (growthRate > maxGrowthRate) {
                maxGrowthRate = growthRate;
                maxGrowthPoint = monthlyOrdersArray[i].month;
            }
        }
    }

    // Para este análisis, asumimos que la implementación de workflows
    // comenzó aproximadamente en Octubre 2024 basándonos en la estructura del workflow
    const implementationDate = '2024-10';

    console.log(`\n📌 Fecha estimada de implementación de workflows: ${implementationDate}`);
    console.log(`📈 Punto de mayor crecimiento detectado: ${maxGrowthPoint} (+${maxGrowthRate.toFixed(1)}%)`);

    // ==========================================
    // ANÁLISIS ANTES VS DESPUÉS
    // ==========================================

    console.log('\n' + '─'.repeat(60));
    console.log('📊 COMPARATIVA: ANTES vs DESPUÉS DE IMPLEMENTACIÓN');
    console.log('─'.repeat(60));

    const beforeImpl = monthlyOrdersArray.filter(m => m.month < implementationDate);
    const afterImpl = monthlyOrdersArray.filter(m => m.month >= implementationDate);

    const avgOrdersBefore = beforeImpl.length > 0
        ? beforeImpl.reduce((sum, m) => sum + m.orders, 0) / beforeImpl.length
        : 0;
    const avgOrdersAfter = afterImpl.length > 0
        ? afterImpl.reduce((sum, m) => sum + m.orders, 0) / afterImpl.length
        : 0;

    const avgRevenueBefore = beforeImpl.length > 0
        ? beforeImpl.reduce((sum, m) => sum + m.revenue, 0) / beforeImpl.length
        : 0;
    const avgRevenueAfter = afterImpl.length > 0
        ? afterImpl.reduce((sum, m) => sum + m.revenue, 0) / afterImpl.length
        : 0;

    const orderGrowth = avgOrdersBefore > 0
        ? ((avgOrdersAfter - avgOrdersBefore) / avgOrdersBefore) * 100
        : 0;
    const revenueGrowth = avgRevenueBefore > 0
        ? ((avgRevenueAfter - avgRevenueBefore) / avgRevenueBefore) * 100
        : 0;

    console.log(`\n                     | ANTES (${beforeImpl.length} meses) | DESPUÉS (${afterImpl.length} meses) | CAMBIO`);
    console.log('─'.repeat(60));
    console.log(`Promedio órdenes/mes |      ${avgOrdersBefore.toFixed(1).padStart(6)}      |       ${avgOrdersAfter.toFixed(1).padStart(6)}       | ${orderGrowth >= 0 ? '+' : ''}${orderGrowth.toFixed(1)}%`);
    console.log(`Promedio ingresos/mes| ${avgRevenueBefore.toLocaleString('es-AR', {maximumFractionDigits: 0}).padStart(12)} | ${avgRevenueAfter.toLocaleString('es-AR', {maximumFractionDigits: 0}).padStart(13)} | ${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`);

    // ==========================================
    // CONCLUSIONES
    // ==========================================

    console.log('\n' + '═'.repeat(60));
    console.log('📋 CONCLUSIONES DEL ANÁLISIS');
    console.log('═'.repeat(60));

    console.log(`
🎯 HALLAZGOS PRINCIPALES:

1. Volumen de Ventas:
   • Total órdenes analizadas: ${totalOrders}
   • Facturación total: ${totalRevenue.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })}
   • Ticket promedio: ${(totalRevenue / totalOrders).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })}

2. Impacto de la Implementación:
   • Crecimiento en órdenes: ${orderGrowth >= 0 ? '+' : ''}${orderGrowth.toFixed(1)}%
   • Crecimiento en ingresos: ${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%
   • Órdenes adicionales estimadas/mes: ${(avgOrdersAfter - avgOrdersBefore).toFixed(1)}

3. ROI Estimado:
   • Ingresos adicionales/mes: ${(avgRevenueAfter - avgRevenueBefore).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })}
`);

    // Guardar datos para el dashboard
    const analysisData = {
        generatedAt: new Date().toISOString(),
        period: {
            start: oneYearAgo.toISOString(),
            end: new Date().toISOString()
        },
        implementationDate,
        summary: {
            totalOrders,
            totalRevenue,
            totalItems,
            avgTicket: totalRevenue / totalOrders
        },
        monthlyData: sortedMonths.map(m => ({
            month: m,
            ...monthlyData[m]
        })),
        dailyData: Object.keys(dailyData).sort().map(d => ({
            date: d,
            ...dailyData[d]
        })),
        impact: {
            avgOrdersBefore,
            avgOrdersAfter,
            avgRevenueBefore,
            avgRevenueAfter,
            orderGrowthPercent: orderGrowth,
            revenueGrowthPercent: revenueGrowth
        }
    };

    fs.writeFileSync(
        'D:/OneDrive/GitHub/huancom/Dashboard/analysis-data.json',
        JSON.stringify(analysisData, null, 2)
    );

    console.log('\n💾 Datos guardados en: analysis-data.json');

    return analysisData;
}

// ==========================================
// EJECUCIÓN PRINCIPAL
// ==========================================

async function main() {
    try {
        console.log('\n🚀 Iniciando análisis científico de datos...\n');

        // Obtener token
        await refreshToken();

        // Descargar órdenes
        const orders = await getAllOrders();

        // Analizar datos
        const analysis = analyzeOrders(orders);

        console.log('\n✅ Análisis completado exitosamente\n');

    } catch (error) {
        console.error('❌ Error en el análisis:', error.message);
        process.exit(1);
    }
}

main();
