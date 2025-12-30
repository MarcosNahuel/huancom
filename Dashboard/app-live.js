/**
 * HUANGCOM DASHBOARD - Live Data Version
 * Connects to backend API for real-time MercadoLibre data
 * Developed by TRAID Agency
 */

// API Base URL
const API_BASE = window.location.origin + '/api/meli';

// ==========================================
// DATA FETCHING
// ==========================================

const fetchMetrics = async () => {
    try {
        const response = await fetch(`${API_BASE}/metrics`);
        if (!response.ok) throw new Error('Failed to fetch metrics');
        return await response.json();
    } catch (error) {
        console.error('Error fetching metrics:', error);
        return null;
    }
};

const fetchOrders = async (limit = 20) => {
    try {
        const response = await fetch(`${API_BASE}/orders?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch orders');
        return await response.json();
    } catch (error) {
        console.error('Error fetching orders:', error);
        return null;
    }
};

// ==========================================
// UPDATE DASHBOARD
// ==========================================

const updateDashboard = async () => {
    const metrics = await fetchMetrics();

    if (!metrics) {
        console.error('Could not update dashboard - no data');
        return;
    }

    // Update KPIs
    const reputation = metrics.reputation;
    const transactions = reputation.transactions;

    // Update total sales
    const totalSalesEl = document.getElementById('totalSales');
    if (totalSalesEl) {
        animateCounter(totalSalesEl, transactions.completed);
    }

    // Update products count
    const productsCount = document.querySelector('.kpi-card.products .kpi-value');
    if (productsCount) {
        productsCount.textContent = metrics.stats.total_items.toLocaleString('es-AR');
    }

    // Update ratings chart
    if (window.ratingsChart) {
        const ratings = transactions.ratings;
        window.ratingsChart.data.datasets[0].data = [
            Math.round(ratings.positive * 100),
            Math.round(ratings.neutral * 100),
            Math.round(ratings.negative * 100)
        ];
        window.ratingsChart.update();
    }

    // Update seller metrics
    const metricsData = reputation.metrics;

    // Claims rate
    const claimsRate = metricsData.claims.rate * 100;
    const claimsEl = document.querySelector('.kpi-card.claims .kpi-value');
    if (claimsEl) {
        claimsEl.textContent = claimsRate.toFixed(2) + '%';
    }

    console.log('Dashboard updated with live data');
};

// ==========================================
// CHART CONFIGURATIONS (SAME AS STATIC VERSION)
// ==========================================

// Ratings Distribution Chart (Doughnut)
const ratingsCtx = document.getElementById('ratingsChart')?.getContext('2d');
if (ratingsCtx) {
    window.ratingsChart = new Chart(ratingsCtx, {
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
}

// Sales Performance Chart (Line)
const salesCtx = document.getElementById('salesChart')?.getContext('2d');
if (salesCtx) {
    // Generate mock data for last 60 days
    const generateSalesData = () => {
        const data = [];
        const labels = [];
        const baseValue = 2;

        for (let i = 60; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }));

            const randomFactor = Math.random() * 3;
            const weekendFactor = (date.getDay() === 0 || date.getDay() === 6) ? 0.7 : 1;
            data.push(Math.round((baseValue + randomFactor) * weekendFactor));
        }

        return { labels, data };
    };

    const salesData = generateSalesData();

    window.salesChart = new Chart(salesCtx, {
        type: 'line',
        data: {
            labels: salesData.labels,
            datasets: [{
                label: 'Ventas diarias',
                data: salesData.data,
                borderColor: '#3483FA',
                backgroundColor: 'rgba(52, 131, 250, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#3483FA',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 3
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
                    cornerRadius: 8
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
                            size: 11
                        },
                        color: '#999999',
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 8
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
                        stepSize: 1
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// ==========================================
// COUNTER ANIMATION
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

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Initial load with static data animation
    const totalSalesElement = document.getElementById('totalSales');
    if (totalSalesElement) {
        setTimeout(() => {
            animateCounter(totalSalesElement, 1021);
        }, 500);
    }

    // Try to fetch live data
    setTimeout(updateDashboard, 2000);

    // Auto-refresh every 5 minutes
    setInterval(updateDashboard, 300000);
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

document.querySelectorAll('.kpi-card, .chart-card, .metric-card, .product-card, .timeline-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    animateOnScroll.observe(el);
});

// Console messages
console.log('%c HUANGCOM Dashboard - Live Mode ', 'background: #00A650; color: white; font-size: 20px; padding: 10px 20px; border-radius: 5px;');
console.log('%c Developed by TRAID Agency ', 'background: #FFE600; color: #1A1A1A; font-size: 14px; padding: 5px 10px; border-radius: 3px;');
console.log('Dashboard initialized with live data connection');
