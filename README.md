# LootChest — On-Chain NFT Loot Box on Sui

A fully on-chain loot box dApp built on the **Sui blockchain**. Users open a mystical chest and receive a randomly tiered NFT — minted live on-chain, owned permanently in their wallet.

> Live on Sui Testnet · Provably fair · No backend · Open source

---

## Features

- Open a loot chest — one click mints a real Sui NFT to your wallet
- 3 reward tiers — Common (70%), Rare (25%), Epic (5%)
- Fully on-chain — randomness seeded from epoch + wallet address, no backend
- Explorer links — every mint links directly to Suiscan to verify your NFT
- Landing page — with smooth scroll, FAQ, How It Works, and reward tier breakdowns
- Custom wallet UI — connect/disconnect any Sui wallet with a styled dropdown
- Dark fantasy UI — gold glassmorphism theme, animated chest, floating particles

---

## Tech Stack

| Layer          | Technology                      |
|----------------|---------------------------------|
| Blockchain     | [Sui](https://sui.io) (Testnet) |
| Smart Contract | Move 2024                       |
| Frontend       | React + Vite                    |
| Wallet         | `@mysten/dapp-kit`              |
| Styling        | Pure CSS (no Tailwind)          |
| Fonts          | Cinzel Decorative + Rajdhani    |

---

## Project Structure

```
lootbox/
├── sources/
│   └── lootbox.move        # Smart contract (Move 2024)
├── frontend/
│   └── src/
│       ├── App.jsx          # Main dApp UI (mint NFT)
│       ├── App.css          # dApp styles
│       ├── Landing.jsx      # Landing page
│       ├── Landing.css      # Landing styles
│       └── main.jsx         # Root + Sui providers
├── Move.toml                # Move package config
├── Published.toml           # Deployed contract addresses
└── README.md
```

---

## Smart Contract

**Package address (Testnet):**
```
0xab43039b8c4d85bafe74267ba0da77d44aa2a16cdd679e5e5d1fb1d920c62304
```

### How it works

```move
public entry fun open_box(ctx: &mut TxContext) {
    // Seed = epoch + last byte of sender address
    let seed = (epoch + last_byte) % 100;

    // 0-69  -> Common NFT  (70%)
    // 70-94 -> Rare NFT    (25%)
    // 95-99 -> Epic NFT    (5%)
}
```

The contract:
1. Computes a pseudo-random seed from the Sui epoch and your wallet address
2. Determines the reward tier based on the seed
3. Mints a `LootNFT` object and transfers it directly to your wallet
4. Emits a `RewardEvent` so the frontend can read the result

### Structs

```move
public struct LootNFT has key {
    id: object::UID,
    name: vector<u8>,   // "Common NFT" | "Rare NFT" | "Epic NFT"
}

public struct RewardEvent has copy, drop {
    reward: u8          // 1 = Common, 2 = Rare, 3 = Epic
}
```

---

## Getting Started

### Prerequisites

- [Sui CLI](https://docs.sui.io/guides/developer/getting-started/sui-install) installed
- [Node.js](https://nodejs.org) v18+
- A Sui-compatible wallet browser extension (Sui Wallet, Martian, etc.)
- Testnet SUI tokens from the [faucet](https://faucet.sui.io)

---

### 1. Clone the repo

```bash
git clone https://github.com/your-username/lootbox.git
cd lootbox
```

### 2. Set up environment variables

```bash
cd frontend
cp .env.example .env
```

Fill in your values — see the Environment Variables section below.

### 3. Deploy the smart contract

```bash
# Switch to testnet
sui client switch --env testnet

# Publish
sui client publish --gas-budget 100000000
```

Copy the PackageID from the output and set it in your `.env` file:

```
VITE_PACKAGE_ID=0xYOUR_PACKAGE_ID
```

### 4. Run the frontend

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Environment Variables

Create a `.env` file inside the `frontend/` directory. A `.env.example` file is included as a template.

| Variable              | Required | Description                                      |
|-----------------------|----------|--------------------------------------------------|
| `VITE_PACKAGE_ID`     | Yes      | Your deployed Move package address               |
| `VITE_NETWORK`        | Yes      | Sui network — `testnet`, `devnet`, or `mainnet`  |
| `VITE_RPC_URL`        | No       | Custom RPC endpoint (defaults to public testnet) |
| `VITE_APP_NAME`       | No       | App name shown in wallet connection prompt       |

Example `.env`:

```env
VITE_PACKAGE_ID=0xab43039b8c4d85bafe74267ba0da77d44aa2a16cdd679e5e5d1fb1d920c62304
VITE_NETWORK=testnet
VITE_RPC_URL=https://fullnode.testnet.sui.io:443
VITE_APP_NAME=LootChest
```

> Never commit your `.env` or `.env.local` files. They are already listed in `.gitignore`.

---

## Configuration

| File                    | What to update                                  |
|-------------------------|-------------------------------------------------|
| `frontend/.env`         | Package ID, network, RPC URL                    |
| `frontend/src/App.jsx`  | `PACKAGE` constant if not using env vars        |
| `Move.toml`             | `authors` field — your name or GitHub username  |
| `Published.toml`        | Auto-generated after publish — commit this file |

---

## How to Use

1. Go to the landing page and click Launch App
2. Click Connect Wallet and select your Sui wallet
3. Make sure you have testnet SUI from [faucet.sui.io](https://faucet.sui.io)
4. Click Mint NFT
5. Approve the transaction in your wallet
6. Your NFT card appears with a direct link to view it on Suiscan

---

## Reward Tiers

| Tier   | Drop Rate | NFT Name   |
|--------|-----------|------------|
| Common | 70%       | Common NFT |
| Rare   | 25%       | Rare NFT   |
| Epic   | 5%        | Epic NFT   |

---

## Limitations and Known Constraints

- **Pseudo-randomness** — The seed uses `epoch + wallet address byte`. This is not cryptographically secure. On mainnet, use [Sui on-chain randomness](https://docs.sui.io/guides/developer/advanced/randomness-onchain) (`sui::random`) instead.
- **Testnet only** — Do not use real funds.
- **NFT metadata** — The NFT currently only stores a name field. No image URI, traits, or display standards yet.
- **Same seed per epoch** — Users with the same wallet last byte will receive the same tier within the same epoch.

---

## Roadmap

- [ ] Use `sui::random` for true on-chain randomness
- [ ] Add image URIs and full NFT metadata
- [ ] Sui Kiosk compatibility for trading
- [ ] NFT collection viewer ("My Loot")
- [ ] Mainnet deployment
- [ ] Rarity traits and on-chain attributes

---

## License

MIT — see [LICENSE](./LICENSE) for details.

---

## Built With

- [Sui Blockchain](https://sui.io)
- [Mysten dapp-kit](https://sdk.mystenlabs.com/dapp-kit)
- [Suiscan Explorer](https://suiscan.xyz)
