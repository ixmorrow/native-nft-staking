"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.createTokenMint = exports.delay = exports.unstakeInput = exports.REDEEM_IX_DATA_LAYOUT = exports.redeemInput = exports.STAKE_IX_DATA_LAYOUT = exports.stakeInput = exports.wallet = exports.program_id = void 0;
const web3_js_1 = require("@solana/web3.js");
const buffer_1 = require("buffer");
const mpl_token_metadata_1 = require("@metaplex-foundation/mpl-token-metadata");
const borsh = __importStar(require("@project-serum/borsh"));
const spl_token_1 = require("@solana/spl-token");
exports.program_id = new web3_js_1.PublicKey("FQkajEMvJ61JDaW41cNQaUnHTK1Kv5CVe4bJXJXWF3JQ");
const RPC_ENDPOINT_URL = "https://api.devnet.solana.com";
const commitment = 'confirmed';
const connection = new web3_js_1.Connection(RPC_ENDPOINT_URL, commitment);
// MY WALLET SETTING
const id_json_path = require('os').homedir() + "/.config/solana/test-wallet.json";
const secret = Uint8Array.from(JSON.parse(require("fs").readFileSync(id_json_path)));
exports.wallet = web3_js_1.Keypair.fromSecretKey(secret);
const stakeInput = (i, user, nftTokenAcct, nftMint, nftEdition, stakeState, delegatedAuth) => {
    return new web3_js_1.TransactionInstruction({
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
                pubkey: spl_token_1.TOKEN_PROGRAM_ID,
                isSigner: false,
                isWritable: false
            },
            {
                pubkey: mpl_token_metadata_1.PROGRAM_ID,
                isSigner: false,
                isWritable: false
            },
            {
                pubkey: web3_js_1.SystemProgram.programId,
                isSigner: false,
                isWritable: false
            }
        ],
        data: i,
        programId: exports.program_id
    });
};
exports.stakeInput = stakeInput;
exports.STAKE_IX_DATA_LAYOUT = borsh.struct([
    borsh.u8("variant"),
]);
const redeemInput = (i, user, nftTokenAccount, stakeState, stakeMint, stakeAuth, userStakeAta) => {
    return new web3_js_1.TransactionInstruction({
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
                pubkey: spl_token_1.TOKEN_PROGRAM_ID,
                isSigner: false,
                isWritable: false,
            }
        ],
        data: i,
        programId: exports.program_id
    });
};
exports.redeemInput = redeemInput;
exports.REDEEM_IX_DATA_LAYOUT = borsh.struct([
    borsh.u8("variant"),
    //borsh.u8("amount"),
]);
const unstakeInput = (i, user, nftTokenAcct, nftMint, nftEdition, stakeState, delegatedAuth) => {
    return new web3_js_1.TransactionInstruction({
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
                pubkey: spl_token_1.TOKEN_PROGRAM_ID,
                isSigner: false,
                isWritable: false
            },
            {
                pubkey: mpl_token_metadata_1.PROGRAM_ID,
                isSigner: false,
                isWritable: false
            },
        ],
        data: i,
        programId: exports.program_id
    });
};
exports.unstakeInput = unstakeInput;
function delay(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}
exports.delay = delay;
function createTokenMint() {
    return __awaiter(this, void 0, void 0, function* () {
        let mintAuth = yield web3_js_1.PublicKey.findProgramAddress([buffer_1.Buffer.from("mint")], exports.program_id);
        let mint = yield (0, spl_token_1.createMint)(connection, exports.wallet, mintAuth[0], null, 6);
        console.log("Mint pubkey: ", mint.toBase58());
    });
}
exports.createTokenMint = createTokenMint;
