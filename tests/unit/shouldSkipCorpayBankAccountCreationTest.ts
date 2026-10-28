import shouldSkipCorpayBankAccountCreation from '@pages/ReimbursementAccount/NonUSD/utils/shouldSkipCorpayBankAccountCreation';

describe('shouldSkipCorpayBankAccountCreation', () => {
    const policyID = 'policy-123';

    test('returns false when no bank account exists for the policy', () => {
        // Given no achData yet
        // When checking whether to skip creation
        expect(shouldSkipCorpayBankAccountCreation(undefined, policyID)).toBe(false);
    });

    test('returns false when bankAccountID exists but created is not set', () => {
        // Given a partial achData state from an in-flight create attempt
        expect(
            shouldSkipCorpayBankAccountCreation(
                {
                    policyID,
                    bankAccountID: 42,
                },
                policyID,
            ),
        ).toBe(false);
    });

    test('returns false when achData belongs to a different policy', () => {
        // Given achData from another workspace on the singleton reimbursement account key
        expect(
            shouldSkipCorpayBankAccountCreation(
                {
                    policyID: 'other-policy',
                    bankAccountID: 42,
                    created: '2026-01-01',
                },
                policyID,
            ),
        ).toBe(false);
    });

    test('returns true when a non-USD Corpay account was already created for this policy', () => {
        // Given the server has persisted bankAccountID and created for this policy
        expect(
            shouldSkipCorpayBankAccountCreation(
                {
                    policyID,
                    bankAccountID: 42,
                    created: '2026-01-01',
                },
                policyID,
            ),
        ).toBe(true);
    });
});
