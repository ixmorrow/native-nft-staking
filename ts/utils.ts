import { PublicKey, Keypair, sendAndConfirmTransaction, Connection, Transaction, TransactionInstruction, SystemProgram } from "@solana/web3.js"
import { Buffer } from 'buffer'
import { PROGRAM_ID as METADATA_PROGEAM_ID} from '@metaplex-foundation/mpl-token-metadata'
import * as borsh from "@project-serum/borsh"
import { createMint, TOKEN_PROGRAM_ID } from '@solana/spl-token'

export const program_id = new PublicKey("FQkajEMvJ61JDaW41cNQaUnHTK1Kv5CVe4bJXJXWF3JQ")

const RPC_ENDPOINT_URL = "https://api.devnet.solana.com"
const commitment = 'confirmed'
const connection = new Connection(RPC_ENDPOINT_URL, commitment)

// MY WALLET SETTING
const id_json_path = require('os').homedir() + "/.config/solana/test-wallet.json"
const secret = Uint8Array.from(JSON.parse(require("fs").readFileSync(id_json_path)))
export const wallet = Keypair.fromSecretKey(secret as Uint8Array)

export const stakeInput = (
    i: Buffer,
    user: PublicKey,
    nftTokenAcct: PublicKey,
    nftMint: PublicKey,
    nftEdition: PublicKey,
    stakeState: PublicKey,
    delegatedAuth: PublicKey,
    ) => {
    return new TransactionInstruction({
        keys: [
            {
                pubkey: user,
                isSigner: true,
                isWritable: true
            },
            {
                pubkey: nftTokenAcct,
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: nftMint,
                isSigner: false,
                isWritable: false
            },
            {
                pubkey: nftEdition,
                isSigner: false,
                isWritable: false
            },
            {
                pubkey: stakeState,
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: delegatedAuth,
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: TOKEN_PROGRAM_ID,
                isSigner: false,
                isWritable: false
            },
            {
                pubkey: METADATA_PROGEAM_ID,
                isSigner: false,
                isWritable: false
            },
            {
                pubkey: SystemProgram.programId,
                isSigner: false,
                isWritable: false
            }
        ],
        data: i,
        programId: program_id
    })
}

export const STAKE_IX_DATA_LAYOUT = borsh.struct([
    borsh.u8("variant"),
])

export const redeemInput = (
    i: Buffer,
    user: PublicKey,
    nftTokenAccount: PublicKey,
    stakeState: PublicKey,
    stakeMint: PublicKey,
    stakeAuth: PublicKey,
    userStakeAta: PublicKey
) => {
    return new TransactionInstruction ({
            keys: [
                {
                    pubkey: user,
                    isSigner: true,
                    isWritable: true
                },
                {
                    pubkey: nftTokenAccount,
                    isSigner: false,
                    isWritable: false,
                },
                {
                    pubkey: stakeState,
                    isSigner: false,
                    isWritable: true,
                },
                {
                    pubkey: stakeMint,
                    isSigner: false,
                    isWritable: true,
                },
                {
                    pubkey: stakeAuth,
                    isSigner: false,
                    isWritable: false,
                },
                {
                    pubkey: userStakeAta,
                    isSigner: false,
                    isWritable: true,
                },
                {
                    pubkey: TOKEN_PROGRAM_ID,
                    isSigner: false,
                    isWritable: false,
                }
        ],
        data: i,
        programId: program_id
    })
}

export const REDEEM_IX_DATA_LAYOUT = borsh.struct([
    borsh.u8("variant"),
    //borsh.u8("amount"),
])

export const unstakeInput = (
    i: Buffer,
    user: PublicKey,
    nftTokenAcct: PublicKey,
    nftMint: PublicKey,
    nftEdition: PublicKey,
    stakeState: PublicKey,
    delegatedAuth: PublicKey,
    ) => {
    return new TransactionInstruction({
        keys: [
            {
                pubkey: user,
                isSigner: true,
                isWritable: true
            },
            {
                pubkey: nftTokenAcct,
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: nftMint,
                isSigner: false,
                isWritable: false
            },
            {
                pubkey: nftEdition,
                isSigner: false,
                isWritable: false
            },
            {
                pubkey: stakeState,
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: delegatedAuth,
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: TOKEN_PROGRAM_ID,
                isSigner: false,
                isWritable: false
            },
            {
                pubkey: METADATA_PROGEAM_ID,
                isSigner: false,
                isWritable: false
            },
        ],
        data: i,
        programId: program_id
    })
}

export function delay(milliseconds : number) {
    return new Promise(resolve => setTimeout( resolve, milliseconds));
}

export async function createTokenMint(){
    let mintAuth = await PublicKey.findProgramAddress([Buffer.from("mint")], program_id)
    let mint = await createMint(
        connection,
        wallet,
        mintAuth[0],
        null,
        6,
    )
    console.log("Mint pubkey: ", mint.toBase58())
}