import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import fs from "fs";

async function main() {
  // Connect to Devnet
  const connection = new Connection("http://localhost:8899", "confirmed");

  // Load sender keypair from id.json
  const senderSecret = JSON.parse(fs.readFileSync("/home/ohtoh/.config/solana/id.json", "utf-8"));
  const sender = Keypair.fromSecretKey(Uint8Array.from(senderSecret));

  // Load recipient keypair from second-wallet.json
  const recipientSecret = JSON.parse(fs.readFileSync("/home/ohtoh/.config/solana/id.json", "utf-8"));
  const recipient = Keypair.fromSecretKey(Uint8Array.from(recipientSecret));

  console.log(`Sender: ${sender.publicKey.toBase58()}`);
  console.log(`Recipient: ${recipient.publicKey.toBase58()}`);

  // Request airdrop for sender if balance is low
  const senderBalance = await connection.getBalance(sender.publicKey);
  if (senderBalance < LAMPORTS_PER_SOL) {
      console.log("Airdropping 2 SOL to sender...");
      const airdropSig = await connection.requestAirdrop(sender.publicKey, 2 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(airdropSig);
  }

  // Calculate amount to send (everything except fee estimate)
  const updatedBalance = await connection.getBalance(sender.publicKey);
  const feeEstimate = 5000; // approximate fee in lamports
  const amount = updatedBalance - feeEstimate;

  // Create and send the transaction
  const tx = new Transaction().add(
      SystemProgram.transfer({
          fromPubkey: sender.publicKey,
          toPubkey: recipient.publicKey,
          lamports: amount,
      })
  );

  const sig = await sendAndConfirmTransaction(connection, tx, [sender]);
  console.log(`Transaction signature: ${sig}`);
  console.log(`Переведено ${amount / LAMPORTS_PER_SOL} SOL (всё, кроме комиссии)`);

  // Print final balances
  const finalSenderBalance = await connection.getBalance(sender.publicKey);
  const finalRecipientBalance = await connection.getBalance(recipient.publicKey);
  console.log(`Sender balance: ${finalSenderBalance / LAMPORTS_PER_SOL} SOL`);
  console.log(`Recipient balance: ${finalRecipientBalance / LAMPORTS_PER_SOL} SOL`);
}

main().catch(console.error);
