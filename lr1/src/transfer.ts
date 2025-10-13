import {
    LAMPORTS_PER_SOL,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    Keypair,
    Connection
  } from "@solana/web3.js";
import fs from "fs";

async function main() {
    const connection = new Connection("http://localhost:8899", "confirmed");
    
    // Load sender keypair from id.json
    const senderSecret = JSON.parse(fs.readFileSync("/home/ohtoh/.config/solana/id.json", "utf-8"));
    const sender = Keypair.fromSecretKey(Uint8Array.from(senderSecret));

    // Load recipient keypair from second-wallet.json
    const recipientSecret = JSON.parse(fs.readFileSync("/home/ohtoh/.config/solana/id.json", "utf-8"));
    const recipient = Keypair.fromSecretKey(Uint8Array.from(recipientSecret));
    
    
    const transferInstruction = SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: recipient.publicKey,
    lamports: 0.01 * LAMPORTS_PER_SOL
    });
    
    const transaction = new Transaction().add(transferInstruction);
    
    const transactionSignature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [sender]
    );
    
    console.log("Transaction Signature:", `${transactionSignature}`);
    
    const senderBalance = await connection.getBalance(sender.publicKey);
    const receiverBalance = await connection.getBalance(recipient.publicKey);
    
    console.log("Sender Balance:", `${senderBalance}`);
    console.log("Receiver Balance:", `${receiverBalance}`);
}

main();