/**
 * SiteManagerTwitter
 *
 * Fetches media (images and videos) posted by a Twitter/X user.
 *
 * Search query format:
 *   The search text is treated as a Twitter username.
 *   Leading "@" is stripped automatically.
 *   Example search: "@someartist" or "someartist"
 *
 * Authentication:
 *   Requires a Twitter API v2 Bearer Token stored in the model as `twitterBearerToken`.
 *   Users can generate one at https://developer.twitter.com/en/portal/dashboard
 *
 * Limitations:
 *   - The Twitter API v2 free tier allows fetching up to 100 tweets per request.
 *   - Only media attachments (photo, animated_gif, video) from the user's timeline are shown.
 *   - Pagination uses `pagination_token` from the API response.
 *   - Rating filtering is not applicable; all content is treated as "safe" by default
 *     since Twitter does not expose content ratings through the API.
 *   - MD5 deduplication is unavailable; Twitter does not provide MD5 hashes.
 */
class SiteManagerTwitter extends SiteManager
{
    constructor(sitesManager, pageLimit)
    {
        // pageLimit is used as max_results per request (capped to 100 by the API)
        super(sitesManager, SITE_TWITTER, 'https://api.twitter.com', Math.min(pageLimit, 100));

        this.resolvedUserId = null;
        this.resolvedUserName = null;
        this.paginationToken = null;
        this.lastSearchText = null;
    }

    // -------------------------------------------------------------------------
    // Overrides
    // -------------------------------------------------------------------------

    resetConnection()
    {
        super.resetConnection();
        this.resolvedUserId = null;
        this.resolvedUserName = null;
        this.paginationToken = null;
        this.lastSearchText = null;
    }

    buildPingRequestUrl()
    {
        // Ping by fetching a known public user; only succeeds if the token is set.
        if (!this._getBearerToken())
            return null;

        return this.url + '/2/users/by/username/Twitter?user.fields=id';
    }

    doesResponseTextIndicateOnline(responseText)
    {
        try
        {
            const json = JSON.parse(responseText);
            return json && json.data && json.data.id != null;
        }
        catch (e)
        {
            return false;
        }
    }

    /**
     * Twitter's search flow is two-step:
     *  1. Resolve the username → user ID (only when username changes between searches).
     *  2. Fetch user media timeline using the user ID.
     *
     * We override performSearch entirely because the base class assumes a single
     * synchronous URL build, but we need an async user-ID lookup first.
     */
    performSearch(searchText, doneSearchingSiteCallback)
    {
        if (!this.isOnline)
        {
            console.log('Trying to perform search on Twitter but the site is not online (Bearer Token may be missing).');
            return;
        }

        this.ranIntoErrorWhileSearching = false;

        const username = this._normalizeUsername(searchText);

        const siteManager = this;

        // If the username changed, reset pagination and re-resolve the user ID.
        if (username !== this.lastSearchText)
        {
            this.lastSearchText = username;
            this.paginationToken = null;
            this.resolvedUserId = null;
            this.resolvedUserName = null;
        }

        if (this.resolvedUserId == null)
        {
            this._resolveUserId(username, function(userId) {
                if (userId == null)
                {
                    siteManager.ranIntoErrorWhileSearching = true;
                    doneSearchingSiteCallback(siteManager);
                    return;
                }
                siteManager.resolvedUserId = userId;
                siteManager.resolvedUserName = username;
                siteManager._fetchMediaTimeline(doneSearchingSiteCallback);
            });
        }
        else
        {
            this._fetchMediaTimeline(doneSearchingSiteCallback);
        }
    }

    addSlides(responseText)
    {
        this._parseTimelineResponse(responseText);
    }

