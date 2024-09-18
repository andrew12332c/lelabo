$(function() {
	// Toggle Mini Cart
	$('.mini-cart-toggle').on('click', function(e) {
		e.preventDefault();
		loadCart(true);
		$('html').toggleClass('no-scroll');
	});

	$(document).on('click', '.sku-atc', function(e) {
		e.preventDefault();

		var $target = $(e.currentTarget);

		if (addPersonalizationPopupTrigger($target)) {
			return;
		}

		linkAtc($target, undefined);
	});

	$(document).on('click', '.sku-inquire', function(e) {
		e.preventDefault();
		sku_inquire($(this).data('sku-code'));
	});

	$(document).on('click', function(event) {
		if ((!$(event.target).closest('.mini-cart').length) && (!$(event.target).closest('.mini-cart-toggle').length)) {
			$('.mini-cart').removeClass('visible');
			$('html').removeClass('no-scroll');
		}
	});

    $('.waypoint').on('click', function(event) {
        event.preventDefault();

        var element = $(this).attr('href');

        $('html, body').animate({
                scrollTop: $(element).offset().top
        }, 1000);
    });

	$('.inventory-check-inquire').on('click', function (evt) {
		var $target = $(evt.target);
		var submitMessage = $target.data('submitMessage');
		var formData = $target.data('formData');

		jQuery.ajax({
			type: 'post',
			url: js_site_var['context_path'] + "/app/checkout/review/inquire",
			headers: {'csrfToken': getCookieWithHelper(false, 'csrfToken')},
			data: JSON.stringify(formData) ,
			timeout: 5000,
			contentType: 'application/json',
			dataType: 'json',
			success: function (data) {
				var $popup = $('#popup-inventory-check');

				$popup.addClass('success');
				$popup.find('.popup-head').html('<h4 class="popup-subtitle">' + submitMessage + '</h4>');
				$popup.find('.popup-content,.inventory-check-inquire-action').remove();
			},
			error: function (data) {
				console.log("ERROR :=> " + data);
			}
		});
	});

	$('.inventory-check-continue').on('click', function (evt) {
		if($(this).hasClass("homepage")){
			window.location.href = js_site_var["homepage_url"];
		}
		hideInventoryCheckPopup();
	});

	$(document.body)
		.on('click', '.delivery-fee-popup-trigger', function () {
			toggleDeliveryFeePopup();
		})

	$(window).on('resize load', function () {
		$('.discovery-items .product-item-title').equalizeHeight();
	});
});

/* For all mini cart form submits */
function updateCart(actionName) {
	var action = $('.mini-cart form').attr('action');
	var postdata = $('.mini-cart form').serializeArray();
	postdata.push({
		name: actionName,
		value: 'value'
	});
	$.post(action, postdata, function(data) {
		$('.mini-cart').html(data);
		miniCartInits();
		countCart();
	});
}

/* TODO: Implement server logic */
/**
 * itemIndex: the cart item index for the item being updated
 * personalizationFormData: the values of the personalization
 *   options (notes[0] - notes[2]) as an array
 */
function updateCartPersonalization(cartItemIds, personalizationFormData, notes, onSuccess) {
	let url = js_site_var['cart_domain'] + js_site_var['context_path'] + '/app/cart/addItems';
	let data = {};

	for (let i = 0; i < cartItemIds.length; i++) {
		let cartItemId = cartItemIds[i];
		let j;

		for (j = 0; j < personalizationFormData.length; j++) {
			data['updateItems[' + i + '].notes[' + j + ']'] = personalizationFormData[j];
		}

		for (; j < notes.length; j++) {
			data['updateItems[' + i + '].notes[' + j + ']'] = notes[j];
		}

		data['updateItems[' + i + '].cartItemId'] = cartItemId.trim();
	}

	var callback;

	if (typeof onSuccess === 'undefined') {
		callback = handleCartUpdate;
	} else {
		callback = onSuccess;
	}

	addCsrfTokenToPostData(data);
	$.post(url, data, callback).fail(function(){
		addCsrfTokenToPostData(data);
		$.post(url, data, callback);
	});
}

function reloadpage() {
	window.location.reload();
}

