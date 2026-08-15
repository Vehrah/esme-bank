const ACCOUNT_TIER_LIMITS = {
  Basic: {
    maxBalance: 20000,
    dailyDeposit: 5000,
    dailyWithdrawal: 2000,
    dailyTransfer: 3000,
  },

  Gold: {
    maxBalance: 50000,
    dailyDeposit: 20000,
    dailyWithdrawal: 10000,
    dailyTransfer: 15000,
  },

  Platinum: {
    maxBalance: 250000,
    dailyDeposit: 100000,
    dailyWithdrawal: 50000,
    dailyTransfer: 75000,
  },
};

module.exports = ACCOUNT_TIER_LIMITS;