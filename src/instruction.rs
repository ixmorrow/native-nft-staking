use solana_program::{program_error::ProgramError};

pub enum StakeInstruction {
    Stake {},
    Redeem {},
    Unstake {}
}

impl StakeInstruction {
  pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (&variant, _rest) = input.split_first().ok_or(ProgramError::InvalidInstructionData)?;
        Ok(match variant {
            0 => Self::Stake {},
            1 => Self::Redeem {},
            2 => Self::Unstake {},
            _ => return Err(ProgramError::InvalidInstructionData)
        })
    }
}