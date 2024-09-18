$(function() {
	$('.map-select').on('change', function(event) {
		$(this).parents('form').submit();
	});

	ajaxWithoutAuth(js_site_var['context_path'] + '/app/cart/bopisEligible.json', null, 'GET', function(data) {
		window.bopisEligible = data.bopisEligible;
		if(data.bopisEligible) {
			initStoreData();
		}
	});
});

function initPopupDisplay() {
	ajaxWithoutAuth(js_site_var['context_path'] + '/app/cart/view.json', null, 'GET', function(data) {
		if (data && data.cart) {
			if(data.cart.itemCount > 0) {
				$('.pickupPopupWithCartText').html(	$('.pickupPopupWithCartText').html().replace("%%BEGIN_LINK%%", "<a href='#' class='btn-link clearCartLink'>") );
				$('.pickupPopupWithCartText').html(	$('.pickupPopupWithCartText').html().replace("%%END_LINK%%", "</a>") );
				$('.pickupPopupWithCartText').removeClass('hidden');
				$('.pickupPopupText').addClass('hidden');
				
				$('body').on('click', '.pickupPopupWithCartText .clearCartLink', function(e) {
					e.preventDefault();
					ajaxWithoutAuth(js_site_var['context_path'] + '/app/cart/clear', null, 'GET', function(data) {
						console.log("cart is cleared successfully");
						handleCartUpdate();
						
						// Revert the popup to its original state
						$('.pickupPopupWithCartText').addClass('hidden');
						$('.pickupPopupText').removeClass('hidden');
						$('.pickup-location-results').addClass('hidden');
       					$('#popup-pickup-location .popup').removeClass('popup-large');
       					$('.pickup-location-search-field').val('');
       					initStoreData();						
					});
				});
			} else {		
				$('.pickupPopupWithCartText').addClass('hidden');
				$('.pickupPopupText').removeClass('hidden');
			}
		}
	});
}

function storeSelectHandler(store, marker){
    marker.getMap().setCenter(marker.getPosition());
}

function initListeners() {
	$('body').on('submit', '#form-pickup-location', function(e) {
		e.preventDefault();
		doStoreSearch();
	});

	$('body').on('click', '.pickup-location-search-btn', function(e) {
		e.preventDefault();
		doStoreSearch();
	});

	$('body').on('click', '#popup-pickup-location .pickup-location-set-btn', function(e) {
		e.preventDefault();
		let $checked = $('input[name="pickup-location"]:checked');
		let alertMsg;

		if (!$checked.length) {
			if (js_site_var['userLanguage'] == 'FR') {
				alertMsg = 'Veuillez sélectionner un magasin de retrait.';
			} else {
				alertMsg = 'Please select a pick up store.'
			}
			alert(alertMsg);
			return;
		}

		if ($checked.length && window.currentStoreData !== undefined) {
			let storeId = $checked.val();
			window.selectedStore = window.currentStoreData.find(store => store.storeId == storeId);
			if(js_site_var['userLanguage'] == 'FR') {
				$('.selected-pickup-store').html('Disponible pour le retrait en magasin à ' + htmlDecode(window.selectedStore.store.name));
			} else {
				$('.selected-pickup-store').text('Available for store pickup today at ' + htmlDecode(window.selectedStore.store.name));
			}

			$('#popup-pickup-location').removeClass('visible');
			$('.mini-cart').removeClass('popup-open');

			ajaxWithoutAuth(js_site_var['context_path'] + '/app/estimatedPickUpStore?storeId=' + storeId + '&postalCode=' + $checked.data('customer-postal'), null, 'GET', function(data) {
				if (window.location.href.indexOf('cart/update') > -1) {
					window.location.reload();
				}
			});
		}
	});

	/*
	$('body').on('click', '.store-listing', function(e) {
		$(this).find('input').prop('checked', true);
	});
	*/

	$('body').on('click', '.pickup-location-item-hours-toggle', function(e) {
		var $target = $(e.target);
		var $item = $target.closest('.pickup-location-item');
		var $hours = $item.find('.pickup-location-item-hours');

		$hours.toggleClass('hidden');
	});
	
	$('body').on('click', '.select-pickup-store-toggle', function(e) {
		initPopupDisplay();
	});
	
	
}

