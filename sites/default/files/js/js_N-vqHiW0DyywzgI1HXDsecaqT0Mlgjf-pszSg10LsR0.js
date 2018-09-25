(function ($) {

Drupal.behaviors.quote = {
  attach: function(context, settings) {
    var level = Drupal.settings.quote_nest - 1;
    if (level >= 0) {
      var top = $('blockquote.quote-nest-1', context);
      $('blockquote.quote-msg:eq(' + level + ')', top)
      .hide()
      .after('<div class="quote-snip">' + Drupal.t('<a href="#">[snip]</a>') + '</div>')
      .next('.quote-snip')
      .children('a')
      .click(function(e) {
        $(this).parent().siblings('.quote-msg').toggle();
        e.preventDefault();
      });
    }
  }
};

}(jQuery));
;
// $Id: compact_forms.js,v 1.11 2011/01/09 05:51:15 sun Exp $

(function ($) {

Drupal.compactForms = {};

/**
 * Compact Forms jQuery plugin.
 */
$.fn.compactForm = function (stars) {
  stars = stars || 0;

  this.each(function () {
    $(this).addClass('compact-form').find('label').each(function () {
      var context = this.form;
      var $label = $(this);
      if (!$label.attr('for')) {
        return;
      }
      var $field = $('#' + $label.attr('for'), context);
      if (!$field.length || !$field.is('input:text,input:password,textarea')) {
        return;
      }
      // Store the initial field value, in case the browser is going to
      // automatically fill it in upon focus.
      var initial_value = $field.val();

      if (initial_value != '') {
        // Firefox doesn't like .hide() here for some reason.
        $label.css('display', 'none');
      }

      $label.parent().addClass('compact-form-wrapper');
      $label.addClass('compact-form-label');
      $field.addClass('compact-form-field');

      if (stars === 0) {
        $label.find('.form-required').hide();
      }
      else if (stars === 2) {
        $label.find('.form-required').insertAfter($field).prepend('&nbsp;');
      }

      $field.focus(function () {
        // Some browsers (e.g., Firefox) are automatically inserting a stored
        // username and password into login forms. In case the password field is
        // manually emptied afterwards, and the user jumps back to the username
        // field (without changing it), and forth to the password field, then
        // the browser automatically re-inserts the password again. Therefore,
        // we also need to test against the initial field value.
        if ($field.val() === initial_value || $field.val() === '') {
          $label.fadeOut('fast');
        }
      });

      $field.blur(function () {
        if ($field.val() === '') {
          $label.fadeIn('slow');
        }
      });

      // Chrome adds passwords after page load, so we need to track changes.
      $field.change(function () {
        if ($field.get(0) != document.activeElement) {
          if ($field.val() === '') {
            $label.fadeIn('fast');
          }
          else {
            $label.css('display', 'none');
          }
        }
      });
    });
  });
};

/**
 * Attach compact forms behavior to all enabled forms upon page load.
 */
Drupal.behaviors.compactForms = {
  attach: function (context, settings) {
    if (!settings || !settings.compactForms) {
      return;
    }
    $('#' + settings.compactForms.forms.join(',#'), context).compactForm(settings.compactForms.stars);

    // Safari adds passwords without triggering any event after page load.
    // We therefore need to wait a bit and then check for field values.
    if ($.browser.safari) {
      setTimeout(Drupal.compactForms.fixSafari, 200);
    }
  }
};

/**
 * Checks for field values and hides the corresponding label if non-empty.
 *
 * @todo Convert $.fn.compactForm to always use a function like this.
 */
Drupal.compactForms.fixSafari = function () {
  $('label.compact-form-label').each(function () {
    var $label = $(this);
    var context = this.form;
    if ($('#' + $label.attr('for'), context).val() != '') {
      $label.css('display', 'none');
    }
  });
}

})(jQuery);
;
(function ($) {

Drupal.googleanalytics = {};

$(document).ready(function() {

  // Attach mousedown, keyup, touchstart events to document only and catch
  // clicks on all elements.
  $(document.body).bind("mousedown keyup touchstart", function(event) {

    // Catch the closest surrounding link of a clicked element.
    $(event.target).closest("a,area").each(function() {

      // Is the clicked URL internal?
      if (Drupal.googleanalytics.isInternal(this.href)) {
        // Skip 'click' tracking, if custom tracking events are bound.
        if ($(this).is('.colorbox') && (Drupal.settings.googleanalytics.trackColorbox)) {
          // Do nothing here. The custom event will handle all tracking.
          //console.info("Click on .colorbox item has been detected.");
        }
        // Is download tracking activated and the file extension configured for download tracking?
        else if (Drupal.settings.googleanalytics.trackDownload && Drupal.googleanalytics.isDownload(this.href)) {
          // Download link clicked.
          ga("send", {
            "hitType": "event",
            "eventCategory": "Downloads",
            "eventAction": Drupal.googleanalytics.getDownloadExtension(this.href).toUpperCase(),
            "eventLabel": Drupal.googleanalytics.getPageUrl(this.href),
            "transport": "beacon"
          });
        }
        else if (Drupal.googleanalytics.isInternalSpecial(this.href)) {
          // Keep the internal URL for Google Analytics website overlay intact.
          ga("send", {
            "hitType": "pageview",
            "page": Drupal.googleanalytics.getPageUrl(this.href),
            "transport": "beacon"
          });
        }
      }
      else {
        if (Drupal.settings.googleanalytics.trackMailto && $(this).is("a[href^='mailto:'],area[href^='mailto:']")) {
          // Mailto link clicked.
          ga("send", {
            "hitType": "event",
            "eventCategory": "Mails",
            "eventAction": "Click",
            "eventLabel": this.href.substring(7),
            "transport": "beacon"
          });
        }
        else if (Drupal.settings.googleanalytics.trackOutbound && this.href.match(/^\w+:\/\//i)) {
          if (Drupal.settings.googleanalytics.trackDomainMode !== 2 || (Drupal.settings.googleanalytics.trackDomainMode === 2 && !Drupal.googleanalytics.isCrossDomain(this.hostname, Drupal.settings.googleanalytics.trackCrossDomains))) {
            // External link clicked / No top-level cross domain clicked.
            ga("send", {
              "hitType": "event",
              "eventCategory": "Outbound links",
              "eventAction": "Click",
              "eventLabel": this.href,
              "transport": "beacon"
            });
          }
        }
      }
    });
  });

  // Track hash changes as unique pageviews, if this option has been enabled.
  if (Drupal.settings.googleanalytics.trackUrlFragments) {
    window.onhashchange = function() {
      ga("send", {
        "hitType": "pageview",
        "page": location.pathname + location.search + location.hash
      });
    };
  }

  // Colorbox: This event triggers when the transition has completed and the
  // newly loaded content has been revealed.
  if (Drupal.settings.googleanalytics.trackColorbox) {
    $(document).bind("cbox_complete", function () {
      var href = $.colorbox.element().attr("href");
      if (href) {
        ga("send", {
          "hitType": "pageview",
          "page": Drupal.googleanalytics.getPageUrl(href)
        });
      }
    });
  }

});

/**
 * Check whether the hostname is part of the cross domains or not.
 *
 * @param string hostname
 *   The hostname of the clicked URL.
 * @param array crossDomains
 *   All cross domain hostnames as JS array.
 *
 * @return boolean
 */
Drupal.googleanalytics.isCrossDomain = function (hostname, crossDomains) {
  /**
   * jQuery < 1.6.3 bug: $.inArray crushes IE6 and Chrome if second argument is
   * `null` or `undefined`, http://bugs.jquery.com/ticket/10076,
   * https://github.com/jquery/jquery/commit/a839af034db2bd934e4d4fa6758a3fed8de74174
   *
   * @todo: Remove/Refactor in D8
   */
  if (!crossDomains) {
    return false;
  }
  else {
    return $.inArray(hostname, crossDomains) > -1 ? true : false;
  }
};

/**
 * Check whether this is a download URL or not.
 *
 * @param string url
 *   The web url to check.
 *
 * @return boolean
 */
Drupal.googleanalytics.isDownload = function (url) {
  var isDownload = new RegExp("\\.(" + Drupal.settings.googleanalytics.trackDownloadExtensions + ")([\?#].*)?$", "i");
  return isDownload.test(url);
};

/**
 * Check whether this is an absolute internal URL or not.
 *
 * @param string url
 *   The web url to check.
 *
 * @return boolean
 */
Drupal.googleanalytics.isInternal = function (url) {
  var isInternal = new RegExp("^(https?):\/\/" + window.location.host, "i");
  return isInternal.test(url);
};

/**
 * Check whether this is a special URL or not.
 *
 * URL types:
 *  - gotwo.module /go/* links.
 *
 * @param string url
 *   The web url to check.
 *
 * @return boolean
 */
Drupal.googleanalytics.isInternalSpecial = function (url) {
  var isInternalSpecial = new RegExp("(\/go\/.*)$", "i");
  return isInternalSpecial.test(url);
};

/**
 * Extract the relative internal URL from an absolute internal URL.
 *
 * Examples:
 * - http://mydomain.com/node/1 -> /node/1
 * - http://example.com/foo/bar -> http://example.com/foo/bar
 *
 * @param string url
 *   The web url to check.
 *
 * @return string
 *   Internal website URL
 */
Drupal.googleanalytics.getPageUrl = function (url) {
  var extractInternalUrl = new RegExp("^(https?):\/\/" + window.location.host, "i");
  return url.replace(extractInternalUrl, '');
};

/**
 * Extract the download file extension from the URL.
 *
 * @param string url
 *   The web url to check.
 *
 * @return string
 *   The file extension of the passed url. e.g. "zip", "txt"
 */
Drupal.googleanalytics.getDownloadExtension = function (url) {
  var extractDownloadextension = new RegExp("\\.(" + Drupal.settings.googleanalytics.trackDownloadExtensions + ")([\?#].*)?$", "i");
  var extension = extractDownloadextension.exec(url);
  return (extension === null) ? '' : extension[1];
};

})(jQuery);
;
