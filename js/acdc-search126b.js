$(function() {
	$('.search-btn').on("click", submitSearch);

	function mobileSearchMenuToggle(flag) {
		var $target = $('.btn-search');
		var $menu = $('.mobile-search-menu');
		var $html = $('html');

		$target.toggleClass('active', flag);
		$html.toggleClass('no-scroll', flag);
		$menu.toggleClass('active', flag);
	}

	function mobileSearch(term) {
		var flag = term !== '';

		function handleAlways() {
			var $popularSection = $('.mobile-search-section--popular');
			var $resultsSection = $('.mobile-search-section--results');

			$popularSection.toggleClass('hidden', flag);
			$resultsSection.toggleClass('hidden', !flag);
		}

		if (flag) {
			var $heading = $('.mobile-search-heading--results');
			var $actions = $('.mobile-search-action');

			var cookieRegion = getCookieWithHelper(false, 'acdc_int_region');

			var mobileSolrSearch = new SolrSearch({
				on_selector: '.mobile-search-section--results',
				query_url: js_site_var['solr_search_url'],
				displayLimit: 4,
				itemRenderer: itemRenderer,
				callback: function (ss) {
					var showMax = ss.getSettings().displayLimit;
					var docs = ss.solr_data.data.response.docs;
					var total = ss.solr_data.total_items;
					var count = Math.min(showMax, docs.length);
					var emptyFlag = total < 1;
					var heading;

					if (emptyFlag) {
						if (js_site_var['userLanguage'] == 'FR') {
							heading = 'PAS DE RÉSULTATS';
						} else {
							heading = 'NO RESULTS';
						}
					} else {
						if (js_site_var['userLanguage'] == 'FR') {
							heading = 'AFFICHANT ' + count + ' DE ' + total + ' RÉSULTATS';
						} else {
							heading = 'DISPLAYING ' + count + ' OF ' + total + ' RESULTS';
						}
					}

					$actions
						.toggleClass('hidden', emptyFlag)
						.attr('href', js_site_var['search_page'] + '?term=' + term);
					$heading.text(heading);

					window.dataLayer.push({
						event: 'View Search Results',
						search: {
							search_term: term, //search term used
							search_result_count: total // number of search results returned after search
						}
					});

					searchCallback(ss);

					handleAlways();
				},
				propagate_event: true,
				skuCodesNoVatTax: undefined,
				regionsNoVatTax: undefined,
				cookieRegion: cookieRegion,
				track_search_term: true,
				termConverter: searchTermConverter
			});
			mobileSolrSearch.solr_query.search_term = term;
			mobileSolrSearch.search();
		} else {
			handleAlways();
		}
	}

	$('.btn-search').on('click', function(e) {
		var $target = $(this);
		var visible = $target.hasClass('active');

		e.preventDefault();

		mobileSearchMenuToggle(!visible);
	});

	$('.mobile-search-close-btn').on('click', function () {
		mobileSearchMenuToggle(false);
	});

	var mobileSearchTimeoutId;
	$('.mobile-search-field').on('input', function (e) {
		var $field = $(e.currentTarget);
		var term = $field.val();

		if (mobileSearchTimeoutId) {
			clearTimeout(mobileSearchTimeoutId);
			mobileSearchTimeoutId = undefined;
		}

		mobileSearchTimeoutId = setTimeout(function() {
			if (typeof mobileSearchTimeoutId === 'undefined') {
				return;
			}

			mobileSearch(term);
		}, 1000);
	}).trigger('input');
});

function submitSearch() {
	// don't do anything if no search term is there
	var target = event.target
	var term = target.parents('form').find('#term').val();
	if ($.trim(term) == '') {
		// do nothing for now
		return false;
	}

	return true;
}

/**
 * Filter product not to be shown if the current user's country abbr is in
 * the product specs HIDE_ON_COUNTRIES
 *
 * @param solrsearch
 */
