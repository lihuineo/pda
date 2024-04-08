import * as web3 from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import * as borsh from "@project-serum/borsh";
import { Buffer } from "buffer";

const programId = new web3.PublicKey("AxhGGBeAQc1SumsczWjgUxbbhhZR7FsTAtfoc5Ay6oaw");
const invokeInstructionLayout = borsh.struct([borsh.u8("newAccountBumpSeed"), borsh.u64("space")]);

export async function invokeProgram(connection: web3.Connection,
    payer: web3.Keypair) {
    const [vault, vaultBumpSeed] = web3.PublicKey.findProgramAddressSync([Buffer.from("vault"), payer.publicKey.toBuffer()], programId);
    let buffer = Buffer.alloc(1000);
    const newAccountBumpSeed = vaultBumpSeed;
    const space = new anchor.BN(10);

    invokeInstructionLayout.encode(
        {
            newAccountBumpSeed: newAccountBumpSeed,
            space: space,
        },
        buffer,
    )

    buffer = buffer.slice(0, invokeInstructionLayout.getSpan(buffer));
    const tx = new web3.Transaction();

    const ins = new web3.TransactionInstruction({
        programId: programId,
        data: buffer,
        keys: [
            {
                pubkey: payer.publicKey,
                isSigner: true,
                isWritable: true,
            },
            {
                pubkey: vault,
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: web3.SystemProgram.programId,
                isSigner: false,
                isWritable: false,
            }
        ]
    });

    tx.add(ins);
    const sig = await web3.sendAndConfirmTransaction(connection, tx, [payer]);
    console.log(`url: https://explorer.solana.com/tx/${sig}?cluster=devnet`);
}
