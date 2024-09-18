$(function () {
	/**
	 * just making sure that it's not getting the page in the browser cache
	 */
	$('.nav li a:not(.dropdown-button), .header .logo').on('click', function () {
		if ($(this).prop('href') && getCookieWithHelper(false, 'ACDC_LOCALE') == 'FR') {

			let uri = new URI($(this).prop('href'));
			let path = uri._parts.path;
			if (!path.startsWith('/fr') || (window.location.href.includes('/fr/') && !path.startsWith('/fr'))) {
				let pathStr = uri._parts.protocol + "://" + uri._parts.hostname + "/fr" + path;
				if (uri._parts.fragment != null) {
					pathStr += "#" + uri._parts.fragment;
				}
				window.location = pathStr;
				return false;
			}
		};
	});

	checkLogIn();

	countCart();

	initializeUserRegionRelated();

	checkCountryToggleLinks();

	$(document).on('click', '.popup-destroy', function (event) {
		event.preventDefault();

		var target = $(this).attr('href');
		$(target).remove();
	});

	$('#field-personalize-engraving').on('input', function (event) {
		var $field = $(this);
		var regex = /[^A-Za-z0-9]/g;
		var currentValue = $field.val();

		if (regex.test(currentValue)) {
			var newValue = currentValue.replace(regex, '');

			$field.val(newValue);
		}
	});

	$('.top-banner-close').on('click', function (event) {
		event.preventDefault();
		setTopBannerCookie();
		checkTopBanner();
	});

	$('body').on('click', '.popup-close-btn, .popup-close-link', function (e) {
		e.preventDefault();

		var targetId = $(this).attr('href');
		var $target = $(targetId);
		$target.toggleClass('visible');
	});

	$('body').on('click', 'a.disabled', function (event) {
		event.preventDefault();

		return false;
	});

	$('.scroll-to-section').on('click', function (event) {
		event.preventDefault();

		var $topBanner = $('.top-banner');
		var $header = $('.header.header-sticky');
		var target = $(this).attr('href');
		var $target = $(target);
		var top = $target.offset().top;
		var breakpoint = 1024;
		var offset;

		if ($(window).width() < breakpoint) {
			offset = top;
		} else {
			if (top < $topBanner.outerHeight()) {
				offset = top;
			} else {
				offset = top - $header.outerHeight();
			}
		}

		$('html').animate({
			scrollTop: offset
		}, 500);
	});
});

function checkLogIn() {
	$.getJSON(js_site_var['context_path'] + '/app/account/info.json', function (data) {
		var $link = $('.header-actions .link-account > a > span');
		var $mobileLink = $('#mobile-link-account');
		var $links = $link.add($mobileLink);
		var $filler = $('#logged-in-filler');

		if (data.loggedIn) {
			if (js_site_var['userLanguage'] == 'FR') {
				$links.text('Bonjour, ' + data.firstName);
				$filler.text('Bonjour, ' + data.firstName + '.');
			} else {
				$links.text('Hello, ' + data.firstName);
				$filler.text('Hello, ' + data.firstName + '.');
			}

			$links.removeClass('screenreader-text');
		} else {
			$links.addClass('screenreader-text');

			if (js_site_var['userLanguage'] == 'FR') {
				$links.text("SE CONNECTER/S'inscrire");
			} else {
				$links.text('Log in/Register');
			}
		}
	});
}

function formatPrice(listBuq, priceBuq, symbol) {
	var listPrice = listBuq / 100;
	var price = priceBuq / 100;
	if (priceBuq < listBuq) {
		return "<span style='text-decoration: line-through'>" + symbol + listPrice.toFixed(2) + "</span> " + symbol + price.toFixed(2);
	} else {
		return symbol + price.toFixed(2);
	}
}

function handleSkuPrice(sku_id, handler) {
	ajaxWithoutAuth(js_site_var['context_path'] + '/app/product/price/' + sku_id + '.json', '', 'GET', function(data) {
		for (var key in data.prices) {
			if (data.prices.hasOwnProperty(key)) {
				if (typeof handler === 'undefined') {
					var pricePrefix = js_site_var['userCurrency'] + ' ' + data.prices[key].symbol;
					$('#sku-price-' + sku_id).html('<span>' + formatPrice(data.prices[key].listBuq, data.prices[key].buq, pricePrefix) + '</span>');
					$('#sku-price-' + sku_id).closest('.product-item').find('.btn-link, .promotion-btn').data('price', formatListingPrice(data.prices[key].buq));
				} else {
					handler(data.prices[key], sku_id);
				}
			}
		}
	}, 'json');
}

var topBannerInitialized = false;

