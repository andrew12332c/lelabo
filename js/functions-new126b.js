;(function($, window, document, undefined) {
	var $win = $(window);
	var $doc = $(document);

	$doc.ready(function() {
		$('.main-checkout .btn-view-cart').on('click', function (event) {
		    var $this = $(this);
		    var $target = $('.btn-view-cart');
		    var count = $this.data('item-count');
		    var $targetText = $target.find('span');

		    $target.toggleClass('active');

			if (js_site_var['userLanguage'] === 'FR') {
				$targetText.text(
					($this.hasClass('active')? 'Cacher' : 'Voir') +  ' le panier (' + count + ')'
				);
			} else {
				$targetText.text(
					($this.hasClass('active')? 'Hide' : 'View') +  ' Cart (' + count + ')'
				);
			}
		    
		    $('.order-summary .order-summary-body').toggleClass('expanded');
		    
		    event.preventDefault();
		});

		$('.cart-item').on('click', '.disabled', function(event) {
			event.preventDefault();
		});

		var isAutoSearching = false;
		var isSearchUpdated = false;

		function searchListener() {
			var $target = $(this);
			var val = $target.val().trim();
			var flag = val === '';

			if (isAutoSearching) {
				isSearchUpdated = true;
				return;
			}

			hideNewsletterSignup(true);
			hideSearchSection(flag);

			!flag && searchAutocomplete('.header-search-results', val);
		}

		var prevSearchFlag = true;

		function clickOutOfHeader(event) {
			var $header = $('.header');
			var $target = $(event.target);

			if ($header.find($target).length) {
				return;
			}

			hideSearchSection(true);
			hideNewsletterSignup(true);
		}

		function hideSearchSection(flag) {
			var $body = $('body');
			var $search = $('.search-new');
			var $clearBtn = $search.find('.search-clear-btn');
			var $searchSection = $('.header-search-wrapper');
			var $bodyOverlay = $('.body-overlay');

			$clearBtn.add($searchSection).add($bodyOverlay).toggleClass('hidden', flag);
			$search.toggleClass('open', !flag);

			if (prevSearchFlag !== flag) {
				$body[flag? 'off' : 'on']('click', clickOutOfHeader);
			}

			prevSearchFlag = flag;
		}

		var prevNewsletterFlag = true;

		function hideNewsletterSignup(flag, location) {
			var $body = $('body');
			var $newsletterSection = $('.header-newsletter-wrapper');
			var $bodyOverlay = $('.body-overlay');
			var $form = $newsletterSection.find('.subscribe-form');

			if(location!= undefined && $form.find('.subscription-location').length != 0){
				$form.find('.subscription-location').val(location);
			}

			$newsletterSection.add($bodyOverlay).toggleClass('hidden', flag);
			!flag && $form.css('min-height', ($form.outerHeight() * 2 / 3) + 'px');

			if (prevNewsletterFlag !== flag) {
				$body[flag? 'off' : 'on']('click', clickOutOfHeader);
			}

			prevNewsletterFlag = flag;
		}

		function searchAutocomplete(topEl, term) {
			isAutoSearching = true;
			isSearchUpdated = false;

			if (!$(topEl).length) {
				isAutoSearching = false;
				return;
			}

			$(topEl).find('ul.header-search-list').html('<li>...loading</li>');

			var criteria = [];
			$.each(searchTermConverter(term).query, function (key, value) {
				criteria.push(key + ':' + value);
			});

			var query = criteria.join(' OR ');
			$.ajax({
				url: "/search/",
				cache: false,
				data: {
					wt: 'json',
					start: 0,
					rows: 1000,
					q: query
				},
				success: function (data) {
					var showMax = 5;
					data = $.parseJSON(data);
					filterHideOnCountries(data);
                    $(topEl).find('ul.header-search-list').html(data.response.numFound < 1? '<li>No results</li>' : '');
					$.each(data.response.docs, function (index, element) {
						if (index >= showMax) {
							return false;
						}

						var url = element.page_name_s;
						var label = element.product_name_t;

						if (typeof element.attr_product_type != undefined) {
							label = label + " " + element.attr_product_type;
						}

						$(topEl).find('ul.header-search-list').append('<li><a href="' + url + '">' + label + '</a></li>');
					});


					if (data.response.numFound > showMax) {
						$(topEl).find('ul.header-search-list').append('<li><a href="#" class="header-search-viewall-link">View All (' + data.response.numFound + ')</a></li>');
						$(topEl).find('.header-search-viewall-link').on('click', function (event) {
							event.preventDefault();
							$('.search-new form').submit();
						})
					}

					searchAutocompleteCallback(topEl);
				},
				error: function () {
					$(topEl).find('ul.header-search-list').html('');
					searchAutocompleteCallback(topEl);
				}
			});
		}

		function searchAutocompleteCallback(topEl) {
			setTimeout(function() {
				if (!isSearchUpdated) {
					isAutoSearching = false;
					return;
				}

				searchAutocomplete(topEl, $('.search-new .search-new-field').val());
			}, 100);
		}

		$('.search-new-field').on('keydown', function(event) {
			if (!(event.key === 'Enter' || event.keyCode === 13)) {
				return;
			}

			event.preventDefault();

			$(this).closest('.search-new').find('form').submit();
		}).on('focusin input', searchListener).trigger('input');

		$('.search-new-btn').on('click', function(event) {
			event.preventDefault();

			var $this 		= $(this),
				$search 	= $this.closest('.search-new'),
				$field 		= $search.find('.search-new-field');

			if(!$search.hasClass('open')) {
				$search.addClass('open');
				$field.focus();
			} else {
				$search.find('form').submit();
			}
		});

		$('.search-clear-btn').on('click', function(event) {
			event.preventDefault();

			var $target = $(this);
			var $search = $target.closest('.search-new');
			var $field = $search.find('.search-new-field');

			$field.val('').focus();
			$target.addClass('hidden');
		});

		$('.newsletter-signup').on('click', function(event) {
			event.preventDefault();

			var $newsletterSection = $('.header-newsletter-wrapper');

			hideSearchSection(true);
			hideNewsletterSignup(!$newsletterSection.hasClass('hidden'), $(this).data('location'));
		});

		$('.newsletter-popup-btn').on('click', function(event){
			$('.newsletter-signup').click();
			var $target = $('.header-wrapper');
			$('html, body').stop().animate({
				'scrollTop': $target.offset().top
			}, 900);
			return false;
		});

		$('body').on('click', '.subscribe-form .form-close', function(event) {
			event.preventDefault();

			hideNewsletterSignup(true);
		});

		$('body').on("click", '#acdcConfirmSubscribeButton', function () {
			if(!$('#acdcConfirmSubscribe').prop("checked")) {
				$('.newsletter-error').show();
				return false;
			} else {
				$('.newsletter-error').hide();
				return true;
			}
		});

		$('body').on('click', '.scroll-to', function(){
			event.preventDefault();

			var target = this.hash,
			$target = $(target);

			$('html, body').stop().animate({
			    'scrollTop': $target.offset().top
			}, 900);
		});


		$('.acf-map').each(function(){
			render_map( $(this) );
		});

		$('.search-trigger').on('click', function(event) {
			event.preventDefault();

			$(this).closest('.search-primary').toggleClass('open');
		});

		$(".userRegionSelect").dropdown();
		$(".map-select").dropdown();

		$('.modal-dismis').on('click', function(event) {
			event.preventDefault();

			$('.modal-pdp').removeClass('open');
		});

		$('.edit-personalization-popup-trigger').on('click', function(e) {
			e.preventDefault();

			modifyPersonalizationPopupTrigger(e.currentTarget, true);
		});

		$('.add-personalization-popup-trigger').on('click', function(e) {
			e.preventDefault();

			modifyPersonalizationPopupTrigger(e.currentTarget, false);
		});

		personalizationPopupListeners();
	});
})(jQuery, window, document);

