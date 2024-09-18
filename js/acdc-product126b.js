var priceJSON = '';

$(function() {
	$(document).ready(function() {
		var $win = $(window);
		$win.on('scroll', function(event) {
			/* pdp sticky header */
			if($('.travel-tube').length = 0){
				if ($win.scrollTop() < 375) {
					$('.product-add-banner').removeClass('visible');
				} else {
					$('.product-add-banner').addClass('visible');
				}
			}
		});
	});

	$('body').on('click', '.slider-product-images .video-slide', function(e) {
		e.preventDefault();

		let $li = $(this);

		if ($li.hasClass('active')) {
			return;
		}

		let $poster = $li.find('img');
		let $video = $li.find('video');

		$poster.hide();
		$video.show();

		$video[0].play();

		$li.addClass('active');
	});
});

function optionsSorter(a, b) {
	// size is always first
	if (a.code == 'SIZE') {
		return -1;
	} else {
		return 1;
	}
}

function optionRenderer(productOptions, option, optionValues) {
	var thumb_sizes = [];

	// We only need to render the dropdown once as size is the only selectable option.
	if (option.code == 'SIZE') {
		// Pre-selected size (if any)
		var uri = new URI(location.href)
		var pre_selected_size = uri.search(true).size;
		// show images based on the pre-selected size, if none, use first size
		var size_for_image = optionValues[0].value;

		var $selector = $(productOptions.getOnSelector());
		$selector.each(function() {
			var $target = $(this).find('.product_options .product_option_SIZE');
			var options = [];

			for (var i = 0; i < optionValues.length; i++) {
				var option = $(document.createElement('option'));
				option.attr('name', option.code);
				option.val(optionValues[i].value);
				option.html(optionValues[i].value);

				if (pre_selected_size == optionValues[i].altValue1 || pre_selected_size == optionValues[i].value ) {
					option.attr('selected', 'selected');
					size_for_image = pre_selected_size;
				}

				options.push(option);

				// register the size to show in thumb images
				thumb_sizes.push(optionValues[i].value);
			}

			$target.html(options);
			$target.dropdown('update');
		});

		atcbutton(productOptions);
	}
}

function productOptionsCallback(productOptions) {
	// get the priceJSON with the proper currency display, then render the options with that info
	ajaxWithoutAuth(js_site_var['context_path'] + '/app/product/prices/' + productOptions.getProductInfo().productDatas[0].productId + '.json', '', 'GET', function(data) {
		priceJSON = data;

		// render the selectable size options for the first time
		productOptions.render();

		// update itself with the preselected value
		$('.product_options .product_option_SIZE').trigger('productoptions_trigger');
	});

	// synchronize the sticky header quantity field and pdp quantity field
	$('.atc-quantity').change(function(e) {
		$('.atc-quantity').val($(this).val());
		$('.atc-quantity').dropdown('update');
	});

	initListeners();
}

function optionChangeHandler(event, productOptions, optionCode, optionValue, target) {
	optionChangeHandlerDelegate(event, productOptions, optionCode, optionValue, target, false);
}

function refillOptionChangeHandler(event, productOptions, optionCode, optionValue, target) {
	optionChangeHandlerDelegate(event, productOptions, optionCode, optionValue, target, true);
}

