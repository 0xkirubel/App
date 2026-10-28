import getAvatarImageCacheURLs from '@libs/invalidateAvatarImageCache/getAvatarImageCacheURLs';

describe('getAvatarImageCacheURLs', () => {
    it('returns nothing for local and letter avatars', () => {
        // Given a local crop URI and a generated letter avatar URL
        const localURI = 'file:///data/user/0/com.expensify.chat/cache/crop.jpg';
        const letterURL = 'https://d2k5nsl2zxldvw.cloudfront.net/images/avatars/generated/v1/green/AB.png';

        // When resolving cache URLs to evict
        // Then neither source should produce remote cache keys
        expect(getAvatarImageCacheURLs(localURI)).toEqual([]);
        expect(getAvatarImageCacheURLs(letterURL)).toEqual([]);
    });

    it('returns full-size and _128 variants for a CloudFront user avatar', () => {
        // Given a canonical full-size avatar URL
        const fullSizeURL = 'https://d2k5nsl2zxldvw.cloudfront.net/images/avatars/user123456.jpeg';

        // When resolving cache URLs
        const urls = getAvatarImageCacheURLs(fullSizeURL);

        // Then both sizes used in the UI should be included
        expect(urls).toEqual([
            'https://d2k5nsl2zxldvw.cloudfront.net/images/avatars/user123456.jpeg',
            'https://d2k5nsl2zxldvw.cloudfront.net/images/avatars/user123456_128.jpeg',
        ]);
    });

    it('derives the full-size URL when given a _128 source', () => {
        // Given a thumbnail URL already loaded in lists
        const thumbnailURL = 'https://d2k5nsl2zxldvw.cloudfront.net/images/avatars/user123456_128.jpeg';

        // When resolving cache URLs
        const urls = getAvatarImageCacheURLs(thumbnailURL);

        // Then both variants are still returned
        expect(urls).toEqual([
            'https://d2k5nsl2zxldvw.cloudfront.net/images/avatars/user123456.jpeg',
            'https://d2k5nsl2zxldvw.cloudfront.net/images/avatars/user123456_128.jpeg',
        ]);
    });
});