function filterHideOnCountries(data){
	var productRegion = getCookieWithHelper(false, 'acdc_region');

	if(productRegion != undefined && data.response.numFound > 0){
		var docs = data.response.docs;
		var tmpDocs = docs.filter(function(doc){
			if(doc.pso_hide_on_countries_t == undefined){
				return true;
			}
			return doc.pso_hide_on_countries_t.indexOf(productRegion) == -1;
		});
		data.response.docs = tmpDocs;
		data.response.numFound = tmpDocs.length;
	}
}

function filterHideOnSearchForm(data){
	var docs = data.response.docs;
	var tmpDocs = docs.filter(function(doc){
		if(doc.pso_hide_on_search_form_b){
			console.log("filtering refill " + doc.id);
			return false;
		}
		return true;
	});
	data.response.docs = tmpDocs;
	data.response.numFound = tmpDocs.length;
}

function renderDocs($target, docs, displayLimit, refillView, regionSkuNoVatTax) {
	if (typeof displayLimit !== 'undefined') {
		docs = docs.slice(0, displayLimit);
	}

	docs.forEach(function (doc, i){
		doc.index = i;
		doc.position = i + 1;

		if (js_site_var['userCurrency'] == 'EUR') {
			if ((js_site_var['userVAT'] == 'true' && regionSkuNoVatTax && skuCodesNoVatTax.indexOf(doc.attr_sku_code[0]) != -1) || js_site_var['userVAT'] != 'true') {
				doc.price_html = getPriceHTML(doc.list_price_eur_i, doc.price_eur_i, doc.price_eur_symbol_s);
				doc.price = formatListingPrice(doc.price_eur_i);
			} else {
				doc.price_html = getPriceHTML(doc.list_price_eur_vat_i, doc.price_eur_vat_i, doc.price_eur_symbol_s);
				doc.price = formatListingPrice(doc.price_eur_vat_i);
			}
		} else if (js_site_var['userCurrency'] == 'GBP') {
			if (js_site_var['userRegion'] == 'JE' || js_site_var['userRegion'] == 'GG') {
				doc.price_html = getPriceHTML(doc.list_price_special_gbp_i, doc.price_special_gbp_i, doc.price_gbp_symbol_s);
				doc.price = formatListingPrice(doc.price_special_gbp_i);
			} else if ((js_site_var['userVAT'] == 'true' && regionSkuNoVatTax && skuCodesNoVatTax.indexOf(doc.attr_sku_code[0]) != -1) || js_site_var['userVAT'] != 'true') {
				doc.price_html = getPriceHTML(doc.list_price_gbp_i, doc.price_gbp_i, doc.price_gbp_symbol_s);
				doc.price = formatListingPrice(doc.price_gbp_i);
			} else {
				doc.price_html = getPriceHTML(doc.list_price_gbp_vat_i, doc.price_gbp_vat_i, doc.price_gbp_symbol_s);
				doc.price = formatListingPrice(doc.price_gbp_vat_i);
			}
		} else {
			doc.price_html = getPriceHTML(doc.list_price_usd_i, doc.price_usd_i, doc.price_usd_symbol_s);
			doc.price = formatListingPrice(doc.price_usd_i);
		}

		doc.image = doc.image_path_s ? js_site_var['sku_image_path'] + doc.image_path_s : null;
		if (doc.image == null) {
			doc.image = js_site_var['context_path'] + '/images/placeHolder_IMG_360.png';
		}
		doc.product_id = doc.id.substring(0, doc.id.indexOf("-"));
		doc.refillView = refillView;

		// Flip the ATC link to Inquire if the userRegion is excluded for this product
		doc.inquireForm = false;
		doc.hasAlcohol = false;
		doc.alcoholRestrictedRegion = false;
		doc.checkInventory = true;
		doc.restrictedCountry = false;

		if ((typeof doc.excluded_countries_t != 'undefined' && doc.excluded_countries_t.indexOf(js_site_var['userRegion']) >= 0)
			|| (typeof doc.pso_excluded_countries_t != 'undefined' && doc.pso_excluded_countries_t.indexOf(js_site_var['userRegion']) >= 0)) {
			doc.inquireForm = true;
		}

		// Flip ATC link to Inquire if userRegion is to an alcohol concerned country for alcohol products
		if (typeof doc.pso_has_alcohol_b != 'undefined' && doc.pso_has_alcohol_b) {
			doc.hasAlcohol = true;
			if (typeof js_site_var['alcoholRegions'] != 'undefined' && js_site_var['alcoholRegions'].indexOf(js_site_var['userRegion']) >= 0) {
				doc.alcoholRestrictedRegion = true;
			}
		}

		if (js_site_var['userRegion'] == 'CN' || js_site_var['userRegion'] == 'MX' || js_site_var['userRegion'] == 'RU' || js_site_var['userRegion'] == 'HK') {
			doc.restrictedCountry = true;
		}

		//don't check inventory if it is a refill item, travel tube, or discovery set
		//we always link the product page, so we don't need to update CTA
		//we also don't check if the product country excluded since it cannot be purchased
		if (typeof doc.inquireForm != 'undefined' && doc.inquireForm) {
			doc.checkInventory = false;
		}

		function createPersonalizationData(key, item) {
			var type = personalizationTypesMap[key];
			var x = item[type + '_x_t'];
			var y = item[type + '_y_t'];
			var fontSize = item[type + '_font_t'];
			var image = item[type + '_image_s'];

			if (!x) {
				return null;
			}

			return {x, y, fontSize, image};
		}

		var personalization = {};

		personalizationTypesArr
			.forEach(function (entry) {
				var key = entry[0];
				var data = createPersonalizationData(key, doc);

				if (data) {
					personalization[key] = data;
				}
			});

		var personalizationMeta = {
			header: js_site_var['userLanguage'] === 'FR' ? doc.header_fr_t : doc.header_en_t,
			body: js_site_var['userLanguage'] === 'FR' ? doc.body_fr_t : doc.body_en_t,
		};

		var $elem = $('#product-template').tmpl(doc).appendTo($target);
		$elem.find('.sku-atc')
			.data({
				personalization: personalization,
				personalizationMeta: personalizationMeta,
				activeKeys: Object.keys(personalization)
			});
	});
}

