import { PublicKey, Keypair, sendAndConfirmTransaction, Connection, Transaction, TransactionInstruction, SystemProgram } from "@solana/web3.js"
import { Buffer } from 'buffer'
import { Metaplex, bundlrStorage, keypairIdentity } from "@metaplex-foundation/js"
import { PROGRAM_ID as METADATA_PROGEAM_ID} from '@metaplex-foundation/mpl-token-metadata'
import * as borsh from "@project-serum/borsh"
import {createMint, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { stakeInput, STAKE_IX_DATA_LAYOUT, redeemInput, REDEEM_IX_DATA_LAYOUT, unstakeInput, program_id } from "./utils"
import { stakeMint } from "./const"

const RPC_ENDPOINT_URL = "https://api.devnet.solana.com"
const commitment = 'confirmed'
const connection = new Connection(RPC_ENDPOINT_URL, commitment)

// MY WALLET SETTING
const id_json_path = require('os').homedir() + "/.config/solana/test-wallet.json"
const secret = Uint8Array.from(JSON.parse(require("fs").readFileSync(id_json_path)))
const wallet = Keypair.fromSecretKey(secret as Uint8Array)

const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(wallet))
    .use(bundlrStorage())


async function testStakingProgram(){
    const nft = await metaplex.nfts().create({
        uri: "",
        name: "Test nft",
        sellerFeeBasisPoints: 0
    }).run()

    console.log("nft metadata pubkey: ", nft.metadataAddress.toBase58())
    console.log("nft token address: ", nft.tokenAddress.toBase58())

    let delegatedAuthPda = await PublicKey.findProgramAddress([Buffer.from("authority")], program_id)
    let stakeStatePda = await PublicKey.findProgramAddress([wallet.publicKey.toBuffer(), nft.tokenAddress.toBuffer()], program_id)

    console.log("delegated authority pda: ", delegatedAuthPda[0].toBase58())
    console.log("stake state pda: ", stakeStatePda[0].toBase58())

    const tx = new Transaction()
    const payload = {
        variant: 0,
    }
    const ixBuffer = Buffer.alloc(1)
    STAKE_IX_DATA_LAYOUT.encode(payload, ixBuffer)
    const ix = stakeInput(
        ixBuffer,
        wallet.publicKey,
        nft.tokenAddress,
        nft.mintAddress,
        nft.masterEditionAddress,
        stakeStatePda[0],
        delegatedAuthPda[0],
        )
    tx.add(ix)

    let txid = await connection.sendTransaction(tx, [wallet], {
        skipPreflight: true,
        preflightCommitment: "confirmed",
    })
    console.log("Stake tx:")
    console.log(`https://explorer.solana.com/tx/${txid}?cluster=devnet`)


    let mintAuth = await PublicKey.findProgramAddress([Buffer.from("mint")], program_id)

    let userStakeAta = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet,
        stakeMint,
        wallet.publicKey
    )

    // redeem instrcution
    const tx1 = new Transaction()
    const payload1 = {
        variant: 1
    }
    const redeemIxBuffer = Buffer.alloc(1)
    REDEEM_IX_DATA_LAYOUT.encode(payload1, redeemIxBuffer)
    const redeemIx = redeemInput(
        redeemIxBuffer,
        wallet.publicKey,
        nft.tokenAddress,
        stakeStatePda[0],
        stakeMint,
        mintAuth[0],
        userStakeAta.address
    )
    tx1.add(redeemIx)
    let txid1 = await connection.sendTransaction(tx1, [wallet], {
        skipPreflight: true,
        preflightCommitment: "confirmed",
    })
    console.log("Redeem stake rewards tx:")
    console.log(`https://explorer.solana.com/tx/${txid1}?cluster=devnet`)

    
    const tx2 = new Transaction()
    const payload2 = {
        variant: 2,
    }
    const unstakeBuffer = Buffer.alloc(1)
    STAKE_IX_DATA_LAYOUT.encode(payload2, unstakeBuffer)
    const ix2 = unstakeInput(
        unstakeBuffer,
        wallet.publicKey,
        nft.tokenAddress,
        nft.mintAddress,
        nft.masterEditionAddress,
        stakeStatePda[0],
        delegatedAuthPda[0],
        )
    tx2.add(ix2)

    let txid2 = await connection.sendTransaction(tx2, [wallet], {
        skipPreflight: true,
        preflightCommitment: "confirmed",
    })
    console.log("Unstake tx:")
    console.log(`https://explorer.solana.com/tx/${txid2}?cluster=devnet`)

}

testStakingProgram()