function optionChangeHandlerDelegate(event, productOptions, optionCode, optionValue, target, isRefill) {
	// they should only have size as a selectable option
	if (optionCode == "SIZE") {
		displayBigImages(optionValue, size_images, productOptions);

		var sku_info = productOptions.getOneAndOnlySku();
		if (sku_info != null) {
			window.skuId = sku_info.itemId;
			var pricePrefix = js_site_var['userCurrency'] + ' ' + priceJSON.prices[sku_info.itemId].symbol;
			$('.main-price').html(formatPrice(priceJSON.prices[sku_info.itemId].listBuq, priceJSON.prices[sku_info.itemId].buq, pricePrefix));
			sku_info.price = formatPrice(priceJSON.prices[sku_info.itemId].listBuq, priceJSON.prices[sku_info.itemId].buq,"");

			// if the sku has a refill product id attr, show the link to that product, hide all others
			var refillProductId = getRefillProductIdForSku(sku_info);
			let hideInCountriesRefillProduct;
			if(typeof hideInCountriesRefillProductMap != 'undefined') {
				hideInCountriesRefillProduct = hideInCountriesRefillProductMap[refillProductId];
			}

			let excludeCountriesRefillProduct;
			if(typeof excludeCountriesRefillProductMap != 'undefined') {
				excludeCountriesRefillProduct = excludeCountriesRefillProductMap[refillProductId];
			}

			let productRegion = getCookieWithHelper(false, 'acdc_region');
			let showsRefill = productRegion != undefined &&
						     (hideInCountriesRefillProduct == undefined ||
							  hideInCountriesRefillProduct != undefined && hideInCountriesRefillProduct.indexOf(productRegion) == -1) &&
							 (excludeCountriesRefillProduct == undefined ||
							  excludeCountriesRefillProduct != undefined && excludeCountriesRefillProduct.indexOf(productRegion) == -1);
			if(refillProductId !== null && showsRefill) {
				$('.additional_refill_product').removeClass('hidden');
				$('.refill-link').hide();
				$('.refill-link-' + refillProductId).show();
			} else {
				$('.additional_refill_product').addClass('hidden');
			}
		}

		// synchronize the size dropdown in the pdp and sticky header
		var $selector = $(productOptions.getOnSelector());
		$selector.each(function() {
			var $target = $(this).find('.product_options .product_option_SIZE');
			$target.val(optionValue);
			$target.dropdown('update');
		});

		// personalization related
		initPersonalization(optionValue, productOptions);

		let productInfo = productOptions.getProductInfo().productDatas[0];

		window.dataLayer.push({
			event: 'View Item',
			ecommerce: {
				items: [
					{
						item_name: productInfo.productName, //name of product
						item_id: sku_info.publicSku, //use SAP SKU
						item_brand: 'Le Labo', // brand of product
						currency: js_site_var['userCurrency'], //Currency displayed to user
						price: Number(sku_info.price.replace(',','')), // price of product shown to user on site
						item_category: productInfo.productType, // use product_type
						item_variant: sku_info.options[0].optionValue.value, //size of product
						product_id: productInfo.productId,
						sku_id: sku_info.itemId
					}
				]
			}
		});

		if(($.inArray(js_site_var['userRegion'], GBPcountries) >= 0) || js_site_var['userRegion'] === 'US') {

			let summarySelector = '.mobile-hidden .clearpay-product-container';
			let mobileSummarySelector = '.mobile-visible .clearpay-product-container';
			let minRange = js_site_var['minAfterpayRange'] || 0;
			let maxRange = js_site_var['maxAfterpayRange'] || 1000;

			if(js_site_var['userRegion'] === 'GB'){
				minRange = js_site_var['minClearpayRange'] || 0;
				maxRange = js_site_var['maxClearpayRange'] || 1000;
			}

			callClearPayPresentment(summarySelector, (priceJSON.prices[sku_info.itemId].listBuq)/100 , minRange, maxRange,function(cpConfig){
				let t = $(summarySelector + ' afterpay-placement')[0].shadowRoot;
				let afterpay_paragraph_El = t.querySelector('.afterpay-paragraph');
				$(afterpay_paragraph_El).css("font-size","13px");
			},'white-on-black');
			callClearPayPresentment(mobileSummarySelector, (priceJSON.prices[sku_info.itemId].listBuq)/100 , minRange, maxRange, null,'white-on-black');
		}

		var missing_option = productOptions.getFirstUnselectedOption();
		if (missing_option == null) {
			// everything selected - is the item out of stock?
			var sku_info = productOptions.getOneAndOnlySku();

			if (sku_info == null) {
				// this shouldn't happen. if you picked all options, you should get one sku
				// even if it's excluded (since we are including excluded items)
			} else {
				// for product that should not be shipped in country CN,MX,RU,HK
				if (isInquire(sku_info.itemId)) {
					inquirebutton(sku_info.skuCode);
					$('.pickup-delivery').hide();
				} else if(isRefill && !isRefillRegion()) {
					moreInfoButton(productOptions);
					$('.pickup-delivery').hide();
				} else if (sku_info.inStock) {
					atcbutton(productOptions);
					$('.pickup-delivery').show();
				} else {
					notifyMeButton(sku_info.skuCode);
					$('.pickup-delivery').hide();
				}
			}

			let itemBopisEligible = true;
			let bopisIneligibleCountryList;
			if(typeof bopisIneligibleCountriesMap != 'undefined') {
				bopisIneligibleCountryList = bopisIneligibleCountriesMap[window.skuId];
				if($.inArray(js_site_var['userRegion'], bopisIneligibleCountryList) >= 0) {
					itemBopisEligible = false;
				}
			}

			if(itemBopisEligible) {
				if(typeof window.bopisEligible == 'undefined' || window.bopisEligible) {
					$('.select-pickup-store-toggle').show();
					$('.selected-pickup-store').html('');
					$('#form-pickup-location .pickup-location-search-field').val(null);
					doStoreSearch();

					if(window.selectedStore !== undefined ) {
						let excludePickupOnCountryList = excludePickupOnCountryMap[window.skuId];
						if(typeof excludePickupOnCountryList == 'undefined') {
							excludePickupOnCountryList = window.excludePickupOnCountries;
						} else {
							excludePickupOnCountryList = [...excludePickupOnCountryList,
								...window.excludePickupOnCountries.filter(c => excludePickupOnCountryList.indexOf(c) < 0)];
						}

						if (excludePickupOnCountryList !== null && excludePickupOnCountryList.includes(window.selectedStore.store.additionalDescription1)) {
							if(js_site_var['userLanguage'] == 'FR') {
								$('.selected-pickup-store').html('Indisponible pour le retrait en magasin à ' + htmlDecode(window.selectedStore.store.name));
							} else {
								$('.selected-pickup-store').text('Unavailable for store pickup at ' + htmlDecode(window.selectedStore.store.name));
							}
						} else {
							if(js_site_var['userLanguage'] == 'FR') {
								$('.selected-pickup-store').html('Disponible pour retrait en magasin à ' + htmlDecode(window.selectedStore.store.name));
							} else {
								$('.selected-pickup-store').text('Available for store pickup at ' + htmlDecode(window.selectedStore.store.name));
							}
						}
					}
				} else {
					$('.select-pickup-store-toggle').hide();
					if(js_site_var['userLanguage'] == 'FR') {
						$('.selected-pickup-store').html('Votre panier n\'est pas éligible pour un enlèvement en magasin.');
					} else {
						$('.selected-pickup-store').text('Your cart is ineligible for store pickup.');
					}
				}
			} else {
				$('.select-pickup-store-toggle').hide();
				if(js_site_var['userLanguage'] == 'FR') {
					$('.selected-pickup-store').html('Ce produit n\'est pas éligible pour un enlèvement en magasin.');
				} else {
					$('.selected-pickup-store').text('This item is ineligible for store pickup.');
				}
			}
		}
	}

	additionalHTML();
}

