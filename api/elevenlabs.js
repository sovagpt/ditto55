// ElevenLabs Voice Integration
class VoiceAgent {
    constructor() {
        this.conversation = null;
        this.status = 'disconnected';
        this.isSpeaking = false;
        this.initializeUI();
    }

    initializeUI() {
        this.updateStatus(this.status);
        this.updateAgentState();
    }

    updateStatus(status) {
        this.status = status;
        const statusElement = document.getElementById('voiceStatus');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    updateAgentState() {
        const stateElement = document.getElementById('agentState');
        if (stateElement) {
            stateElement.textContent = this.isSpeaking ? 'speaking' : 'listening';
        }
    }

    async initialize() {
        try {
            const { useConversation } = await import('@11labs/react');
            
            this.conversation = useConversation({
                onConnect: () => {
                    console.log('Connected');
                    this.updateStatus('connected');
                },
                onDisconnect: () => {
                    console.log('Disconnected');
                    this.updateStatus('disconnected');
                },
                onMessage: (message) => {
                    console.log('Message:', message);
                    this.isSpeaking = true;
                    this.updateAgentState();
                    addMessage(message.text, 'assistant');
                },
                onError: (error) => {
                    console.error('Error:', error);
                    addMessage('Sorry, I encountered a voice error. Please try again. ~', 'assistant');
                }
            });
        } catch (error) {
            console.error('Failed to initialize voice agent:', error);
        }
    }

    async startConversation() {
        try {
            // Request microphone permission
            await navigator.mediaDevices.getUserMedia({ audio: true });

            // Start the conversation with your agent
            await this.conversation.startSession({
                agentId: 'YOUR_AGENT_ID', // Replace with your actual agent ID
            });

            this.isSpeaking = false;
            this.updateAgentState();
            addMessage('Voice chat started. You can speak now. ~', 'assistant');
        } catch (error) {
            console.error('Failed to start conversation:', error);
            addMessage('Failed to start voice conversation. Please try again. ~', 'assistant');
        }
    }

    async stopConversation() {
        try {
            await this.conversation.endSession();
            this.updateStatus('disconnected');
            addMessage('Voice chat ended. ~', 'assistant');
        } catch (error) {
            console.error('Failed to stop conversation:', error);
        }
    }
}

// Initialize voice agent when the page loads
let voiceAgent;
document.addEventListener('DOMContentLoaded', async () => {
    voiceAgent = new VoiceAgent();
    await voiceAgent.initialize();
});

// Make functions available globally
window.startConversation = () => voiceAgent.startConversation();
window.stopConversation = () => voiceAgent.stopConversation();