function itemRenderer(solrsearch) {

	filterHideOnCountries(solrsearch.solr_data.data);

	if (solrsearch.solr_query.search_term) {
		console.log("filtering out hide_on_search_form products");
		filterHideOnSearchForm(solrsearch.solr_data.data);
	}

	var regionSkuNoVatTax = false;
	if (typeof solrsearch.getSettings().skuCodesNoVatTax != 'undefined'
		&& typeof solrsearch.getSettings().regionsNoVatTax != 'undefined'
		&& typeof solrsearch.getSettings().cookieRegion != 'undefined'
		&& regionsNoVatTax.indexOf(cookieRegion) != -1) {
		regionSkuNoVatTax = true;
	}

	var response = solrsearch.solr_data.data.response;
	var $target = $(solrsearch.getSettings().on_selector + ' .product-items');

	if (solrsearch.getOptions().targetClass != undefined) {
		var newTargetName = solrsearch.getOptions().targetClass;
		$target = $(newTargetName);
	}

	$target.html('');
	let itemList = [];

	renderDocs($target, response.docs, solrsearch.getSettings().displayLimit, solrsearch.getSettings().refillView, regionSkuNoVatTax);

	response.docs.forEach(function (doc) {
		itemList.push({
			item_name: doc.product_name_t, //name of product
			item_id: doc.gtn_t, //use SAP SKU
			item_brand: 'Le Labo', // brand of product
			currency: js_site_var['userCurrency'], //Currency displayed to user
			price: Number(doc.price), // price of product shown to user on site
			index: doc.position, //position of the product in the product grid
			item_category: doc.product_type_s, // use product_type
			item_variant: doc.split_size_s, //size of product
			product_id: doc.product_id,
			sku_id: doc.sku_id_s
		});
	});

	if (typeof catalogName != "undefined") {
		window.dataLayer.push({
			event: 'View Item List',
			ecommerce: {
				item_list_name: catalogName,
				items: itemList

			}
		});
	}
}

