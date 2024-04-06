// No imports needed: web3, borsh, pg and more are globally available
import { serialize, deserialize, deserializeUnchecked } from "borsh";
import { Buffer } from "buffer";
/**
 * The state of a greeting account managed by the hello world program
 */
class GreetingAccount {
  message = "";
  constructor(fields: { message: string } | undefined = undefined) {
    if (fields) {
      this.message = fields.message;
    }
  }
}

/**
 * Borsh schema definition for greeting accounts
 */
const GreetingSchema = new Map([
  [GreetingAccount, { kind: "struct", fields: [["counter", "String"]] }],
]);

class Assignable {
  constructor(properties) {
    Object.keys(properties).map((key) => {
      return (this[key] = properties[key]);
    });
  }
}

// Our instruction payload vocabulary
class CreateInstruction extends Assignable {}
class ModifyInstruction extends Assignable {}
class DeleteInstruction extends Assignable {}

// Borsh needs a schema describing the payload
const helloWorldInstructionSchema = new Map([
  [
    CreateInstruction,
    {
      kind: "struct",
      fields: [
        ["id", "u8"],
        ["msg", "String"],
      ],
    },
  ],
  [
    ModifyInstruction,
    {
      kind: "struct",
      fields: [
        ["id", "u8"],
        ["msg", "String"],
      ],
    },
  ],
  [
    DeleteInstruction,
    {
      kind: "struct",
      fields: [["id", "u8"]],
    },
  ],
]);

// Instruction variant indexes
enum InstructionVariant {
  Create = 0,
  Modify = 1,
  Delete = 2,
}

/**
 * The expected size of each greeting account.
 */
const GREETING_SIZE = borsh.serialize(
  GreetingSchema,
  new GreetingAccount({ message: "1234567890" })
).length;

// Create greetings account instruction
const greetingAccountKp = new web3.Keypair();
const lamports = await pg.connection.getMinimumBalanceForRentExemption(
  GREETING_SIZE
);
const createGreetingAccountIx = web3.SystemProgram.createAccount({
  fromPubkey: pg.wallet.publicKey,
  lamports,
  newAccountPubkey: greetingAccountKp.publicKey,
  programId: pg.PROGRAM_ID,
  space: GREETING_SIZE,
});

const createIx = new CreateInstruction({
  id: InstructionVariant.Create,
  msg: "123",
});

// Serialize the payload
const createSerBuf = Buffer.from(
  serialize(helloWorldInstructionSchema, createIx)
);

// Create greet instruction
const greetIx = new web3.TransactionInstruction({
  data: createSerBuf,
  keys: [
    {
      pubkey: greetingAccountKp.publicKey,
      isSigner: false,
      isWritable: true,
    },
  ],
  programId: pg.PROGRAM_ID,
});

// Create transaction and add the instructions
const tx = new web3.Transaction();
tx.add(createGreetingAccountIx, greetIx);

// Send and confirm the transaction
const txHash = await web3.sendAndConfirmTransaction(pg.connection, tx, [
  pg.wallet.keypair,
  greetingAccountKp,
]);
console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);

// Fetch the greetings account
const greetingAccount = await pg.connection.getAccountInfo(
  greetingAccountKp.publicKey
);

// Deserialize the account data
const deserializedAccountData = borsh.deserialize(
  GreetingSchema,
  GreetingAccount,
  greetingAccount.data
);

console.log(
  `deserializedAccountData.counter ${deserializedAccountData.counter}`
);

const modifyIx = new CreateInstruction({
  id: InstructionVariant.Create,
  msg: "321",
});

// Serialize the payload
const modifySerBuf = Buffer.from(
  serialize(helloWorldInstructionSchema, modifyIx)
);

// Create greet instruction
const modifyTI = new web3.TransactionInstruction({
  data: modifySerBuf,
  keys: [
    {
      pubkey: greetingAccountKp.publicKey,
      isSigner: false,
      isWritable: true,
    },
  ],
  programId: pg.PROGRAM_ID,
});

// Create transaction and add the instructions
const tx2 = new web3.Transaction();
tx2.add(modifyTI);

// Send and confirm the transaction
const txHash2 = await web3.sendAndConfirmTransaction(pg.connection, tx2, [
  pg.wallet.keypair,
  greetingAccountKp,
]);
console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);

// Fetch the greetings account
const greetingAccount2 = await pg.connection.getAccountInfo(
  greetingAccountKp.publicKey
);

// Deserialize the account data
const deserializedAccountData2 = borsh.deserialize(
  GreetingSchema,
  GreetingAccount,
  greetingAccount2.data
);

console.log(
  `after modify deserializedAccountData.counter ${deserializedAccountData2.message}`
);

const deleteIx = new CreateInstruction({
  id: InstructionVariant.Delete,
});

// Serialize the payload
const deleteSerBuf = Buffer.from(
  serialize(helloWorldInstructionSchema, deleteIx)
);

// Create greet instruction
const deleteTI = new web3.TransactionInstruction({
  data: deleteSerBuf,
  keys: [
    {
      pubkey: pg.wallet.keypair.publicKey,
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: greetingAccountKp.publicKey,
      isSigner: true,
      isWritable: true,
    },
  ],
  programId: pg.PROGRAM_ID,
});

// Create transaction and add the instructions
const tx3 = new web3.Transaction();
tx3.add(deleteTI);

// Send and confirm the transaction
const txHash3 = await web3.sendAndConfirmTransaction(pg.connection, tx3, [
  pg.wallet.keypair,
  greetingAccountKp,
]);
console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);

// Fetch the greetings account
const greetingAccount3 = await pg.connection.getAccountInfo(
  greetingAccountKp.publicKey
);

// Deserialize the account data
const deserializedAccountData3 = borsh.deserialize(
  GreetingSchema,
  GreetingAccount,
  greetingAccount3.data
);

console.log(
  `after delete deserializedAccountData.message ${deserializedAccountData3.message}`
);
