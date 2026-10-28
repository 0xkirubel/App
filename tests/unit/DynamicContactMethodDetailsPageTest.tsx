import {act, render} from '@testing-library/react-native';

import HTMLEngineProvider from '@components/HTMLEngineProvider';

import * as UserActions from '@libs/actions/User';
import Navigation from '@libs/Navigation/Navigation';

import DynamicContactMethodDetailsPage from '@pages/settings/Profile/Contacts/DynamicContactMethodDetailsPage';

import ONYXKEYS from '@src/ONYXKEYS';

import Onyx from 'react-native-onyx';

import type {MockFetch} from '../utils/TestHelper';

import {getGlobalFetchMock} from '../utils/TestHelper';
import waitForBatchedUpdates from '../utils/waitForBatchedUpdates';
import waitForBatchedUpdatesWithAct from '../utils/waitForBatchedUpdatesWithAct';

const mockUseIsFocused = jest.fn(() => true);
const mockUseDynamicBackPath = jest.fn(() => '');

jest.mock('@react-navigation/native', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const actualNav = jest.requireActual('@react-navigation/native');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return {
        ...actualNav,
        useIsFocused: () => mockUseIsFocused(),
        useRoute: jest.fn(() => ({name: '', key: '', params: {}})),
        usePreventRemove: jest.fn(),
    };
});

jest.mock('@libs/Navigation/Navigation', () => ({
    getActiveRoute: jest.fn(() => ''),
    getActiveRouteWithoutParams: jest.fn(() => ''),
    isNavigationReady: jest.fn(() => Promise.resolve()),
    goBack: jest.fn(),
}));

jest.mock('@hooks/useDynamicBackPath', () => jest.fn((...args: unknown[]) => mockUseDynamicBackPath(...args)));

jest.mock('@components/DelegateNoAccessModalProvider', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const actual = jest.requireActual('@components/DelegateNoAccessModalProvider');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return {
        ...actual,
        useDelegateNoAccessState: () => ({isActingAsDelegate: false, isDelegateAccessRestricted: false}),
        useDelegateNoAccessActions: () => ({showDelegateNoAccessModal: jest.fn()}),
    };
});

jest.mock('@libs/actions/User', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const originalModule = jest.requireActual('@libs/actions/User');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return {
        ...originalModule,
        resetContactMethodValidateCodeSentState: jest.fn(),
    };
});

function HTMLProviderWrapper({children}: {children: React.ReactNode}) {
    return <HTMLEngineProvider>{children}</HTMLEngineProvider>;
}

const fakeEmail = 'fake@gmail.com';
const mockRoute = {
    params: {
        contactMethod: fakeEmail,
    },
};
const mockLoginList = {
    [`1_${fakeEmail}`]: {
        partnerID: 1,
        partnerUserID: fakeEmail,
        validatedDate: 'fake-validatedDate',
    },
};

