(function ($) {

  Drupal.behaviors.canadagtir = {
    attach: function (context, settings) {
      $('.author-pane .author-pane-line.author-joined', context).prepend('<span class="author-pane-label">Joined:</span> ');
      $('.login-or-register-to-post', context).replaceWith('<a href="/user/login">Log in</a> or <a href="/user/register">register</a> to post comments');
    }
  };

})(jQuery);;