function googleTrackProductClick(event) {
	let target = event.currentTarget;

	window.dataLayer.push({
		event: 'Select Item',
		ecommerce: {
			items: [
				{
					item_name: $(target).data('name'), //name of product
					item_id: $(target).data('gtn'), //use SAP SKU
					item_brand: 'Le Labo', // brand of product
					currency: js_site_var['userCurrency'], //Currency displayed to user
					price: Number($(target).data('price')), // price of product shown to user on site
					index: $(target).data('position'), //position of the product in the product grid
					item_category: $(target).data('product-category'), // use product_type
					item_variant: $(target).data('variant'), //size of product
					product_id: $(target).data('product-id'),
					sku_id: $(target).data('sku-id')
				}
			]
		}
	});

}

function facetRenderer(facetsolrsearch) {
	facetCounts = facetsolrsearch.solr_data.data.facet_counts;
	var facet_counts = facetsolrsearch.solr_data.data.facet_counts;

	for ( var facet_field in facet_counts.facet_fields) {
		if (!facet_counts.facet_fields.hasOwnProperty(facet_field)) {
			continue;
		}

		if (facet_field == 'facet_product_type') {
			renderStyleFacet(facet_counts, '.facet_product_type', 'facet_product_type', -1);
		} else if (facet_field == 'facet_scent') {
			renderStyleFacet(facet_counts, '.facet_scent', 'facet_scent', -1);
		} else if (facet_field == 'facet_product_type_fr') {
			renderStyleFacet(facet_counts, '.facet_product_type_fr', 'facet_product_type_fr', -1);
		}
	}
}

function renderStyleFacet(facet_counts, selector, facet, style_cap) {
	var selected_val_arr = facetsolrsearch.queryValues(facet);
	var sorted_styles = getUnSortedFacets(facet_counts.facet_fields[facet], style_cap);

	var $el = $(selector + ' ul');
	$el.html('');

	for (var i = 0; i < sorted_styles.length; i += 2) {
		var $li = $(document.createElement('li'));
		var $link = $(document.createElement('a'));
		$link.addClass('lelabo_filter');
		$link.addClass('gatracking');
		$link.html(cleanFacet(sorted_styles[i]));
		$link.data('solr_filter_facet', facet);
		$link.data('solr_filter_value', sorted_styles[i]);
		$link.data('label', cleanFacet(sorted_styles[i]));
		$link.data('category', 'Filter');
		$li.append($link);
		$el.append($li);
	}

	// tie the facetListeners, add selected facet value to the facet array and search again.
	$el.on('click', 'li', addFilter);

	if ($el.html() != '') {
		$(selector).show();
	}
}

function getUnSortedFacets(facets, facet_cap) {
	var sorted_facets = new Array();
	how_many_facets = facet_cap;

	// no sorting yet...

	for (var i = 0; i < facets.length; i += 2) {
		sorted_facets.push(facets[i]); // name
		sorted_facets.push(facets[i + 1]); // count

		how_many_facets--;

		if (how_many_facets == 0) {
			break;
		}
	}

	return sorted_facets;
}

function addFilter(event) {
	var target = jQuery(event.target);
	var solr_facet = target.data('solr_filter_facet');
	var solr_value = target.data('solr_filter_value');
	var solr_filter_trigger = $('.' + solr_facet).children('.solr-filter-trigger');

	// Add new filter facet to the existing array of facets and TRIGGER a new solr search
	var solr_value_array = solr_filter_trigger.data('solr_filter_value');
	if ($.inArray(solr_value, solr_value_array) >= 0) {
		// Make sure the new filter facet isn't already being filtered
		console.log('filter already being filtered, ignore');
		return;
	}
	solr_value_array.push(solr_value);
	solr_filter_trigger.data('solr_filter_value', solr_value_array);
	solr_filter_trigger.data('solr_filter_facet', solr_facet);
	$('.product-items').html('');
	solr_filter_trigger.trigger('solrsearch_trigger');

	window.dataLayer.push({
		event: 'PLP Filter Click',
		filter: {
			filter_used: solr_value,
		}
	});
}

