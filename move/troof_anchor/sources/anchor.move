/// Troof anchor — the on-chain root of trust for a sealed proof.
/// Stores the SHA-256 of a canonicalized wallet report (plus its Walrus blob id) in an
/// immutable owned object and emits an event. Tampering with the off-chain report changes
/// its hash, which then no longer matches the hash anchored here.
module troof_anchor::anchor;

use std::string::{Self, String};
use sui::event;

/// An immutable record of a sealed proof.
public struct Record has key, store {
    id: UID,
    /// Walrus blob id that holds the full report bundle.
    blob_id: String,
    /// SHA-256 (hex) of the canonicalized report — the integrity hash.
    content_hash: String,
    /// The wallet the report is about.
    wallet: String,
    /// "mainnet" | "testnet".
    network: String,
}

/// Emitted on every seal, for discovery/indexing.
public struct Anchored has copy, drop {
    record_id: ID,
    blob_id: String,
    content_hash: String,
    wallet: String,
    anchored_by: address,
    epoch: u64,
}

/// Seal a proof: create the immutable Record and emit an Anchored event.
public entry fun anchor(
    blob_id: String,
    content_hash: String,
    wallet: String,
    network: String,
    ctx: &mut TxContext,
) {
    let rec = Record {
        id: object::new(ctx),
        blob_id,
        content_hash,
        wallet,
        network,
    };
    // Clone the strings for the event (String is not `copy`); the originals stay in Record.
    event::emit(Anchored {
        record_id: object::id(&rec),
        blob_id: string::utf8(*rec.blob_id.as_bytes()),
        content_hash: string::utf8(*rec.content_hash.as_bytes()),
        wallet: string::utf8(*rec.wallet.as_bytes()),
        anchored_by: ctx.sender(),
        epoch: ctx.epoch(),
    });
    transfer::public_transfer(rec, ctx.sender());
}