function miniCartInits() {
	$('.mini-cart .mini-cart-close').on('click', function(e) {
		e.preventDefault();
		$('.mini-cart').removeClass('visible');
		$('html').removeClass('no-scroll');
	});
	$('.mini-cart .quantity-decrease').on('click', function(e) {
		e.preventDefault();
		var $target = $(this).parent().siblings('input');
		var qty = $target.val();
		$target.val(parseInt(qty) - 1);
		updateCart('_eventId_checkout_update');
	});
	$('.mini-cart .quantity-increase').on('click', function(e) {
		e.preventDefault();
		var $target = $(this).parent().siblings('input');
		var qty = $target.val();
		$target.val(parseInt(qty) + 1);
		updateCart('_eventId_checkout_update');
	});
	$('.mini-cart .mini-cart-remove').on('click', function(e) {
		e.preventDefault();
		var index = $(this).data('index');
		var $target = $('#cartUpdate\\.itemUpdates' + index + '\\.itemUpdateQuantity');
		$target.val(0);
		updateCart('_eventId_checkout_update');
	});
	$('.mini-cart .edit-personalization-popup-trigger').on('click', function (e) {
		e.preventDefault();

		modifyPersonalizationPopupTrigger(e.currentTarget, true);
	});
	$('.mini-cart .add-personalization-popup-trigger').on('click', function(e) {
		e.preventDefault();

		modifyPersonalizationPopupTrigger(e.currentTarget, false);
	});
}

function countCart() {
	ajaxWithoutAuth(js_site_var['context_path'] + '/app/cart/view.json', null, 'GET', function(data) {
		if (data && data.cart) {
			$('.shopping-bag-count').html('(' + data.cart.itemCount + ')');
			initCartLimit(data);
		}
	});

	ajaxWithoutAuth(js_site_var['context_path'] + '/app/cart/bopisEligible.json', null, 'GET', function(data) {
		window.bopisEligible = data.bopisEligible;
	});
}

function loadCart(show, onSuccess, onError) {
	ajaxWithoutAuth(js_site_var['context_path'] + '/app/cart/update?v=mini', null, 'GET', function(data) {
		var $data = $('<div></div>').html(data);
		var $errors = $data.find('.mini-cart-error');

		if ($errors.length) {
			onError(Array.prototype.map.call($errors, function(elem) { return $(elem).text(); }));

			return;
		}

		var $container = $('.mini-cart');
		$container.html($data.html());

		miniCartInits();
		countCart();

		if (typeof onSuccess !== 'undefined') {
			onSuccess();
		}

		if (show) {
			$container.addClass('visible');
		}
	});
}

function atc(selector, product_options) {
	var qty = selector.find('.atc-quantity').val();
	var cartLimitSelector = selector.find('.product_option_qty.product_option.atc-quantity.acdc-cart-limit');

	//This is just to mock a quantity in the server to display the cartlimit error
	if(qty == 0 && $(cartLimitSelector).length != 0 && $(cartLimitSelector).data('remaining-limit') == 0 ){
		qty = 1
	}else if (qty == 0) {
		showCartErrorPopup('Please enter a quantity.');
		return false;
	}

	var sku_info = product_options.getOneAndOnlySku();

	if (sku_info == null) {
		var missing_option = product_options.getFirstUnselectedOption();

		// they didn't pick all the options
		console.log('Please select all options.');
	} else {
		var items = [];
		var notes = [];

		let personalizationResult = setPersonalization(selector, notes);
		var scentCheck = setScents(selector, notes);

		if(!scentCheck && scentCheck != undefined) {
			if (js_site_var['userLanguage'] == 'FR')
				alert("s'il vous plaît sélectionner 3 parfums");
			else
				alert('Please select 3 scents.');
			return false;
		}

		var forFromCheck = setForFrom(selector, notes);

		if(!forFromCheck && forFromCheck != undefined) {
			if (js_site_var['userLanguage'] == 'FR')
				alert("Veuillez inclure un nom dans les champs 'pour' et 'de' ...");
			else
				alert("Please include a name in both the 'for' and 'from' fields...");
			return false;
		}

		if(notes.length != 0) {
			items.push({
				itemId: sku_info.itemId,
				quantity: qty,
				notes: notes
			});

		} else {
			items.push({
				itemId: sku_info.itemId,
				quantity: qty
			});
		}

		var url = js_site_var['cart_domain'] + js_site_var['context_path'] + '/app/cart/addItems';
		AcdcCart.addToCart(url, items, function(data) {
			if (typeof data != 'undefined'  && data.indexOf('profanity-error') != -1) {
				alert($(data).html());
			}

			handleCartUpdate();
		});

		var productInfo = product_options.getProductInfo().productDatas[0];
		sku_info.product_name = productInfo.productName;

		window.dataLayer.push({
			event: 'Add to Cart',
			ecommerce: {
				items: [
					{
						location: 'PDP',
						item_name: productInfo.productName, //name of product
						item_id: sku_info.publicSku, //use SAP SKU
						item_brand: 'Le Labo', // brand of product
						currency: js_site_var['userCurrency'], //Currency displayed to user
						price: Number(sku_info.price.replace(',','')), // price of product shown to user on site
						item_category: productInfo.productType, // use product_type
						item_variant: sku_info.options[0].optionValue.value, //size of product
						quantity: qty, // quantity of products added to cart
						personalization: personalizationResult, //if user personalizes product
						product_id: productInfo.productId,
						sku_id: sku_info.itemId
					}
				]
			}
		});
	}

	return false;
}

