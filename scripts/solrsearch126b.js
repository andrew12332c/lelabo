function SolrSearch(options) {

	/**
	 * for private methods
	 */
	var obj = this;

	/**
	 * fixed settings - stuff that shouldn't change once you set them.
	 */
	var settings = jQuery.extend({
		propagate_event: false,

		// 'AND' or 'OR'. while the operator is optional (Solr uses the default according to the schema),
		// that is frowned upon in these woods.
		// the default should be 'AND' since it makes the most sense for how we typically use search.
		operator: 'AND',

		query_url: '',

		// this will always be part of the query - useful for category pages
		// where the { category_id: 2 } will always be part of the query.
		// format should be { field_name: 'field_value', field_name: 'field_value' }
		query: null,

		// for arbitrary faceting (e.g., prices)
		facet_queries: [],

		// sometimes, we need to know the initial sort.
		// this is only used if sort_data.query_sort is null.
		initial_query_sort: 'score+desc',

		// format should be [ 'color', 'style', 'size' ]
		facets: [],

		// display the number of facets for display, default 100 set to -1 for unlimited
		facet_limit: 100,

		// ordering of facet(s) return back, default by count. change to 'index' for alphabetically sorted
		facet_sort: 'count',

		// comma delimited list of fields to get back from Solr if there is a need to minimize response
		return_fields: '',

		// the most number of items we'll ever ask for is
		maximum_items: 1000,

		// function for rendering facet fields
		facetRenderer: null,

		// function for rendering items.
		// this can also be a name of the function.
		itemRenderer: null,

		// function for rendering paging
		pagingRenderer: null,

		// where the event handler is attached
		on_selector: '#solr_search',

		// events to attach the change handler for
		change_handler_events: 'change click solrsearch_trigger',

		// called AFTER every search() (after render - if not null)
		callback: null,

		// function called before rendering
		pre: null,
		
		// calculates the offset for the query count/current page
		offsetCalculator: function(obj){
			if (obj.solr_query.per_page < 0) {
				// "view all"
				return 0;
			}
			return (obj.solr_query.cur_page - 1) * obj.solr_query.per_page;
		},
		
		//calculate the number of Items that need to be queried
		queryCountCalculator: function(obj){
			if (obj.solr_query.per_page < 0) {
				return settings.maximum_items;
			}else {
				return obj.solr_query.per_page;
			}
		},

		// this is the function used to convert a search term into a Solr query.
		// this should return an Object that has the same format as "query".
		// this can also be a name of the function.
		// if the return value is a string, then we are going to use Solr's DisMax query parser
		// which is good for searching user-entered search phrases.
		// in general, we should stick with Solr's DisMax query parser and have the termConverter
		// return the search term.
		termConverter: function(st) {

			// after trimming, replace all whitespace with " AND "
			return st.trim().replace(/\s+/g, ' AND ');
		},

		spellcheck_collate: true,
		spellcheck_max_collations: 5,

		// when changes are detected (e.g., filter, sort, page change), we want to perform a search.
		// set this to false if you don't want that to happen. you'll have to call the
		// search() function explicitly.
		implicit_search: true,

		// function to call when page, filter, sort, etc. changes. this is called
		// BEFORE search()
		changeCallback: null,
		
		// use this callback if you want to append any additional query data to the url as a param
		constructParamCallback: null,

		searchTermFilter: function(st) {
			return st.replace(/[^a-zA-Z0-9 \-]/g, '');
		},

		// an array of field names to search against when doing DisMax query parsing.
		// e.g.: ['third_party_id_t', 'third_party_id_t']
		// with boosts e.g.: ['third_party_id_t^20', 'third_party_id_t^10']
		query_fields: null,

		// whether or not we should keep track of customer's searches
		track_search_term: false
	}, options || {});

	// get the passed options....
	this.getOptions = function() {
		return options;
	};

	// can be used to inject functionality after object has been created
	// prior to "search" invocation.
	this.getSettings = function() {
		return settings;
	};

	// the dynamic part of the query.
	// the query will be built from a combination of settings.query, solr_query (this), and settings.query_fields (if DisMax)
	this.solr_query = {
		// format should be { field_name: 'field_value', field_name: 'field_value' }.
		// send multiple values for an OR statement by using surrounding the value with ()
		// and separating the elements with 'OR' (e.g., { category_id: '(10 OR 11 OR 12)' }
		query: null,

		query_sort: null,
		cur_page: 1,

		// < 0 means "view all" (actually settings.maximum_items). i have no idea what 0 would mean.
		per_page: 20,

		// search term - this term will be converted by the "termConverter" function into
		// a Solr query which will be converted into the "query".
		search_term: null,

		// the search term we want do spell check against
		spellcheck_query: null,
		
		// the clicked facet
		current_target: null
	};

	// reflects the current Solr result/state/data.
	this.solr_data = {
		total_items: 0, // total items (regardless of pagination)
		total_pages: 0,
		data: null
	};

	this.setImplicitSearch = function(b) {
		settings.implicit_search = b;
	}

	this.setChangeCallback = function(fn) {
		settings.changeCallback = fn;
	}

	this.getChangeCallback = function() {
		return settings.changeCallback;
	}

  /**
   *  save on first occurrence for this object
   *  used for search term tracking
   */
  var isTrackingSaved = false;

	var equals = function(x, y) {
		if (x === y)
			return true;
		// if both x and y are null or undefined and exactly the same

		if (!(x instanceof Object) || !(y instanceof Object))
			return false;
		// if they are not strictly equal, they both need to be Objects

		if (x.constructor !== y.constructor)
			return false;
		// they must have the exact same prototype chain, the closest we can do is
		// test there constructor.

		for ( var p in x) {
			if (!x.hasOwnProperty(p))
				continue;
			// other properties were tested using x.constructor === y.constructor

			// unique to our needs, a property with null or undefined are "equal"
			if (x[p] != null && !y.hasOwnProperty(p))
				return false;
			// allows to compare x[p] and y[p] when set to undefined

			if (x[p] === y[p])
				continue;
			// if they have the same strict value or identity then they are equal

			if (typeof (x[p]) !== "object")
				return false;
			// Numbers, Strings, Functions, Booleans must be strictly equal

			if (!equals(x[p], y[p]))
				return false;
			// Objects and Arrays must be tested recursively
		}

		for (p in y) {
			// unique to our needs, a property with null or undefined are "equal"
			if (y.hasOwnProperty(p) && y[p] != null && !x.hasOwnProperty(p))
				return false;
			// allows x[p] to be set to undefined
		}

		return true;
	}

	this.queryEquals = function(other_solr_query) {
		return equals(this.solr_query, other_solr_query);
	}

	var deconstructQueryObject = function(query_obj, operator) {
		if (typeof query_obj === 'string') {
			return query_obj;
		}

		// console.log('in deconstructQueryObject() with operator: ' + operator);
		var query = '';

		for ( var key in query_obj) {
			if (!query_obj.hasOwnProperty(key)) {
				continue;
			}

			if (key == 'operator') {
				continue;
			}

			var val = query_obj[key];

			if (val != null && val != '') {
				query += ' ' + operator;

				if (typeof val == 'object') {
					// if the object is an array return the array.
					if ((Array.isArray && Array.isArray(val)) || val instanceof Array) {
						var invertSymbol = operator == 'AND' ? ' OR ' : ' AND ';
						var deconstructed = key + ' : (';
						var len = val.length - 1;

						$.each(val, function(index, value) {
							// escape double quotes
							value = String(value);
							value = value.replace('"', '\\"');
							deconstructed += '"' + value + '"';
							deconstructed += index < len ? invertSymbol : '';
						});

						deconstructed += ')';
					} else if (typeof val.operator == 'undefined') {
						// we'll just "intelligently" assume that you're using a "sub-query" because you want
						// to use the opposite operator.
						if (operator == 'AND') {
							var deconstructed = '(' + deconstructQueryObject(val, 'OR') + ')';
						} else {
							var deconstructed = '(' + deconstructQueryObject(val, 'AND') + ')';
						}
					} else {
						var deconstructed = '(' + deconstructQueryObject(val, val.operator) + ')';
					}

					// console.log('"' + key + '" has an object for a value and it was deconstructed into ' + deconstructed);
					query += ' ' + deconstructed;
				} else if (typeof val == 'number') {
					query += ' ' + key + ':' + val;
				} else {
					if (val.length > 1 && val.substring(0, 1) == '[' && val.substring(val.length - 1) == ']') {
						// it's a range e.g., [0 TO *]
						// console.log('range search using ' + val);
						query += ' ' + key + ':' + val;
					} else if (val.length > 1 && val.substring(0, 1) == '(' && val.substring(val.length - 1) == ')') {

						// it's a group of values e.g., (5 OR 6)
						// console.log('group search using ' + val);
						query += ' ' + key + ':' + val;
					} else if (val.length > 1 && (val.indexOf('~') > 1 || val.indexOf('^') > 1)) {

						// if we're boosting a term or doing proximity/fuzzy search, then the search term should already have
						// double quotes (if needed).
						// console.log('boost, proximity, or fuzzy search using ' + val);
						query += ' ' + key + ':' + val;
					} else {
						query += ' ' + key + ':"' + val + '"';
					}
				}
			}
		}

		// trim the beginning
		if (query != '') {
			// console.log('before trim: ' + query);
			// 2 is for two separate spaces used during separation of terms/phrases
			query = query.substr(2 + operator.length);
			// console.log('after trim: ' + query);
		}

		return query;
	}

	var disMaxQueryHelper = function(index, value) {
		query = '';

		if (value != null && value != '') {
			if ((typeof value == 'object') && ((Array.isArray && Array.isArray(value)) || value instanceof Array)) {
				var invertSymbol = settings.operator == 'AND' ? ' OR ' : ' AND ';
				query += index + ' : (';
				var len = value.length - 1;

				$.each(value, function(arr_index, arr_value) {
					// escape double quotes
					arr_value = typeof arr_value === 'string' ? arr_value.replace('"', '\\"') : arr_value;
					query += '"' + encodeURIComponent(arr_value) + '"';
					query += arr_index < len ? invertSymbol : '';
				});

				query += ') ';
			} else {
				query += index + ":" + value + " ";
			}
		}

		return query;
	}

	var buildDisMaxQuery = function(query_obj, query) {
		if (typeof query_obj === 'string' && settings.query_fields != null && settings.query_fields.length > 0) {
			console.log('performing dismax');
			query += '&defType=edismax';

			// this is for the fields you want to query with dismax
			query += '&qf=';

			for (var i = 0; i < settings.query_fields.length; i++) {
				// simple space seperator is acceptable
				query += settings.query_fields[i] + " ";
			}

			// this is for filtering the query based on "settings.query" and "solr_query.query"
			if (obj.solr_query.query !== null || settings.query != null) {
				query += '&fq=';

				if (settings.query !== null) {
					$.each(settings.query, function(index, value) {
						query += disMaxQueryHelper(index, value);
					});
				}

				if (obj.solr_query.query !== null) {
					$.each(obj.solr_query.query, function(index, value) {
						query += disMaxQueryHelper(index, value);
					});
				}
			}
		}

		return query;
	}

	var buildQuery = function() {
		var query = settings.query_url;
		query += '&start=' + settings.offsetCalculator(obj) + '&rows=' + settings.queryCountCalculator(obj);

		query += '&sort=' + obj.querySort();
		query += '&q=';

		// merge query and query (deep copy)
		var query_obj = {};
		var original_search_term = obj.solr_query.search_term;

		if (obj.solr_query.search_term) {
			obj.solr_query.search_term = settings.searchTermFilter(decodeURIComponent(obj.solr_query.search_term));
		}

		// to avoid some search terms, such as "watch" conflicting with FF watch() function, detect this and reset.
		if (typeof search_term != 'undefined' && search_term instanceof Function) {
			var name = obj.solr_query.search_term.name;
			obj.solr_query = {
				"search_term": name
			};
		}

		// TODO factor out into its own function
		// if there is a search term and a converter, use them to construct the "query" part.
		if (settings.termConverter != null && obj.solr_query.search_term != null && obj.solr_query.search_term != '') {
			// we lowercase
			var lowercased_term = obj.solr_query.search_term.toLowerCase();

			if (typeof settings.termConverter === 'string') {
				// settings.termConverter is the function name and not the function itself
				var inner_query = window[settings.termConverter](lowercased_term);
			} else {
				var inner_query = settings.termConverter(lowercased_term);
			}

			console.log('from (original) ' + original_search_term + ' to (lowercased) ' + lowercased_term + ' to (final)', inner_query);

			if (typeof inner_query === 'string') {
				query_obj = inner_query;
			} else {
				query_obj = jQuery.extend(true, {}, obj.solr_query.query, inner_query);
				query_obj = jQuery.extend(true, {}, settings.query, query_obj);
			}
		} else {
			query_obj = jQuery.extend(true, {}, settings.query, obj.solr_query.query);
		}

		// this is for the 'q=' part
		var q_part = deconstructQueryObject(query_obj, settings.operator);

		if (q_part == '') {
			// is this a good default?
			query += '*:*';
		} else {
			query += encodeURIComponent(q_part);
		}

		if (settings.facets.length > 0) {
			query += '&facet=true&facet.mincount=1&facet.sort=' + settings.facet_sort;

			for (var i = 0; i < settings.facets.length; i++) {
				query += '&facet.field=' + settings.facets[i];
			}
		}

		// facet queries
		for (var i = 0; i < settings.facet_queries.length; i++) {
			query += '&facet.query=' + settings.facet_queries[i];
		}

		if (settings.facet_limit != null) {
			query += '&facet.limit=' + settings.facet_limit;
		}

		if (settings.return_fields != '') {
			query += '&fl=' + settings.return_fields;
		}

		// DisMax
		console.log("query_obj before DisMax", query_obj);
		console.log("query before DisMax", query);
		query = buildDisMaxQuery(query_obj, query);
		console.log("query after DisMax", query);

		// spell check?
		if (obj.solr_query.spellcheck_query != null && obj.solr_query.spellcheck_query != '') {
			query += '&spellcheck=true&spellcheck.collate=' + settings.spellcheck_collate + '&spellcheck.maxCollations=' + settings.spellcheck_max_collations + '&spellcheck.q="' + obj.solr_query.spellcheck_query + '"';
		}

		// escape \ which is a reserved character in Lucene
		var re = /(\\)/g;
		query = query.replace(re, '\\$1', 'g');
		return query;
	};

	// this overwrites solr_query.query.
	this.setQuery = function(query) {
		this.solr_query.query = query;
	}

	// this overwrites solr_query.current_target.
	this.setTarget = function(target) {
		this.solr_query.current_target = target;
	}
	
	// format should be { field_name: 'field_value', field_name: 'field_value' }.
	// this is for ADDing (using jQuery's extend(). if you want to blank out (no longer query) a specific
	// field, you need to set it as a blank/null property on the "query" object by passing
	// in a blank/null value.
	this.addQuery = function(query) {
		if (this.solr_query.query == null) {
			this.solr_query.query = {};
		}

		if (query == null) {
			query = {};
		}

		jQuery.extend(this.solr_query.query, query);

		// if solr_query.query no longer has any own property,
		// then we'll set it to null.
		for ( var key in this.solr_query.query) {
			if (this.solr_query.query.hasOwnProperty(key) && this.solr_query.query[key] != '') {
				return;
			}
		}

		this.solr_query.query = null;
	}

	// this only works if the field is a property of settings.query or this.solr_query.query and
	// is not a JavaScript object.
	this.queryValue = function(field) {
		var query_obj = jQuery.extend({}, settings.query, this.solr_query.query);
		var val = query_obj[field];

		if (val === undefined) {
			return '';
		} else {

			// val could be null.
			return val;
		}
	}

	// always returns an array
	this.queryValues = function(field) {
		var query_obj = jQuery.extend({}, settings.query, this.solr_query.query);
		var val = query_obj[field];

		if (typeof val === 'undefined') {
			val = [];
		} else {
			if ((Array.isArray && Array.isArray(val)) || val instanceof Array) {
				;
			} else {
				var c = val;
				val = new Array();

				if (c != '') {
					val.push(c);
				}
			}
		}

		return val;
	}

	this.querySort = function() {
		return this.solr_query.query_sort != null ? this.solr_query.query_sort : settings.initial_query_sort;
	}

	this.search = function(additional_callback) {
		console.log('search()', obj.solr_query);
		jQuery.getJSON(buildQuery(), function(data) {
			// recalculate some stuff
			obj.solr_data.total_items = data.response.numFound;
			obj.solr_data.total_pages = Math.ceil(obj.solr_data.total_items / obj.solr_query.per_page);
			obj.solr_data.data = data;

			if (settings.pre != null) {
				settings.pre(obj);
			}

			if (settings.facetRenderer != null) {
				settings.facetRenderer(obj);
			}

			if (settings.itemRenderer != null) {
				if (typeof settings.itemRenderer === 'string') {
					window[settings.itemRenderer](obj);
				} else {
					settings.itemRenderer(obj);
				}
			}

			if (settings.pagingRenderer != null) {
				settings.pagingRenderer(obj);
			}

      /**
       *
       * Tracking the search term and reflect the result count
       *
       * This will not be called if the tracking was already saved for this object
       *
       **/
      if (settings.track_search_term && obj.solr_query.search_term != null && !isTrackingSaved) {
        var searchResultsCount = obj.solr_data.data.response.numFound;
        var trackImg = new Image();
        trackImg.src = js_site_var['context_path'] + '/app/track/image?type=search&query=' + obj.solr_query.search_term + '&numFound=' + searchResultsCount;
        isTrackingSaved = true;
      }

			if (settings.callback != null) {
				settings.callback(obj);
			}

			if (typeof additional_callback !== 'undefined' && additional_callback != null) {
				additional_callback(obj);
			}
		});
	};

	this.changePage = function(page_num) {
		if (this.solr_query.cur_page != page_num) {
			this.solr_query.cur_page = page_num;

			if (settings.changeCallback != null) {
				settings.changeCallback('solr_change_page', this);
			}

			if (settings.implicit_search) {
				this.search();
			}
		}
	}

	this.nextPage = function() {
		if (this.solr_query.cur_page < this.solr_data.total_pages) {
			this.changePage(this.solr_query.cur_page + 1)
		}
	}

	this.previousPage = function() {
		if (this.solr_query.cur_page > 1) {
			this.changePage(this.solr_query.cur_page - 1);
		}
	}

	this.changePerPage = function(per_page) {
		if (this.solr_query.per_page != per_page) {
			this.solr_query.per_page = per_page;

			this.solr_query.cur_page = 1;

			if (settings.changeCallback != null) {
				settings.changeCallback('solr_per_page', this);
			}

			if (settings.implicit_search) {
				this.search();
			}
		}
	};

	// TODO not sure what the difference is between this and queryValue()....
	this.getFacetValue = function(facet) {
		if (this.solr_query.query == null) {
			return null;
		} else if (typeof this.solr_query.query[facet] === 'undefined') {
			return null;
		} else {
			return this.solr_query.query[facet];
		}
	}
	
	// will return the current solr query as request param URL
	this.constructParam = function() {
		var param = URI.parseQuery(location.search);
		
		var query_obj = this.solr_query.query;
		
		if (query_obj != null) {
			for (var key in query_obj) {
				var val = query_obj[key];
				
				if (val != null && val != '') {
					var newParam = '';
					
					if ((Array.isArray && Array.isArray(val)) || val instanceof Array) {
						var len = val.length - 1;
						
						$.each(val, function(index, value) {
							// escape double quotes
							value = String(value);
							value = value.replace('"', '\\"');
							newParam += value;
							newParam += index < len ? '|' : '';
						});
					} else {
						newParam = val;
					}
					
					param['s_' + key] = newParam;
				} else {
					delete param['s_' + key];
				}
			}
		} else {
			var paramKeys = Object.keys(param);
			for (var i = 0; i < paramKeys.length; i++) {
				var paramKey = paramKeys[i];
				if (paramKey.indexOf('s_facet') > -1) {
					delete param[paramKey];
				}
			}
		}
		
		var sort = this.solr_query['query_sort'];
		
		if (sort != null && sort !='') {
			param['s_sort'] = sort;
		} else {
			delete param['s_sort'];
		}
		
		var page = this.solr_query['cur_page'];
		
		if (page != null && page !='') {
			param['s_page'] = page;
		} else {
			delete param['s_page'];
		}
		
		var per_page = this.solr_query['per_page']
		
		if (per_page != null && per_page !='') {
			param['s_per_page'] = per_page;
		} else {
			delete param['s_per_page'];
		}
		
		if(settings.constructParamCallback != null) {
			settings.constructParamCallback(this.solr_query, param);
		}
		
		var newUrl = URI.buildQuery(param);
		
		return newUrl;
	}

	// attach handler
	// if you want to trigger a change in the Solr query without triggering a "click" or "change" (which
	// may have other implications from other unknown handlers), then use the "solrsearch_trigger" event instead.
	jQuery(settings.on_selector).on(settings.change_handler_events, '.solr_change_page, .solr_next_page, .solr_prev_page, .solr_sort, .solr_filter, .solr_per_page', function(event) {
		var target = jQuery(event.target);
		// console.log('handling event ' + event.type + ' on target ' + target.prop('tagName'));

		if (target.hasClass('solr_change_page')) {
			var page = target.data('solr_change_page');
			// ('solr_change_page: ' + page);
			obj.changePage(page);
		} else if (target.hasClass('solr_next_page')) {
			// console.log('solr_next_page');
			obj.nextPage();
		} else if (target.hasClass('solr_prev_page')) {
			// console.log('solr_prev_page');
			obj.previousPage();
		} else if (target.hasClass('solr_sort')) {
			var sort = null;

			if (target.is('select')) {
				sort = target.val();
				// console.log('solr_sort: ' + sort);
			} else {
				sort = target.data('solr_sort');

				// if it's not explicitly set with data "solr_sort", maybe we can use the value
				if (typeof sort === 'undefined') {
					sort = target.val();
				}

				// console.log('solr_sort: ' + sort);
			}

			if (sort == settings.initial_query_sort) {
				sort = null;
			}

			if (obj.solr_query.query_sort != sort) {
				obj.solr_query.query_sort = sort;

				// need to reset it since pagination will be inconsistent
				obj.solr_query.cur_page = 1;

				if (settings.changeCallback != null) {
					settings.changeCallback('solr_sort', obj);
				}

				if (settings.implicit_search) {
					obj.search();
				}
			}
		} else if (target.hasClass('solr_filter')) {
			var facet = null;
			var value = null;

			if (target.is('select')) {
				facet = target.prop('name');
				value = target.val();
			} else if (target.is('[type=checkbox]')) {
				if (event.type == 'change') {
					console.log('you are advised to deal with click rather than change for radio/checkbox');
				}

				facet = target.data('solr_filter_facet');

				if (typeof facet === 'undefined') {
					facet = target.prop('name');
				}

				value = [];

				// e.g. <input type="checkbox" class="solr_filter solr_attr_color" value="BLUE" />
				jQuery('.solr_filter.solr_' + facet + ':checked').each(function() {
					var $this = $(this);
					var filter_value = $this.data('solr_filter_value');

					if (typeof filter_value === 'undefined') {
						filter_value = $this.val();
					}

					if(value.indexOf(filter_value) < 0) {
						if ($.isArray(filter_value))
							$.merge(value, filter_value);
						else
							value.push(filter_value);
					}
				});
			} else if (target.is('input[type="radio"]')) {
				if (event.type == 'change') {
					console.log('you are advised to deal with click rather than change for radio/checkbox');
				}

				var facet = null;
				var value = null;
				facet = target.data('solr_filter_facet');

				if (typeof facet === 'undefined') {
					facet = target.prop('name');
				}

				value = target.data('solr_filter_value');

				if (typeof value === 'undefined') {
					value = target.val();
				}
			} else {
				facet = target.data('solr_filter_facet');
				value = target.data('solr_filter_value');
			}

			var current_value = obj.getFacetValue(facet);

			// only perform the search if something changed
			var value_is_empty = false;

			if ((Array.isArray && Array.isArray(value)) || value instanceof Array) {
				value_is_empty = value.length == 0;
			} else {
				value_is_empty = value == '';
			}

			if (current_value == null && value_is_empty) {
				console.log('facet value did not change (empty)');
			} else if (current_value == value) {
				console.log('facet value (' + current_value + ') did not change');
			} else {
				var q = new Object();
				q[facet] = value;
				obj.addQuery(q);

				obj.solr_query.current_target = facet;
				
				// need to reset it since pagination will be inconsistent
				obj.solr_query.cur_page = 1;

				if (settings.changeCallback != null) {
					settings.changeCallback('solr_filter', obj);
				}

				if (settings.implicit_search) {
					obj.search();
				}
			}
		} else if (target.hasClass('solr_per_page')) {
			var per_page = null;

			if (target.is('select')) {
				per_page = target.val();
			} else {
				per_page = target.data('solr_per_page');
			}

			obj.changePerPage(per_page);
		}

		return settings.propagate_event;
	});
};