describe('DynamicContactMethodDetailsPage', () => {
    let mockFetch: MockFetch;
    beforeAll(() => {
        Onyx.init({
            keys: ONYXKEYS,
        });
    });
    beforeEach(() => {
        const globalFetchMock = getGlobalFetchMock();
        global.fetch = globalFetchMock;
        mockFetch = globalFetchMock;
        mockUseIsFocused.mockReturnValue(true);
        mockUseDynamicBackPath.mockReturnValue('');
        jest.mocked(Navigation.getActiveRoute).mockReturnValue('');
        jest.mocked(Navigation.goBack).mockClear();
        return Onyx.clear().then(waitForBatchedUpdates);
    });

    function ContactMethodDetailsPageRenderer() {
        return (
            <HTMLProviderWrapper>
                <DynamicContactMethodDetailsPage
                    // @ts-expect-error - Ignoring type errors for testing purposes
                    route={mockRoute}
                />
            </HTMLProviderWrapper>
        );
    }

    it('should not call resetContactMethodValidateCodeSentState when we got a delete pending field', async () => {
        // Given a login list with a validated contact method
        Onyx.merge(ONYXKEYS.LOGINS, mockLoginList);
        await waitForBatchedUpdates();

        // Given the page is rendered
        render(<ContactMethodDetailsPageRenderer />);

        // When a deleteContactMethod called
        UserActions.deleteContactMethod(fakeEmail, mockLoginList);
        await waitForBatchedUpdatesWithAct();

        // When the deletion is successful
        mockFetch?.succeed();
        await waitForBatchedUpdates();
        mockFetch?.resume();
        await waitForBatchedUpdates();

        // Then resetContactMethodValidateCodeSentState should not be called
        expect(UserActions.resetContactMethodValidateCodeSentState).not.toHaveBeenCalled();
    });

    it('should not call resetContactMethodValidateCodeSentState when the login data has no partnerUserID', async () => {
        // Given a login list with a contact method that has no partnerUserID
        Onyx.merge(ONYXKEYS.LOGINS, {
            [`1_${fakeEmail}`]: {
                partnerID: 1,

                partnerUserID: '',
                validatedDate: '',
            },
        });
        await waitForBatchedUpdates();

        // Given the page is rendered
        render(<ContactMethodDetailsPageRenderer />);
        await waitForBatchedUpdatesWithAct();

        // Then resetContactMethodValidateCodeSentState should not be called
        expect(UserActions.resetContactMethodValidateCodeSentState).not.toHaveBeenCalled();
    });

    it('calls Navigation.goBack when contact method becomes validated and screen is focused', async () => {
        Onyx.merge(ONYXKEYS.SESSION, {email: fakeEmail});
        Onyx.merge(ONYXKEYS.IS_LOADING_REPORT_DATA, false);
        Onyx.merge(ONYXKEYS.LOGINS, {
            [`1_${fakeEmail}`]: {
                partnerID: 1,

                partnerUserID: fakeEmail,
                validatedDate: '',
            },
        });
        await waitForBatchedUpdates();

        render(<ContactMethodDetailsPageRenderer />);
        await waitForBatchedUpdatesWithAct();

        await act(async () => {
            Onyx.merge(ONYXKEYS.LOGINS, {
                [`1_${fakeEmail}`]: {
                    partnerID: 1,

                    partnerUserID: fakeEmail,
                    validatedDate: '2024-01-01',
                },
            });
        });
        await waitForBatchedUpdatesWithAct();

        expect(Navigation.goBack).toHaveBeenCalled();
    });

    it('goes back to the contact methods list when the screen is refocused after being validated under another screen', async () => {
        const contactMethodsListPath = 'settings/profile/contact-methods';
        const detailsPath = `settings/profile/contact-methods/${encodeURIComponent(fakeEmail)}/details`;
        const staleModalPath = `test-tools?backTo=${encodeURIComponent(detailsPath)}`;

        mockUseIsFocused.mockReturnValue(false);
        mockUseDynamicBackPath.mockReturnValue(staleModalPath);
        jest.mocked(Navigation.getActiveRoute).mockReturnValue(detailsPath);

        Onyx.merge(ONYXKEYS.SESSION, {email: fakeEmail});
        Onyx.merge(ONYXKEYS.IS_LOADING_REPORT_DATA, false);
        Onyx.merge(ONYXKEYS.LOGINS, {
            [`1_${fakeEmail}`]: {
                partnerID: 1,
                partnerUserID: fakeEmail,
                validatedDate: '',
            },
        });
        await waitForBatchedUpdates();

        const {rerender} = render(<ContactMethodDetailsPageRenderer />);
        await waitForBatchedUpdatesWithAct();

        await act(async () => {
            Onyx.merge(ONYXKEYS.LOGINS, {
                [`1_${fakeEmail}`]: {
                    partnerID: 1,
                    partnerUserID: fakeEmail,
                    validatedDate: '2024-01-01',
                },
            });
        });
        await waitForBatchedUpdatesWithAct();

        expect(Navigation.goBack).not.toHaveBeenCalled();

        mockUseIsFocused.mockReturnValue(true);
        rerender(<ContactMethodDetailsPageRenderer />);
        await waitForBatchedUpdatesWithAct();

        expect(Navigation.goBack).toHaveBeenCalledTimes(1);
        expect(Navigation.goBack).toHaveBeenCalledWith(contactMethodsListPath);
    });

    it('does not go back when opening an already validated contact method', async () => {
        Onyx.merge(ONYXKEYS.SESSION, {email: fakeEmail});
        Onyx.merge(ONYXKEYS.IS_LOADING_REPORT_DATA, false);
        Onyx.merge(ONYXKEYS.LOGINS, mockLoginList);
        await waitForBatchedUpdates();

        render(<ContactMethodDetailsPageRenderer />);
        await waitForBatchedUpdatesWithAct();

        expect(Navigation.goBack).not.toHaveBeenCalled();
    });
});
