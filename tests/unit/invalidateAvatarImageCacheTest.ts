import {Image} from 'expo-image';
import RNFS from 'react-native-fs';

import Log from '@libs/Log';

import CONST from '@src/CONST';

import invalidateAvatarImageCache, {getUploadedAvatarURLVariants} from '../../src/libs/invalidateAvatarImageCache/index.native';

jest.mock('expo-image', () => ({
    Image: {
        clearMemoryCache: jest.fn(() => Promise.resolve()),
        getCachePathAsync: jest.fn(() => Promise.resolve(null)),
    },
}));

jest.mock('react-native-fs', () => ({
    unlink: jest.fn(() => Promise.resolve()),
}));

jest.mock('@libs/Log');

const mockClearMemoryCache = jest.mocked(Image.clearMemoryCache);
const mockGetCachePathAsync = jest.mocked(Image.getCachePathAsync);
const mockUnlink = jest.mocked(RNFS.unlink);

describe('invalidateAvatarImageCache', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getUploadedAvatarURLVariants', () => {
        it('returns full-size and _128 URLs for uploaded CloudFront avatars', () => {
            const fullSize = 'https://d1wpcgnaa73g0y.cloudfront.net/abc123.jpeg';
            expect(getUploadedAvatarURLVariants(fullSize)).toEqual([fullSize, 'https://d1wpcgnaa73g0y.cloudfront.net/abc123_128.jpeg']);
        });

        it('returns nothing for generated letter avatars', () => {
            const letterAvatar = `${CONST.CLOUDFRONT_URL}${CONST.GENERATED_LETTER_AVATAR_PATH}v1/blue100/AB.png`;
            expect(getUploadedAvatarURLVariants(letterAvatar)).toEqual([]);
        });
    });

    describe('invalidateAvatarImageCache', () => {
        it('clears memory and deletes cached files for both avatar sizes', async () => {
            const fullSize = 'https://d1wpcgnaa73g0y.cloudfront.net/abc123.jpeg';
            const thumbnail = 'https://d1wpcgnaa73g0y.cloudfront.net/abc123_128.jpeg';

            mockGetCachePathAsync.mockImplementation((url: string) => {
                if (url === fullSize) {
                    return Promise.resolve('/cache/full.jpeg');
                }
                if (url === thumbnail) {
                    return Promise.resolve('/cache/thumb.jpeg');
                }
                return Promise.resolve(null);
            });

            await invalidateAvatarImageCache(fullSize);

            expect(mockClearMemoryCache).toHaveBeenCalledTimes(1);
            expect(mockGetCachePathAsync).toHaveBeenCalledWith(fullSize);
            expect(mockGetCachePathAsync).toHaveBeenCalledWith(thumbnail);
            expect(mockUnlink).toHaveBeenCalledWith('/cache/full.jpeg');
            expect(mockUnlink).toHaveBeenCalledWith('/cache/thumb.jpeg');
        });

        it('still clears memory when the avatar URL is not an uploaded CloudFront photo', async () => {
            await invalidateAvatarImageCache('file://local-crop.jpg');

            expect(mockClearMemoryCache).toHaveBeenCalledTimes(1);
            expect(mockGetCachePathAsync).not.toHaveBeenCalled();
        });

        it('logs and continues when deleting a cached file fails', async () => {
            const fullSize = 'https://d1wpcgnaa73g0y.cloudfront.net/abc123.jpeg';
            mockGetCachePathAsync.mockResolvedValue('/cache/full.jpeg');
            mockUnlink.mockRejectedValue(new Error('permission denied'));

            await expect(invalidateAvatarImageCache(fullSize)).resolves.toBeUndefined();
            expect(Log.warn).toHaveBeenCalled();
        });
    });
});
