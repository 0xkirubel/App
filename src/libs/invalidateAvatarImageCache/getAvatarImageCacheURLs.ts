import CONST from '@src/CONST';

import {isGeneratedLetterAvatarURL} from '@libs/UserAvatarUtils';

/**
 * Returns the remote URLs whose expo-image disk entries should be dropped when a user-uploaded avatar is replaced.
 * User avatars are loaded at full size and at the `_128` variant; both must be evicted because Glide keys by URL.
 */
function getAvatarImageCacheURLs(avatarSource: string | undefined): string[] {
    if (!avatarSource?.startsWith('http')) {
        return [];
    }

    if (isGeneratedLetterAvatarURL(avatarSource)) {
        return [];
    }

    if (!CONST.CLOUDFRONT_DOMAIN_REGEX.test(avatarSource)) {
        return [avatarSource];
    }

    const lastPeriodIndex = avatarSource.lastIndexOf('.');
    if (lastPeriodIndex === -1) {
        return [avatarSource];
    }

    const has128Suffix = avatarSource.substring(lastPeriodIndex - 4, lastPeriodIndex) === '_128';
    const fullSizeURL = has128Suffix ? `${avatarSource.substring(0, lastPeriodIndex - 4)}${avatarSource.substring(lastPeriodIndex)}` : avatarSource;
    const smallSizeURL = has128Suffix
        ? avatarSource
        : `${avatarSource.substring(0, lastPeriodIndex)}_128${avatarSource.substring(lastPeriodIndex)}`;

    return fullSizeURL === smallSizeURL ? [fullSizeURL] : [fullSizeURL, smallSizeURL];
}

export default getAvatarImageCacheURLs;
