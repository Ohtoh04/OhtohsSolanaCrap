// airdrop.js
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

async function main() {
    const connection = new Connection("http://127.0.0.1:8899", "confirmed");
    const address = new PublicKey("G5XhJ1BFYJmzjWuGvCWBDB8GsMeMyohn1Fom3RmhTLmx");

    const airdropSig = await connection.requestAirdrop(address, 2e9); // 2 SOL
    await connection.confirmTransaction(airdropSig);

    console.log(`Airdrop 2 SOL выполнен на адрес ${address.toBase58()}`);
}