function isInquire(skuId) {
	if (typeof window.inquireMap === 'undefined'
			|| typeof window.inquireMap[skuId] === 'undefined') {
		return false;
	}

	if(window.inquireMap[skuId].indexOf(js_site_var['userRegion']) > -1) {
		console.log("inquireMap");
		return true;
	}
	
	return false;
}

function notifyMeButton(skuCode) {
	var $ctaButton = $('.form-product .atc-button');

	$ctaButton.off('click').click(function(event) {
		event.preventDefault();
		sku_inquire(skuCode);
	});

	var text;
	if (js_site_var['userLanguage'] == 'FR') {
		text = 'Prévenez-moi';
	} else {
		text = 'Notify Me';
	}

	$ctaButton.val(text);
	$ctaButton.removeClass('disabled-like');

	$('.product-terms').addClass('hidden');
}

function getRefillProductIdForSku(skuInfo) {
	try {
		if(typeof skuInfo.attributes['REFILL_PRODUCT_ID'] != 'undefined'){
			return skuInfo.attributes['REFILL_PRODUCT_ID'][0];
		}
	} catch(err) {
		console.log(err);
	}

	return null;
}

function additionalHTML() {
	$('.product-thumb a').on('click', function(event) {
		setMainImage($(this));
		event.preventDefault();
	});

	$('.slider-product-images .slide-image').each(function() {
		var introImageSource = $(this).find('.slide-bg').attr('src');
		$(this).css('background-image', 'url(' + introImageSource + ')');
	});

	personalizationListeners();
}

