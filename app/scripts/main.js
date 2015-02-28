;(function(window) {
    'use strict';
    /*!
    loadCSS: load a CSS file asynchronously.
    [c]2014 @scottjehl, Filament Group, Inc.
    Licensed MIT
    */
    function loadCSS(href, before, media, callback) {

        // Arguments explained:
        // `href` is the URL for your CSS file.
        // `before` optionally defines the element we'll use as a reference for injecting our <link>
        // By default, `before` uses the first <script> element in the page.
        // However, since the order in which stylesheets are referenced matters, you might need a more specific location in your document.
        // If so, pass a different reference element to the `before` argument and it'll insert before that instead
        // note: `insertBefore` is used instead of `appendChild`, for safety re: http://www.paulirish.com/2011/surefire-dom-element-insertion/
        var ss = window.document.createElement('link');
        var ref = before || window.document.getElementsByTagName('script')[0];
        var sheets = window.document.styleSheets;
        ss.rel = 'stylesheet';
        ss.href = href;
        // temporarily, set media to something non-matching to ensure it'll fetch without blocking render
        ss.media = 'only x';
        ss.onload = callback || null;
        // inject link
        ref.parentNode.insertBefore(ss, ref);
        // This function sets the link's media back to `all` so that the stylesheet applies once it loads
        // It is designed to poll until document.styleSheets includes the new sheet.
        function toggleMedia() {
            var defined;
            for (var i = 0; i < sheets.length; i++) {
                if (sheets[i].href && sheets[i].href.indexOf(href) > -1) {
                    defined = true;
                }
            }
            if (defined) {
                ss.media = media || 'all';
            } else {
                setTimeout(toggleMedia);
            }
        }
        toggleMedia();
        return ss;
    }

    var grunticon = function(css, onload) {
        // expects a css array with 3 items representing CSS paths to datasvg, datapng, urlpng
        if (!css || css.length !== 3) {
            return;
        }

        var navigator = window.navigator,
            Image = window.Image;

        // Thanks Modernizr & Erik Dahlstrom
        var svg = !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect && !!document.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#Image', '1.1') && !(window.opera && navigator.userAgent.indexOf('Chrome') === -1) && navigator.userAgent.indexOf('Series40') === -1;

        var img = new Image();

        img.onerror = function() {
            grunticon.method = 'png';
            grunticon.href = css[2];
            loadCSS(css[2]);
        };

        img.onload = function() {
            var data = img.width === 1 && img.height === 1,
                href = css[data && svg ? 0 : data ? 1 : 2];

            if (data && svg) {
                grunticon.method = 'svg';
            } else if (data) {
                grunticon.method = 'datapng';
            } else {
                grunticon.method = 'png';
            }

            grunticon.href = href;
            loadCSS(href, null, null, onload);
        };

        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
        document.documentElement.className += ' grunticon';
    };
    grunticon.loadCSS = loadCSS;
    window.grunticon = grunticon;
}(this));

/*global grunticon:true*/
(function(grunticon, window) {
    'use strict';
    var document = window.document;
    var selectorPlaceholder = 'grunticon:';

    var ready = function(fn) {
        // If DOM is already ready at exec time, depends on the browser.
        // From: https://github.com/mobify/mobifyjs/blob/526841be5509e28fc949038021799e4223479f8d/src/capture.js#L128
        if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading') {
            fn();
        } else {
            var created = false;
            document.addEventListener('readystatechange', function() {
                if (!created) {
                    created = true;
                    fn();
                }
            }, false);
        }
    };

    // get the SVG link
    var getCSS = function(href) {
        return window.document.querySelector('link[href$="' + href + '"]');
    };

    // this function can rip the svg markup from the css so we can embed it anywhere
    var getIcons = function(stylesheet) {
        // get grunticon stylesheet by its href
        var icons = {},
            svgss,
            rules, cssText,
            iconClass, iconSVGEncoded, iconSVGRaw;

        svgss = stylesheet.sheet;

        if (!svgss) {
            return icons;
        }

        rules = svgss.cssRules ? svgss.cssRules : svgss.rules;
        for (var i = 0; i < rules.length; i++) {
            cssText = rules[i].cssText;
            iconClass = selectorPlaceholder + rules[i].selectorText;
            iconSVGEncoded = cssText.split(');')[0].match(/US\-ASCII\,([^"']+)/);
            if (iconSVGEncoded && iconSVGEncoded[1]) {
                iconSVGRaw = decodeURIComponent(iconSVGEncoded[1]);
                icons[iconClass] = iconSVGRaw;

            }
        }
        return icons;
    };

    // embed an icon of a particular name ("icon-foo") in all elements with that icon class
    // and remove its background image
    var embedIcons = function(icons) {
        var embedElems, embedAttr, selector;

        // attr to specify svg embedding
        embedAttr = 'data-grunticon-embed';

        for (var iconName in icons) {
            selector = iconName.slice(selectorPlaceholder.length);

            try {
                embedElems = document.querySelectorAll(selector + '[' + embedAttr + ']');
            } catch (er) {
                // continue further with embeds even though it failed for this icon
                continue;
            }

            if (!embedElems.length) {
                continue;
            }

            for (var i = 0; i < embedElems.length; i++) {
                embedElems[i].innerHTML = icons[iconName];
                embedElems[i].style.backgroundImage = 'none';
                embedElems[i].removeAttribute(embedAttr);
            }
        }
        return embedElems;
    };

    var svgLoadedCallback = function(callback) {
        if (grunticon.method !== 'svg') {
            return;
        }
        ready(function() {
            embedIcons(getIcons(getCSS(grunticon.href)));
            if (typeof callback === 'function') {
                callback();
            }
        });
    };

    grunticon.embedIcons = embedIcons;
    grunticon.getCSS = getCSS;
    grunticon.getIcons = getIcons;
    grunticon.ready = ready;
    grunticon.svgLoadedCallback = svgLoadedCallback; //TODO DEPRECATED
    grunticon.embedSVG = svgLoadedCallback;

}(grunticon, this));

/*global grunticon:true*/
(function(grunticon, window) {
    'use strict';
    var document = window.document;

    // x-domain get (with cors if available)
    var ajaxGet = function(url, cb) {
        var xhr = new window.XMLHttpRequest();
        if ('withCredentials' in xhr) {
            xhr.open('GET', url, true);
        } else if (typeof window.XDomainRequest !== 'undefined') { //IE
            xhr = new window.XDomainRequest();
            xhr.open('GET', url);
        }
        if (cb) {
            xhr.onload = cb;
        }
        xhr.send();
        return xhr;
    };

    var svgLoadedCORSCallback = function(callback) {
        if (grunticon.method !== 'svg') {
            return;
        }
        grunticon.ready(function() {
            ajaxGet(grunticon.href, function() {
                var style = document.createElement('style');
                style.innerHTML = this.responseText;
                var ref = grunticon.getCSS(grunticon.href);
                ref.parentNode.insertBefore(style, ref);
                ref.parentNode.removeChild(ref);
                grunticon.embedIcons(grunticon.getIcons(style));
                if (callback) {
                    callback();
                }
            });
        });
    };

    grunticon.ajaxGet = ajaxGet;
    grunticon.svgLoadedCORSCallback = svgLoadedCORSCallback; //TODO: Deprecated
    grunticon.embedSVGCors = svgLoadedCORSCallback;

}(grunticon, this));

			
grunticon(['styles/icons.data.svg.css', 'styles/icons.data.png.css', 'styles/icons.fallback.css'], grunticon.svgLoadedCallback);
