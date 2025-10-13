import {
  airdropFactory,
  appendTransactionMessageInstructions,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  generateKeyPairSigner,
  getSignatureFromTransaction,
  lamports,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners
} from "@solana/kit";
import {
  getCreateAssociatedTokenInstructionAsync,
  findAssociatedTokenPda,
  getMintToInstruction,
  TOKEN_PROGRAM_ADDRESS
} from "@solana-program/token";
import * as fs from "fs"

// Create Connection (example uses local validator)
const rpc = createSolanaRpc("http://localhost:8899");
const rpcSubscriptions = createSolanaRpcSubscriptions("ws://localhost:8900");

// Generate fee payer
const secret = JSON.parse(fs.readFileSync("/home/ohtoh/.config/solana/id.json", "utf-8"));
const secretBytes = Uint8Array.from(secret);
const feePayer = await createKeyPairSignerFromBytes(secretBytes);

// Fund fee payer
await airdropFactory({ rpc, rpcSubscriptions })({
  recipientAddress: feePayer.address,
  lamports: lamports(1_000_000_000n),
  commitment: "confirmed"
});

// Use existing mint instead of creating a new one
const EXISTING_MINT_ADDRESS = "47eiKtF4oTkbxDxanda19mDGt6x17v8zAmoVukdar6aH";
console.log("Using existing mint:", EXISTING_MINT_ADDRESS);

// Get latest blockhash
const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

// Create instruction to create the associated token account for existing mint
const createAtaInstruction = await getCreateAssociatedTokenInstructionAsync({
  payer: feePayer,
  mint: EXISTING_MINT_ADDRESS,
  owner: feePayer.address
});

// Only one instruction now — create ATA
const instructions = [createAtaInstruction];

// Build transaction
const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(feePayer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(instructions, tx)
);

// Sign + send
const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
  commitment: "confirmed"
});

// Log ATA
const transactionSignature = getSignatureFromTransaction(signedTransaction);

// Derive ATA address
const [associatedTokenAddress] = await findAssociatedTokenPda({
  mint: EXISTING_MINT_ADDRESS,
  owner: feePayer.address,
  tokenProgram: TOKEN_PROGRAM_ADDRESS
});

console.log("Associated Token Account:", associatedTokenAddress.toString());
console.log("ATA creation signature:", transactionSignature);

// Mint tokens to the ATA (using existing mint authority)
const mintToInstruction = getMintToInstruction({
  mint: EXISTING_MINT_ADDRESS,
  token: associatedTokenAddress,
  mintAuthority: feePayer.address, // must match existing mint authority
  amount: 100n // 1.00 tokens with 2 decimals
});

// Build mint transaction
const mintTxMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(feePayer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions([mintToInstruction], tx)
);

// Sign + send
const signedMintTx = await signTransactionMessageWithSigners(mintTxMessage);
await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedMintTx, {
  commitment: "confirmed"
});

// Log mint result
const transactionSignature2 = getSignatureFromTransaction(signedMintTx);
console.log("Successfully minted 1.00 tokens");
console.log("Mint Transaction Signature:", transactionSignature2);
