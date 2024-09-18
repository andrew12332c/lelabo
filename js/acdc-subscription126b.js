$(function() {
	$( document ).ready(function() {
		populateSubscription('.header-newsletter-wrapper', 'newsletter');

		populateSubscription('.footer-subscribe', 'footer');
	});
});

function populateSubscription(target, param) {
	var url = js_site_var['context_path'] + '/app/subscription/signup';
	if(param !== undefined && param !== null && $.trim(param) !== '') {
		url += '?v=' + param;
	}
	ajaxWithoutAuth(url, null, 'GET', function(data) {
		$(target).html(data);
	});
}

function subscriptionSuccess(data) {
	$('.subscribe.typed').removeClass('typed');
	$('.subscribe-field').hide();

	window.dataLayer.push({
		event: 'Email Signup'
	});
}

function subscriptionFailure(data) {
	$('.subscribe-btn:disabled').prop('disabled', false)

	if (data.outcome == 'valError') {
		alert(data.m);
	} else if (data.outcome == 'failure') {
		alert('There was an error.');
	}
}

function footerSubscriptionSuccess(data) {
	var text = "Thanks for signing up, smell you later!";
	if (js_site_var['userLanguage'] == 'FR') {
		text = "Merci pour s'inscrire, a bient&ocirc;t!";
	}

	window.dataLayer.push({
		event: 'Email Signup'
	});

	$('.footer-subscribe-body').html(text);
}

function footerSubscriptionFailure(data) {
	if (data.outcome == 'valError') {
		alert(data.m);
	} else if (data.outcome == 'failure') {
		alert('There was an error.');
	}
}

function personalCareSubscriptionSuccess(data) {
	$('.personal-care-page .subscribe--default .subscribe__inner').remove();
	$('.personal-care-page .subscribe--default .subscribe__actions').html('Thank you, we will be in touch soon.');
	$('.personal-care-page .subscribe--default .subscribe__actions').addClass('product-details');
	$('.personal-care-page .subscribe--default .subscribe__actions').css({'border-top': '1px solid #e5e5e5', 'padding-top': '2em'});
}

function personalCareSubscriptionFailure(data) {
	if (data.outcome == 'valError') {
		alert(data.m);
	} else if (data.outcome == 'failure') {
		alert('There was an error.');
	}
}