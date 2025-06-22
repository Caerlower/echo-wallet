# EchoWallet 🤖 AI-Powered Telegram Wallet Assistant

EchoWallet is an intelligent Telegram bot designed to provide instant, comprehensive insights into any wallet on the **Base blockchain**. Powered by the **Nodit Web3 Data API** and **Perplexity AI**, EchoWallet allows users to fetch transaction histories, view detailed portfolio breakdowns, and receive AI-driven analysis of wallet activity, all within a simple conversational interface.

![EchoWallet Demo](https://i.imgur.com/example.png) <!-- Replace with a real screenshot -->

---

## ✨ Features

-   **Comprehensive Wallet Insights:** Get a full overview of any wallet, including transaction counts, native ETH and token transfers, and net flow.
-   **Last 10 Transactions:** Instantly fetch the last 10 transactions (both native ETH and ERC-20 tokens), complete with values, direction, and direct links to BaseScan.
-   **Detailed Portfolio Analysis:** View a complete portfolio breakdown, including the total USD value and a list of all held assets, with prices powered exclusively by Nodit's Data API.
-   **AI-Powered Analysis:** Leverage the power of Perplexity AI to receive a human-readable analysis of a wallet's activity, including patterns, risk assessment, and actionable suggestions.
-   **ENS Name Resolution:** Simply provide an ENS name (e.g., `vitalik.eth`) and EchoWallet will automatically resolve it to the corresponding wallet address.
-   **Interactive Interface:** Use intuitive buttons to navigate through transaction history, get detailed insights, or request an AI analysis.
-   **Transaction Search:** Use the `/search` command to perform a simple keyword search on a wallet's recent transaction history.

---

## 🛠️ Technologies Used

-   **Backend:** Node.js
-   **Blockchain Data:** Nodit Web3 Data API
-   **AI Analysis:** Perplexity AI
-   **Telegram Integration:** `node-telegram-bot-api`
-   **Environment Management:** `dotenv`

---

## 🚀 Getting Started

Follow these instructions to get a local copy of EchoWallet up and running.

### Prerequisites

-   Node.js (v18.x or later)
-   npm
-   Git

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/echo-wallet.git
    cd echo-wallet
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file:
    ```sh
    cp env.example .env
    ```

4.  **Configure your `.env` file:**
    Open the `.env` file and add your API keys and configuration details:

    ```env
    # Telegram Bot Token from BotFather
    TELEGRAM_TOKEN=YOUR_TELEGRAM_BOT_TOKEN

    # Nodit API Key for Web3 data
    NODIT_API_KEY=YOUR_NODIT_API_KEY

    # (Optional) Perplexity API Key for AI analysis
    PERPLEXITY_API_KEY=YOUR_PERPLEXITY_API_KEY

    # Nodit RPC URL for the Base blockchain
    BASE_RPC_URL=https://base-mainnet.nodit.io/YOUR_NODIT_API_KEY
    ```

---

## Usage

### Running the Bot

Once your `.env` file is configured, you can start the bot with:

```sh
npm start
```

### How to Interact with the Bot

1.  **Start a conversation:** Find your bot on Telegram and send `/start`.
2.  **Query a wallet:** Send any wallet address or ENS name to the bot.
    -   `0x750094b9263860508f2b4cf3eaa867f344167f1e`
    -   `caerlower.eth`
3.  **Use Interactive Buttons:** After receiving the initial analysis, use the buttons to:
    -   **Transaction History:** View the last 10 transactions in detail.
    -   **Detailed Insights:** Refresh the main insights view.
    -   **Get AI Analysis:** Receive a human-readable summary from Perplexity AI.
4.  **Search Transactions:** Use the `/search` command to find specific transactions.
    ```
    /search <wallet_address> <your_query>
    ```
    *Example:* `/search 0x750094b9263860508f2b4cf3eaa867f1e sent USDC`

---

## 🤝 Contributing

Contributions are welcome! If you have suggestions or want to improve the bot, feel free to fork the repo and submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.