import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import fs from "fs";

async function main() {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    const secret = JSON.parse(fs.readFileSync("/home/ohtoh/.config/solana/id.json", "utf-8"));
    const sender = Keypair.fromSecretKey(Uint8Array.from(secret));


    const airdropSig = await connection.requestAirdrop(sender.publicKey, 2e9); // 2 SOL

    await connection.confirmTransaction(airdropSig);

    console.log(`Airdrop 2 SOL выполнен на адрес ${sender.publicKey.toBase58()}`);
}

main().catch(console.error);
