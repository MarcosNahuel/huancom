/**
 * HUANGCOM - Gráfico de Análisis de Impacto
 * Serie Temporal de Ventas con Punto de Implementación
 *
 * Usa el modelo de datos centralizado (data-model.js)
 * Fuente: API MercadoLibre - Órdenes con status "paid"
 */

// Los datos vienen del modelo centralizado HuangcomData
// Este objeto mantiene compatibilidad con el código existente
const salesAnalysisData = {
    get implementationDate() {
        return HuangcomData.paidOrders.implementationMonth;
    },
    get implementationLabel() {
        return HuangcomData.paidOrders.implementationLabel;
    },
    get months() {
        return HuangcomData.paidOrders.months.map(m => m.period);
    },
    get orders() {
        return HuangcomData.paidOrders.months.map(m => m.orders);
    },
    get revenue() {
        return HuangcomData.paidOrders.months.map(m => m.revenue / 1000000);
    },
    get trendProjected() {
        return HuangcomData.getTrendProjection();
    },
    get metrics() {
        const m = HuangcomData.getMetrics();
        const orders = this.orders;
        const implIdx = m.implementationIndex;

        // Calcular rebote de octubre vs septiembre
        const sepOrders = orders[implIdx - 1] || 1;
        const octOrders = orders[implIdx] || 0;
        const reboundOct = ((octOrders - sepOrders) / sepOrders * 100);

        // Órdenes recuperadas vs proyección
        const projected = this.trendProjected;
        let ordersRecovered = 0;
        for (let i = implIdx; i < orders.length; i++) {
            ordersRecovered += orders[i] - projected[i];
        }

        // Revenue recuperado (estimado)
        const avgTicket = m.totalRevenue / m.totalOrders;
        const revenueRecovered = ordersRecovered * avgTicket / 1000000;

        return {
            avgBefore: m.avgPreImpl,
            avgAfter: m.avgPostImpl,
            trendBefore: m.trendSlope,
            reboundOct: reboundOct,
            ordersRecovered: ordersRecovered,
            revenueRecovered: revenueRecovered
        };
    }
};

// Crear gráfico cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    createSalesAnalysisChart();
});

function createSalesAnalysisChart() {
    const ctx = document.getElementById('salesAnalysisChart');
    if (!ctx) return;

    // Encontrar índice de implementación
    const implIndex = salesAnalysisData.months.indexOf(salesAnalysisData.implementationDate);

    // Configuración del gráfico
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: salesAnalysisData.months.map(m => {
                const [year, month] = m.split('-');
                const monthNames = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                return `${monthNames[parseInt(month)]} ${year.slice(2)}`;
            }),
            datasets: [
                {
                    label: 'Órdenes Reales',
                    data: salesAnalysisData.orders,
                    borderColor: '#3483FA',
                    backgroundColor: 'rgba(52, 131, 250, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 6,
                    pointBackgroundColor: salesAnalysisData.orders.map((_, i) =>
                        i >= implIndex ? '#00A650' : '#3483FA'
                    ),
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 8
                },
                {
                    label: 'Tendencia Proyectada (sin implementación)',
                    data: salesAnalysisData.trendProjected,
                    borderColor: '#F23D4F',
                    borderWidth: 2,
                    borderDash: [8, 4],
                    fill: false,
                    tension: 0,
                    pointRadius: 0,
                    pointHoverRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            family: 'Inter',
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: '#1A1A1A',
                    titleFont: { family: 'Inter', size: 14, weight: '600' },
                    bodyFont: { family: 'Inter', size: 13 },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        afterBody: function(context) {
                            const dataIndex = context[0].dataIndex;
                            if (dataIndex >= implIndex) {
                                const real = salesAnalysisData.orders[dataIndex];
                                const projected = salesAnalysisData.trendProjected[dataIndex];
                                const diff = real - projected;
                                return `\nDiferencia vs proyección: +${diff} órdenes`;
                            }
                            return '';
                        }
                    }
                },
                annotation: {
                    annotations: {
                        implementationLine: {
                            type: 'line',
                            xMin: implIndex,
                            xMax: implIndex,
                            borderColor: '#00A650',
                            borderWidth: 3,
                            borderDash: [6, 6],
                            label: {
                                display: true,
                                content: '🚀 Implementación n8n',
                                position: 'start',
                                backgroundColor: '#00A650',
                                color: '#ffffff',
                                font: {
                                    family: 'Inter',
                                    size: 11,
                                    weight: '600'
                                },
                                padding: 6,
                                cornerRadius: 4
                            }
                        },
                        recoveryZone: {
                            type: 'box',
                            xMin: implIndex,
                            xMax: salesAnalysisData.months.length - 1,
                            backgroundColor: 'rgba(0, 166, 80, 0.05)',
                            borderWidth: 0
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: { family: 'Inter', size: 11 },
                        color: '#666666'
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 140,
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        font: { family: 'Inter', size: 11 },
                        color: '#666666',
                        callback: function(value) {
                            return value + ' órd.';
                        }
                    }
                }
            }
        },
        plugins: [{
            id: 'customAnnotation',
            afterDraw: function(chart) {
                const ctx = chart.ctx;
                const xScale = chart.scales.x;
                const yScale = chart.scales.y;

                // Dibujar línea de implementación
                const x = xScale.getPixelForValue(implIndex);

                ctx.save();
                ctx.beginPath();
                ctx.setLineDash([6, 6]);
                ctx.strokeStyle = '#00A650';
                ctx.lineWidth = 2;
                ctx.moveTo(x, yScale.top);
                ctx.lineTo(x, yScale.bottom);
                ctx.stroke();

                // Etiqueta de implementación
                ctx.fillStyle = '#00A650';
                ctx.font = 'bold 11px Inter';
                ctx.textAlign = 'center';
                ctx.fillText('🚀 Implementación', x, yScale.top - 25);
                ctx.fillText('n8n Workflows', x, yScale.top - 10);

                ctx.restore();
            }
        }]
    });
}

// Función para actualizar métricas en el DOM
function updateImpactMetrics() {
    const metrics = salesAnalysisData.metrics;

    // Actualizar elementos si existen
    const elements = {
        'impact-rebound': `+${metrics.reboundOct.toFixed(1)}%`,
        'impact-orders': `+${metrics.ordersRecovered}`,
        'impact-revenue': `$${metrics.revenueRecovered.toFixed(1)}M`
    };

    Object.entries(elements).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });
}

// Exportar para uso en otros scripts
if (typeof module !== 'undefined') {
    module.exports = { salesAnalysisData };
}
