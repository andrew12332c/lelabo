/**
 * Used to generate an Instagram feed.
 *
 * https://acadaca.atlassian.net/wiki/spaces/PM/pages/1060995174/Migrating+to+new+Instagram+API
 *
 * JSON response structure:
 * {
      "data": [
        {
          "caption": "The Media's caption text. Not returnable for Media in albums.",
          "id": "The Media's ID.",
          "media_type": "The Media's type. Can be IMAGE, VIDEO, or CAROUSEL_ALBUM.",
          "media_url": "The Media's URL.",
          "permalink": "The Media's permanent URL.",
          "thumbnail_url": "The Media's thumbnail image URL. Only available on VIDEO Media.",
          "timestamp": "The Media's publish date in ISO 8601 format.",
          "username": "The Media owner's username."
        }
      ],
      "paging": {
        "cursors": {
          "before": "hash of previous page",
          "after": "hash of next page"
        },
        "next": "link to next page"
      }
    }
 *
 * @param options
 */
function InstagramFeed(options) {
    // for private methods
    var obj = this;

    var settings = $.extend({
        // the media to render
        data: null,

        // default map of media types to template names
        media_type_template_name_map: {
            IMAGE: '#instagram-feed-template',
            CAROUSEL_ALBUM: '#instagram-feed-template',
            VIDEO: '#instagram-feed-video-template'
        },

        // media types in this array will be rendered
        media_types_to_render: [
            'IMAGE', 'CAROUSEL_ALBUM', 'VIDEO'
        ],

        // target element to append the media to
        target_selector: '.instagram-feed',

        // the outermost wrapper element of the feed, which will be hidden if no media is found
        target_to_hide_selector: null,

        // max media items to render.  < 0 means unlimited
        max_to_render: 5,

        // attach the constructed object to the target
        attach: true,

        // optional renderer function
        renderer: null,

        // optional template renderer function for specific template type (mustache, jquery, etc)
        template_renderer: null,

        // optional callback function
        render_callback: null,

        instagram_media_page_size: 25,

        page_size: 5,

        current_page: 1,

        is_last_page: false,

        load_next_page_selector: null,

        loading_icon_selector: null,

        load_next_click_callback: null
    }, options || {});

    var rendered = false;

    if (settings.attach) {
        $(settings.target_selector).data('instagram-feed', obj);
    }

    if(settings.load_next_page_selector != null) {
        $('body').on('click', settings.load_next_page_selector, function(event) {
            event.preventDefault();

            $(this).hide();

            if(settings.loading_icon_selector !== null) {
                $(settings.loading_icon_selector).show();
            }

            if(settings.load_next_click_callback) {
                settings.load_next_click_callback(this);
            }

            obj.loadNextPage();
        });
    }

    this.getTargetSelector = function() {
        return settings.target_selector;
    }

    this.getTargetToHideSelector = function() {
        return settings.target_to_hide_selector;
    }

    this.getMediaTypeTemplateNameMap = function() {
        return settings.media_type_template_name_map;
    }

    this.getLoadNextPageSelector = function() {
        return settings.load_next_page_selector;
    }

    /**
     * This should be called to render the first page on Instagram posts.
     */
    this.render = function() {
        if(rendered) {
            console.log('Recently viewed products have already been rendererd, ignoring...');
        } else {
            if(settings.renderer) {
                settings.renderer(obj, settings.data);
            } else {
                defaultRenderer();
            }

            rendered = true;

            if(settings.render_callback) {
                settings.render_callback(obj, settings.data);
            }
        }
    }

    this.getTemplateNameForMediaType = function(mediaType) {
        if(settings.media_types_to_render.indexOf(mediaType) > -1) {
            return settings.media_type_template_name_map[mediaType];
        }

        return null;
    }

    var defaultTemplateRenderer = function(templateName, mediaContent) {
        return Mustache.render($(templateName).html(), mediaContent);
    }

    var defaultRenderer = function() {
        var $target = $(settings.target_selector);
        var $targetToHide = settings.target_to_hide_selector !== null
            ? $(settings.target_to_hide_selector) : $target;

        if(settings.data === undefined || settings.data === null
            || settings.data.data === undefined || settings.data.data === null) {
            console.log('No media found, hiding: ');
            console.log($targetToHide);
            $targetToHide.hide();
            return;
        }

        var mediaLength = settings.data.data.length;
        if(mediaLength === undefined || mediaLength === null || mediaLength < 1) {
            console.log('No media found, hiding: ');
            console.log($targetToHide);
            $targetToHide.hide();
            return;
        }

        var max = settings.max_to_render < 0 ? mediaLength : (mediaLength < settings.max_to_render ? mediaLength : settings.max_to_render);
        var renderCount = 0;
        for(var i = 0; i < mediaLength; i++) {
            if(renderCount >= max) {
                break;
            }

            var mediaContent = settings.data.data[i];

            var templateName = obj.getTemplateNameForMediaType(mediaContent.media_type);
            if(templateName === null) {
                continue;
            }

            if(settings.template_renderer) {
                $target.append(settings.template_renderer(templateName, mediaContent));
            } else {
                $target.append(defaultTemplateRenderer(templateName, mediaContent));
            }

            renderCount++;
        }

        if(renderCount < 1) {
            console.log("Nothing rendered, hiding");
            console.log($targetToHide);
            $targetToHide.hide();
        }
    }

    this.loadNextPage = function() {
        var indexToStart = settings.current_page * settings.page_size;
        var startMediaLength = settings.data.data.length;

        if(!settings.is_last_page && indexToStart + settings.page_size > startMediaLength) {
            loadNextPageData(indexToStart);
        } else {
            renderNextPage();
        }
    }

    var renderNextPage = function() {
        var indexToStart = settings.current_page * settings.page_size;
        var mediaLength = settings.data.data.length;

        if(settings.loading_icon_selector !== null) {
            $(settings.loading_icon_selector).hide();
        }

        var max = settings.page_size < 0 ? mediaLength : (mediaLength < settings.page_size ? mediaLength : settings.page_size);
        var renderCount = 0;
        var $target = $(settings.target_selector);
        var showLoadMore = true;
        for(var i = indexToStart; i < mediaLength; i++) {
            if(renderCount >= max) {
                break;
            }

            var mediaContent = settings.data.data[i];

            var templateName = obj.getTemplateNameForMediaType(mediaContent.media_type);
            if(templateName === null) {
                continue;
            }

            if(settings.template_renderer) {
                $target.append(settings.template_renderer(templateName, mediaContent));
            } else {
                $target.append(defaultTemplateRenderer(templateName, mediaContent));
            }

            renderCount++;

            if(settings.is_last_page && i >= mediaLength - 1) {
                showLoadMore = false;
            }
        }

        if(renderCount > 0) {
            settings.current_page++;
        }

        if(showLoadMore) {
            $(settings.load_next_page_selector).show();
        }
    }

    var loadNextPageData = function(indexToStart) {
        var pageToLoad = Math.ceil((indexToStart + settings.page_size) / settings.instagram_media_page_size);
        const url = js_site_var['context_path'] + '/app/instagramgraph/media/loadpage/' + pageToLoad;
        ajaxWithoutAuth(url, null, 'GET', function(data) {
            if(data.data !== null && data.data.length > 0) {
                settings.data.data = settings.data.data.concat(data.data);
            }

            // check to see if this was the last page
            if(data.paging === undefined || data.paging === null || data.paging.next === undefined
                || data.paging.next === null) {
                settings.is_last_page = true;
            }

            if(!settings.is_last_page && indexToStart + settings.page_size > settings.data.data.length) {
                loadNextPageData(indexToStart);
            } else {
                renderNextPage();
            }
        });
    }
}

/**
 * Easy way to initialize a new InstagramFeed object.  Optional callback function.
 *
 * @param options
 * @param callback
 */
function constructInstagramFeed(options, callback) {
    ajaxWithoutAuth(js_site_var['context_path'] + '/app/instagramgraph/media', null, 'GET', function(data) {
        options.data = data;
        var instagramFeed = new InstagramFeed(options);

        instagramFeed.render();

        if(callback) {
            callback(instagramFeed, data);
        }
    });
}