    addSlide(mediaItem)
    {
        // mediaItem is a custom object built in _parseTimelineResponse, not a raw API object.
        if (!mediaItem)
            return;

        const mediaType = this.getMediaTypeFromPath(mediaItem.fileUrl);

        if (!this.isMediaTypeSupported(mediaType))
            return;

        // Twitter has no rating system; treat all as safe and respect the safe filter.
        if (!this.isRatingAllowed('s'))
            return;

        const newSlide = new Slide(
            SITE_TWITTER,
            mediaItem.id,
            mediaItem.fileUrl,
            mediaItem.previewUrl,
            mediaItem.postUrl,
            mediaItem.width,
            mediaItem.height,
            mediaItem.date,
            mediaItem.likeCount,
            mediaType,
            null,           // no MD5 available from Twitter API
            mediaItem.tags
        );

        this.allUnsortedSlides.push(newSlide);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    _getBearerToken()
    {
        return this.sitesManager.model.twitterBearerToken || null;
    }

    _normalizeUsername(searchText)
    {
        return searchText.trim().replace(/^@/, '');
    }

    _buildAuthHeaders()
    {
        return { 'Authorization': 'Bearer ' + this._getBearerToken() };
    }

    _resolveUserId(username, callback)
    {
        const url = this.url + '/2/users/by/username/' + encodeURIComponent(username);
        const siteManager = this;

        this._makeAuthorizedRequest(
            url,
            function(responseText) {
                try
                {
                    const json = JSON.parse(responseText);
                    if (json && json.data && json.data.id)
                    {
                        callback(json.data.id);
                    }
                    else
                    {
                        siteManager.sitesManager.displayWarningMessage(
                            'Twitter: Could not find user "' + username + '". Check the username.'
                        );
                        callback(null);
                    }
                }
                catch (e)
                {
                    siteManager.sitesManager.displayWarningMessage('Twitter: Failed to parse user lookup response.');
                    callback(null);
                }
            },
            function(responseText, statusCode) {
                siteManager._handleTwitterError(responseText, statusCode, username);
                callback(null);
            },
            null,
            function() {
                siteManager.sitesManager.displayWarningMessage('Twitter: Network error during user lookup.');
                callback(null);
            }
        );
    }

    _fetchMediaTimeline(doneSearchingSiteCallback)
    {
        const url = this._buildTimelineUrl();
        const siteManager = this;

        this._makeAuthorizedRequest(
            url,
            function(responseText) {
                siteManager.lastPageLoaded++;
                logForDev(responseText);
                siteManager.addSlides(responseText);
            },
            function(responseText, statusCode) {
                siteManager.ranIntoErrorWhileSearching = true;
                siteManager._handleTwitterError(responseText, statusCode, siteManager.resolvedUserName);
            },
            function() {
                doneSearchingSiteCallback(siteManager);
            },
            function() {
                siteManager.ranIntoErrorWhileSearching = true;
                siteManager.sitesManager.displayWarningMessage('Twitter: Network error while fetching timeline.');
                doneSearchingSiteCallback(siteManager);
            }
        );
    }

    _buildTimelineUrl()
    {
        const maxResults = this.pageLimit;
        let url = this.url + '/2/users/' + this.resolvedUserId + '/tweets'
            + '?max_results=' + maxResults
            + '&tweet.fields=created_at,public_metrics,attachments'
            + '&expansions=attachments.media_keys'
            + '&media.fields=url,preview_image_url,width,height,type,variants';

        if (this.paginationToken)
        {
            url += '&pagination_token=' + encodeURIComponent(this.paginationToken);
        }

        return url;
    }

    _parseTimelineResponse(responseText)
    {
        let json;

        try
        {
            json = JSON.parse(responseText);
        }
        catch (e)
        {
            console.log('Twitter: Failed to parse timeline JSON.');
            return;
        }

        // Store next-page token for pagination
        this.paginationToken = (json.meta && json.meta.next_token) ? json.meta.next_token : null;
        this.hasExhaustedSearch = (this.paginationToken == null);

        const tweets = json.data;
        const mediaMap = this._buildMediaMap(json.includes);

        if (!tweets || tweets.length === 0)
        {
            this.hasExhaustedSearch = true;
            return;
        }

        for (const tweet of tweets)
        {
            if (!tweet.attachments || !tweet.attachments.media_keys)
                continue;

            const date = tweet.created_at ? new Date(tweet.created_at) : new Date(0);
            const likeCount = tweet.public_metrics ? tweet.public_metrics.like_count : 0;
            const postUrl = 'https://x.com/' + this.resolvedUserName + '/status/' + tweet.id;
            const tags = this.resolvedUserName;

            for (const mediaKey of tweet.attachments.media_keys)
            {
                const media = mediaMap[mediaKey];

                if (!media)
                    continue;

                const mediaItem = this._extractMediaItem(media, tweet.id, date, likeCount, postUrl, tags);

                if (mediaItem)
                    this.addSlide(mediaItem);
            }
        }
    }

    _buildMediaMap(includes)
    {
        const map = {};

        if (includes && includes.media)
        {
            for (const media of includes.media)
            {
                map[media.media_key] = media;
            }
        }

        return map;
    }

    _extractMediaItem(media, tweetId, date, likeCount, postUrl, tags)
    {
        let fileUrl = null;
        let previewUrl = null;
        let width = media.width || 0;
        let height = media.height || 0;

        if (media.type === 'photo')
        {
            fileUrl = media.url || null;
            previewUrl = fileUrl ? fileUrl + '?name=thumb' : null;
        }
        else if (media.type === 'animated_gif' || media.type === 'video')
        {
            // Pick the highest-bitrate mp4 variant
            if (media.variants && media.variants.length > 0)
            {
                const mp4Variants = media.variants.filter(v => v.content_type === 'video/mp4');
                if (mp4Variants.length > 0)
                {
                    mp4Variants.sort((a, b) => (b.bit_rate || 0) - (a.bit_rate || 0));
                    fileUrl = mp4Variants[0].url;
                }
            }
            previewUrl = media.preview_image_url || null;
        }

        if (!fileUrl)
            return null;

        // Derive a stable ID from the tweet ID + media key so thumbnails are unique
        const id = tweetId + '_' + (media.media_key || '');

        return {
            id: id,
            fileUrl: fileUrl,
            previewUrl: previewUrl || fileUrl,
            postUrl: postUrl,
            width: width,
            height: height,
            date: date,
            likeCount: likeCount,
            tags: tags
        };
    }

    _handleTwitterError(responseText, statusCode, username)
    {
        let message = 'Twitter: Error for user "' + (username || '?') + '" (HTTP ' + statusCode + ').';

        try
        {
            const json = JSON.parse(responseText);
            if (json && json.detail)
                message += ' ' + json.detail;
            else if (json && json.errors && json.errors[0] && json.errors[0].message)
                message += ' ' + json.errors[0].message;
        }
        catch (e) {}

        if (statusCode === 401)
            message += ' Your Bearer Token may be invalid or missing.';
        else if (statusCode === 403)
            message += ' Your app may not have the required permissions.';
        else if (statusCode === 429)
            message += ' Rate limit exceeded. Please wait before searching again.';

        this.sitesManager.displayWarningMessage(message);
    }

    /**
     * Makes an authenticated GET request using XHR with the Authorization header.
     * The base WebRequester does not support custom headers, so we handle it here.
     */
    _makeAuthorizedRequest(url, onSuccess, onError, onAfter, onNetworkError)
    {
        logForDev(url);

        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Authorization', 'Bearer ' + this._getBearerToken());

        xhr.onload = function() {
            if (xhr.status === 200)
            {
                if (onSuccess) onSuccess(xhr.responseText);
            }
            else
            {
                if (onError) onError(xhr.responseText, xhr.status);
            }

            if (onAfter) onAfter();
        };

        xhr.onerror = function() {
            if (onNetworkError) onNetworkError();
        };

        xhr.send();
    }

    // Not used — we override performSearch directly.
    buildRequestUrl(searchText, pageNumber)
    {
        return null;
    }
}
