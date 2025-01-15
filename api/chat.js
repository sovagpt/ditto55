export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { message, systemPrompt } = req.body;

        console.log('Received request:', { message, systemPrompt });

        // Get Claude's response
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-beta': 'messages-2023-12-15'
            },
            body: JSON.stringify({
                model: 'claude-3-opus-20240229',
                messages: [{
                    role: 'user',
                    content: message
                }],
                system: systemPrompt,
                max_tokens: 1000,
                temperature: 0.7
            })
        });

        if (!claudeResponse.ok) {
            const errorText = await claudeResponse.text();
            console.error('Claude API error:', errorText);
            throw new Error(`Claude API error: ${errorText}`);
        }

        const claudeData = await claudeResponse.json();
        console.log('Claude response received');

        try {
            // Generate voice using ElevenLabs
            const voiceResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}/stream`, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': process.env.ELEVENLABS_API_KEY
                },
                body: JSON.stringify({
                    text: claudeData.content[0].text,
                    model_id: 'eleven_monolingual_v1',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                        style: 0.0,
                        use_speaker_boost: true
                    }
                })
            });

            if (!voiceResponse.ok) {
                const voiceErrorText = await voiceResponse.text();
                console.error('ElevenLabs API error:', voiceErrorText);
                // If voice fails, still return the text response
                return res.status(200).json(claudeData);
            }

            const audioBuffer = await voiceResponse.arrayBuffer();
            const audioBase64 = Buffer.from(audioBuffer).toString('base64');

            // Send both text and audio response
            return res.status(200).json({
                ...claudeData,
                audio: audioBase64
            });
        } catch (voiceError) {
            console.error('Voice generation error:', voiceError);
            // If voice generation fails, still return the text response
            return res.status(200).json(claudeData);
        }
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: error.message,
            stack: error.stack 
        });
    }
}