function removeFilter(event) {
	// Remove the filter facet to the existing array of facets and TRIGGER a new solr search
	var target = jQuery(event.target);
	var solr_facet = target.data('solr_filter_facet');
	var solr_value = target.data('solr_filter_value');
	var solr_filter_trigger = $('.' + solr_facet).children('.solr-filter-trigger');
	var solr_value_array = solr_filter_trigger.data('solr_filter_value');

	solr_value_array = $.grep(solr_value_array, function(value) {
		return value != solr_value;
	});

	solr_filter_trigger.data('solr_filter_value', solr_value_array);
	solr_filter_trigger.trigger('solrsearch_trigger');
}

function redrawFilters(ss) {
	// Redraw the pre-selected filters based on the current solr search query
	var $target = $(ss.getSettings().on_selector + ' .filter-tags-inner span.lelabo_filter_queue');
	$target.html('');

	drawFilter('facet_product_type', ss, $target);
	drawFilter('facet_scent', ss, $target);
	drawFilter('facet_product_type_fr', ss, $target);

	if ($('.filter-tags-inner span.lelabo_filter_queue').html() == '') {
		$('.filter-tags-inner span.filter-tags-label').hide();
	} else {
		$('.filter-tags-inner span.filter-tags-label').show();
	}
}

function drawFilter(solr_facet, ss, $target) {
	var facet_value_array = ss.queryValues(solr_facet);

	var solr_filter_trigger = $('.' + solr_facet).children('.solr-filter-trigger');
	var solr_filter_trigger_array = [];

	$.each(facet_value_array, function(key, solr_value) {
		var $span = $(document.createElement('span'));
		$span.addClass('filter-tag');
		$span.data('solr_filter_facet', solr_facet);
		$span.data('solr_filter_value', solr_value);
		$span.html(solr_value);
		var $span_separator = $(document.createElement('span'));
		$span_separator.addClass('filter-tag-separator');
		$span_separator.html(',');
		if ($('.filter-tags-inner span.lelabo_filter_queue').html() == '') {
			$target.html($span)
		} else {
			$target.append($span_separator);
			$target.append($span);
		}

		// Add the removeFilter listener to this filter
		$span.on('click', function(event) {
			removeFilter(event);
		});

		// Remember what was already selected in the solr query to prevent re-selection
		solr_filter_trigger_array.push(solr_value);
	});

	solr_filter_trigger.data('solr_filter_value', solr_filter_trigger_array);
	solr_filter_trigger.data('solr_filter_facet', solr_facet);
}

function clearAllFilters(ss) {
	$('.filter-tags-inner span.filter-tags-label').hide();
	$('.filter-tags-inner span.lelabo_filter_queue').children().remove();
	$('.solr-filter-trigger').data('solr_filter_value', null);

	ss.setQuery(null);
	ss.search();
}

function searchtermCallback(ss) {
	var total = ss.solr_data.data.response.numFound;
	var term = ss.solr_query.search_term;

	if (total == 0) {
		// no results, we show products in the no results cat.

		if (js_site_var['userLanguage'] == 'FR') {
			$('.search-label').html('aucun résultat pour la recherche "' + term + '", mais vous aimerez peut-être...');
			var facetsToUse = ['facet_scent', 'facet_product_type_fr'];
		} else {
			$('.search-label').html('no results for "' + term + '", but we love these...');
			var facetsToUse = ['facet_scent', 'facet_product_type'];
		}

		facetsolrsearch = new SolrSearch({
			on_selector: '.dummy',
			query_url: js_site_var['solr_search_url'],
			query: {
				attr_cat_id: 38
			},
			facets: facetsToUse,
			facetRenderer: facetRenderer,
			propagate_event: true,
			facet_sort: 'index'
		});
		facetsolrsearch.search();

		solrsearch = new SolrSearch({
			on_selector: '.wrapper',
			query_url: js_site_var['solr_search_url'],
			query: {
				attr_cat_id: 38
			},
			initial_query_sort: 'sequence38_i+asc',
			itemRenderer: itemRenderer,
			propagate_event: true
		});
		solrsearch.search();
	}

	$('.search-tally').html(total);
	$('.search-term').html(term);
	$('.search-field').val(term);

	window.dataLayer.push({
		event: 'View Search Results',
		search: {
			search_term: term, //search term used
			search_result_count: total // number of search results returned after search
		}
	});

	searchCallback(ss);
}

