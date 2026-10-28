import type {InvalidateAvatarImageCache} from './types';

/** Browsers revalidate avatar URLs; native is the only platform that needs eviction. */
const invalidateAvatarImageCache: InvalidateAvatarImageCache = () => Promise.resolve();

export default invalidateAvatarImageCache;
