import { Keypair, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

async function main() {
    const keypair = Keypair.generate();
    console.log(`Public Key: ${keypair.publicKey}`);

    const connection = new Connection("http://localhost:8899", "confirmed");

    const signature = await connection.requestAirdrop(
    keypair.publicKey,
    LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature, "confirmed");

    const accountInfo = await connection.getAccountInfo(keypair.publicKey);
    console.log(JSON.stringify(accountInfo, null, 2));
}

main()