function setMainImage($sourceElement) {
	var $thumbLi = $sourceElement.parent();
	var $li = $($sourceElement.attr('href'));

	$thumbLi.addClass('current').siblings().removeClass('current');
	$li.addClass('current').siblings().removeClass('current')

	if ($li.hasClass('video-slide') && !$li.hasClass('video-loaded')) {
		let $poster = $li.find('img');
		let video_tag = $(document.createElement('video'));
		let video_source_tag = $(document.createElement('source'));

		if ($poster.data('show-controls')) {
			video_tag.attr('controls', '');
		}

		if ($poster.data('loop')) {
			video_tag.attr('loop', '');
		}

		video_tag.attr('muted', '');

		video_source_tag.attr('type', 'video/mp4');
		video_source_tag.attr('src', $poster.data('video-src'));

		video_tag.append(video_source_tag);
		$li.append(video_tag);
		$li.addClass('video-loaded');
	}
};

function atcbutton(productOptions) {
	var $selector = $(productOptions.getOnSelector());
	$selector.each(function() {
		var $target = $(this).find('.form-product .atc-button');
		if(typeof $(this).data('category') != 'undefined') {
			ga('send', 'event', $(target).data('category'), 'click');
		}
		$target.off('click').click(function(event) {
			event.preventDefault();
			
			if (isRefillSku(productOptions)) {
				let nonCheckedTerms = false;
				let personalizationVal = $('.personalize input').val();
				let personalizationFilled =  personalizationVal != undefined && personalizationVal != null
					&& personalizationVal.trim() != '';

				$('.refill-term-checkbox').each(function() {
					let checked = $(this).prop('checked');
					let $termContainer = $(this).closest('.refill-term');
					let $errorContainer = $('.refill-term-error');

					if (!checked) {
						nonCheckedTerms = true;
						$termContainer.addClass('error');
						$errorContainer.addClass('error');
					}
				});

				let $errorContainer = $('.refill-term-error');
				$errorContainer.toggleClass('error', nonCheckedTerms);

				let $personalizationInputContainer = $('.personalize-label');
				let $personalizationErrorContainer = $('.refill-personalization-error');
				$personalizationErrorContainer.toggleClass('error', !personalizationFilled);
				$personalizationInputContainer.toggleClass('error', !personalizationFilled);

				if (nonCheckedTerms || !personalizationFilled) {
					return false;
				}
			}

			return atc($selector, productOptions);
		});

		if (js_site_var['userLanguage'] == 'FR')
			$target.val('AJOUTER AU PANIER');
		else
			$target.val('Add to Cart');
	});
}

function isRefillSku(productOptions) {
	try {
		return productOptions.getProductInfo().skuInfos[0].attributes['REFILL'][0].toLowerCase() === 'true';
	} catch(err) {
		console.log(err);
	}

	return false;
}

function oosbutton(productOptions) {
	$('.form-product .atc-button').off('click').click(function(event) {
		event.preventDefault();
	});
	if (js_site_var['userLanguage'] == 'FR')
		$('.form-product .atc-button').val('Rupture de Stock');
	else
		$('.form-product .atc-button').val('Out of stock');
}

function inquirebutton(skuCode) {
	var $ctaButton = $('.form-product .atc-button');

	$ctaButton.off('click').click(function(event) {
		event.preventDefault();
		sku_inquire(skuCode);
	});

	var text;
	// Flip ATC link to Inquire if userRegion is to an alcohol concerned country for alcohol products
	if (typeof hasAlcoholSpec != 'undefined' && hasAlcoholSpec.toUpperCase() == "TRUE" && typeof  js_site_var['alcoholRegions'] != 'undefined' && js_site_var['alcoholRegions'].indexOf(js_site_var['userRegion']) >= 0) {
		if (js_site_var['userLanguage'] == 'FR') {
			text = 'Demander';
		} else {
			text = 'Inquire';
		}
	} else if (js_site_var['userRegion'] == 'CN' || js_site_var['userRegion'] == 'MX' || js_site_var['userRegion'] == 'RU' || js_site_var['userRegion'] == 'HK') {
		if (js_site_var['userLanguage'] == 'FR') {
			text = 'Demander';
		} else {
			text = 'Inquire';
		}
	} else {
		if (js_site_var['userLanguage'] == 'FR') {
			text = 'Prévenez-moi';
		} else {
			text = 'Notify Me';
		}
	}

	$ctaButton.val(text);
	$ctaButton.removeClass('disabled-like');

	$('.product-terms').addClass('hidden');
}

