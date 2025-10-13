import {
  airdropFactory,
  appendTransactionMessageInstructions,
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
import { getCreateAccountInstruction } from "@solana-program/system";
import {
  getInitializeAccount2Instruction,
  getTokenSize,
  TOKEN_PROGRAM_ADDRESS
} from "@solana-program/token";

// Create Connection (example uses local validator)
const rpc = createSolanaRpc("http://localhost:8899");
const rpcSubscriptions = createSolanaRpcSubscriptions("ws://localhost:8900");

// Get latest blockhash
const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

// Generate fee payer
const feePayer = await generateKeyPairSigner();

// Fund fee payer
await airdropFactory({ rpc, rpcSubscriptions })({
  recipientAddress: feePayer.address,
  lamports: lamports(1_000_000_000n),
  commitment: "confirmed"
});

const EXISTING_MINT_ADDRESS = "47eiKtF4oTkbxDxanda19mDGt6x17v8zAmoVukdar6aH";

// Generate keypair for new token account
const tokenAccount = await generateKeyPairSigner();

// Get token account size (in bytes)
const tokenAccountSpace = BigInt(getTokenSize());

// Get minimum balance for rent exemption
const tokenAccountRent = await rpc
  .getMinimumBalanceForRentExemption(tokenAccountSpace)
  .send();

// Create token account for existing mint
const createTokenAccountInstruction = getCreateAccountInstruction({
  payer: feePayer,
  newAccount: tokenAccount,
  lamports: tokenAccountRent,
  space: tokenAccountSpace,
  programAddress: TOKEN_PROGRAM_ADDRESS
});

const initializeTokenAccountInstruction = getInitializeAccount2Instruction({
  account: tokenAccount.address,
  mint: EXISTING_MINT_ADDRESS,
  owner: feePayer.address
});

const instructions = [
  createTokenAccountInstruction,
  initializeTokenAccountInstruction
];

// Build transaction message
const tokenAccountMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(feePayer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(instructions, tx)
);

// Sign transaction
const signedTokenAccountTx = await signTransactionMessageWithSigners(
  tokenAccountMessage
);

// Send + confirm
await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(
  signedTokenAccountTx,
  { commitment: "confirmed" }
);

// Log result
const transactionSignature = getSignatureFromTransaction(signedTokenAccountTx);
console.log("Using existing mint:", EXISTING_MINT_ADDRESS);
console.log("New token account:", tokenAccount.address);
console.log("Transaction signature:", transactionSignature);
