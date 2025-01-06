const { MongoClient } = require('mongodb');

let cachedDb = null;

async function connectToDatabase(uri) {
    if (cachedDb) return cachedDb;
    const client = await MongoClient.connect(uri);
    const db = client.db('dittoai');
    cachedDb = db;
    return db;
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { modelUrl, prompt, timestamp } = req.body;
        const db = await connectToDatabase(process.env.MONGODB_URI);
        const result = await db.collection('models').insertOne({
            modelUrl,
            prompt,
            timestamp,
            createdAt: new Date()
        });
        res.status(200).json({ success: true, id: result.insertedId });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}