var personalizationPopupLabelFontSizes;
var isPersonalizePopupLabelAndBoxScenario;

var personalizationTypesMap = {
	7: 'label',
	8: 'box',
	9: 'engraving'
};

var personalizationTypesMapFR = {
	7: 'sur la bouteille',
	8: 'sur la boîte',
	9: 'la gravure sur les bouteilles'
};

var personalizationTypesArr = Object.entries(personalizationTypesMap)
	.sort(function(entryA, entryB) {
		var a = entryA[0];
		var b = entryB[0];

		return a - b;
	});


function initPersonalizationPopup(data, modifyFlag, editFlag) {
	var $popup = $('#popup-personalize');
	var $title = $popup.find('.popup-title');
	var $subtitle = $popup.find('.popup-subtitle');
	var $imageContainer = $popup.find('.personalize-image-container');
	var $personalizeContainer = $popup.find('.personalize-container');
	var $errorMsg = $popup.find('.personalize-popup-error-msg,.personalize-popup-plp-error-msg');
	var $warningMsg = $popup.find('.personalize-popup-warning-msg,.personalize-popup-plp-warning-msg');
	var $imageRow;
	var personalization = data.personalization;
	var personalizationMeta = data.personalizationMeta;
	var notes = data.notes;
	var activeKeys = data.activeKeys;
	var activePersonalization = {};
	var personalizationList = activeKeys
		.map(function(key) {
			if (personalization.hasOwnProperty(key)) {
				return [key, personalization[key]];
			}

			return undefined;
		})
		.sort(function(entryA, entryB) {
			var a = entryA[0];
			var b = entryB[0];

			return parseInt(a, 10) - parseInt(b, 10);
		});

	activeKeys.forEach(function(key) {
		var value = personalization[key];

		if (value) {
			activePersonalization[key] = value;
		}
	});

	personalizationPopupLabelFontSizes = [];
	isPersonalizePopupLabelAndBoxScenario =
		activePersonalization[7] && activePersonalization[8];

	$popup.toggleClass('large', personalizationList.length > 1);

	$imageContainer.html('');
	$personalizeContainer
		.find('.personalize').hide()
		.find('input').val('').data('savedValue', '');
	$errorMsg.hide();
	$warningMsg.hide();

	if (personalizationMeta) {
		var headerHtml;
		var bodyHtml;

		if (personalizationMeta.header) {
			headerHtml = personalizationMeta.header;
		} else if (js_site_var['userLanguage'] === 'FR') {
			headerHtml = 'Personnalisez Votre Étiquette';
		} else {
			headerHtml = 'Personalize Your Label';
		}

		if (personalizationMeta.body) {
			bodyHtml = personalizationMeta.body;
		} else if (js_site_var['userLanguage'] === 'FR') {
			bodyHtml = '<li>Le texte par défaut "You" sera imprimé pour les créations non personnalisées.</li><li>Tout achat d\'une création avec une étiquette personnalisée est définitif</li>.';
		} else {
			bodyHtml = '<li>The default text "You" will be printed for creations with no personalization.</li><li>Creations with personalized labels are final sale.</li>';
		}

		$title.html(headerHtml);
		$subtitle.html(bodyHtml);
	}

	$imageRow = $('<div class="personalize-image-row"></div>');

	personalizationList.forEach(function(entry, i) {
		var key = entry[0];
		var val = entry[1];
		var type = personalizationTypesMap[key];

		var x = val.x;
		var y = val.y;
		var fontSize = val.fontSize;
		var image = val.image;

		image = /^(https?:\/\/|\/)/i.test(image) ? image : js_site_var['sku_image_path'] + image;

		var $col = $('<div class="personalize-image-col personalize-image-col--' + key + (i === 0? ' open' : '') + '"></div>');
		var $wrapper = $('<div class="personalize-image-wrapper"></div>');
		var $img = $('<img class="personalize-image" src="' + image + '" alt="" width="1200" height="1200" />');
		var $label = $(
			'<span '
			+ 'class="personalize-image-label personalize-image-label-' + key + ' personalize-image-label--' + type +'"'
			+ ' data-key="' + key + '"'
			+ '></span>'
		);

		$label.css({
			fontSize: fontSize + 'px',
			left: x + '%',
			top: y + '%'
		});

		personalizationPopupLabelFontSizes.push({
			font: parseInt(val.fontSize, 10),
			data: parseInt(key, 10)
		});

		$wrapper.append($img);
		$wrapper.append($label);
		$col.append($wrapper);
		$imageRow.append($col);
	});

	function togglePersonalization(key, flag) {
		var type = personalizationTypesMap[key];

		if (typeof flag === 'undefined') {
			flag = !!activePersonalization[key];
		}

		$personalizeContainer.find('.personalize-' + type).toggle(flag);
		$imageContainer.find('.personalize-image-label-' + key).toggle(flag);
	}

	if (isPersonalizePopupLabelAndBoxScenario) {
		$personalizeContainer.find('.personalize-label .form-label')
			.text(js_site_var['userLanguage'] === 'FR' ?  'Pour:' : 'For:');

		togglePersonalization(7, true);
		togglePersonalization(8, false);
	} else {
		if (personalization[7]) {
			$personalizeContainer.find('.personalize-label .form-label')
				.text(js_site_var['userLanguage'] === 'FR' ?  'Personnalisation de Étiquette:' : 'Personalize label:');
		}

		togglePersonalization(7);
		togglePersonalization(8);
	}

	togglePersonalization(9);

	var generatePersonalizationTypeHtml;
	var personalizeText;

	if (js_site_var['userLanguage'] === 'FR') {
		generatePersonalizationTypeHtml = function (key) {
			return '<a href="#" class="personalize-image-text-type" data-key="' + key + '">' + personalizationTypesMapFR[key] + '</a>';
		};
	} else {
		generatePersonalizationTypeHtml = function (key) {
			return '<a href="#" class="personalize-image-text-type" data-key="' + key + '">' + personalizationTypesMap[key] + '</a>';
		};
	}

	if (personalizationList.length > 1) {
		personalizeText = personalizationList
			.slice(0, personalizationList.length - 1)
			.map(function (entry) {
				var key = entry[0];

				return generatePersonalizationTypeHtml(key);
			}).join(',') + (js_site_var['userLanguage'] === 'FR' ? ' et ' : ' and ');
	} else {
		personalizeText = '';
	}

	personalizeText += generatePersonalizationTypeHtml(personalizationList[personalizationList.length - 1][0]);

	var personalizationTextLabel = js_site_var['userLanguage'] === 'FR'
		? 'La personnalisation'
		: 'Personalization';

	$imageContainer.append($imageRow);
	$imageContainer.append(
		'<div class="personalize-image-text">'
		+ personalizationTextLabel + ': ' + personalizeText
		+ '</div>'
	);

	if (!modifyFlag) {
		$popup.find('.personalize-popup-atc-personalization-btn,.personalize-popup-atc-link')
			.attr('data-sku-id', data.skuId).data('sku-id', data.skuId)
			.attr('data-label', data.label).data('label', data.label)
			.attr('data-price', data.price).data('price', data.price)
			.attr('data-cat-name', data.catName).data('cat-name', data.catName)
			.attr('data-product-category', data.productCategory).data('product-category', data.productCategory)
			.attr('data-gtn', data.gtn).data('gtn', data.gtn)
			.attr('data-name', data.name).data('name', data.name)
			.attr('data-variant', data.variant).data('variant', data.variant)
			.attr('data-product-id', data.productId).data('product-id', data.productId)
			.attr('data-cat-name', data.cat-name).data('label', data.cat-name);
	} else {

		$popup.find('.personalize-popup-add-btn,.personalize-popup-edit-btn')
			.attr('data-item-index', data.itemIndex).data('item-index', data.itemIndex)
			.attr('data-cartitemids', data.cartitemids).data('cartitemids', data.cartitemids)
			.data('notes', data.notes)
			.attr('data-location', data.location);
	}

	$popup.find('.personalize-popup-action-atc-personalization,.personalize-popup-action-atc')
		.toggle(!modifyFlag);
	$popup.find('.personalize-popup-action-add')
		.toggle(modifyFlag && !editFlag);
	$popup.find('.personalize-popup-action-edit')
		.toggle(modifyFlag && editFlag);
	$popup.find('.personalize-popup-action-unchange')
		.toggle(modifyFlag);

	personalizationTypesArr
		.forEach(function(entry, i) {
			var key = entry[0];
			var val = personalization[key];

			if (!val) {
				return;
			}

			var type = personalizationTypesMap[key];
			var value = notes && notes.length > i? notes[i] : '';
			var $field = $personalizeContainer.find('#field-popup-personalize-' + type);

			$field
				.val(value)
				.data('savedValue', value)
				.trigger('input');
	});

	personalizationPopupAllLabelsFontResize(personalizationPopupLabelFontSizes);
}