function initStoreData() {
	// fetch the set of excluded pick up countries from the current cart
	ajaxWithoutAuth(js_site_var['context_path'] + '/app/cart/excludedPickUpCountries.json', null, 'GET', function(data) {
		window.excludePickupOnCountries = window.excludePickupOnCountries || [];
		window.excludePickupOnCountries = [...window.excludePickupOnCountries,
			...data.excludedCountries.filter(c => window.excludePickupOnCountries.indexOf(c) < 0)];
	});

	// fetch the current estimated pick up store if customer has selected one
	ajaxWithoutAuth(js_site_var['context_path'] + '/app/cart/estimatedPickUpStore.json', null, 'GET', function(data) {
		if (data !== undefined && data.store !== null) {
			window.selectedStore = data.store;
			let excludePickupOnCountryList = excludePickupOnCountryMap[window.skuId];
			if(typeof excludePickupOnCountryList == 'undefined') {
				excludePickupOnCountryList = window.excludePickupOnCountries;
			} else {
				excludePickupOnCountryList = [...excludePickupOnCountryList,
					...window.excludePickupOnCountries.filter(c => excludePickupOnCountryList.indexOf(c) < 0)];
			}
			// Check if selected store is available for current product
			console.log(data.store.store.additionalDescription1);
			console.log(excludePickupOnCountryList);

			let itemBopisEligible = true;
			let bopisIneligibleCountries = bopisIneligibleCountriesMap[window.skuId];
			if(typeof bopisIneligibleCountries != 'undefined' && bopisIneligibleCountries.length > 0) {
				if($.inArray(js_site_var['userRegion'], bopisIneligibleCountryList) >= 0) {
					itemBopisEligible = false;
				}
			}

			if(!itemBopisEligible) {
				if(js_site_var['userLanguage'] == 'FR') {
					$('.selected-pickup-store').html('Ce produit n\'est pas éligible pour un enlèvement en magasin.');
				} else {
					$('.selected-pickup-store').text('This item is ineligible for store pickup.');
				}
			} else if (excludePickupOnCountryList !== null && excludePickupOnCountryList.includes(window.selectedStore.store.additionalDescription1)) {
				if(js_site_var['userLanguage'] == 'FR') {
					$('.selected-pickup-store').html('Indisponible pour le retrait en magasin à ' + htmlDecode(window.selectedStore.store.name));
				} else {
					$('.selected-pickup-store').text('Unavailable for store pickup today at ' + htmlDecode(window.selectedStore.store.name));
				}
			} else {
				if(js_site_var['userLanguage'] == 'FR') {
					$('.selected-pickup-store').html('Disponible pour le retrait en magasin à ' + htmlDecode(window.selectedStore.store.name));
				} else {
					$('.selected-pickup-store').text('Available for store pickup today at ' + htmlDecode(window.selectedStore.store.name));
				}
			}
		}
	});
}

function doStoreSearch() {
	let location = $('#form-pickup-location .pickup-location-search-field').val();
	if (location === undefined || location === null || location.trim() === '') {
        $('.pickup-location-results').addClass('hidden');
        $('#popup-pickup-location .popup').removeClass('popup-large');
		return;
	}

	// if we have the location response cached, use that value instead to prevent
	// excessive AJAX calls
	if (window.storeCache !== undefined && window.storeCache[location + "_" + window.skuId] !== undefined
			&& window.storeCache[location + "_" + window.skuId] !== null) {
		renderStores(location, window.storeCache[location + "_" + window.skuId], htmlDecode);
		return;
	}

	let headers = {
		"Accept" : "application/json",
		"Content-Type" : "application/json",
		"csrfToken" : getCookieWithHelper(false, 'csrfToken')
	};

	let requestData = {
		"searchAll": location,
		"withInMiles": js_site_var['inStorePickupWithinMiles'],
		"storeType": js_site_var['pickupStoreTypeRefCode'],
		"orderField": "DISTANCE"
	};

	let url = js_site_var['context_path'] + '/app/store/locationQuery.json';
	ajaxWithoutAuthWithHeaders(url, JSON.stringify(requestData), 'POST', headers, function(data) {
		let excludePickupOnCountryList = excludePickupOnCountryMap[window.skuId];
		if(typeof excludePickupOnCountryList == 'undefined') {
			excludePickupOnCountryList = window.excludePickupOnCountries;
		} else {
			excludePickupOnCountryList = [...excludePickupOnCountryList,
				...window.excludePickupOnCountries.filter(c => excludePickupOnCountryList.indexOf(c) < 0)];
		}
		window.currentStoreData = data.stores.filter(store =>
			excludePickupOnCountryList.indexOf(store.store.additionalDescription1) < 0);

		window.storeCache = window.storeCache || {};
		window.storeCache[location + "_" + window.skuId] = window.currentStoreData;
		renderStores(location, window.currentStoreData, htmlDecode);
	});
}

function renderStores(location, stores, htmlDecode) {
	let errorMsg;

	$('.pickup-location-list').html('');

	if (stores.length === 0) {
		if (js_site_var['userLanguage'] == 'FR') {
			errorMsg = "Désolé, il n'y a pas de points de retrait dans votre région.";
		} else {
			errorMsg = "Sorry, there are no pickup locations in your area.";
		}

		$('.pickup-location-results-text').text(errorMsg);

		$('#popup-pickup-location .popup').removeClass('popup-large');
	} else {
		if (js_site_var['userLanguage'] == 'FR') {
			$('.pickup-location-results-text').text('Les résultats pour "' + location + '"');
		} else {
			$('.pickup-location-results-text').text('Results for "' + location + '"');
		}

		for (let key in stores) {
			let store = stores[key];

			store.store.hours = htmlDecode(store.store.hours);
			store.customerPostal = location;

			if (js_site_var['userLanguage'] == 'FR') {
				let store_copy_fr = store.store.storeAttributeMap['AVAILABLE_COPY_FR'];
				if(store_copy_fr != undefined) {
					store.store.message = store_copy_fr;
				} else {
					store.store.message = "Disponible pour retrait en magasin sous 1 à 2 jours ouvrables.";
				}

			} else {
				let store_copy_en = store.store.storeAttributeMap['AVAILABLE_COPY_EN']
				if(store_copy_en != undefined) {
					store.store.message = store_copy_en;
				} else {
					store.store.message = "Available for store pickup within 1-2 business days. (Free)";
				}
			}

			$('.pickup-location-list').append($('#store-listing').tmpl(store));
		}

		$('#popup-pickup-location .popup').addClass('popup-large');
	}

	$('.pickup-location-results').removeClass('hidden');
}

function htmlDecode(input){
	let e = document.createElement('textarea');
	e.innerHTML = input;
	return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}