function cleanFacet(value) {
	return value.replace(/[^a-zA-Z0-9] /g, '-');
}

function searchCallback(ss) {
	var $target = $(ss.getSettings().on_selector + ' .filter-clear');
	$target.on('click', function(event) {
		clearAllFilters(ss);
	});

	$('.product-item a.product-link').on("click", function(event) {
		googleTrackProductClick(event);
	});

	redrawFilters(ss);
	
	countCart();

	let docs = ss.solr_data.data.response.docs
	let inventoryCheckSkuList = [];
	for(var i = 0; i < docs.length; i++) {
		if (docs[i].checkInventory) {
			inventoryCheckSkuList.push(docs[i].sku_id_s);
		}
	}

	ajaxWithoutAuth(js_site_var['cart_domain'] + js_site_var['context_path'] + '/app/sku/inventory/' + inventoryCheckSkuList.join() + '.json', null, 'GET', function(data) {
		if (data.skuInfoList != null) {
			for(var j = 0; j < data.skuInfoList.length; j++) {
				let skuInfo = data.skuInfoList[j];
				if(!skuInfo.inStock && !skuInfo.ignoreInventory) {
					$('.sku-inquire-' + skuInfo.itemId).removeClass('hidden');
				} else {
					$('.sku-atc-' + skuInfo.itemId).removeClass('hidden');
				}
			}
		}
	});
}

function getPriceHTML(list_price, price, symbol) {
	var price_html = '';

	if (list_price > price) {
		price_html = '<s>' + symbol + formatListingPrice(list_price) + '</s>';
	}

	price_html += '<span>' + symbol + formatListingPrice(price) + '</span>';

	return price_html;
}

function formatListingPrice(price) {
	return parseFloat(price / 100).toFixed(2);
}

function searchTermConverter(search_term) {
	var third_party_id_q = search_term;
	var product_name_q = search_term + '~2';
	var product_detail_q = search_term.toUpperCase() + '~2';
	var attr_scent_q = search_term + '~2';
	var attr_product_type_q = search_term + '~2';
	
	// need to wrap in quotes if it's a search phrase
	if (search_term.indexOf(' ') > 1) {
		third_party_id_q = '(';
		product_name_q = '(';
		product_detail_q = '(';
		attr_scent_q = '(';
		attr_product_type_q = '(';

		var search_terms = search_term.split(' ');
		$.each(search_terms, function(index, term) {
			third_party_id_q += term;
			product_name_q += term + '~2';
			product_detail_q += term + '~2';
			attr_scent_q += term + '~2';
			attr_product_type_q += term + '~2';

			if (index === search_terms.length - 1) {
				third_party_id_q += ')';
				product_name_q += ')';
				product_detail_q += ')';
				attr_scent_q += ')';
				attr_product_type_q += ')';
			} else {
				third_party_id_q += ' OR ';
				product_name_q += ' OR ';
				product_detail_q += ' OR ';
				attr_scent_q += ' OR ';
				attr_product_type_q += ' OR ';
			}
		});
	}
	
	var obj;
	if(js_site_var["userLanguage"] == 'FR') {
		obj = {
				query: {
					third_party_id_txt: third_party_id_q,
					product_name_txt_fr: product_name_q,
					product_detail_txt_fr: product_detail_q,
					scent_txt: attr_scent_q,
					product_type_txt_fr: attr_product_type_q,
				},
				query_sort: null
			};
	} else {
		obj = {
				query: {
					third_party_id_txt: third_party_id_q,
					product_name_txt: product_name_q,
					product_detail_txt: product_detail_q,
					scent_txt: attr_scent_q,
					product_type_txt: attr_product_type_q
				},
				query_sort: null
			};
	}

	return obj;
	
}
