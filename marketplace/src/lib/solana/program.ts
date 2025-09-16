import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  AccountMeta,
} from "@solana/web3.js";
import { serialize } from "borsh";

// Program ID - This would be your deployed program ID
export const MARKETPLACE_PROGRAM_ID = new PublicKey(
  "GsVxXr66fe6nas8gvTUG6VuaK3DayuBQq3h5ri3FxyP8"
); // Replace with actual program ID

// Instruction enum
export enum MarketplaceInstruction {
  InitializeMarketplace = 0,
  ListNft = 1,
  BuyNft = 2,
  CancelListing = 3,
  UpdateMarketplaceFee = 4,
}

// Instruction data structures
export class InitializeMarketplaceData {
  instruction: MarketplaceInstruction;
  fee_percentage: number;

  constructor(fee_percentage: number) {
    this.instruction = MarketplaceInstruction.InitializeMarketplace;
    this.fee_percentage = fee_percentage;
  }
}

export class ListNftData {
  instruction: MarketplaceInstruction;
  price: bigint;

  constructor(price: bigint) {
    this.instruction = MarketplaceInstruction.ListNft;
    this.price = price;
  }
}

export class BuyNftData {
  instruction: MarketplaceInstruction;

  constructor() {
    this.instruction = MarketplaceInstruction.BuyNft;
  }
}

export class CancelListingData {
  instruction: MarketplaceInstruction;

  constructor() {
    this.instruction = MarketplaceInstruction.CancelListing;
  }
}

export class UpdateMarketplaceFeeData {
  instruction: MarketplaceInstruction;
  new_fee_percentage: number;

  constructor(new_fee_percentage: number) {
    this.instruction = MarketplaceInstruction.UpdateMarketplaceFee;
    this.new_fee_percentage = new_fee_percentage;
  }
}

// Borsh schemas
const InitializeMarketplaceSchema = new Map([
  [
    InitializeMarketplaceData,
    {
      kind: "struct",
      fields: [
        ["instruction", "u8"],
        ["fee_percentage", "u16"],
      ],
    },
  ],
]);

const ListNftSchema = new Map([
  [
    ListNftData,
    {
      kind: "struct",
      fields: [
        ["instruction", "u8"],
        ["price", "u64"],
      ],
    },
  ],
]);

const BuyNftSchema = new Map([
  [BuyNftData, { kind: "struct", fields: [["instruction", "u8"]] }],
]);

const CancelListingSchema = new Map([
  [CancelListingData, { kind: "struct", fields: [["instruction", "u8"]] }],
]);

const UpdateMarketplaceFeeSchema = new Map([
  [
    UpdateMarketplaceFeeData,
    {
      kind: "struct",
      fields: [
        ["instruction", "u8"],
        ["new_fee_percentage", "u16"],
      ],
    },
  ],
]);

// PDA helpers
export const getMarketplacePDA = (
  authority: PublicKey
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace"), authority.toBuffer()],
    MARKETPLACE_PROGRAM_ID
  );
};

export const getListingPDA = (
  nftMint: PublicKey,
  seller: PublicKey
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("listing"), nftMint.toBuffer(), seller.toBuffer()],
    MARKETPLACE_PROGRAM_ID
  );
};

export const getMarketplaceFeePDA = (
  marketplace: PublicKey
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("fee"), marketplace.toBuffer()],
    MARKETPLACE_PROGRAM_ID
  );
};

// Instruction builders
export const createInitializeMarketplaceInstruction = (
  authority: PublicKey,
  feePercentage: number
): TransactionInstruction => {
  const [marketplacePDA] = getMarketplacePDA(authority);

  const data = new InitializeMarketplaceData(feePercentage);
  const serializedData = serialize(InitializeMarketplaceSchema, data);

  const accounts: AccountMeta[] = [
    { pubkey: authority, isSigner: true, isWritable: false },
    { pubkey: marketplacePDA, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys: accounts,
    programId: MARKETPLACE_PROGRAM_ID,
    data: Buffer.from(serializedData),
  });
};

