# 🎁 LootChest — On-Chain NFT Loot Box on Sui

> Open a mystical chest. Receive a provably fair NFT. Own it forever — on the Sui blockchain.

**Live on Sui Testnet · True On-Chain Randomness (sui::random) · 0.01 SUI per open · Open Source**

---

## ✨ Features

| Feature | Details |
|---|---|
| 🎲 **True randomness** | Uses `sui::random` — Sui's native VRF, cryptographically unpredictable every TX |
| 💎 **3 NFT tiers** | Common (70%), Rare (25%), Epic (5%) |
| ⛓ **Fully on-chain** | No backend, no admin keys, every result verifiable on Sui Explorer |
| 💰 **Pay-to-play** | 0.01 SUI per chest — sent directly to treasury via smart contract |
| 🎉 **Reveal modal** | Animated reveal with confetti, sound effects, and tier-glow |
| 🔊 **Sound effects** | Web Audio API — different melody per tier, no audio files needed |
| ⏳ **Cooldown timer** | 8-second spam prevention with animated drain bar |
| 🎒 **My Collection** | Fetches all your LootChest NFTs from the blockchain with live stats |
| 🌐 **Landing page** | Scroll-reveal animations, floating reward chips, FAQ, How It Works |
| 📱 **Responsive** | Works on desktop and mobile |

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Blockchain | [Sui](https://sui.io) Testnet |
| Smart Contract | Move 2024 (`sui::random`, `sui::coin`) |
| Frontend | React 18 + Vite |
| Wallet | `@mysten/dapp-kit` |
| Styling | Pure CSS — no Tailwind |
| Fonts | Cinzel Decorative + Rajdhani (Google Fonts) |
| Audio | Web Audio API (zero files) |

---

## 📁 Project Structure

```
lootbox/
├── sources/
│   └── lootbox.move          # Smart contract
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # dApp — mint, reveal modal, collection
│   │   ├── App.css            # dApp styles
│   │   ├── Landing.jsx        # Marketing landing page
│   │   ├── Landing.css        # Landing styles
│   │   └── main.jsx           # Root + Sui providers + routing
│   ├── .env                   # Your package ID (not committed)
│   └── .env.example           # Template
├── Move.toml                  # Move package config
├── Published.toml             # Deployed contract addresses
└── README.md
```

---

## 📜 Smart Contract

**Package address (Testnet):**
```
0x71c83839cc6f3595b971b26dab8415fdf64b1d811c3b4500d01400d734ee677e
```

### Core logic

```move
public entry fun open_box(
    payment: Coin<SUI>,   // 0.01 SUI required
    r: &Random,           // Sui's on-chain VRF — object 0x8
    ctx: &mut TxContext
) {
    // 1. Verify payment >= 0.01 SUI (10_000_000 MIST)
    assert!(coin::value(&payment) >= PRICE_MIST, EInsufficientPayment);

    // 2. Split exact price → treasury, return change to sender
    let treasury_coin = coin::split(&mut payment, PRICE_MIST, ctx);
    transfer::public_transfer(treasury_coin, TREASURY);

    // 3. Roll true random 0–99 via sui::random VRF
    let mut generator = new_generator(r, ctx);
    let roll = generator.generate_u8_in_range(0, 99);

    // 4. Assign tier: 0–69 = Common, 70–94 = Rare, 95–99 = Epic
    let tier = if (roll < 70) { 1 } else if (roll < 95) { 2 } else { 3 };

    // 5. Mint LootNFT with name + image_url + tier → sender's wallet
    // 6. Emit RewardEvent
}
```

### Structs

```move
public struct LootNFT has key {
    id: object::UID,
    name: vector<u8>,       // "Common NFT" | "Rare NFT" | "Epic NFT"
    image_url: vector<u8>,  // Hosted image URL
    tier: u8,               // 1 | 2 | 3
}

public struct RewardEvent has copy, drop {
    reward: u8,    // tier number
    player: address,
}
```

---

## 🚀 Getting Started

### Prerequisites

- [Sui CLI](https://docs.sui.io/guides/developer/getting-started/sui-install) installed
- Node.js v18+
- A Sui wallet browser extension (Sui Wallet, Martian, etc.)
- Testnet SUI from the [faucet](https://faucet.sui.io)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/lootbox.git
cd lootbox
```

### 2. Deploy the contract

```bash
# Switch to testnet
sui client switch --env testnet

# Deploy
sui client publish --gas-budget 100000000
```

Copy the **PackageID** from the output.

### 3. Configure frontend

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```
VITE_PACKAGE_ID=0xYOUR_NEW_PACKAGE_ID
VITE_NETWORK=testnet
VITE_RPC_URL=https://fullnode.testnet.sui.io:443
```

### 4. Run the frontend

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🎮 How to Play

1. Go to the landing page → click **Launch App**
2. Click **Connect Wallet** → select your Sui wallet
3. Make sure you have testnet SUI ([faucet.sui.io](https://faucet.sui.io))
4. Click **⚡ Mint NFT — 0.01 SUI**
5. Approve the transaction in your wallet
6. Watch the chest shake and open — your NFT reveal modal appears with confetti and sound!
7. Click **🔍 View NFT** to see your NFT on Suiscan
8. Switch to **🎒 My Collection** to see all your LootChest NFTs

---

## 🔮 Reward Tiers

| Tier | Emoji | Drop Rate | Name |
|---|---|---|---|
| Common | 🎁 | 70% | Common NFT |
| Rare | 💎 | 25% | Rare NFT |
| Epic | 🔥 | 5% | Epic NFT |

---

## 🎲 Why sui::random?

The old approach used `epoch + wallet address byte` as a seed — this gave the **same result all day** for users with the same wallet byte, and was trivially predictable.

`sui::random` uses Sui's native **Verifiable Random Function (VRF)** — an on-chain shared object at address `0x8` that is updated every epoch with a distributed key generation protocol. When combined with your transaction data via `new_generator(r, ctx)`, it produces a result that is:

- ✅ Different every single transaction
- ✅ Cryptographically unpredictable
- ✅ Impossible to manipulate (not even the contract deployer can influence it)
- ✅ Fully verifiable on-chain

---

## 🔧 Customising

| What | Where | How |
|---|---|---|
| Price | `lootbox.move` | Change `PRICE_MIST` (1 SUI = 1_000_000_000 MIST) |
| Treasury | `lootbox.move` | Change `TREASURY` address constant |
| Drop rates | `lootbox.move` | Change the `roll < 70` / `roll < 95` thresholds |
| NFT images | `lootbox.move` | Replace the `image_url` strings with your IPFS CIDs |
| Cooldown | `App.jsx` | Change the `COOLDOWN` constant (seconds) |
| Package ID | `frontend/.env` | Update `VITE_PACKAGE_ID` after each publish |

---

## ⚠️ Known Limitations

- **Testnet only** — Do not use real funds. Contract is on Sui Testnet.
- **Placeholder images** — NFT images use `placehold.co`. Replace with real IPFS images.
- **Basic NFT metadata** — No `display` standard, no traits. Suiscan may not render the image automatically.
- **Pseudo-treasury** — The treasury address is hardcoded. For production, use a multisig or DAO.

---

## 🗺 Roadmap

- [ ] Upload real NFT artwork to IPFS (Pinata)
- [ ] Implement Sui `display` standard for proper NFT metadata
- [ ] Kiosk compatibility for trading on Sui marketplaces
- [ ] "My Collection" rarity stats and filters
- [ ] Mainnet deployment
- [ ] Multiple chest types with different prices and odds

---

## 📄 License

MIT — see [LICENSE](./LICENSE)

---

## 🙏 Built With

- [Sui Blockchain](https://sui.io) — Move smart contracts + sui::random
- [Mysten dapp-kit](https://sdk.mystenlabs.com/dapp-kit) — wallet integration
- [Suiscan](https://suiscan.xyz) — explorer links
- Web Audio API — sound effects without any audio files
