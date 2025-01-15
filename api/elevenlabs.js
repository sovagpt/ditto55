const { Client } = require('@11labs/sdk');

// Initialize ElevenLabs client
const client = new Client(process.env.ELEVENLABS_API_KEY);
let activeConversation = null;

async function handleAudioStream(audioStream) {
    if (!activeConversation) return;
    try {
        const response = await activeConversation.sendAudio(audioStream);
        return response;
    } catch (error) {
        console.error('Error processing audio:', error);
        throw error;
    }
}

module.exports = async function (req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { action, audioData } = req.body;

        switch (action) {
            case 'start':
                if (activeConversation) {
                    await activeConversation.stop();
                }

                activeConversation = await client.startConversation({
                    agentId: process.env.ELEVENLABS_AGENT_ID,
                    createParams: {
                        displayName: "DittoAI",
                        description: "A friendly AI assistant specializing in 3D modeling",
                        initialMessage: "Hello! I'm DittoAI. How can I help you today?",
                    },
                    onMessage: async (message) => {
                        // Handle incoming messages from the AI
                        console.log('AI Response:', message);
                        // You can implement WebSocket here to send messages to the client
                        return message;
                    },
                    onError: (error) => {
                        console.error('Conversation error:', error);
                        throw error;
                    }
                });

                return res.status(200).json({ 
                    status: 'started',
                    message: 'Voice conversation started successfully' 
                });

            case 'stop':
                if (activeConversation) {
                    await activeConversation.stop();
                    activeConversation = null;
                }
                return res.status(200).json({ 
                    status: 'stopped',
                    message: 'Voice conversation stopped successfully' 
                });

            case 'speak':
                if (!audioData) {
                    return res.status(400).json({ error: 'No audio data provided' });
                }
                if (!activeConversation) {
                    return res.status(400).json({ error: 'No active conversation' });
                }
                
                const response = await handleAudioStream(audioData);
                return res.status(200).json(response);

            case 'status':
                return res.status(200).json({ 
                    status: activeConversation ? 'active' : 'inactive' 
                });

            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('ElevenLabs error:', error);
        return res.status(500).json({ 
            error: 'Voice processing failed', 
            details: error.message 
        });
    }
};