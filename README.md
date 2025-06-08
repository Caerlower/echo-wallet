# EchoWallet – AI Wallet Assistant for Base Chain

## Overview

**EchoWallet** is a conversational wallet assistant for the Base blockchain, delivered through Telegram. The project’s goal is to make Web3 wallet monitoring and insights accessible to everyone—especially non-technical users—by combining the power of Nodit’s Web3 Data API and AI tooling with a simple chat interface.

---

## Features

- Accepts Ethereum wallet addresses or ENS names via Telegram
- Fetches and summarizes recent wallet activity on the Base chain using Nodit’s Web3 Data API
- Validates user input and handles errors gracefully
- Modular codebase designed for easy extension
- Planned AI-powered natural language queries and real-time wallet alerts

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- Telegram account (to create and use a bot)
- Nodit API key ([get one here](https://developer.nodit.io/))
- (Optional) OpenAI API key for future AI features

### Installation

1. **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/wallet-assistant-bot.git
    cd wallet-assistant-bot
    ```

2. **Install dependencies**
    ```bash
    npm install
    ```

3. **Configure environment variables**

    Create a `.env` file in the root directory:
    ```
    TELEGRAM_TOKEN=your_telegram_bot_token
    NODIT_API_KEY=your_nodit_api_key
    OPENAI_API_KEY=your_openai_api_key   # Optional
    ```

4. **Run the bot**
    ```bash
    node bot/index.js
    ```

---

## Usage

- Start a chat with your Telegram bot.
- Send your Base chain wallet address (0x...) or ENS name (e.g., vitalik.eth).
- Receive a summary of your recent wallet activity in the chat.

---

## Project Structure

```
wallet-assistant-bot/
├── bot/                # Telegram bot logic
├── services/           # Nodit API integration
├── mcp/                # AI/MCP integration (planned)
├── prompts/            # AI prompt templates (planned)
├── .env
├── package.json
├── README.md
```

---

## Technologies Used

- Node.js
- node-telegram-bot-api
- Nodit Web3 Data API
- Nodit Model Context Protocol (MCP) (planned)
- OpenAI API (planned)
- dotenv
- axios

---

## Roadmap

- [ ] AI-powered, natural language wallet queries
- [ ] Real-time transaction and NFT alerts
- [ ] Multi-chain support
- [ ] Enhanced conversational UX
- [ ] Open source contributions and community features

---

## Contributing

Contributions are welcome!  
Feel free to open issues or submit pull requests for improvements, bug fixes, or new features.

---

## License

This project is licensed under the MIT License.

---

For questions or support, please open an issue on this repository.