function getPersonalizationPopupFormData() {
	var $popup = $('#popup-personalize');

	return personalizationTypesArr.map(function(entry) {
		var key = entry[0];
		var type = entry[1];
		var val;

		if (isPersonalizePopupLabelAndBoxScenario && key === '8') {
			val = $popup.find('#field-popup-personalize-label').val();
		} else {
			val = $popup.find('#field-popup-personalize-' + type).val();
		}

		return type === 'engraving' ? val.toUpperCase() : val;
	});
}

function hasPersonalizationPopupFormBeenUpdated() {
	var $popup = $('#popup-personalize');

	return personalizationTypesArr.some(function(entry) {
		var type = entry[1];
		var $field = $popup.find('#field-popup-personalize-' + type);

		return $field.val() !== $field.data('savedValue');
	});
}

/* Behavior functions of personalization */
function personalizationPopupListeners() {
	var $popup = $('#popup-personalize');

	function updateCallback() {
		$popup.removeClass('visible');

		handleCartUpdate();
	}

	$popup
		.on('input', '#field-popup-personalize-engraving', function() {
			var $field = $(this);
			var regex = /[^A-Za-z0-9]/g;
			var currentValue = $field.val();

			if (regex.test(currentValue)) {
				var newValue = currentValue.replace(regex, '');

				$field.val(newValue);
			}
		})
		.on('input', '.personalize input', function() {
			var $field = $(this);
			var key = $field.data('key');
			var val = $field.val();
			var $errorMsg = $popup.find('.personalize-popup-error-msg,.personalize-popup-plp-error-msg');
			var $warningMsg = $popup.find('.personalize-popup-warning-msg,.personalize-popup-plp-warning-msg');

			$popup
				.find('.personalize-popup-atc-link,.personalize-popup-unchange-link')
				.removeClass('clicked-once');
			$errorMsg.hide();
			$warningMsg.hide();

			$('#popup-personalize .personalize-image-label-' + key).text(val);

			// Engraving scenario is not part of the special scenario
			if (isPersonalizePopupLabelAndBoxScenario && key != 9) {
				$('#popup-personalize .personalize-image-label-8').text(val);
				$('#popup-personalize #field-personalize-popup-box').val(val);
			}

			var $counterElement = $field.parent().siblings('.input-count');
			if (!$counterElement.length) {
				$counterElement = $field.parents('.form-bar').find('.input-count');
			}
			var maxChars = parseInt($counterElement.data('maxlength'));
			$counterElement.html(maxChars - val.length);
		})
		.on('focus', '.personalize input', function() {
			personalizationPopupAllLabelsFontResize(personalizationPopupLabelFontSizes);
		})
		.on('click', '.personalize-image-text-type', function(e) {
			e.preventDefault();

			var $link = $(this);
			var key = $link.data('key');

			$popup.find('.personalize-image-col').removeClass('open');
			$popup.find('.personalize-image-col--' + key).addClass('open');

			personalizationPopupLabelFontResize(personalizationPopupLabelFontSizes, key);
		})
		.on('click', '.personalize-popup-atc-personalization-btn', function(e) {
			e.preventDefault();

			var $btn = $(this);
			var $errorMsg = $('.personalize-popup-error-msg');
			var $plpErrorMsg = $('.personalize-popup-plp-error-msg');
			var $warningMsg = $('.personalize-popup-warning-msg');
			var $plpWarningMsg = $('.personalize-popup-plp-warning-msg');
			var personalizationFormData = getPersonalizationPopupFormData();
			var hasPersonalization = personalizationFormData.some(function(value) {
				return value;
			});

			$errorMsg.hide();
			$warningMsg.hide();
			$plpWarningMsg.hide();

			if (!hasPersonalization) {
				$plpErrorMsg.show();
				return;
			}

			$plpErrorMsg.hide();

			linkAtc($btn, personalizationFormData, updateCallback);
		})
		.on('click', '.personalize-popup-add-btn', function(e) {
			e.preventDefault();

			var $btn = $(this);
			var $errorMsg = $('.personalize-popup-error-msg');
			var $plpErrorMsg = $('.personalize-popup-plp-error-msg');
			var $warningMsg = $('.personalize-popup-warning-msg');
			var $plpWarningMsg = $('.personalize-popup-plp-warning-msg');
			var cartItemIds = $btn.data('cartitemids').replace(/[\[\]]/g,'').split(',');
			var notes = $btn.data('notes');
			var personalizationFormData = getPersonalizationPopupFormData();
			var hasPersonalization = personalizationFormData.some(function(value) {
				return value;
			});

			$plpErrorMsg.hide();
			$warningMsg.hide();
			$plpWarningMsg.hide();

			if (!hasPersonalization) {
				$errorMsg.show();
				return;
			}

			$errorMsg.hide();

			updateCartPersonalization(cartItemIds, personalizationFormData, notes);

			let location = $btn.data('location');
			window.dataLayer.push({
				event: 'Cart Personalization',
				location: location, //mini-cart or cart
			});

			$popup.removeClass('visible');
		})
		.on('click', '.personalize-popup-edit-btn', function(e) {
			e.preventDefault();

			var $btn = $(this);
			var cartItemIds = $btn.data('cartitemids').replace(/[\[\]]/g,'').split(',');
			var notes = $btn.data('notes');
			var personalizationFormData = getPersonalizationPopupFormData();

			updateCartPersonalization(cartItemIds, personalizationFormData, notes);

			$popup.removeClass('visible');
		})
		.on('click', '.personalize-popup-atc-link', function(e) {
			e.preventDefault();

			var $btn = $(this);
			var $errorMsg = $('.personalize-popup-error-msg');
			var $plpErrorMsg = $('.personalize-popup-plp-error-msg');
			var $warningMsg = $('.personalize-popup-warning-msg');
			var $plpWarningMsg = $('.personalize-popup-plp-warning-msg');
			var personalizationFormData = getPersonalizationPopupFormData();
			var hasPersonalization = personalizationFormData.some(function(value) {
				return value;
			});

			$errorMsg.hide();
			$plpErrorMsg.hide();
			$warningMsg.hide();

			if (hasPersonalization && !$btn.hasClass('clicked-once')) {
				$plpWarningMsg.show();

				$btn.addClass('clicked-once');
				return;
			}

			$plpWarningMsg.hide();

			$btn.removeClass('clicked-once');

			linkAtc($btn, undefined, updateCallback);
		})
		.on('click', '.personalize-popup-unchange-link', function(e) {
			e.preventDefault();

			var $btn = $(this);
			var $errorMsg = $('.personalize-popup-error-msg');
			var $plpErrorMsg = $('.personalize-popup-plp-error-msg');
			var $warningMsg = $('.personalize-popup-warning-msg');
			var $plpWarningMsg = $('.personalize-popup-plp-warning-msg');
			var hasPersonalizationChanged = hasPersonalizationPopupFormBeenUpdated();

			$errorMsg.hide();
			$plpErrorMsg.hide();
			$plpWarningMsg.hide();

			if (hasPersonalizationChanged && !$btn.hasClass('clicked-once')) {
				$warningMsg.show();

				$btn.addClass('clicked-once');
				return;
			}

			$warningMsg.hide();

			$btn.removeClass('clicked-once');

			$popup.removeClass('visible');
		})
		.on('click', function (e) {
			var $target = $(e.target);

			if (!$target.is($popup)) {
				return true;
			}

			var $link = $popup
				.find('.personalize-popup-atc-link,.personalize-popup-unchange-link')
				.filter(':visible').first();

			$link.trigger('click');

			return false;
		});

	$(window).on('resize', function() {
		personalizationPopupAllLabelsFontResize(personalizationPopupLabelFontSizes);
	});
}

