use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::next_account_info,
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    program::invoke_signed,
    pubkey::Pubkey,
    system_instruction, system_program,
    sysvar::{rent::Rent, Sysvar},
};

entrypoint!(process_instruction);

fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let ins = CreateAccountInstruction::deserialize(&mut &instruction_data[..])?;

    let account_info_iter = &mut accounts.iter();

    let payer = next_account_info(account_info_iter)?;
    let new_account_pda = next_account_info(account_info_iter)?;
    let system_account = next_account_info(account_info_iter)?;

    assert!(payer.is_signer);
    assert!(payer.is_writable);

    // Note that `new_account_pda` is not signer yet.
    // This program will sign fro it via `invoke_signed`.
    assert!(!new_account_pda.is_signer);
    assert!(new_account_pda.is_writable);
    assert!(system_program::check_id(system_account.key));

    let new_account_bump_seed = ins.new_account_bump_seed;
    let rent = Rent::get()?.minimum_balance(ins.space.try_into().expect("overflow"));

    invoke_signed(
        &system_instruction::create_account(
            payer.key,
            new_account_pda.key,
            rent,
            ins.space,
            &system_program::ID,
        ),
        &[payer.clone(), new_account_pda.clone()],
        &[&[b"vault", payer.key.as_ref(), &[new_account_bump_seed]]],
    )?;

    Ok(())
}

#[derive(BorshDeserialize, BorshSerialize)]
pub struct CreateAccountInstruction {
    /// The PDA bump seed
    pub new_account_bump_seed: u8,
    /// The amount of space to allocate for `new_account_bump_pda`
    pub space: u64,
}