export const createListNftInstruction = (
  seller: PublicKey,
  nftMint: PublicKey,
  sellerTokenAccount: PublicKey,
  marketplace: PublicKey,
  price: bigint
): TransactionInstruction => {
  const [listingPDA] = getListingPDA(nftMint, seller);

  const data = new ListNftData(price);
  const serializedData = serialize(ListNftSchema, data);

  const accounts: AccountMeta[] = [
    { pubkey: seller, isSigner: true, isWritable: false },
    { pubkey: listingPDA, isSigner: false, isWritable: true },
    { pubkey: nftMint, isSigner: false, isWritable: false },
    { pubkey: sellerTokenAccount, isSigner: false, isWritable: true },
    { pubkey: marketplace, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys: accounts,
    programId: MARKETPLACE_PROGRAM_ID,
    data: Buffer.from(serializedData),
  });
};

export const createBuyNftInstruction = (
  buyer: PublicKey,
  seller: PublicKey,
  nftMint: PublicKey,
  buyerTokenAccount: PublicKey,
  sellerTokenAccount: PublicKey,
  marketplace: PublicKey,
  marketplaceFeeAccount: PublicKey,
  tokenProgram: PublicKey
): TransactionInstruction => {
  const [listingPDA] = getListingPDA(nftMint, seller);

  const data = new BuyNftData();
  const serializedData = serialize(BuyNftSchema, data);

  const accounts: AccountMeta[] = [
    { pubkey: buyer, isSigner: true, isWritable: true },
    { pubkey: listingPDA, isSigner: false, isWritable: true },
    { pubkey: buyerTokenAccount, isSigner: false, isWritable: true },
    { pubkey: sellerTokenAccount, isSigner: false, isWritable: true },
    { pubkey: seller, isSigner: false, isWritable: true },
    { pubkey: marketplaceFeeAccount, isSigner: false, isWritable: true },
    { pubkey: nftMint, isSigner: false, isWritable: false },
    { pubkey: marketplace, isSigner: false, isWritable: true },
    { pubkey: tokenProgram, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys: accounts,
    programId: MARKETPLACE_PROGRAM_ID,
    data: Buffer.from(serializedData),
  });
};

export const createCancelListingInstruction = (
  seller: PublicKey,
  nftMint: PublicKey
): TransactionInstruction => {
  const [listingPDA] = getListingPDA(nftMint, seller);

  const data = new CancelListingData();
  const serializedData = serialize(CancelListingSchema, data);

  const accounts: AccountMeta[] = [
    { pubkey: seller, isSigner: true, isWritable: true },
    { pubkey: listingPDA, isSigner: false, isWritable: true },
    { pubkey: nftMint, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys: accounts,
    programId: MARKETPLACE_PROGRAM_ID,
    data: Buffer.from(serializedData),
  });
};

export const createUpdateMarketplaceFeeInstruction = (
  authority: PublicKey,
  newFeePercentage: number
): TransactionInstruction => {
  const [marketplacePDA] = getMarketplacePDA(authority);

  const data = new UpdateMarketplaceFeeData(newFeePercentage);
  const serializedData = serialize(UpdateMarketplaceFeeSchema, data);

  const accounts: AccountMeta[] = [
    { pubkey: authority, isSigner: true, isWritable: false },
    { pubkey: marketplacePDA, isSigner: false, isWritable: true },
  ];

  return new TransactionInstruction({
    keys: accounts,
    programId: MARKETPLACE_PROGRAM_ID,
    data: Buffer.from(serializedData),
  });
};

// Account data structures
export interface MarketplaceAccount {
  isInitialized: boolean;
  authority: PublicKey;
  feePercentage: number;
  feeRecipient: PublicKey;
  totalVolume: bigint;
  totalSales: bigint;
}

export interface ListingAccount {
  isInitialized: boolean;
  seller: PublicKey;
  nftMint: PublicKey;
  price: bigint;
  createdAt: bigint;
  marketplace: PublicKey;
}

// Helper functions
export const lamportsToSol = (lamports: bigint): number => {
  return Number(lamports) / 1e9;
};

export const solToLamports = (sol: number): bigint => {
  return BigInt(Math.floor(sol * 1e9));
};

export const formatPrice = (lamports: bigint): string => {
  return `${lamportsToSol(lamports).toFixed(4)} SOL`;
};
