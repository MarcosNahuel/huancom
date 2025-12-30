/**
 * HUANGCOM DASHBOARD - TRAID AGENCY
 * Interactive Dashboard for MercadoLibre Success Case
 */

// ==========================================
// CHART CONFIGURATIONS
// ==========================================

// Ratings Distribution Chart (Doughnut)
const ratingsCtx = document.getElementById('ratingsChart').getContext('2d');
const ratingsChart = new Chart(ratingsCtx, {
    type: 'doughnut',
    data: {
        labels: ['Positivas', 'Neutrales', 'Negativas'],
        datasets: [{
            data: [97, 2, 1],
            backgroundColor: [
                '#00A650',
                '#FF7733',
                '#F23D4F'
            ],
            borderColor: '#ffffff',
            borderWidth: 4,
            hoverOffset: 10
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: '#1A1A1A',
                titleFont: {
                    family: 'Inter',
                    size: 14,
                    weight: '600'
                },
                bodyFont: {
                    family: 'Inter',
                    size: 13
                },
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: function(context) {
                        return context.label + ': ' + context.parsed + '%';
                    }
                }
            }
        },
        animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1500,
            easing: 'easeOutQuart'
        }
    }
});

// Sales Performance Chart (Bar) - Órdenes Pagadas 12 meses
// Usa datos del modelo centralizado (data-model.js)
const salesCtx = document.getElementById('salesChart').getContext('2d');

// Obtener datos del modelo centralizado
const chartData = HuangcomData.getChartData();
const metrics = HuangcomData.getMetrics();

// Actualizar elementos del resumen
document.getElementById('totalYearOrders').textContent = metrics.totalOrders.toLocaleString('es-AR');
document.getElementById('avgMonthlyOrders').textContent = metrics.avgMonthlyOrders.toLocaleString('es-AR');
document.getElementById('bestMonth').textContent = `${metrics.bestMonthOrders} (${metrics.bestMonthLabel})`;

const salesChart = new Chart(salesCtx, {
    type: 'bar',
    data: {
        labels: chartData.labels,
        datasets: [{
            label: 'Órdenes pagadas',
            data: chartData.orders,
            backgroundColor: chartData.orders.map((val, idx) => {
                // Destacar el mejor mes en dorado
                if (val === metrics.bestMonthOrders) return '#FFD700';
                // Post-implementación en verde
                if (idx >= metrics.implementationIndex) return 'rgba(0, 166, 80, 0.7)';
                // Pre-implementación en azul
                return 'rgba(52, 131, 250, 0.7)';
            }),
            borderColor: chartData.orders.map((val, idx) => {
                if (val === metrics.bestMonthOrders) return '#FFA500';
                if (idx >= metrics.implementationIndex) return '#00A650';
                return '#3483FA';
            }),
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false
        }]
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
                display: false
            },
            tooltip: {
                backgroundColor: '#1A1A1A',
                titleFont: {
                    family: 'Inter',
                    size: 14,
                    weight: '600'
                },
                bodyFont: {
                    family: 'Inter',
                    size: 13
                },
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: function(context) {
                        const value = context.parsed.y;
                        const idx = context.dataIndex;
                        const isBest = value === metrics.bestMonthOrders;
                        const isPostImpl = idx >= metrics.implementationIndex;

                        let label = `Órdenes pagadas: ${value}`;
                        if (isBest) label += ' ⭐ Mejor mes';
                        if (isPostImpl) label += ' (post n8n)';
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                display: true,
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        family: 'Inter',
                        size: 10
                    },
                    color: '#999999',
                    maxRotation: 45,
                    minRotation: 45
                }
            },
            y: {
                display: true,
                beginAtZero: true,
                grid: {
                    color: 'rgba(0,0,0,0.05)',
                    drawBorder: false
                },
                ticks: {
                    font: {
                        family: 'Inter',
                        size: 11
                    },
                    color: '#999999',
                    stepSize: 20
                }
            }
        },
        animation: {
            duration: 2000,
            easing: 'easeOutQuart'
        }
    }
});

// ==========================================
// COUNTER ANIMATIONS
// ==========================================

const animateCounter = (element, target, duration = 2000) => {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current).toLocaleString('es-AR');
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target.toLocaleString('es-AR');
        }
    };

    updateCounter();
};

// Animate main stat on page load
document.addEventListener('DOMContentLoaded', () => {
    const totalSalesElement = document.getElementById('totalSales');
    if (totalSalesElement) {
        setTimeout(() => {
            animateCounter(totalSalesElement, 1021);
        }, 500);
    }
});

// ==========================================
// INTERSECTION OBSERVER FOR ANIMATIONS
// ==========================================

const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -50px 0px'
};

const animateOnScroll = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Apply observer to animated elements
document.querySelectorAll('.kpi-card, .chart-card, .metric-card, .product-card, .timeline-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    animateOnScroll.observe(el);
});

// ==========================================
// DYNAMIC DATA REFRESH (SIMULATED)
// ==========================================

// This would connect to the real API in production
const refreshData = async () => {
    console.log('Dashboard data refresh triggered');

    // In production, this would fetch from:
    // const response = await fetch('/api/meli/metrics');
    // const data = await response.json();

    // Update charts and KPIs with new data
};

// Auto-refresh every 5 minutes (in production)
// setInterval(refreshData, 300000);

// ==========================================
// SMOOTH SCROLL FOR INTERNAL LINKS
// ==========================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ==========================================
// TOOLTIP INITIALIZATION
// ==========================================

const initTooltips = () => {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(el => {
        el.addEventListener('mouseenter', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = e.target.dataset.tooltip;
            tooltip.style.cssText = `
                position: absolute;
                background: #1A1A1A;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-family: Inter, sans-serif;
                z-index: 1000;
                pointer-events: none;
                transform: translateY(-100%);
                margin-top: -10px;
            `;
            document.body.appendChild(tooltip);

            const rect = e.target.getBoundingClientRect();
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = rect.top + window.scrollY + 'px';

            e.target._tooltip = tooltip;
        });

        el.addEventListener('mouseleave', (e) => {
            if (e.target._tooltip) {
                e.target._tooltip.remove();
            }
        });
    });
};

initTooltips();

// ==========================================
// CONSOLE WELCOME MESSAGE
// ==========================================

console.log('%c HUANGCOM Dashboard ', 'background: #3483FA; color: white; font-size: 20px; padding: 10px 20px; border-radius: 5px;');
console.log('%c Developed by TRAID Agency ', 'background: #FFE600; color: #1A1A1A; font-size: 14px; padding: 5px 10px; border-radius: 3px;');
console.log('Dashboard initialized successfully');
