use solana_program::{
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    msg,
    account_info::{next_account_info, AccountInfo},
    system_instruction,
    program_error::ProgramError,
    sysvar::{rent::Rent, Sysvar},
    program::{invoke, invoke_signed},
    borsh::try_from_slice_unchecked,
    program_pack::{IsInitialized},
    clock::Clock
};
use spl_token::{
    ID as spl_token_program_id,
};
use std::convert::TryInto;
use crate::error::StakeError;
use crate::instruction::StakeInstruction;
use crate::state::{UserStakeInfo, StakeState};
use mpl_token_metadata::{
    ID as mpl_metadata_program_id
};
use borsh::BorshSerialize;


pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8]
  ) -> ProgramResult {

    let instruction = StakeInstruction::unpack(instruction_data)?;
    match instruction {
        StakeInstruction::Stake {} => {
            process_stake(program_id, accounts)
        },
        StakeInstruction::Redeem {} => {
            process_redeem(program_id, accounts)
        },
        StakeInstruction::Unstake {} => {
            process_unstake(program_id, accounts)
        }
    }
}

pub fn process_stake(
  program_id: &Pubkey,
  accounts: &[AccountInfo],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let user = next_account_info(account_info_iter)?;
    let nft_token_account = next_account_info(account_info_iter)?;
    let nft_mint = next_account_info(account_info_iter)?;
    let nft_edition = next_account_info(account_info_iter)?;
    let stake_state = next_account_info(account_info_iter)?;
    let program_authority = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;
    let metadata_program = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;
    // Getting clock directly
    let clock = Clock::get()?;

    // derive delegated authority pda
    let (delegated_auth_pda, delegate_bump) = Pubkey::find_program_address(&[b"authority"], program_id);
    if delegated_auth_pda != *program_authority.key {
        msg!("Invalid seeds for PDA");
        return Err(ProgramError::InvalidArgument)
    }

    // derive stake state pda
    let (stake_state_pda, bump_seed) = Pubkey::find_program_address(&[user.key.as_ref(), nft_token_account.key.as_ref(),], program_id);
    if stake_state_pda != *stake_state.key {
        msg!("Invalid seeds for PDA");
        return Err(ProgramError::InvalidArgument)
    }

    // create stake state account at pda
    let account_len: usize = 32 + 64 + 64 + 32 + 25 + 1;
    let rent = Rent::get()?;
    let rent_lamports = rent.minimum_balance(account_len);
    msg!("Creating state account");
    invoke_signed(
        &system_instruction::create_account(
        user.key,
        stake_state.key,
        rent_lamports,
        account_len.try_into().unwrap(),
        program_id,
        ),
        &[user.clone(), stake_state.clone(), system_program.clone()],
        &[&[user.key.as_ref(), nft_token_account.key.as_ref(), &[bump_seed]]],
    )?;

    msg!("CPI to approve ix on token program");
    invoke(
        &spl_token::instruction::approve(
            &spl_token_program_id,
            nft_token_account.key,
            program_authority.key,
            user.key,
            &[user.key],
            1
        )?,
        &[nft_token_account.clone(), program_authority.clone(), user.clone(), token_program.clone()]
    )?;

    msg!("CPI to invoke freeze ix on token program");
    invoke_signed(
        &mpl_token_metadata::instruction::freeze_delegated_account(
            mpl_metadata_program_id,
            *program_authority.key,
            *nft_token_account.key,
            *nft_edition.key,
            *nft_mint.key
        ),
        &[program_authority.clone(), nft_token_account.clone(), nft_edition.clone(), nft_mint.clone(), metadata_program.clone()],
        &[&[b"authority", &[delegate_bump]]]
    )?;

    let mut account_data = try_from_slice_unchecked::<UserStakeInfo>(&stake_state.data.borrow()).unwrap();
    if account_data.is_initialized() {
        msg!("Account already initialized");
        return Err(ProgramError::AccountAlreadyInitialized);
    }
    account_data.token_account = *nft_token_account.key;
    account_data.user_pubkey = *user.key;
    account_data.stake_state = StakeState::Staked;
    account_data.stake_start_time = clock.unix_timestamp;
    account_data.last_stake_redeem = clock.unix_timestamp;
    account_data.is_initialized = true;

    msg!("NFT token account: {:?}", account_data.token_account);
    msg!("User pubkey: {:?}", account_data.user_pubkey);
    msg!("Stake state: {:?}", account_data.stake_state);
    msg!("Stake start time: {:?}", account_data.stake_start_time);
    msg!("Time since last redeem: {:?}", account_data.last_stake_redeem);

    account_data.serialize(&mut &mut stake_state.data.borrow_mut()[..])?;
    Ok(())
}

