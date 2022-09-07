"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const buffer_1 = require("buffer");
const js_1 = require("@metaplex-foundation/js");
const spl_token_1 = require("@solana/spl-token");
const utils_1 = require("./utils");
const const_1 = require("./const");
const RPC_ENDPOINT_URL = "https://api.devnet.solana.com";
const commitment = 'confirmed';
const connection = new web3_js_1.Connection(RPC_ENDPOINT_URL, commitment);
// MY WALLET SETTING
const id_json_path = require('os').homedir() + "/.config/solana/test-wallet.json";
const secret = Uint8Array.from(JSON.parse(require("fs").readFileSync(id_json_path)));
const wallet = web3_js_1.Keypair.fromSecretKey(secret);
const metaplex = js_1.Metaplex.make(connection)
    .use((0, js_1.keypairIdentity)(wallet))
    .use((0, js_1.bundlrStorage)());
function testStakingProgram() {
    return __awaiter(this, void 0, void 0, function* () {
        const nft = yield metaplex.nfts().create({
            uri: "",
            name: "Test nft",
            sellerFeeBasisPoints: 0
        }).run();
        console.log("nft metadata pubkey: ", nft.metadataAddress.toBase58());
        console.log("nft token address: ", nft.tokenAddress.toBase58());
        let delegatedAuthPda = yield web3_js_1.PublicKey.findProgramAddress([buffer_1.Buffer.from("authority")], utils_1.program_id);
        let stakeStatePda = yield web3_js_1.PublicKey.findProgramAddress([wallet.publicKey.toBuffer(), nft.tokenAddress.toBuffer()], utils_1.program_id);
        console.log("delegated authority pda: ", delegatedAuthPda[0].toBase58());
        console.log("stake state pda: ", stakeStatePda[0].toBase58());
        const tx = new web3_js_1.Transaction();
        const payload = {
            variant: 0,
        };
        const ixBuffer = buffer_1.Buffer.alloc(1);
        utils_1.STAKE_IX_DATA_LAYOUT.encode(payload, ixBuffer);
        const ix = (0, utils_1.stakeInput)(ixBuffer, wallet.publicKey, nft.tokenAddress, nft.mintAddress, nft.masterEditionAddress, stakeStatePda[0], delegatedAuthPda[0]);
        tx.add(ix);
        let txid = yield connection.sendTransaction(tx, [wallet], {
            skipPreflight: true,
            preflightCommitment: "confirmed",
        });
        console.log("Stake tx:");
        console.log(`https://explorer.solana.com/tx/${txid}?cluster=devnet`);
        let mintAuth = yield web3_js_1.PublicKey.findProgramAddress([buffer_1.Buffer.from("mint")], utils_1.program_id);
        let userStakeAta = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, wallet, const_1.stakeMint, wallet.publicKey);
        // redeem instrcution
        const tx1 = new web3_js_1.Transaction();
        const payload1 = {
            variant: 1
        };
        const redeemIxBuffer = buffer_1.Buffer.alloc(1);
        utils_1.REDEEM_IX_DATA_LAYOUT.encode(payload1, redeemIxBuffer);
        const redeemIx = (0, utils_1.redeemInput)(redeemIxBuffer, wallet.publicKey, nft.tokenAddress, stakeStatePda[0], const_1.stakeMint, mintAuth[0], userStakeAta.address);
        tx1.add(redeemIx);
        let txid1 = yield connection.sendTransaction(tx1, [wallet], {
            skipPreflight: true,
            preflightCommitment: "confirmed",
        });
        console.log("Redeem stake rewards tx:");
        console.log(`https://explorer.solana.com/tx/${txid1}?cluster=devnet`);
        const tx2 = new web3_js_1.Transaction();
        const payload2 = {
            variant: 2,
        };
        const unstakeBuffer = buffer_1.Buffer.alloc(1);
        utils_1.STAKE_IX_DATA_LAYOUT.encode(payload2, unstakeBuffer);
        const ix2 = (0, utils_1.unstakeInput)(unstakeBuffer, wallet.publicKey, nft.tokenAddress, nft.mintAddress, nft.masterEditionAddress, stakeStatePda[0], delegatedAuthPda[0]);
        tx2.add(ix2);
        let txid2 = yield connection.sendTransaction(tx2, [wallet], {
            skipPreflight: true,
            preflightCommitment: "confirmed",
        });
        console.log("Unstake tx:");
        console.log(`https://explorer.solana.com/tx/${txid2}?cluster=devnet`);
    });
}
testStakingProgram();
