
import * as web3 from "@solana/web3.js";
import { invokeProgram } from "./invoke-program";

const devnet = "https://neat-twilight-seed.solana-devnet.quiknode.pro/f5b58eab34b737385de4001f1eddd79b998e3e29/";

(async () => {
  const con = new web3.Connection(devnet);
  let privateKey = "dbd618298430042d13193f0eaaa30ca0a7f38b6027e360569fafbddca5a52b5ad8c0cc7efb4771e05c722aae9c353918b55af9c26a6bdf5edd195ec9f1aae8e7";
  const privateKeyBytes = new Uint8Array(privateKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const kp = web3.Keypair.fromSecretKey(privateKeyBytes);
  console.log(`public key: ${kp.publicKey.toBase58()}`);
  await invokeProgram(con, kp);
})();