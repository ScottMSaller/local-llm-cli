# Guru CLI - Your Local LLM Command Line Interface 🧘‍♂️

A powerful command-line interface for interacting with LM Studio's local LLM server. Get instant AI responses right in your terminal with real-time token streaming and conversation memory.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14.0.0 or higher)
- [LM Studio](https://lmstudio.ai/) (latest version)
- npm (comes with Node.js)

## Installation

1. Clone this repository:
```bash
git clone https://github.com/ScottMSaller/local-llm-cli.git
cd local-llm-cli
```

2. Install dependencies:
```bash
npm install
```

3. Install globally:
```bash
npm install -g .
```

## Setting up LM Studio

1. Download and install LM Studio from [lmstudio.ai](https://lmstudio.ai/)
2. Launch LM Studio
3. Download a model of your choice (e.g., Mistral 7B, Llama 2)
4. In LM Studio:
   - Click on the "Local Server" tab
   - Select your model
   - Click "Start Server"
   - Ensure the server is running on port 1234 (default)

## Usage

### Quick Start
Simply type `guru` followed by your question:
```bash
guru tell me about meditation
```

### Interactive Mode
Launch the interactive mode by running `guru` without any arguments:
```bash
guru
```
In this mode, you can:
- Type your questions and get responses
- Use up/down arrows to access command history
- Maintain conversation context (the model remembers your chat)
- Type 'clear' to reset the conversation memory
- Type 'exit' to quit

### Conversation Memory

The CLI supports two modes of operation:

1. **Single Command Mode** (no memory):
```bash
guru tell me about meditation
```
Perfect for quick, one-off questions.

2. **Interactive Mode** (with conversation memory):
```bash
guru
```
Features:
- Maintains context throughout your conversation
- Model remembers previous questions and answers
- Allows for more natural, contextual conversations
- Type 'clear' to start a fresh conversation
- Memory persists until you exit or clear it

Example conversation:
```
You: Tell me about dogs
Bot: [responds about dogs]
You: What are their average lifespans?
Bot: [understands "their" refers to dogs and responds accordingly]
```

### Command Line Options

#### Temperature
Control the creativity/randomness of responses (0.0 to 2.0):
```bash
guru -t 0.9 tell me a creative story
```
- Lower values (e.g., 0.2): More focused and deterministic
- Higher values (e.g., 1.5): More creative and random
- Default: 0.7

#### Model Selection
Specify which model to use:
```bash
guru -m mistral-7b what is the meaning of life
```
Default: 'local-model'

#### Combining Options
You can combine multiple options:
```bash
guru -t 0.8 -m mistral-7b tell me a joke
```

## Troubleshooting

### Common Issues

1. **Connection Error**
   If you see "Cannot connect to LM Studio", ensure:
   - LM Studio is running
   - Server is started in LM Studio
   - Port 1234 is available and not blocked

2. **No Response**
   If the model isn't responding:
   - Check if your model is properly loaded in LM Studio
   - Restart the LM Studio server
   - Ensure you have sufficient RAM for your model

3. **Installation Issues**
   If `guru` command isn't recognized:
   - Try reinstalling globally: `npm install -g .`
   - Ensure your npm global binaries are in your PATH
   - Try running with npx: `npx guru`

## Contributing

Contributions are welcome! Feel free to:
- Open issues for bugs or feature requests
- Submit pull requests
- Suggest improvements to documentation

## License

MIT License - Feel free to use, modify, and distribute as you wish!

## Support

If you encounter any issues or need help:
- Open an issue on GitHub
- Check the troubleshooting section
- Ensure LM Studio is properly configured

## Acknowledgments

- Built for use with [LM Studio](https://lmstudio.ai/)
- Uses Node.js and various npm packages
- Inspired by the need for simple CLI access to local LLMs
