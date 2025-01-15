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
        console.log('Processing request...');

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
            throw new Error(await claudeResponse.text());
        }

        const claudeData = await claudeResponse.json();
        const fullText = claudeData.content[0].text;
        console.log('Claude response received');
        
        // Extract text without codeblocks for voice
        const textToSpeak = fullText.split(/```[\s\S]*?```/).join(' ').trim();
        console.log('Text to speak:', textToSpeak);

        // Only generate voice if there's text to speak
        if (textToSpeak) {
            console.log('Generating voice with ElevenLabs...');
            // Use your custom voice ID
            const VOICE_ID = 'jBpfuIE2acCO8z3wKNLl';
            
            const voiceResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': process.env.ELEVENLABS_API_KEY
                },
                body: JSON.stringify({
                    text: textToSpeak,
                    model_id: 'eleven_monolingual_v1',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                        style: 0.66,
                        use_speaker_boost: true
                    }
                })
            });

            if (!voiceResponse.ok) {
                const voiceErrorText = await voiceResponse.text();
                console.error('ElevenLabs API error:', voiceErrorText);
                return res.status(200).json(claudeData);
            }

            console.log('Voice generated successfully');
            const audioBuffer = await voiceResponse.arrayBuffer();
            const audioBase64 = Buffer.from(audioBuffer).toString('base64');
            console.log('Audio data length:', audioBase64.length);

            return res.status(200).json({
                ...claudeData,
                audio: audioBase64
            });
        } else {
            console.log('No text to speak, returning text-only response');
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