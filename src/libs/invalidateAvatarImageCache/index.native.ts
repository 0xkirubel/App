import {Image} from 'expo-image';
import RNFS from 'react-native-fs';

import Log from '@libs/Log';
import {isGeneratedLetterAvatarURL} from '@libs/UserAvatarUtils';

import CONST from '@src/CONST';

import type {InvalidateAvatarImageCache} from './types';

/** Returns full-size and _128 CloudFront URLs used when rendering uploaded avatars. */
function getUploadedAvatarURLVariants(avatarURL: string): string[] {
    if (!CONST.CLOUDFRONT_DOMAIN_REGEX.test(avatarURL) || isGeneratedLetterAvatarURL(avatarURL)) {
        return [];
    }

    const fullSizeURL = avatarURL.replace('_128', '');
    const lastPeriodIndex = fullSizeURL.lastIndexOf('.');
    if (lastPeriodIndex === -1) {
        return [fullSizeURL];
    }

    const thumbnailURL = `${fullSizeURL.substring(0, lastPeriodIndex)}_128${fullSizeURL.substring(lastPeriodIndex)}`;
    return fullSizeURL === thumbnailURL ? [fullSizeURL] : [fullSizeURL, thumbnailURL];
}

/**
 * Drops cached bitmaps for an uploaded avatar URL. The backend keeps one URL per account while replacing
 * the bytes, so native image caches must be cleared when that URL is about to show new content.
 */
const invalidateAvatarImageCache: InvalidateAvatarImageCache = async (avatarURL) => {
    await Image.clearMemoryCache();

    if (typeof avatarURL !== 'string' || !avatarURL.startsWith('http')) {
        return;
    }

    const urlVariants = getUploadedAvatarURLVariants(avatarURL);
    if (urlVariants.length === 0) {
        return;
    }

    await Promise.all(
        urlVariants.map(async (url) => {
            const cachePath = await Image.getCachePathAsync(url);
            if (!cachePath) {
                return;
            }
            await RNFS.unlink(cachePath).catch((error: unknown) => {
                Log.warn('[invalidateAvatarImageCache] Failed to delete a cached avatar file', String(error));
            });
        }),
    );
};

export default invalidateAvatarImageCache;
export {getUploadedAvatarURLVariants};
