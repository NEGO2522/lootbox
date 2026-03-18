module lootbox::lootbox {

    use sui::event;
    use sui::object;
    use sui::transfer;
    use sui::tx_context::TxContext;
    use sui::random::{Random, new_generator};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;

    // ── Constants ──────────────────────────────────────────────
    // 0.01 SUI = 10_000_000 MIST (1 SUI = 1_000_000_000 MIST)
    const PRICE_MIST: u64 = 10_000_000;

    // Treasury address — receives every payment
    // Replace with your own Sui wallet address
    const TREASURY: address = @0x10bc42773f189a376d74412f9719b886feca2437df649451e496456850774478;

    // ── Error codes ────────────────────────────────────────────
    const EInsufficientPayment: u64 = 1;

    // ── Structs ────────────────────────────────────────────────
    public struct RewardEvent has copy, drop {
        reward: u8,
        player: address,
    }

    public struct LootNFT has key {
        id: object::UID,
        name: vector<u8>,
        image_url: vector<u8>,
        tier: u8,
    }

    // ── Entry function ─────────────────────────────────────────
    /// Player passes a SUI Coin worth at least PRICE_MIST.
    /// Excess is returned to the player. Payment goes to TREASURY.
    public entry fun open_box(
        payment: Coin<SUI>,
        r: &Random,
        ctx: &mut TxContext
    ) {
        // 1. Verify payment amount
        let paid = coin::value(&payment);
        assert!(paid >= PRICE_MIST, EInsufficientPayment);

        // 2. Split exact price and return change if any
        let mut payment_mut = payment;
        let treasury_coin = coin::split(&mut payment_mut, PRICE_MIST, ctx);

        // Return leftover change to sender
        let change = coin::value(&payment_mut);
        if (change > 0) {
            transfer::public_transfer(payment_mut, ctx.sender());
        } else {
            coin::destroy_zero(payment_mut);
        };

        // 3. Send price to treasury
        transfer::public_transfer(treasury_coin, TREASURY);

        // 4. Roll randomness
        let mut generator = new_generator(r, ctx);
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

        // 5. Mint NFT to player
        let nft = LootNFT {
            id: object::new(ctx),
            name,
            image_url,
            tier,
        };

        transfer::transfer(nft, ctx.sender());
        event::emit(RewardEvent { reward: tier, player: ctx.sender() });
    }
}