function setPersonalization(selector, notes) {
	/* Grab the optional personalization fields */
	var personalization1 = selector.find('#field-personalize-label').val();
	var personalization2 = selector.find('#field-personalize-box').val();
	var personalization3 = selector.find('#field-personalize-engraving').val();

	if (typeof personalization1 !== 'undefined' || typeof personalization2 !== 'undefined' || typeof personalization3 !== 'undefined') {

		notes.push(personalization1);
		notes.push(personalization2);
		if (typeof personalization3 === 'string') {
			notes.push(personalization3.toUpperCase());
		} else {
			notes.push("");
		}

		if(personalization1 !== "" || personalization2 !== "" || personalization3 !== "") {
			return true;
		}

		return false;
	}

	return false;
}

function setScents(selector, notes) {
	var scent1 = selector.find('select[name="scent1"]').val();
	var scent2 = selector.find('select[name="scent2"]').val();
	var scent3 = selector.find('select[name="scent3"]').val();

	if (typeof scent1 !== 'undefined' || typeof scent2 !== 'undefined' || typeof scent3 !== 'undefined') {
		if (scent1.toLowerCase() == 'choose scent' || scent2.toLowerCase() == 'choose scent'  || scent3.toLowerCase() == 'choose scent')
			return false;
		else {
			notes.push(scent1);
			notes.push(scent2);
			notes.push(scent3);
		}
	} else {
		notes.push("");
		notes.push("");
		notes.push("");
	}
}

function setForFrom(selector, notes) {
	var forValue = selector.find('input[name="for"]').val();
	var fromValue = selector.find('input[name="from"]').val();

	if (typeof forValue !== 'undefined' || typeof fromValue !== 'undefined') {
		if (forValue === "" || fromValue === "") {
			return false;
		} else {
			notes.push(forValue);
			notes.push(fromValue);
		}
	}

}

function samples_atc() {
	var items = [];

	$('.sample-sku-qty').each(function(index, element) {
		var sku_id = $(this).data('sku-id');
		var qty = $(this).val();

		if (qty > 0) {
			items.push({
				itemId: sku_id,
				quantity: qty
			});
		}
	});

	if (items.length > 0) {
		var url = js_site_var['cart_domain'] + js_site_var['context_path'] + '/app/cart/addItems';
		AcdcCart.addToCart(url, items, handleCartUpdate);
	}

	return false;
}

function customized_atc(sku_id, notes, callback, track) {
	if (track == null || track != false) {
		let target = event.target;
		isPersonalize = notes != null;
		window.dataLayer.push({
			event: 'Add to Cart',
			ecommerce: {
				items: [
					{
						location: 'PLP',
						item_name: $(target).data('name'), //name of product
						item_id: $(target).data('gtn'), //use SAP SKU
						item_brand: 'Le Labo', // brand of product
						currency: js_site_var['userCurrency'], //Currency displayed to user
						price: Number($(target).data('price')), // price of product shown to user on site
						item_category: $(target).data('product-category'), // use product_type
						item_variant: $(target).data('variant'), //size of product
						quantity: 1, // quantity of products added to cart
						personalization: isPersonalize, //if user personalizes product
						product_id: $(target).data('product-id'),
						sku_id: $(target).data('sku-id')
					}
				]
			}
		});
	}

	var items = [];

	var item = {
		itemId: sku_id,
		quantity: 1
	};

	if (notes) {
		item.notes = notes;
	}

	items.push(item);

	var url = js_site_var['cart_domain'] + js_site_var['context_path'] + '/app/cart/addItems';
	AcdcCart.addToCart(url, items, typeof callback !== 'undefined' ? callback : handleCartUpdate);

	return false;
}

function sku_atc(sku_id, callback, track) {
	return customized_atc(sku_id, undefined, callback, track);
}

function linkAtc(target, notes, callback) {
	var $target = $(target);
	var skuId = $target.data('sku-id');

	customized_atc(skuId, notes, callback);
}

function handleCartUpdateSuccess() {
	if (js_site_var['pageview'][0] === 'cart') {
		reloadpage();
	} else {
		$('html, body').animate({
			scrollTop: 0
		}, 1000);
	}
}

function handleCartUpdateError(errors) {
	showCartErrorPopup(
		errors.map(function(err) { return '<p>' + err + '</p>'; })
			.join('')
	);
}

function handleCartUpdate() {
	loadCart(
		true,
		handleCartUpdateSuccess,
		handleCartUpdateError
	);
}

function inquireHandleWindowScroll() {
	var $header = $('.header');
	var $topBanner = $('.top-banner');
	var $sectionFilter = $('.section-filter');
	var $popup = $('.popup.popup-inquire');
	var breakpoint = 1024;
	var winWidth = $(window).width();
	var offset;

	function isVisible($target) {
		var rect = $target[0].getBoundingClientRect();
		var top = rect.top;
		var bottom = rect.bottom;

		return $target.is(':visible') && top >= 0 && bottom >= 0;
	}
}

