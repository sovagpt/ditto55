const { MongoClient } = require('mongodb');

// Initialize MongoDB connection
let cachedDb = null;

async function connectToDatabase(uri) {
    if (cachedDb) return cachedDb;

    const client = await MongoClient.connect(uri);
    const db = client.db('dittoai');
    cachedDb = db;
    return db;
}

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const db = await connectToDatabase(process.env.MONGODB_URI);

        if (req.method === 'POST' && req.url === '/api/community/add') {
            const { modelUrl, prompt, timestamp } = req.body;
            
            const result = await db.collection('models').insertOne({
                modelUrl,
                prompt,
                timestamp,
                createdAt: new Date()
            });

            res.status(200).json({ success: true, id: result.insertedId });
        } 
        else if (req.method === 'GET' && req.url === '/api/community/models') {
            const models = await db.collection('models')
                .find()
                .sort({ createdAt: -1 })
                .toArray();

            res.status(200).json(models);
        } 
        else {
            res.status(404).json({ error: 'Not found' });
        }
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}