import {translateLocal} from '../../../utils/TestHelper';

import {getWorkspaceRules} from '@pages/workspace/duplicate/utils';

import CONST from '@src/CONST';
import type {Policy, PolicyCategories} from '@src/types/onyx';

import createRandomPolicy from '../../../utils/collections/policies';

describe('getWorkspaceRules', () => {
    const translate = translateLocal;

    it('returns null when Rules is disabled even if default rule fields are present on the policy', () => {
        // Given a Control workspace with Rules off but leftover values that used to make the duplicate list non-empty
        const policy: Policy = {
            ...createRandomPolicy(1, CONST.POLICY.TYPE.CORPORATE),
            areRulesEnabled: false,
            prohibitedExpenses: CONST.POLICY.DEFAULT_PROHIBITED_EXPENSES,
            glCodes: true,
            disabledFields: {defaultBillable: true, reimbursable: false},
        };

        // When the duplicate helper builds the Rules row list
        const rules = getWorkspaceRules(policy, translate);

        // Then no Rules row should be offered
        expect(rules).toBeNull();
    });

    it('returns rule labels when Rules is enabled and values exist', () => {
        // Given Rules on with eReceipts configured
        const policy: Policy = {
            ...createRandomPolicy(2, CONST.POLICY.TYPE.CORPORATE),
            areRulesEnabled: true,
            eReceipts: true,
            maxExpenseAmountNoReceipt: CONST.DISABLED_MAX_EXPENSE_VALUE,
            maxExpenseAmount: CONST.DISABLED_MAX_EXPENSE_VALUE,
            maxExpenseAge: CONST.DISABLED_MAX_EXPENSE_VALUE,
        };

        const rules = getWorkspaceRules(policy, translate);

        expect(rules).toContain(translate('workspace.rules.individualExpenseRules.eReceipts'));
    });

    it('returns rule labels for migrated Control policies whose Rules state lives in category rules', () => {
        const policy: Policy = {
            ...createRandomPolicy(3, CONST.POLICY.TYPE.CORPORATE),
            areRulesEnabled: undefined,
            eReceipts: true,
        };
        const policyCategories: PolicyCategories = {
            Travel: {
                name: 'Travel',
                enabled: true,
                maxExpenseAmount: 100,
            },
        };

        const rules = getWorkspaceRules(policy, translate, policyCategories);

        expect(rules).toContain(translate('workspace.rules.individualExpenseRules.eReceipts'));
    });
});
