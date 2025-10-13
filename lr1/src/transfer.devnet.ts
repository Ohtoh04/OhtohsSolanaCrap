import {
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
  Connection,
  clusterApiUrl
} from "@solana/web3.js";

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  
  const sender = Keypair.generate();
  const receiver = Keypair.generate();
  
  const signature = await connection.requestAirdrop(
      sender.publicKey,
      LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(signature, "confirmed");
  
  const transferInstruction = SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: receiver.publicKey,
      lamports: 0.01 * LAMPORTS_PER_SOL
  });
  
  const transaction = new Transaction().add(transferInstruction);
  
  const transactionSignature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [sender]
  );
  
  console.log("Transaction Signature:", transactionSignature);
  
  const senderBalance = await connection.getBalance(sender.publicKey);
  const receiverBalance = await connection.getBalance(receiver.publicKey);
  
  console.log("Sender Balance:", senderBalance / LAMPORTS_PER_SOL, "SOL");
  console.log("Receiver Balance:", receiverBalance / LAMPORTS_PER_SOL, "SOL");
}

main().catch(console.error);