/* For managing the various font size based on the window width */
function personalizationPopupLabelFontResize(fontSizes, key) {
	var $label = $('#popup-personalize .personalize-image-label-' + key);

	var fontSize = fontSizes.find(function(item) {
		return item.data === key;
	});

	var imgHeight = $label.closest('.personalize-image-wrapper').outerHeight();
	imgHeight = imgHeight / 614;
	var labelSize = fontSize.font * imgHeight;

	$label.css('font-size', labelSize + 'px');
}

function personalizationPopupAllLabelsFontResize(fontSizes) {
	$('#popup-personalize .personalize-image-label').each(function() {
		var $label = $(this);
		var key = $label.data('key');

		personalizationPopupLabelFontResize(fontSizes, key);
	});
}

function personalizationPopupTrigger(target, modifyFlag, editFlag) {
	var $target = $(target);
	var data = $target.data();
	var personalization = data.personalization;

	if (personalization && !$.isEmptyObject(personalization)) {
		initPersonalizationPopup(data, modifyFlag, editFlag);

		showPersonalizationPopup();
		return true;
	}

	return false;
}

function addPersonalizationPopupTrigger(target) {
	var $target = $(target);
	var personalization = $target.data('personalization');

	if (!personalization) {
		try {
			var itemIndex = $target.data('sku-id');
			var data = JSON.parse($('.personalize-add-data-' + itemIndex).first().text());

			$target.data($.extend({}, data, {
				activeKeys: Object.keys(data.personalization)
			}));
		} catch (err) {
			console.error(err);
		}
	}

	return personalizationPopupTrigger($target, false);
}

function modifyPersonalizationPopupTrigger(target, editFlag) {
	var $target = $(target);
	var personalization = $target.data('personalization');

	if (!personalization) {
		try {
			var itemIndex = $target.data('item-index');
			var keys = $target.data('keys').toString().split(',');
			var data = JSON.parse($('.personalize-modify-data-' + itemIndex).first().text());

			$target.data($.extend({}, data, {
				activeKeys: keys
			}));
		} catch (err) {
			console.error(err);
		}
	}

	return personalizationPopupTrigger($target, true, editFlag);
}