// display the big images based on the selected size option, includes the thumb images too
function displayBigImages(size, size_images, productOptions) {
	var $targetBig = $('.product-image #main-images');
	var $targetThumb = $('.product-image #thumb-images');
	$targetBig.html('');
	$targetThumb.html('');

	//FOR PERSONALIZE SKIP IMAGE PRODUCT 7,8,9
	let sku_info = productOptions.getOneAndOnlySku();
	let skipImage = false;
	if ((sku_info != null && sku_info.attributes != null && sku_info.attributes.LABEL_X > 0)  || (sku_info.attributes.BOX_X > 0)) {
		skipImage = true;
	}

	var number_of_images = 0;
	for (var image_tag_number = 1; image_tag_number <= 15; image_tag_number++) {
		if(skipImage && (image_tag_number == 7 || image_tag_number == 8 || image_tag_number == 9 )){
			continue;
		}

		// Make sure image exists, at the same time make sure at least one image (even if placeholder) is shown
		let image_tag_name = image_tag_number < 10 ? "0" + image_tag_number : image_tag_number;
		if (image_tag_number == 1 || (typeof size_images[size] !== 'undefined' && typeof size_images[size]['PRODUCT_' + image_tag_name] !== 'undefined')) {
			if (typeof size_images[size] !== 'undefined' && typeof size_images[size]['PRODUCT_' + image_tag_name]['IMG_1200'] != 'undefined') {
				var image_url = js_site_var['sku_image_path'] + size_images[size]['PRODUCT_' + image_tag_name]['IMG_1200'];
			} else {
				var image_url = js_site_var['context_path'] + '/images/placeHolder_IMG_1200.png';
			}

			var li_tag = $(document.createElement('li'));
			var img_tag = $(document.createElement('img'));
			li_tag.addClass('slide');
			li_tag.attr('id', 'tab' + image_tag_number);
			if (image_tag_number == 1) {
				li_tag.addClass('current');
			}
			img_tag.attr('src', image_url);
			li_tag.append(img_tag);
			$targetBig.append(li_tag);

			if (typeof size_images[size] !== 'undefined' && typeof size_images[size]['PRODUCT_' + image_tag_name]['IMG_140'] != 'undefined') {
				var thumb_url = js_site_var['sku_image_path'] + size_images[size]['PRODUCT_' + image_tag_name]['IMG_140'];
			} else {
				var thumb_url = js_site_var['context_path'] + '/images/placeHolder_IMG_140.png';
			}

			var thumb_li_tag = $(document.createElement('li'));
			var thumb_a_tag = $(document.createElement('a'));
			var thumb_img_tag = $(document.createElement('img'));
			thumb_img_tag.attr('src', thumb_url);
			thumb_img_tag.attr('width', '80');
			thumb_img_tag.attr('height', '80');
			thumb_a_tag.append(thumb_img_tag);
			thumb_a_tag.addClass('product-item-image');
			thumb_a_tag.addClass('gatracking');
			thumb_a_tag.attr('href', '#tab' + image_tag_number);
			thumb_a_tag.attr('id', 'thumb' + image_tag_number);
			thumb_a_tag.data('label', 'Thumb - ' + image_tag_number);
			thumb_a_tag.data('category', 'Gallery Thumbnail');
			thumb_li_tag.append(thumb_a_tag);
			thumb_li_tag.addClass('product-thumb');

			if (image_tag_number == 1) {
				thumb_li_tag.addClass('current');
			}
			$targetThumb.append(thumb_li_tag);

			number_of_images++;
		}
	}

	for (let key in window.pdpVideoContents) {
		let videoContent = window.pdpVideoContents[key];
		number_of_images++;

		let li_tag = $(document.createElement('li'));
		let img_tag = $(document.createElement('img'));

		li_tag.addClass('slide');
		li_tag.addClass('video-slide');
		li_tag.data('autoplay', videoContent.is_autoplay);
		li_tag.data('autoplaySrc', videoContent.autoplay_src);
		li_tag.attr('id', 'tab' + number_of_images);
		if (number_of_images == 1) {
			li_tag.addClass('current');
		}
		img_tag.attr('src', videoContent.placeholder_img_src);
		img_tag.data('video-src', videoContent.video_src);
		img_tag.data('autoplay', videoContent.is_autoplay);
		img_tag.data('show-controls', videoContent.show_controls);
		img_tag.data('loop', videoContent.loop);
		li_tag.append(img_tag);
		$targetBig.append(li_tag);

		var thumb_li_tag = $(document.createElement('li'));
		var thumb_a_tag = $(document.createElement('a'));
		var thumb_img_tag = $(document.createElement('img'));
		thumb_img_tag.attr('src', videoContent.placeholder_img_src);
		thumb_img_tag.attr('width', '80');
		thumb_img_tag.attr('height', '80');
		thumb_a_tag.append(thumb_img_tag);
		thumb_a_tag.addClass('product-item-image');
		thumb_a_tag.addClass('gatracking');
		thumb_a_tag.attr('href', '#tab' + number_of_images);
		thumb_a_tag.attr('id', 'thumb' + number_of_images);
		thumb_a_tag.data('label', 'Thumb - ' + number_of_images);
		thumb_a_tag.data('category', 'Gallery Thumbnail');
		thumb_li_tag.append(thumb_a_tag);
		thumb_li_tag.addClass('product-thumb');

		if (number_of_images == 1) {
			thumb_li_tag.addClass('current');
		}
		$targetThumb.append(thumb_li_tag);


	}

	// if(number_of_images > 7) {
	// 	$targetThumb.find('li.product-thumb').owlCarousel({
	// 		items: 1,
	// 		margin: 0,
	// 		loop: true,
	// 		dotsEach: true
	// 	});
	// }
}

