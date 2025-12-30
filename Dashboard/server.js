/**
 * HUANGCOM DASHBOARD - Backend Server
 * MercadoLibre API Integration
 * Developed by TRAID Agency
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ==========================================
// MERCADOLIBRE CREDENTIALS
// ==========================================

const MELI_CONFIG = {
    clientId: '1479055899419707',
    clientSecret: 'Qx8l5JJtL2oGGPGTyfcGIVXAkCVcQcii',
    redirectUri: 'https://juan-n8n.zfis90.easypanel.host/webhook/meli',
    userId: '331914355'
};

// Token storage (in production, use a database)
let tokenData = {
    accessToken: null,
    refreshToken: 'TG-6937fa4658144500017685e7-331914355',
    expiresAt: null
};

const TOKEN_FILE = path.join(__dirname, 'token.json');

// Load saved token on startup
const loadToken = () => {
    try {
        if (fs.existsSync(TOKEN_FILE)) {
            const data = fs.readFileSync(TOKEN_FILE, 'utf8');
            tokenData = JSON.parse(data);
            console.log('Token loaded from file');
        }
    } catch (error) {
        console.error('Error loading token:', error.message);
    }
};

// Save token to file
const saveToken = () => {
    try {
        fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenData, null, 2));
        console.log('Token saved to file');
    } catch (error) {
        console.error('Error saving token:', error.message);
    }
};

loadToken();

// ==========================================
// TOKEN REFRESH LOGIC
// ==========================================

const refreshAccessToken = async () => {
    try {
        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: MELI_CONFIG.clientId,
            client_secret: MELI_CONFIG.clientSecret,
            refresh_token: tokenData.refreshToken
        });

        const response = await fetch('https://api.mercadolibre.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: params
        });

        if (!response.ok) {
            throw new Error(`Token refresh failed: ${response.status}`);
        }

        const data = await response.json();

        tokenData = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: Date.now() + (data.expires_in * 1000)
        };

        saveToken();
        console.log('Token refreshed successfully');
        return tokenData.accessToken;

    } catch (error) {
        console.error('Error refreshing token:', error.message);
        throw error;
    }
};

// Get valid access token
const getAccessToken = async () => {
    // Check if token is expired or will expire in 5 minutes
    const isExpired = !tokenData.accessToken ||
        !tokenData.expiresAt ||
        Date.now() >= (tokenData.expiresAt - 300000);

    if (isExpired) {
        return await refreshAccessToken();
    }

    return tokenData.accessToken;
};

// Auto-refresh token every 5 hours
setInterval(async () => {
    try {
        await refreshAccessToken();
    } catch (error) {
        console.error('Auto-refresh failed:', error.message);
    }
}, 5 * 60 * 60 * 1000);

// ==========================================
// MERCADOLIBRE API HELPERS
// ==========================================

const meliRequest = async (endpoint) => {
    const token = await getAccessToken();

    const response = await fetch(`https://api.mercadolibre.com${endpoint}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
};

// ==========================================
// API ROUTES
// ==========================================

// Get user profile
app.get('/api/meli/user', async (req, res) => {
    try {
        const data = await meliRequest(`/users/${MELI_CONFIG.userId}`);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get seller reputation
app.get('/api/meli/reputation', async (req, res) => {
    try {
        const user = await meliRequest(`/users/${MELI_CONFIG.userId}`);
        res.json({
            level_id: user.seller_reputation.level_id,
            power_seller_status: user.seller_reputation.power_seller_status,
            transactions: user.seller_reputation.transactions,
            metrics: user.seller_reputation.metrics
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get items/products
app.get('/api/meli/items', async (req, res) => {
    try {
        const limit = req.query.limit || 50;
        const offset = req.query.offset || 0;

        const data = await meliRequest(
            `/users/${MELI_CONFIG.userId}/items/search?limit=${limit}&offset=${offset}`
        );
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get item details
app.get('/api/meli/items/:id', async (req, res) => {
    try {
        const data = await meliRequest(`/items/${req.params.id}`);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get orders
app.get('/api/meli/orders', async (req, res) => {
    try {
        const status = req.query.status || 'paid';
        const limit = req.query.limit || 50;

        const data = await meliRequest(
            `/orders/search?seller=${MELI_CONFIG.userId}&order.status=${status}&limit=${limit}`
        );
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all metrics (combined endpoint)
app.get('/api/meli/metrics', async (req, res) => {
    try {
        const [user, items, orders] = await Promise.all([
            meliRequest(`/users/${MELI_CONFIG.userId}`),
            meliRequest(`/users/${MELI_CONFIG.userId}/items/search?limit=1`),
            meliRequest(`/orders/search?seller=${MELI_CONFIG.userId}&order.status=paid&limit=1`)
        ]);

        res.json({
            user: {
                id: user.id,
                nickname: user.nickname,
                registration_date: user.registration_date,
                permalink: user.permalink,
                thumbnail: user.thumbnail?.picture_url
            },
            reputation: {
                level_id: user.seller_reputation.level_id,
                power_seller_status: user.seller_reputation.power_seller_status,
                transactions: user.seller_reputation.transactions,
                metrics: user.seller_reputation.metrics
            },
            stats: {
                total_items: items.paging.total,
                total_orders: orders.paging?.total || 0
            },
            company: {
                brand_name: user.company?.brand_name,
                corporate_name: user.company?.corporate_name
            },
            tags: user.tags
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        tokenStatus: tokenData.accessToken ? 'valid' : 'needs_refresh',
        tokenExpiresAt: tokenData.expiresAt ? new Date(tokenData.expiresAt).toISOString() : null
    });
});

// Serve dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, async () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 HUANGCOM Dashboard Server                             ║
║   📊 MercadoLibre API Integration                          ║
║   🏢 Developed by TRAID Agency                             ║
║                                                            ║
║   Server running at: http://localhost:${PORT}                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);

    // Initial token refresh on startup
    try {
        await refreshAccessToken();
        console.log('✅ Initial token refresh successful');
    } catch (error) {
        console.error('⚠️ Initial token refresh failed:', error.message);
    }
});
