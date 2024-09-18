function initializeUserRegionRelated() {
	// hooking up the region dropdown
	
	$('.userRegionDropdown .location__link').on('click', function(event) {
		event.preventDefault();
		var selectedUserRegion = $(this).find('.location__title').attr('data-country-value');
		var countryName = $(this).find('.location__title').text();
		var countryLang = $(this).find('.location__language').data('lang');

        if (selectedUserRegion == "JP" ) {
            window.location.href = "http://www.lelabofragrances.jp/";
            return false;
        }

        if (selectedUserRegion == "CA" ) {
            window.location.href = canadaURI + "?region=CA&locale=" + countryLang;
            return false;
        }

        if (selectedUserRegion == "AU" ) {
            window.location.href = australiaURI + "?region=AU";
            return false;
        }

		if (selectedUserRegion == "KR" ) {
			window.location.href = koreaURI;
			return false;
		}

		if (selectedUserRegion == "MX" ) {
			window.location.href = mexicoURI;
			return false;
		}

		if (selectedUserRegion == "TW" ) {
			window.location.href = taiwanURI;
			return false;
		}

        setCookieWithHelper(false, 'ACDC_LOCALE', countryLang, {
            expires: 30,
			path: '/;SameSite=None; Secure',
            domain: js_site_var['cookie_domain']
        });

		setCookieWithHelper(false, 'acdc_country', countryName, {
			expires: 30,
			path: '/;SameSite=None; Secure',
			domain: js_site_var['cookie_domain']
		});

		setCookieWithHelper(false, 'acdc_country_code', selectedUserRegion, {
			expires: 30,
			path: '/;SameSite=None; Secure',
			domain: js_site_var['cookie_domain']
		});

		if(selectedUserRegion == 'ND' || selectedUserRegion == 'SS') {
			selectedUserRegion = 'GB';
		}

		setCookieWithHelper(false, 'acdc_region', selectedUserRegion, {
			expires: 30,
			path: '/;SameSite=None; Secure',
			domain: js_site_var['cookie_domain']
		});

		setCookieWithHelper(false, 'acdc_int_region', selectedUserRegion, {
			expires: 30,
			path: '/;SameSite=None; Secure',
			domain: js_site_var['cookie_domain']
		});

		if(getCookieWithHelper(false, 'ACDC_LOCALE') === 'undefined' || getCookieWithHelper(false, 'ACDC_LOCALE') === 'EN'){
			js_site_var['userLanguage'] = "EN";
		}else if(getCookieWithHelper(false, 'ACDC_LOCALE') === 'RU'){
			js_site_var['userLanguage'] = "RU";
		}else{
			js_site_var['userLanguage'] = "FR";
		}

		$('.popover-bag .new-country').text(countryName);
		$('.popover-bag .new-country').val(selectedUserRegion);
		$('.popover-bag').addClass('open');
		setAndShowCurrency(selectedUserRegion);
		setCurrencyBasedOnRegion(selectedUserRegion);
		setVATBasedOnRegion(selectedUserRegion);

		var homepageUrl = js_site_var["homepage_url"];
		if(js_site_var['userLanguage'] === "FR") {
			homepageUrl += 'fr/';
		}

		window.selectedStore = null;
		ajaxWithoutAuth(js_site_var['context_path'] + '/app/estimatedPickUpStore?storeId=clear', null, 'GET', null);
		if(cartdata.cart.itemCount > 0){
			ajaxWithoutAuth(js_site_var['context_path'] + '/app/cart/clear', null, 'GET', function() {
				window.location.href = homepageUrl;
			});
		} else {
			window.location.href = homepageUrl;
		}

	});

	$('.popover-btn-cancel').on('click', function(event) {
		event.preventDefault();
		location.reload();
	});

	$('.popover-btn-cancel-footer').on('click', function(event) {
		event.preventDefault();
		location.reload();
	});

	// update dropdown with pre-selected region
	$('.userRegionDropdown').val(js_site_var['userRegion']);
	$('.userRegionDropdown').addClass('select-secondary');
	$('.nav-lang').show();

	// show currency specific content. If userVAT is false and a nonVAT price is available, use that instead
	displayCurrency();

  //contactus Region
  var currentContactRegionClass = "contactUS";
  if(typeof contactusUKRegion != 'undefined' && contactusUKRegion.indexOf(js_site_var["userRegion"]) != -1 ){
    currentContactRegionClass = "contactUK";
  }else if(typeof contactusFRRegion != 'undefined' && contactusFRRegion.indexOf(js_site_var["userRegion"]) != -1 ){
    currentContactRegionClass = "contactFR";
  }else if(typeof contactusUSRegion != 'undefined' && contactusUSRegion.indexOf(js_site_var["userRegion"]) != -1 ) {
  	currentContactRegionClass = "contactUS";
  }else if(typeof contactusINTRegion != 'undefined' && contactusINTRegion.indexOf(js_site_var["userRegion"]) != -1 ) {
  	currentContactRegionClass = "contactINT";
  }
  $('.acdc_distributor.' + currentContactRegionClass).show();
}

function displayCurrency(){
	$('.acdc_currency').hide();
	$('.acdc_currency.' + js_site_var['userCurrency'] + ':not(.nonVAT)').show();
	if (js_site_var['userVAT'] == 'false') {
		$('.acdc_currency.' + js_site_var['userCurrency'] + '.nonVAT').each( function() {
			$(this).siblings( '.acdc_currency.' + js_site_var['userCurrency']).hide();
			$(this).show();
		});
	}
}

function setCurrencyBasedOnRegion(selectedUserRegion) {
	// base on the region, set the currency also
	if ($.inArray(selectedUserRegion, EURcountries) >= 0) {
		setCookieWithHelper(false, 'acdc_currency', 'EUR', {
			expires: 30,
			path: '/;SameSite=None; Secure',
			domain: js_site_var['cookie_domain']
		});
	} else if ($.inArray(selectedUserRegion, GBPcountries) >= 0) {
		setCookieWithHelper(false, 'acdc_currency', 'GBP', {
			expires: 30,
			path: '/;SameSite=None; Secure',
			domain: js_site_var['cookie_domain']
		});
	} else {
		setCookieWithHelper(false, 'acdc_currency', 'USD', {
			expires: 30,
			path: '/;SameSite=None; Secure',
			domain: js_site_var['cookie_domain']
		});
	}
}

function setAndShowCurrency(selectedUserRegion) {
	
	if ($.inArray(selectedUserRegion, EURcountries) >= 0) {
		js_site_var['userCurrency'] = 'EUR';
	} else if ($.inArray(selectedUserRegion, GBPcountries) >= 0) {
		js_site_var['userCurrency'] = 'GBP';
	} else {
		js_site_var['userCurrency'] = 'USD';
	}
	
	displayCurrency();
}

function setVATBasedOnRegion(selectedUserRegion) {
	if ($.inArray(selectedUserRegion, VATcountries) >= 0) {
		// base on the region, enable VAT (Value Added Tax) prices
		setCookieWithHelper(false, 'acdc_vat', 'true', {
			expires: 30,
			path: '/;SameSite=None; Secure',
			domain: js_site_var['cookie_domain']
		});
	} else {
		// all other regions are not applicable to VAT (i.e. US, CA)
		setCookieWithHelper(false, 'acdc_vat', 'false', {
			expires: 30,
			path: '/;SameSite=None; Secure',
			domain: js_site_var['cookie_domain']
		});
	}
}