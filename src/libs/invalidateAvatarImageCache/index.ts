import type {InvalidateAvatarImageCache} from './types';

/** Web browsers revalidate avatar URLs; native clears stale Glide/SDWebImage entries. */
const invalidateAvatarImageCache: InvalidateAvatarImageCache = () => Promise.resolve();

export default invalidateAvatarImageCache;