/**
 * this goes with com.acadaca.yaz.app.solr.copy.EveryImageCopyHandler and adds swatch-related information to the Solr documents so
 * that it's easier to render swatch images and act on clicks.
 * 
 * @param solrsearch
 * @param color_map maps specific color with facet color (specific colors to generic colors)
 * @param big_image_size image size ref code for the big image
 * @param color_facet_name the color facet name so we can figure out if any color filtering was done
 * @param color_attr_name the color attribute name so we can figure out the real color from the Solr doc
 * @param swatch_image_tag defaults to SWATCH
 * @param big_image_tag defaults to PRODUCT_01
 */
function updateWithSwatchData(solrsearch, color_map, big_image_size, color_facet_name, color_attr_name, swatch_image_tag, big_image_tag) {
	// make sure color_map is ok
	for ( var p in color_map) {
		if (color_map.hasOwnProperty(p)) {
			if (color_map[p] == null) {
				console.log('color_map is incomplete, no mapping found for color ' + p);
			}
		}
	}

	var response = solrsearch.solr_data.data.response;

	if (typeof color_facet_name == 'undefined') {
		color_facet_name = 'facet_color';
	}

	if (typeof color_attr_name == 'undefined') {
		color_attr_name = 'attr_color';
	}

	if (typeof swatch_image_tag == 'undefined') {
		swatch_image_tag = 'SWATCH';
	}

	if (typeof big_image_tag == 'undefined') {
		big_image_tag = 'PRODUCT_01';
	}

	var facet_colors = solrsearch.queryValues('facet_color');

	// this is the same regex used to clean up the color value in EveryImageCopyHandler
	var cleanColor = function(color) {
		return color.replace(/[^a-zA-Z0-9]/g, '-');
	}

	for (var i = 0; i < response.docs.length; i++) {
		// array of swatch images
		response.docs[i].swatch_imgs = new Array();

		// array of images to show for each swatch image (color)
		response.docs[i].imgs = new Array();

		// 0-index based
		response.docs[i].swatch_index = i;

		// create array of swatch images for each color
		for (var c = 0; c < response.docs[i].attr_color.length; c++) {
			var cleancolor = cleanColor(response.docs[i].attr_color[c]);

			// first sku with that color
			var first_sku_id = response.docs[i]['first_' + cleancolor + '_sku_id_s'];

			// swatch image URL
			var swatch_file = response.docs[i]['image_' + cleancolor + '_' + swatch_image_tag + '_ONE_SIZE_s'];
			var swatch_url = js_site_var['static_path'] + '/images/placeHolder_ONE_SIZE.png';

			if (typeof swatch_file !== 'undefined') {
				swatch_url = js_site_var['sku_image_path'] + swatch_file;
			}

			// big image URL
			var img_file = response.docs[i]['image_' + cleancolor + '_' + big_image_tag + '_' + big_image_size + '_s'];
			var img_url = js_site_var['static_path'] + '/images/placeHolder_' + big_image_size + '.png';

			if (typeof img_file !== 'undefined') {
				img_url = js_site_var['sku_image_path'] + img_file;
			}

			// if we're not filtering on any colors), we'll use the first one as the first big image
			if (facet_colors.length == 0 && c == 0) {
				response.docs[i].first_img = img_url;
				response.docs[i].first_color = response.docs[i].attr_color[c];
			}

			// important - "facet_colors" is an array of facet colors (typically simpler and smaller set)
			// response.docs[i].attr_color[c] is the current (in for loop) actual color (e.g., metallic blue)

			// if we find a matching color, we'll use it as the big image (if not already set)
			var facet_color_equiv = color_map[response.docs[i][color_attr_name][c]];

			if (typeof facet_color_equiv !== 'undefined') {
				if (typeof response.docs[i].first_img === 'undefined' && $.inArray(facet_color_equiv, facet_colors) >= 0) {
					response.docs[i].first_img = img_url;
					response.docs[i].first_color = response.docs[i].attr_color[c];
				}
			}

			// VERY IMPORTANT: the "idx" on the "swatch_imgs" and "imgs" are relative to the CURRENT Solr result.
			// so if you are using something like solrinfinitescroll.js (which performs search continuously as you scroll,
			// the "idx" becomes unreliable).
			response.docs[i].swatch_imgs.push({
				url: swatch_url,
				color: response.docs[i].attr_color[c],
				idx: c,
				first_sku_id: first_sku_id,
				doc_id: response.docs[i].id
			});

			response.docs[i].imgs.push({
				url: img_url,
				color: response.docs[i].attr_color[c],
				idx: c,
				first_sku_id: first_sku_id,
				doc_id: response.docs[i].id
			});
		}
	}
}