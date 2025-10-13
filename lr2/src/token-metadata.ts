import { getCreateAccountInstruction } from "@solana-program/system";
import {
  extension,
  getInitializeAccountInstruction,
  getInitializeMintInstruction,
  getInitializeMetadataPointerInstruction,
  getMintSize,
  getTokenSize,
  TOKEN_2022_PROGRAM_ADDRESS,
  getInitializeTokenMetadataInstruction
} from "@solana-program/token-2022";
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
  signTransactionMessageWithSigners,
  some
} from "@solana/kit";

// Create Connection, local validator in this example
const rpc = createSolanaRpc("http://localhost:8899");
const rpcSubscriptions = createSolanaRpcSubscriptions("ws://localhost:8900");

// Generate the authority for the mint (also acts as fee payer)
const authority = await generateKeyPairSigner();

// Fund authority/fee payer
await airdropFactory({ rpc, rpcSubscriptions })({
  recipientAddress: authority.address,
  lamports: lamports(5_000_000_000n), // 5 SOL
  commitment: "confirmed"
});

// Generate keypair to use as address of mint
const mint = await generateKeyPairSigner();

// Enable Metadata and Metadata Pointer extensions
const metadataExtension = extension("TokenMetadata", {
  updateAuthority: some(authority.address),
  mint: mint.address,
  name: "OPOS",
  symbol: "OPS",
  uri: "https://raw.githubusercontent.com/solana-developers/opos-asset/main/assets/DeveloperPortal/metadata.json",
  additionalMetadata: new Map().set("description", "Only possible on Solana")
});

const metadataPointerExtension = extension("MetadataPointer", {
  authority: authority.address,
  metadataAddress: mint.address // can also point to another account if desired
});

// Get mint account size with the metadata pointer extension alone
const spaceWithoutTokenMetadataExtension = BigInt(
  getMintSize([metadataPointerExtension])
);

// Get mint account size with all extensions(metadata && metadataPointer)
const spaceWithTokenMetadataExtension = BigInt(
  getMintSize([metadataPointerExtension, metadataExtension])
);

// Get minimum balance for rent exemption
const rent = await rpc
  .getMinimumBalanceForRentExemption(spaceWithTokenMetadataExtension)
  .send();

// Get latest blockhash to include in transaction
const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

// Instruction to create new account for mint
const createMintAccountInstruction = getCreateAccountInstruction({
  payer: authority,
  newAccount: mint,
  lamports: rent,
  space: spaceWithoutTokenMetadataExtension,
  programAddress: TOKEN_2022_PROGRAM_ADDRESS
});

// Initialize metadata extension
const initializeMetadataInstruction = getInitializeTokenMetadataInstruction({
  metadata: mint.address, // Account address that holds the metadata
  updateAuthority: authority.address, // Authority that can update the metadata
  mint: mint.address, // Mint Account address
  mintAuthority: authority, // Designated Mint Authority
  name: "OPOS",
  symbol: "OPS",
  uri: "https://raw.githubusercontent.com/solana-developers/opos-asset/main/assets/DeveloperPortal/metadata.json"
});

// Initialize metadata pointer extension
const initializeMetadataPointerInstruction =
  getInitializeMetadataPointerInstruction({
    mint: mint.address,
    authority: authority.address,
    metadataAddress: mint.address
  });

// Initialize mint account data
const initializeMintInstruction = getInitializeMintInstruction({
  mint: mint.address,
  decimals: 9,
  mintAuthority: authority.address,
  freezeAuthority: authority.address
});

// Generate keypair to use as address of token account
const tokenAccount = await generateKeyPairSigner();

// Get token account size (basic)
const tokenAccountLen = BigInt(getTokenSize([]));

// Get minimum balance for rent exemption
const tokenAccountRent = await rpc
  .getMinimumBalanceForRentExemption(tokenAccountLen)
  .send();

// Instruction to create new token account
const createTokenAccountInstruction = getCreateAccountInstruction({
  payer: authority,
  newAccount: tokenAccount,
  lamports: tokenAccountRent,
  space: tokenAccountLen,
  programAddress: TOKEN_2022_PROGRAM_ADDRESS
});

// Instruction to initialize the created token account
const initializeTokenAccountInstruction = getInitializeAccountInstruction({
  account: tokenAccount.address,
  mint: mint.address,
  owner: authority.address
});

// Build the instruction list
const instructions = [
  createMintAccountInstruction,
  initializeMetadataPointerInstruction,
  initializeMintInstruction,
  initializeMetadataInstruction,
  createTokenAccountInstruction,
  initializeTokenAccountInstruction
];

// Create transaction message
const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(authority, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(instructions, tx)
);

// Sign transaction message with all required signers
const signedTransaction =
  await signTransactionMessageWithSigners(transactionMessage);

// Send and confirm transaction
await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(
  signedTransaction,
  { commitment: "confirmed", skipPreflight: true }
);

// Get transaction signature
const transactionSignature = getSignatureFromTransaction(signedTransaction);

console.log("Mint Address:", mint.address.toString());
console.log(
  "Token account with Metadata + Metadata Pointer:",
  tokenAccount.address.toString()
);
console.log("Transaction Signature:", transactionSignature);