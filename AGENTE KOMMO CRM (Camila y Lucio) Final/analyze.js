const fs = require('fs');
const data = JSON.parse(fs.readFileSync('D:/OneDrive/GitHub/huancom/AGENTE KOMMO CRM (Camila y Lucio) Final/logs/workflow_principal_executions.json', 'utf8'));
const inner = JSON.parse(data[0].text);

// Analyze node execution times
const nodeStats = {};

inner.forEach(e => {
    if (e.data && e.data.resultData && e.data.resultData.runData) {
        Object.entries(e.data.resultData.runData).forEach(([node, runs]) => {
            if (runs && runs[0]) {
                const run = runs[0];
                const time = run.executionTime || 0;
                if (!nodeStats[node]) {
                    nodeStats[node] = {times: [], errors: 0, total: 0};
                }
                nodeStats[node].times.push(time);
                nodeStats[node].total++;
                if (run.executionStatus !== 'success') nodeStats[node].errors++;
            }
        });
    }
});

console.log('=== NODE PERFORMANCE ANALYSIS ===');
Object.entries(nodeStats)
    .map(([name, stats]) => {
        const avg = stats.times.reduce((a,b)=>a+b,0) / stats.times.length;
        const max = Math.max(...stats.times);
        return {name, avg, max, total: stats.total, errors: stats.errors};
    })
    .sort((a,b) => b.avg - a.avg)
    .forEach(s => {
        console.log(s.name);
        console.log('  Avg:', (s.avg/1000).toFixed(2), 'sec | Max:', (s.max/1000).toFixed(2), 'sec | Runs:', s.total, '| Errors:', s.errors);
    });

// Find AI Agent performance
console.log('\n=== AI AGENT NODES DETAIL ===');
const aiNodes = Object.entries(nodeStats).filter(([name]) =>
    name.includes('Agent') || name.includes('Gemini') || name.includes('OpenAI') || name.includes('model')
);
aiNodes.forEach(([name, stats]) => {
    const sorted = [...stats.times].sort((a,b) => b-a);
    console.log(name);
    console.log('  Top 5 slowest:', sorted.slice(0,5).map(t => (t/1000).toFixed(1)+'s').join(', '));
});

// Analyze Wait node usage
console.log('\n=== WAIT NODE ANALYSIS ===');
if (nodeStats['Wait']) {
    console.log('Wait node executions:', nodeStats['Wait'].total);
    console.log('This adds 15 seconds delay per execution (configured in workflow)');
}

// Check for Redis operations
console.log('\n=== REDIS OPERATIONS ===');
Object.entries(nodeStats).filter(([name]) => name.includes('Redis')).forEach(([name, stats]) => {
    console.log(name, '- Runs:', stats.total, '| Avg:', (stats.times.reduce((a,b)=>a+b,0)/stats.times.length).toFixed(0), 'ms');
});
