/**
 * HUANGCOM DASHBOARD - MODELO DE DATOS CENTRALIZADO
 * Base de datos de órdenes pagadas de MercadoLibre
 *
 * Fuente: API MercadoLibre - Órdenes con status "paid"
 * Período: Diciembre 2024 - Noviembre 2025 (12 meses)
 */

const HuangcomData = {
    // ==========================================
    // CONFIGURACIÓN
    // ==========================================
    config: {
        sellerId: 'HUANGCOM',
        currency: 'ARS',
        marketplace: 'MLA', // MercadoLibre Argentina
        dataSource: 'API MercadoLibre - Orders',
        lastUpdate: '2025-12-09',
        orderStatus: 'paid' // Solo órdenes pagadas
    },

    // ==========================================
    // ÓRDENES PAGADAS POR MES (12 meses)
    // ==========================================
    // Datos reales de órdenes con status "paid"
    paidOrders: {
        months: [
            { period: '2024-12', label: 'Dic 24', orders: 99,  revenue: 39100000 },
            { period: '2025-01', label: 'Ene 25', orders: 122, revenue: 45400000 },
            { period: '2025-02', label: 'Feb 25', orders: 98,  revenue: 29100000 },
            { period: '2025-03', label: 'Mar 25', orders: 90,  revenue: 34200000 },
            { period: '2025-04', label: 'Abr 25', orders: 89,  revenue: 40600000 },
            { period: '2025-05', label: 'May 25', orders: 94,  revenue: 39100000 },
            { period: '2025-06', label: 'Jun 25', orders: 82,  revenue: 29900000 },
            { period: '2025-07', label: 'Jul 25', orders: 64,  revenue: 22200000 },
            { period: '2025-08', label: 'Ago 25', orders: 67,  revenue: 27800000 },
            { period: '2025-09', label: 'Sep 25', orders: 48,  revenue: 17100000 },
            { period: '2025-10', label: 'Oct 25', orders: 71,  revenue: 27800000 },
            { period: '2025-11', label: 'Nov 25', orders: 73,  revenue: 26500000 }
        ],

        // Punto de implementación n8n
        implementationMonth: '2025-10',
        implementationLabel: 'Implementación n8n Workflows'
    },

    // ==========================================
    // MÉTRICAS CALCULADAS
    // ==========================================
    getMetrics: function() {
        const orders = this.paidOrders.months.map(m => m.orders);
        const revenues = this.paidOrders.months.map(m => m.revenue);

        const totalOrders = orders.reduce((a, b) => a + b, 0);
        const totalRevenue = revenues.reduce((a, b) => a + b, 0);
        const avgMonthlyOrders = Math.round(totalOrders / orders.length);
        const avgMonthlyRevenue = Math.round(totalRevenue / revenues.length);
        const bestMonthOrders = Math.max(...orders);
        const bestMonthIndex = orders.indexOf(bestMonthOrders);
        const bestMonthLabel = this.paidOrders.months[bestMonthIndex].label;

        // Métricas pre/post implementación
        const implIndex = this.paidOrders.months.findIndex(
            m => m.period === this.paidOrders.implementationMonth
        );
        const preImplOrders = orders.slice(0, implIndex);
        const postImplOrders = orders.slice(implIndex);

        const avgPreImpl = Math.round(preImplOrders.reduce((a, b) => a + b, 0) / preImplOrders.length);
        const avgPostImpl = Math.round(postImplOrders.reduce((a, b) => a + b, 0) / postImplOrders.length);

        // Tendencia pre-implementación (regresión lineal simple)
        const trendSlope = this.calculateTrendSlope(preImplOrders);

        return {
            totalOrders,
            totalRevenue,
            avgMonthlyOrders,
            avgMonthlyRevenue,
            bestMonthOrders,
            bestMonthLabel,
            avgPreImpl,
            avgPostImpl,
            trendSlope,
            implementationIndex: implIndex
        };
    },

    // Calcular pendiente de tendencia
    calculateTrendSlope: function(data) {
        const n = data.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += data[i];
            sumXY += i * data[i];
            sumX2 += i * i;
        }

        return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    },

    // Generar proyección de tendencia
    getTrendProjection: function() {
        const metrics = this.getMetrics();
        const orders = this.paidOrders.months.map(m => m.orders);
        const projection = [];

        // Proyectar basado en tendencia pre-implementación
        const startValue = orders[0];
        for (let i = 0; i < orders.length; i++) {
            projection.push(Math.round(startValue + (metrics.trendSlope * i)));
        }

        return projection;
    },

    // ==========================================
    // HELPERS PARA GRÁFICOS
    // ==========================================
    getChartData: function() {
        return {
            labels: this.paidOrders.months.map(m => m.label),
            orders: this.paidOrders.months.map(m => m.orders),
            revenue: this.paidOrders.months.map(m => m.revenue),
            revenueMillions: this.paidOrders.months.map(m => m.revenue / 1000000),
            trendProjection: this.getTrendProjection()
        };
    },

    // ==========================================
    // DATOS ADICIONALES DEL VENDEDOR
    // ==========================================
    seller: {
        name: 'Huangcom Group',
        level: 'MercadoLíder Silver',
        positiveRatings: 97,
        neutralRatings: 2,
        negativeRatings: 1,
        totalTransactions: 1106,
        completedSales: 1021,
        activeProducts: 357,
        claimRate: 0.61,
        cancelRate: 0,
        delayRate: 0,
        creditLevel: 'MLA1',
        registrationDate: '2018-06'
    }
};

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.HuangcomData = HuangcomData;
}