function checkTopBanner() {
	var $topBanner = $('.slider-top-banner');
	var $slider = $topBanner.find('.slides');
	var flag = typeof getCookieWithHelper(false, 'acdc_top_banner') === 'undefined';

	$topBanner.toggle(flag);

	if (flag) {
		if (topBannerInitialized) {
			return;
		}

		$slider.owlCarousel({
			items: 1,
			margin: 0,
			loop: true,
			nav: false,
			dots: false,
			autoplay: true,
			autoplayTimeout: 5000,
			autoplaySpeed: 0,
			onInitialized: mobileMenuAdjust
		});

		topBannerInitialized = true;
	} else {
		if (!topBannerInitialized) {
			return;
		}

		$slider.trigger('destroy.owl.carousel');
	}
}

function removeForeignCountryContent() {
	$('.acdc_country_selector').each(function (index, element) {
		var countryList = $(element).data('country-value');
		if (countryList.indexOf(js_site_var['userRegion']) == -1) {
			$(element).remove();
		}
	});
}

function initTopBanner() {
	removeForeignCountryContent();
	removeOutsideRadius();

	/**
	 * remove by Gabe on 7/16  LL3480
	 *
	if ($('.top-banner .top-banner-text').length) {
		$('.top-banner-adjust').addClass('has-banner');
		$('.top-banner').data('maxIndex', $('.top-banner .top-banner-text').length - 1);
		$('.top-banner .top-banner-text').each(function (index, element) {
			$(element).addClass('banner-index-' + index);

			if (index > 0) {
				$(element).addClass('hidden');
			}
		})
	}*/

	checkTopBanner();
}

function setTopBannerCookie() {
	setCookieWithHelper(false, 'acdc_top_banner', 'true', {
		path: '/',
		domain: js_site_var['cookie_domain']
	});
}

function showOrderLimitPopup() {
	var $target = $('#popup-order-limit');

	$target.toggleClass('visible');
}

function showPersonalizationPopup() {
	var $target = $('#popup-personalize');

	$target.toggleClass('visible');
}

/**
 * Format the input element to be
 * @param element
 */
function formatCPF(element) {
	let ele = document.getElementById(element.id);

	ele = ele.value.split('.').join('');  // Remove dot
	ele = ele.split('-').join('');        // Remove dash

	//console.log ("ELE => " + ele);

	let finalVal = ele.match(/.{1,3}/g).join('\.');

	//replace the 3 occurence of dot to dash
	let nth = 0;
	finalVal = finalVal.replace(/\./g, function (match, i, original) {
		nth++;
		return (nth === 3) ? "-" : match;
	});
	//console.log ("FINAL => " + finalVal);
	document.getElementById(element.id).value = finalVal;
}

function showAlertPopup(msg) {
	let $target = $('#popup-alert-msg');

	$target.find('.popup-content').text(msg);
	$target.toggleClass('visible');
}

function checkCountryToggleLinks() {
	$('.country-toggle').each(function () {
		let $this = $(this);
		let visibleCountries = $this.data('visible-countries');
		let hiddenCountries = $this.data('hidden-countries');
		let region = js_site_var['userRegion'];

		if (visibleCountries != null) {
			$this.toggleClass('hidden', visibleCountries.indexOf(region) < 0);
		}

		if (hiddenCountries != null) {
			$this.toggleClass('hidden', hiddenCountries.indexOf(region) > -1);
		}
	});
}

/*====================== start geo location ======================*/
var browserCity;
var browserCountry;
var browserLatitude;
var browserLongitude;
var initMapCalled = false;

function getCity(callback) {
	if (initMapCalled) {
        callback();
		return;
	}

	function innerCallBack() {
		callback();
		initMapCalled = true;
	}

	if (navigator.geolocation) {
		browserLatitude = getCookieWithHelper(false, 'ACDC_BROWSER_LATITUDE');
		browserLongitude = getCookieWithHelper(false, 'ACDC_BROWSER_LONGITUDE');
		browserCity = getCookieWithHelper(false, 'ACDC_BROWSER_CITY');
		browserCountry = getCookieWithHelper(false, 'ACDC_BROWSER_COUNTRY');
		if (typeof browserLatitude === 'undefined' || typeof browserCountry === 'undefined') {
			navigator.geolocation.getCurrentPosition((position) => showPos(position, innerCallBack), innerCallBack);
		} else {
			console.log("browser supports map LAT: " + browserLatitude + "  LNG: " + browserLongitude);
			innerCallBack();
		}

	} else {
		x.innerHTML = "Geolocation is not supported by this browser.";
	}
}

function geoLocationNotEnabled() {
	console.log("geolocation not enabled!!!!!!!")
}

/**
 *
 * @param mk1
 * @param mk2
 * @returns {number}
 */
