module lootbox::lootbox {

    use sui::event;
    use sui::object;
    use sui::transfer;
    use sui::tx_context::TxContext;
    use sui::random::{Random, new_generator};

    public struct RewardEvent has copy, drop {
        reward: u8
    }

    public struct LootNFT has key {
        id: object::UID,
        name: vector<u8>,
        image_url: vector<u8>,
        tier: u8,
    }

    /// `r` is Sui's on-chain Random object — always at address 0x8
    /// It gives a different result every single transaction, for every user
    public entry fun open_box(r: &Random, ctx: &mut TxContext) {
        // Create a generator seeded from Sui's on-chain randomness
        let mut generator = new_generator(r, ctx);

        // Roll 0–99
        let roll = generator.generate_u8_in_range(0, 99);

        // 70% Common, 25% Rare, 5% Epic
        let tier: u8 = if (roll < 70) { 1 }
            else if (roll < 95) { 2 }
            else { 3 };

        let name: vector<u8> = if (tier == 1) { b"Common NFT" }
            else if (tier == 2) { b"Rare NFT" }
            else { b"Epic NFT" };

        let image_url: vector<u8> = if (tier == 1) {
            b"https://placehold.co/400x400/1a1a2e/a0c4ff?text=COMMON+NFT&font=playfair-display"
        } else if (tier == 2) {
            b"https://placehold.co/400x400/1a1a2e/b48eff?text=RARE+NFT&font=playfair-display"
        } else {
            b"https://placehold.co/400x400/1a1a2e/ff9f43?text=EPIC+NFT&font=playfair-display"
        };

        let nft = LootNFT {
            id: object::new(ctx),
            name,
            image_url,
            tier,
        };

        transfer::transfer(nft, ctx.sender());
        event::emit(RewardEvent { reward: tier });
    }
}