/**
 * Check and redirect to redirectURL
 *
 * @param hideOnCountries
 */
function redirectProductIfHideOnCountries(hideOnCountries, redirectURL){
	var productRegion = getCookieWithHelper(false, 'acdc_region');
	if(productRegion != undefined && hideIncountries.indexOf(productRegion) != -1) {
		window.location.replace(redirectURL);
	}
}

/**
 * For refill products, there should only be one one sku per product, and thus only
 * one size available.
 *
 * @param productOptions
 * @param option
 * @param optionValues
 */
function refillOptionRenderer(productOptions, option, optionValues) {
	if (option.code == 'SIZE') {
		var $target = $('.product_option_SIZE');
		var size = optionValues[0];
		$target.text(size.value);
		$target.data('product_option.value', size.value);
		productOptions.selectOption('SIZE', size.value, true);
	}

	initRefillTermListeners(productOptions);

	atcbutton(productOptions);
}

function isRefillRegion() {
	return js_site_var['refillCountries'].indexOf(js_site_var['userRegion']) > -1;
}

/**
 * Will toggle the error state on each refill term checkbox condition when the checkbox
 * is updated.  If the checkbox previously had an error, then the error state will be added back
 * if the checkbox is unchecked again.
 *
 * @param productOptions
 */
function initRefillTermListeners(productOptions) {
	var $selector = $(productOptions.getOnSelector());
	var $termCheckboxes = $selector.find('.refill-term-checkbox');

	function checkAtcStatus() {
		let $atcBtn = $selector.find('.form-product .atc-button');
		let atcFlag = !!$termCheckboxes.filter(':not(:checked)').length;
		let $errorContainer = $('.refill-term-error');

		$atcBtn.toggleClass('disabled-like', atcFlag);
		if (!atcFlag) {
			$errorContainer.removeClass('error', atcFlag);
		}
	}

	$termCheckboxes.on('click change', function(event) {
		let $this = $(this);
		let checked = $this.prop('checked');
		let $target = $this.closest('.refill-term');
		let hasError = $target.hasClass('error');
		let hadError = $target.hasClass('had-error');
		let $errorContainer = $('.refill-term-error');

		if (checked) {
			$target.removeClass('error');

			if (hasError) {
				$target.addClass('had-error');
			}
		} else if (hadError) {
			$errorContainer.addClass('error');
			$target.addClass('error');
		}

		checkAtcStatus();
	});

	checkAtcStatus();
}

function moreInfoButton(productOptions) {
	var $atcBtn = $(productOptions.getOnSelector()).find('.form-product .atc-button');
    if (js_site_var['userLanguage'] == 'FR') {
        $atcBtn.val('Plus d\'informations');
    } else {
        $atcBtn.val('More Info');
    }

    $atcBtn.on('click', function(event) {
        event.preventDefault();

        var target = $('#popup-refill-more-info');
        $(target).toggleClass('visible');

        $('.popup-close-btn').on('click', function(e) {
            e.preventDefault();

            var target = $('#popup-refill-more-info');
            $(target).toggleClass('visible');
        });
    });
}