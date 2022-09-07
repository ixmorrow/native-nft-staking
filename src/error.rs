use solana_program::{program_error::ProgramError};
use thiserror::Error;

/// Errors that may be returned by the MovieReview program.
#[derive(Debug, Error)]
pub enum StakeError{
    // 0
    /// UnitializedAccount
    #[error("Account not initialized yet")]
    UnitializedAccount,
    // 1
    // Incorrect PDA
    #[error("PDA derived does not equal PDA passed in")]
    InvalidPDA,
    // 2
    // Data is too long
    #[error("Input data exceeds max length")]
    InvalidDataLength,
    // 3
    // Rating is too high
    #[error("Rating cannot exceed 5")]
    RatingTooHigh,
    // 4
    // NFT Token Accounts do not match
    #[error("Account does not match token account stored in state account")]
    InvalidTokenAccount,
    // 5
    // Incorrect stake account
    #[error("User does not match this stake account")]
    InvalidStakeAccount,
}

impl From<StakeError> for ProgramError {
    fn from(e: StakeError) -> Self {
        ProgramError::Custom(e as u32)
    }
}