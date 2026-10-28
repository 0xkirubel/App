import Log from '@libs/Log';

import {Image} from 'expo-image';
import {unlink} from 'react-native-fs';

import getAvatarImageCacheURLs from './getAvatarImageCacheURLs';
import type {InvalidateAvatarImageCache} from './types';

const invalidateAvatarImageCache: InvalidateAvatarImageCache = async (avatarSource) => {
    await Image.clearMemoryCache();

    const urls = getAvatarImageCacheURLs(avatarSource);
    if (urls.length === 0) {
        return;
    }

    await Promise.all(
        urls.map(async (url) => {
            const cachePath = await Image.getCachePathAsync(url);
            if (!cachePath) {
                return;
            }
            await unlink(cachePath).catch((error: unknown) => {
                Log.warn('[invalidateAvatarImageCache] Failed to delete cached avatar file', String(error));
            });
        }),
    );
};

export default invalidateAvatarImageCache;
