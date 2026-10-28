import {hasInProgressVBBA} from '@libs/ReimbursementAccountUtils';
import type {ACHDataReimbursementAccount} from '@src/types/onyx/ReimbursementAccount';

/**
 * Non-USD Corpay bank accounts are created once per policy during Bank Info confirmation.
 * When achData already reflects a created account for this policy, Confirm should advance the flow
 * instead of dispatching another BANK_ACCOUNT_CREATE_CORPAY request.
 */
function shouldSkipCorpayBankAccountCreation(achData: ACHDataReimbursementAccount | undefined, policyID: string): boolean {
    return hasInProgressVBBA(achData, true, policyID);
}

export default shouldSkipCorpayBankAccountCreation;
