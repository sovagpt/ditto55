export default async function handler(req, res) {
    const url = req.query.url;
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const fetchOptions = {
        method: req.method,
        headers: {
            'Authorization': `Bearer ${process.env.MESHY_API_KEY}`,
            'Accept': 'model/gltf-binary'
        }
    };

    if (req.method === 'POST') {
        fetchOptions.headers['Content-Type'] = 'application/json';
        fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    try {
        const response = await fetch(url, fetchOptions);
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        res.setHeader('Content-Type', contentType || 'model/gltf-binary');
        
        if (contentType?.includes('application/json')) {
            const data = await response.json();
            res.json(data);
        } else {
            const buffer = await response.arrayBuffer();
            res.send(Buffer.from(buffer));
        }
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: error.message });
    }
}