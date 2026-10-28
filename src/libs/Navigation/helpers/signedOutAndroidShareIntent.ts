import Navigation from '@libs/Navigation/Navigation';
import navigationRef from '@libs/Navigation/navigationRef';
import {registerSessionCleanupCallback} from '@libs/SessionCleanup';

import NAVIGATORS from '@src/NAVIGATORS';
import ROUTES from '@src/ROUTES';

/** In-memory flag for a gallery share received before authentication. Not stored in Onyx so it cannot replay after reload or for the next account. */
let shouldResumeShareAfterOnboardingLanding = false;

function isShareRootRoute(route: string | undefined) {
    return !!route && route.startsWith(ROUTES.SHARE_ROOT);
}

function parkSignedOutShareForAfterOnboardingLanding() {
    shouldResumeShareAfterOnboardingLanding = true;
}

function hasParkedSignedOutShareForAfterOnboardingLanding() {
    return shouldResumeShareAfterOnboardingLanding;
}

function openParkedSignedOutShareAfterOnboardingLanding() {
    if (!shouldResumeShareAfterOnboardingLanding) {
        return;
    }

    shouldResumeShareAfterOnboardingLanding = false;

    const rootState = navigationRef.getRootState();
    const shareAlreadyMounted = rootState?.routes.some((rootRoute) => rootRoute.name === NAVIGATORS.SHARE_MODAL_NAVIGATOR);
    if (shareAlreadyMounted) {
        return;
    }

    Navigation.navigate(ROUTES.SHARE_ROOT, {waitForTransition: true});
}

registerSessionCleanupCallback(() => {
    shouldResumeShareAfterOnboardingLanding = false;
});

export {hasParkedSignedOutShareForAfterOnboardingLanding, isShareRootRoute, openParkedSignedOutShareAfterOnboardingLanding, parkSignedOutShareForAfterOnboardingLanding};
