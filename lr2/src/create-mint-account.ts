import {
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import {
  createInitializeMintInstruction,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint
} from "@solana/spl-token";
import * as fs from 'fs';

// Create connection to local validator
const connection = new Connection("http://localhost:8899", "confirmed");
const latestBlockhash = await connection.getLatestBlockhash();

// Generate a new keypair for the fee payer
const feepayerSecret = JSON.parse(fs.readFileSync("/home/ohtoh/.config/solana/id.json", "utf-8"));
const feePayer = Keypair.fromSecretKey(Uint8Array.from(feepayerSecret));

// Airdrop 1 SOL to fee payer
const airdropSignature = await connection.requestAirdrop(
  feePayer.publicKey,
  LAMPORTS_PER_SOL
);

await connection.confirmTransaction({
  blockhash: latestBlockhash.blockhash,
  lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  signature: airdropSignature
});

// Generate keypair to use as address of mint
const mint = Keypair.generate();

const createAccountInstruction = SystemProgram.createAccount({
  fromPubkey: feePayer.publicKey,
  newAccountPubkey: mint.publicKey,
  space: MINT_SIZE,
  lamports: await getMinimumBalanceForRentExemptMint(connection),
  programId: TOKEN_PROGRAM_ID
});

const initializeMintInstruction = createInitializeMintInstruction(
  mint.publicKey,
  9, // Decimals
  feePayer.publicKey, // Mint authority
  feePayer.publicKey, // Freeze authority
  TOKEN_PROGRAM_ID
);

const transaction = new Transaction().add(
  createAccountInstruction,
  initializeMintInstruction
);

const transactionSignature = await sendAndConfirmTransaction(
  connection,
  transaction,
  [feePayer, mint] // Signers
);

console.log("Mint Address:", mint.publicKey.toBase58());
console.log("\nTransaction Signature:", transactionSignature);