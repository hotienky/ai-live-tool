const http = require('http');

const token = "KTTICMxbM13gyMwD6MbJY5gcS0cyXiRymyL3QzaoQrOsqxnaXRPilJuYgbkl2cro";
const endpoints = [
    '/api/booking/services',
    '/api/events/events',
    '/api/restaurant/tables',
    '/api/salon/services',
    '/api/lms/courses',
    '/api/forum/boards',
    '/api/jobboard/jobs',
    '/api/realestate/properties',
    '/api/lucky-draw/campaigns',
    '/api/membership/tiers'
];

async function checkApi(path) {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'tenant.cms.localhost',
            port: 80,
            path: path,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 500) {
                    console.error(`ERROR 500 on ${path}`);
                    console.error(data.substring(0, 500));
                    resolve(false);
                } else if (res.statusCode >= 400) {
                    console.warn(`WARN ${res.statusCode} on ${path}`);
                    resolve(true);
                } else {
                    console.log(`OK ${res.statusCode} on ${path}`);
                    resolve(true);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`Connection error on ${path}: ${e.message}`);
            resolve(false);
        });

        req.end();
    });
}

(async () => {
    let allOk = true;
    console.log("Starting API tests...");
    for (const path of endpoints) {
        const ok = await checkApi(path);
        if (!ok) allOk = false;
    }
    if (allOk) {
        console.log("ALL PLUGINS OK!");
    } else {
        console.log("SOME PLUGINS FAILED.");
    }
})();