function sku_inquire(skuCode) {
	$.get(js_site_var['context_path'] + '/app/lead/add/inquire?skuCode=' + skuCode, function(data) {
		var $html = $(data);
		$('.wrapper').prepend($html);
		$('.select').dropdown();

		$(window).on('scroll', inquireHandleWindowScroll);
		inquireHandleWindowScroll();

		$html.find('.popup-close').on('click', function() {
			$(window).off('scroll', inquireHandleWindowScroll);
		});
	});
}

function leadInquireSubmit(data) {
	var $content = $(data).find('.popup-content');
	$('.popup.popup-inquire .popup-content').replaceWith($content);
	$('.select').dropdown();

	$content.find('.popup-close').on('click', function() {
		$(window).off('scroll', inquireHandleWindowScroll);
	});
}

function displayErrorMessage(message){
	setTimeout(function(){ alert(message); }, 500);
}

function fix3dsFrame() {
	// move result div out of iframe to parent and then remove iframe
	window.parent.$('#acs-form').append($('#paInlineFrame').contents().find('#threeds-result'));
	$('#paInlineFrame').remove();
}


/* START FOR APPLE PAY CLIENT  */
function applePayShippingContactValidation(event, update){
	if(event.shippingContact.countryCode.toLowerCase() == 'us' && applePay.settings.request.countryCode.toLowerCase() != 'us'){
		var error = new ApplePayError("addressUnserviceable", "country", "Please select US address.");
		update.errors = [error];
	}else if(event.shippingContact.countryCode.toLowerCase() == 'gb' && applePay.settings.request.countryCode.toLowerCase() != 'gb'){
		var error = new ApplePayError("addressUnserviceable", "country", "Please select GB address.");
		update.errors = [error];
	}else if(event.shippingContact.countryCode.toLowerCase() != 'us' && event.shippingContact.countryCode.toLowerCase() != 'gb') {
		var error = new ApplePayError("addressUnserviceable", "country", "Apple Pay can only be used in the United States and UK. Please select the country's address.");
		update.errors = [error];
	}
}


function applePayShippingContactStatus(event){
	return (event.shippingContact.countryCode.toLowerCase() != 'us' && event.shippingContact.countryCode.toLowerCase() != 'gb')
}
/* END FOR APPLE PAY CLIENT  */

function showCartErrorPopup(html) {
	var $target = $('#popup-max-cart-items');
	$target.find('.popup-content').html(html);

	$target.toggleClass('visible');
}

/* if a shipping method is not selected, scroll to the form element and show options */
function validateShippingMethod() {
	if($('#ship-method-form-select').val() == "") {
		$('#ship-method-form-select').get(0).scrollIntoView();
		$('#ship-method-form-select').get(0).click();
		return false;
	}

	return true;
}

function validatePoBox(streetAddress) {
	let regex = new RegExp('.*[p][.]*[\\s]*[o][.]*[ ]*box.*|.*post[ ]*office[ ]*box.*|.*postal[ ]*box.*' +
		'|.*postal[ ]*office[ ]*box.*|(^[p][.]*[\\s]*[o][.]*[ ]\\d+|.*[ ]*[p][.]*[\\s]*[o][.]*[ ]*\\d+)' +
		'|(^[ ]*box*[.]*[:]*[\\s]*[ ]*\\d+|.*[ ]box[.]*[:]*[\\s]*[ ]*\\d+)|(^[ ]*box#*[.]*[:]*[\\s]*[ ]*\\d+' +
		'|.*[ ]box#[.]*[:]*[\\s]*[ ]*\\d+)|(^[ ]*box #*[.]*[:]*[\\s]*[ ]*\\d+|.*[ ]*box #*[.]*[:]*[\\s]*[ ]*\\d+)');
	try {
		return streetAddress.toLowerCase().match(regex) == null;
	} catch(err) {
		console.log(err);
	}

	// this won't break the autocomplete if there is an error
	return true;
}

function toggleInventoryCheckPopup(flag) {
	var $target = $('#popup-inventory-check');

	if (typeof flag === 'undefined') {
		flag = !$target.hasClass('visible');
	}

	$target.toggleClass('visible', flag);
	$('.mini-cart').toggleClass('popup-open', flag);
}

function showInventoryCheckPopup() {
	toggleInventoryCheckPopup(true);
}

function hideInventoryCheckPopup() {
	toggleInventoryCheckPopup(false);
}

function toggleDeliveryFeePopup(flag) {
	var $popup = $('#popup-delivery-fee');

	if (typeof flag === 'undefined') {
		flag = !$popup.hasClass('visible');
	}

	$popup.toggleClass('visible', flag);
}