function distanceBetweenPosition(userLatitude, userLongitude, contentLatitude, contentLongitude) {
	var R = 3958.8; // Radius of the Earth in miles
	var rlat1 = userLatitude * (Math.PI / 180); // Convert degrees to radians
	var rlat2 = contentLatitude * (Math.PI / 180); // Convert degrees to radians
	var difflat = rlat2 - rlat1; // Radian difference (latitudes)
	var difflon = (contentLongitude - userLongitude) * (Math.PI / 180); // Radian difference (longitudes)

	var d = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat / 2) * Math.sin(difflat / 2) + Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(difflon / 2) * Math.sin(difflon / 2)));
	return d;
}

function isEmptyOrSpaces(str) {
	str = String(str);
	//console.log ("STR VALUE :=> " + str)
	return typeof str == 'undefined' || str == 'undefined' || str === null || str.match(/^ *$/) !== null;
}

/**
 *
 * hasInsideRadius determines if there's content block that seat inside the radius of the
 * current browser position (latitude, longitude)
 *
 *
 * @returns {boolean}
 */
function removeOutsideRadius() {

	//set the radius in miles;
	let radiusDistance = 25;

	if (typeof browserLatitude != 'undefined') {
		$('.acdc_country_selector').each(function (index, element) {
			let lat = $(element).data('latitude-value');
			let lng = $(element).data('longitude-value');
			//console.log(" CONTENT LATITUDE:=> " + lat + "   CONTENT LONGITUDE :=> " + lng);
			if (!isEmptyOrSpaces(lat) && !isEmptyOrSpaces(lng)) {
				//console.log("CALCULATING DISTANCE ........");
				let distance = distanceBetweenPosition(browserLatitude, browserLongitude, $(element).data('latitude-value'), $(element).data('longitude-value'));
				//console.log("DISTANCE IS :=> " + distance);
				if (distance > radiusDistance || Number.isNaN(distance)) {
					$(element).remove();
					//console.log("... REMOVING ...");
				}
			} else {
				//console.log("... SKIPPING....");
			}
		});
	} else {
		// Removing content that has longitude and latitude...
		console.log("browserLatitude .... IS undefined");
		$('.acdc_country_selector').each(function (index, element) {
			let lat = $(element).data('latitude-value');
			let lng = $(element).data('longitude-value');
			if (!isEmptyOrSpaces(lat) || !isEmptyOrSpaces(lng)) {
				$(element).remove();
			}
		});
	}
}

function showPos(position, callback) {
	var lat = position.coords.latitude;
	var lng = position.coords.longitude;

	browserLatitude = lat;
	browserLongitude = lng;
	setCookieWithHelper(false, "ACDC_BROWSER_LATITUDE", lat, {path: '/'});
	setCookieWithHelper(false, "ACDC_BROWSER_LONGITUDE", lng, {path: '/'});

	var geocoder = new google.maps.Geocoder();
	var latlng = new google.maps.LatLng(lat, lng);

	geocoder.geocode({'location': latlng}, function (results, status) {
		if (status == google.maps.GeocoderStatus.OK && results[0]) {

			var details = results[0].address_components;
			console.log(JSON.stringify(details));
			for (var i = details.length - 1; i >= 0; i--) {
				for (var j = 0; j < details[i].types.length; j++) {
					if (browserCity) {
						continue;
					}
					if (details[i].types[j] == 'locality') {
						browserCity = details[i].long_name;
					} else if (details[i].types[j] == 'sublocality') {
						browserCity = details[i].long_name;
					} else if (details[i].types[j] == 'neighborhood') {
						browserCity = details[i].long_name;
					} else if (details[i].types[j] == 'postal_town') {
						browserCity = details[i].long_name;
						console.log("postal_town=" + browserCity);
					} else if (details[i].types[j] == 'administrative_area_level_2') {
						browserCity = details[i].long_name;
						console.log("admin_area_2=" + browserCity);
					}
					// from "google maps API geocoding get address components"
					// https://stackoverflow.com/questions/50225907/google-maps-api-geocoding-get-address-components
					if (browserCountry) {
						continue;
					}
					if (details[i].types[j] == "country") {
						browserCountry = details[i].short_name;
					}
				}
			}
			if (browserCity) {
				setCookieWithHelper(false, "ACDC_BROWSER_CITY", browserCity, {path: '/'});
			}
			if (browserCountry) {
				setCookieWithHelper(false, "ACDC_BROWSER_COUNTRY", browserCountry, {path: '/'});
			}
			//alert(browserCity); // shows the found city.
		}
		callback();
	});
}

/**
 * This is called when the googlmap api is loaded
 */
function initMap() {
	getCity(function () {
		initTopBanner();
	});
}

/*====================== end geo location ======================*/