pub fn process_redeem(
program_id: &Pubkey,
accounts: &[AccountInfo],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let user = next_account_info(account_info_iter)?;
    let nft_token_account = next_account_info(account_info_iter)?;
    let stake_state = next_account_info(account_info_iter)?;
    let stake_mint = next_account_info(account_info_iter)?;
    let stake_authority = next_account_info(account_info_iter)?;
    let user_stake_ata = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;
    // Getting clock directly
    let clock = Clock::get()?;

    // Validations on Staking state account
    let (stake_state_pda, _bump_seed) = Pubkey::find_program_address(&[user.key.as_ref(), nft_token_account.key.as_ref(),], program_id);
    if stake_state_pda != *stake_state.key {
        msg!("Invalid seeds for PDA");
        return Err(ProgramError::InvalidArgument)
    }

    // deserialize user stake state
    let mut account_data = try_from_slice_unchecked::<UserStakeInfo>(&stake_state.data.borrow()).unwrap();
    if !account_data.is_initialized() {
        msg!("Account is not initialized");
        return Err(StakeError::UnitializedAccount.into());
    }
    if account_data.stake_state != StakeState::Staked {
        msg!("Stake account is not staking anything");
        return Err(ProgramError::InvalidArgument)
    }
    if *user.key != account_data.user_pubkey {
        msg!("Incorrect stake account for user");
        return Err(StakeError::InvalidStakeAccount.into());
    }
    if *nft_token_account.key != account_data.token_account{
        msg!("NFT Token accounts do not match");
        return Err(StakeError::InvalidTokenAccount.into());
    }
    // Validate minting authority
    let (stake_auth_pda, auth_bump) = Pubkey::find_program_address(&[b"mint"], program_id);
    if *stake_authority.key != stake_auth_pda {
        msg!("Invalid stake mint authority!");
        return Err(StakeError::InvalidPDA.into());
    }

    // Calculate stake rewards based on amount of time staked
    msg!("Stake last redeem: {:?}", account_data.last_stake_redeem);
    msg!("Current time: {:?}", clock.unix_timestamp);
    let unix_time = clock.unix_timestamp - account_data.last_stake_redeem;
    msg!("Seconds since last redeem: {}", unix_time);
    let redeem_amount = 1000000 * unix_time;
    msg!("Elligible redeem amount in lamports: {}", redeem_amount);

    // mint stake rewards to user
    invoke_signed(
        &spl_token::instruction::mint_to(
            token_program.key,
            stake_mint.key,
            user_stake_ata.key,
            stake_authority.key,
            &[stake_authority.key],
            redeem_amount.try_into().unwrap()
        )?,
        &[stake_mint.clone(), user_stake_ata.clone(), stake_authority.clone(), token_program.clone()],
        &[&[b"mint", &[auth_bump]]]
    )?;

    account_data.last_stake_redeem = clock.unix_timestamp;
    msg!("Updated last stake time: {:?}", account_data.last_stake_redeem);
    account_data.serialize(&mut &mut stake_state.data.borrow_mut()[..])?;

    Ok(())
}

pub fn process_unstake(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let user = next_account_info(account_info_iter)?;
    let nft_token_account = next_account_info(account_info_iter)?;
    let nft_mint = next_account_info(account_info_iter)?;
    let nft_edition = next_account_info(account_info_iter)?;
    let stake_state = next_account_info(account_info_iter)?;
    let program_authority = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;
    let metadata_program = next_account_info(account_info_iter)?;

    // derive stake state pda
    let (stake_state_pda, _bump_seed) = Pubkey::find_program_address(&[user.key.as_ref(), nft_token_account.key.as_ref(),], program_id);
    if stake_state_pda != *stake_state.key {
        msg!("Invalid seeds for PDA");
        return Err(ProgramError::InvalidArgument)
    }
    let mut account_data = try_from_slice_unchecked::<UserStakeInfo>(&stake_state.data.borrow()).unwrap();
    if !account_data.is_initialized() {
        msg!("Account is not initialized");
        return Err(StakeError::UnitializedAccount.into());
    }
    if account_data.stake_state != StakeState::Staked {
        msg!("Stake account is not staking anything");
        return Err(ProgramError::InvalidArgument)
    }
    // derive delegated auth pda
    let (delegated_auth_pda, delegate_bump) = Pubkey::find_program_address(&[b"authority"], program_id);
    if delegated_auth_pda != *program_authority.key {
        msg!("Invalid seeds for PDA");
        return Err(ProgramError::InvalidArgument)
    }

    // Thaw NFT token account
    msg!("Thawing NFT token account...");
    invoke_signed(
        &mpl_token_metadata::instruction::thaw_delegated_account(
            mpl_metadata_program_id,
            *program_authority.key,
            *nft_token_account.key,
            *nft_edition.key,
            *nft_mint.key
        ),
        &[program_authority.clone(), nft_token_account.clone(), nft_edition.clone(), nft_mint.clone(), metadata_program.clone()],
        &[&[b"authority", &[delegate_bump]]]
    )?;

    msg!("Revoking delegation...");
    invoke(
        &spl_token::instruction::revoke(
            token_program.key,
            nft_token_account.key,
            user.key,
            &[user.key]
        )?,
        &[nft_token_account.clone(), user.clone(), token_program.clone()]
    )?;
    
    account_data.stake_state = StakeState::Unstaked;
    account_data.serialize(&mut &mut stake_state.data.borrow_mut()[..])?;
    
    Ok(())
}