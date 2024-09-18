;(function($, window, document, undefined) {
	var $win = $(window);
	var $doc = $(document);
	$doc.ready(function() {
		if ($('#craftsmanship-filter').length) {
			var craftsmanshipFilterArray;

			if (js_site_var['userLanguage'] === 'FR') {
				craftsmanshipFilterArray = craftsmanshipFilterArrayFR;
			} else {
				craftsmanshipFilterArray = craftsmanshipFilterArrayEN;
			}

			var craftsmanshipFilterSet = new Set(craftsmanshipFilterArray);

			craftsmanshipFilterSet.forEach(function (value) {
				$('#craftsmanship-filter').append('<option value="' + value + '">' + value + '</option>');
			});
		}

		//Selects
		$('.select').dropdown();

		$(document).on('click change', '.gatracking', function(event) {
			var target = event.target;
			if(!$.isEmptyObject($(target).data()) && $(this).data('category') != null && typeof ga !== 'undefined') {
				ga('send', 'event', $(target).data('category'), 'click', $(target).data('label'));
			}
		});

		(function() {
			function mobileMenuOnResize() {
				var $header = $('.header:not(.header-alt)');
				var $topBanner = $('.top-banner');
				var $mobileMenu = $('.menu');
				var visible = $mobileMenu.hasClass('visible');
				var height, offset;

				if (!visible) {
					$mobileMenu.css('opacity', '0').addClass('visible');
				} else {
					$mobileMenu.css('height', '');
				}

				height = $mobileMenu.outerHeight();
				$mobileMenu.data('height', height);

				if (!visible) {
					$mobileMenu.removeClass('visible').css('opacity', '');
				} else {
					$mobileMenu.css('height', height + 'px');
				}

				mobileMenuAdjust();
			}

			$win.on('load resize', mobileMenuOnResize);
			mobileMenuOnResize();
		})();

		var oldWindowHeight = -1;
		function handleWindowResize() {
			var windowHeight = $win.height();

			if (windowHeight === oldWindowHeight) {
				return;
			}

			document.documentElement.style.setProperty('--app-window-height', windowHeight + 'px');

			oldWindowHeight = windowHeight;
		}

		$win.on('resize', handleWindowResize);

		handleWindowResize();

		var $header = $('.header.header-sticky');

		if ($header.length) {
			var oldHeaderHeight = -1;
			function handleHeaderResize(headerHeight) {
				if (headerHeight === oldHeaderHeight) {
					return;
				}

				document.documentElement.style.setProperty('--app-header-height', headerHeight + 'px');

				oldHeaderHeight = headerHeight;
			}

			var headerResizeObserver = new ResizeObserver(function (list) {
				var headerHeight = list
					&& list.length
					&& list[list.length - 1]
					&& list[list.length - 1].contentRect
					&& list[list.length - 1].contentRect.height
					|| 0;

				handleHeaderResize(headerHeight);
			});
			handleHeaderResize($header.height());
			headerResizeObserver.observe($header[0]);

			var prevWidth = $win.width();
			var prevScrollY = -1;
			var breakpoint = 1024;

			prevWidth = prevWidth < breakpoint? breakpoint : 0;

			function stickyHeaderUpdateHandler(testFunc) {
				var $wrapper = $('body > .wrapper');
				var $header = $('.header.header-sticky');
				var $topBanner = $('.top-banner');
				var width = $win.width();
				var scrollY = $win.scrollTop();
				var heights = $topBanner.length && $topBanner.outerHeight();
				var fixed;

				if (!testFunc(heights)) {
					return;
				}

				fixed = scrollY > heights && width >= breakpoint;

				$wrapper.css('padding-top', fixed? $header.outerHeight(true) + 'px' : '');
				!fixed && $wrapper.scrollTop(0);
				$header.toggleClass('fixed', fixed);
			}

			function handleResizeStickyHeader() {
				var width = $win.width();

				stickyHeaderUpdateHandler(function() {
					return width < breakpoint && prevWidth >= breakpoint || width >= breakpoint && prevWidth < breakpoint;
				});

				prevWidth = width;
			}

			function handleScrollStickyHeader() {
				var scrollY = $win.scrollTop();

				stickyHeaderUpdateHandler(function(offset) {
					return scrollY < offset && prevScrollY >= offset || scrollY >= offset && prevScrollY < offset;
				});

				prevScrollY = scrollY;
			}

			$win.on('resize', handleResizeStickyHeader);
			$win.on('scroll', handleScrollStickyHeader);
			handleResizeStickyHeader();
		}

		function footerAccordionToggle(trigger, flag) {
			var $trigger = $(trigger);
			var $container = $trigger.closest('.footer-nav-wrapper');
			var $target = $($trigger.attr('href'));

			if ($(window).width() >= 1024) {
				return;
			}

			if (typeof flag === 'undefined') {
				flag = !$container.hasClass('open');
			}

			$container.toggleClass('open', flag);
			$target['slide' + (flag ? 'Down' : 'Up')](300);
		}

		$('.footer-nav-accordion-trigger')
			.on('click', function(e) {
				e.preventDefault();

				footerAccordionToggle(e.currentTarget);
			})
			.each(function(i, trigger) {
				footerAccordionToggle(trigger, false);
			});

		//Fullsize Background Image
		$('.fullsize').each(function() {
			var $img = $(this);

			$img.addClass('hidden').parent().addClass('fullsize-container').css('background-image', 'url(' + $img.attr('src') + ')');
		});

		if (typeof $('.select-secondary').selectize != 'undefined') {
			$('.select-secondary').selectize({
				onInitialize: function() {
					var source = this.$input;
					if(!$.isEmptyObject(source.data())) {
						this.$wrapper.data('category', source.data('category'));
						this.$wrapper.data('label', source.data('label'));
						this.$wrapper.addClass('gatracking');
					}
				}
			});
		}

		//Populate label
		$('.field-label').on('keyup', function () {
			var target = $(this).data('target');

			$(target).text($(this).val());
		});

		//Close Promo Bar
		$('.promo-close').on('click', function (e) {
			e.preventDefault();

			$(this).closest('.promo-bar').slideUp();
		});

		$('.slider-product .slides').owlCarousel({
			items: 1,
			margin: 0,
			loop: true,
			dotsEach: true
		});

		//Locations
		if ($('.locations').length) {
			//Initialize ScrollSpy
			var scrollspy = new ScrollSpy({
				linksContainerSelector: '.locations-nav-section',
				sectionSelector: '.section-spy',
				headerOffset: false
			});

			scrollspy.init();

			$win
				.on('load resize', function() {
					scrollspy.refreshPositions();
				});

			var $sidebar = $('.section-sidebar');
			var $content = $('.section-locations .section-content');

			$win.on('scroll', function () {
				var sidebarHeight 		= $sidebar.innerHeight();
				var contentHeight 		= $content.innerHeight();
				var winScroll 			= $win.scrollTop();
				var contentOffset 		= $content.offset().top;

				$sidebar.toggleClass('fixed', winScroll > contentOffset); //Fixed sidebar

				$sidebar.toggleClass('at-bottom', winScroll + sidebarHeight > contentOffset + contentHeight); //absolute sidebar

			});

			/* ACADACA commenting this out
			$('.locations-nav .locations-nav-section a').on('click', function (e) {
				e.preventDefault();

				var target = $(this).attr('href');

				$('html, body').animate({
					scrollTop: $(target).offset().top
				}, 500);

				if ($win.width() < 768) {
					$('dropdown-status span:first-child')
						.removeClass('hidden')
						.siblings()
						.addClass('hidden');

					$('.location-dropdown-toggle-mobile > ul').slideUp();
					$('.section-sidebar').removeClass('expanded')
				}
			}); */

			$('.location-dropdown-toggle').on('click', function () {
				$(this)
					.find('span')
					.toggleClass('hidden')
					.closest('li')
					.siblings()
					.find('.location-dropdown-toggle span:first-child')
					.removeClass('hidden')
					.siblings()
					.addClass('hidden');

				$(this)
					.siblings('ul')
					.stop()
					.slideToggle()
					.parent()
					.siblings()
					.find('ul')
					.slideUp();
			});

			$('.location-dropdown-toggle-mobile').on('click', function () {
				var $toggle = $(this);

				$toggle
					.find('.dropdown-status span')
					.toggleClass('hidden')
					.closest('li')
					.siblings()
					.find('.dropdown-status span:first-child')
					.removeClass('hidden')
					.siblings()
					.addClass('hidden');

				$toggle
					.closest('.locations-nav-section')
					.siblings()
					.find('.dropdown-status span:first-child')
					.removeClass('hidden')
					.siblings()
					.addClass('hidden');

				if ($toggle.parent().is('.locations-nav-section')) {
					$toggle
						.siblings('ul')
						.stop()
						.slideToggle()
						.parent()
						.siblings()
						.find('.has-dropdown-mobile ul')
						.slideUp();
				} else {
					$toggle
						.siblings('ul')
						.stop()
						.slideToggle()
						.parent()
						.siblings()
						.find('ul')
						.slideUp()
						.closest('.locations-nav-section')
						.siblings()
						.find('ul')
						.slideUp();
				}
			});

			$('.sidebar-toggle').on('click', function (e) {
				e.preventDefault();

				$(this).next().toggleClass('visible').parent().toggleClass('expanded');
			});
		}


		//Mask Input
		$('.mask-phone').mask('(999) 999-9999', {placeholder:" "});
		$('.mask-card').mask('9999 9999 9999 9999', {placeholder:" "});

		//Mini cart toggle fields
		$('.mini-cart-item input[type="checkbox"]').on('change', function () {
			var $this = $(this);
			var $item = $(this).closest('.mini-cart-item');
			var $hiddenFields = $item.find('.form-hidden');

			if ($this.prop('checked')) {
				$hiddenFields.removeClass('hidden');
			} else {
				$hiddenFields.addClass('hidden');
			}
		});

		$win.on('click', function (event) {
			var $target = $(event.target);

			if (!$target.parents('.filter-dropdown').length || $target.is('.filter-dropdown')) {
				$('.filter-dropdown').removeClass('expanded');
			}

			if (!$target.parents('.tooltip').length || $target.is('.tooltip')) {
				$('.tooltip').removeClass('opened');
			}
		});

		if ($('.form-scroll').length) {
			var $sectionProduct = $('.section-product');

			$win.on('scroll', function () {
				if ($win.width() < 768) {
					if ($sectionProduct.offset().top + $sectionProduct.innerHeight() > $win.scrollTop() + $win.height()) {
						$('.form-scroll').addClass('fixed');
					} else {
						$('.form-scroll').removeClass('fixed');
					}
				}
			});
		}

		$doc.on('click touchstart', function (event) {
			var $target = $(event.target);

			if ( $target.is($('.mini-cart')) ) {

				if ($('.popup').hasClass('visible')) {
					$('.popup').removeClass('visible');
					$('.mini-cart a.active').removeClass('active');
				} else {
					$('.mini-cart').removeClass('visible');
					$('.mini-cart a.active').removeClass('active');
					$('html').removeClass('no-scroll');
				}
			}

			if (($target.is('.popup-container') && !$target.is('.popup-container-required')) || $target.is('.popup-wrapper')) {
				$('.popup-container').removeClass('visible');
			}

		});

		//Move Select dropdown Position
		$('.select-fancy select').on('change', function () {
			var $dropdown = $(this).siblings('.fs-dropdown-options');
			var selectedItemIdx = $dropdown.find('.fs-dropdown-item_selected').index();
			var itemHeight = $dropdown.find('.fs-dropdown-item').innerHeight();

			$dropdown.css(
				'transform', 'translateY(-' + (itemHeight * selectedItemIdx) + 'px)'
			);
		});

		//Form Allow Next Steps
		$('.form-next').on('click', function (e) {
			e.preventDefault();

			$(this).closest('form').find('.form-section').toggleClass('disabled');
		});

		//Toggle Product Details
		$('.product-details-toggle').on('click', function (e) {
			e.preventDefault();

			var $toggle = $(this);
			var parent = $toggle.parents('.product-details');
			var $productDetailsInner = parent.find('.product-details-inner');

			$productDetailsInner.addClass('gradient');

			$productDetailsInner.slideToggle(400, function() {
				if (!parent.find('.product-details-inner').is(':visible')) {
					if (js_site_var['userLanguage'] == 'FR')
						$toggle.html('En savoir plus');
					else
						$toggle.html('view more');
				} else {
					if (js_site_var['userLanguage'] == 'FR')
						$toggle.html('lire moins');
					else
						$toggle.html('view less');
				}
			});

			setTimeout(function () {
				$productDetailsInner.removeClass('gradient');
			}, 400);

		});


		//Toggle Product Ingredients
		$('.product-ingredients-toggle').on('click', function (e) {
			e.preventDefault();

			var $toggle = $(this);
			var parent = $toggle.parents('.product-ingredients');
			var $productIngredientsInner = parent.find('.product-ingredients-inner');

			$productIngredientsInner.addClass('gradient');

			$productIngredientsInner.slideToggle(400, function() {
				if (!parent.find('.product-ingredients-inner').is(':visible')) {
					if (js_site_var['userLanguage'] == 'FR')
						$toggle.html('afficher la liste');
					else
						$toggle.html('view list');
				} else {
					if (js_site_var['userLanguage'] == 'FR')
						$toggle.html('fermer la liste');
					else
						$toggle.html('close list');
				}
			});

			setTimeout(function () {
				$productDetailsInner.removeClass('gradient');
			}, 400);

		});


		//Toggle Filter
		$('.filter-dropdown-toggle').on('click', function (e) {
			e.preventDefault();

			$('.filter-dropdown-toggle').not($(this)).parent().removeClass('expanded');

			$(this).parent().toggleClass('expanded');
		});

		//Toggle Tooltips
		$('.tooltip-toggle').on('click', function () {

			$('.tooltip-toggle').not($(this)).parent().removeClass('opened');

			$(this).closest('.tooltip').toggleClass('opened');l
		});

		//Toggle Search
		$('.filter .search-btn').on('click', function (e) {
			if ( $win.width() < 1024 && $win.width() > 767 && !$('.filter .search').hasClass('expanded')) {
				$('.filter .search').addClass('expanded');
				$('.filter .search-field').focus();

				e.preventDefault();
			}
		});

		$('.search-close').on('click', function (e) {
			e.preventDefault();

			$(this).closest('.search').removeClass('expanded');
		});

		//Show Popups
		$('.popup-toggle').on('click', function (e) {
			e.preventDefault();

			var target = $(this).attr('href');

			$(this).toggleClass('active');
			$(target).toggleClass('visible');
		});

		$('.popup .popup-toggle').on('click', function(event) {
			event.preventDefault();

			var element = $(this).attr('href');

			$('.mini-cart')
				.find('a[href="' + element + '"]')
				.removeClass('active');
		});

		//Toggle
		$('.link-toggle').on('click', function (e) {
			e.preventDefault();

			var target = $(this).attr('href');

			$(this).children().toggleClass('visible');

			$(target).stop().fadeToggle();
		});

		$('.subscribe-field').on('keyup', function () {
			if ($(this).val() !== '') {
				$(this).closest('.subscribe').addClass('typed');
			} else {
				$(this).closest('.subscribe').removeClass('typed');
			}
		})

		$('.subscribe form').on('submit', function (e) {
			e.preventDefault();

			if ( $('.subscribe-field').val() !== '' ) {
				$('.subscribe-label span').toggleClass('visible');

				$('.subscribe-btn').attr('disabled', 'disabled');
			}
		});

		//Scent Page - header main menu
		$('.scents-tab-link').on('click', function(evt){
			var pageUrl = window.location.href;
			var $elem = $(evt.currentTarget);
			var href = $elem.prop('href');
			var anchor = $elem.data('anchorlink');

			pageUrl = pageUrl.slice(0, pageUrl.indexOf('#'));
			href = href.slice(0, href.indexOf('#'));

			if (pageUrl !== href) {
				return;
			}

			evt.preventDefault();
			$('.scents-tabs .tab-link[href="' + anchor + '"]').click();
			mobileMenuToggle(false);
		});

		//Tabs
		function tabClick(tabButton, target) {
			var $tabButton = $(tabButton);
			var $target = $(target);
			var $list = $tabButton.siblings('.tab-button');
			var $neighbors = $target.siblings('.tab-content');

			$list.removeClass('selected');
			$tabButton.addClass('selected');

			$neighbors.removeClass('active');
			$target.addClass('active');
		}

		$('.tabs .tab-buttons .tab-button').on('mouseenter touchstart', function (event) {
				var $elem = $(event.currentTarget);
				var $list = $elem.siblings('.tab-button');

				$list.removeClass('active');
				$elem.addClass('active');
		})
		.on('mouseleave touchend', function(event) {
/*** conflict-1299 vs HEAD below
		$('.tabs .tab-buttons .tab-button').on('mouseenter touchstart', function (event) {
			var $elem = $(event.currentTarget);
			var target = $elem.data('target');

			tabClick($elem, target);
		}).on('mouseleave touchend', function(event) {
*/
			var $elem = $(event.currentTarget);
			var $wrapper = $elem.closest('.tab-buttons');
			var $list = $wrapper.find('.tab-button');
			var $target = $list.filter('.selected');

			$list.removeClass('active');
			$target.addClass('active');
		})
		.on('click', function (event) {
			var $tabButton = $(event.currentTarget);
			var target = $tabButton.data('target');

				tabClick($tabButton, target);
			})
		.find('.tab-link').on('click', function (event) {
			event.preventDefault();

			var $link = $(event.currentTarget);
/* conflict-1299 vs HEAD below
			let linkUrl = $(this).attr('href');
			if (linkUrl !== undefined && linkUrl !== null && linkUrl[0] !== '#') {
				window.open(linkUrl);
				return;
			}

			var $link = $(event.target);
*/
			var href = $link.attr('href');
			var target = (href && href[0] === '#'? href.length > 1 && href : href) || $link.data('target');
			var $target = $(target);

			if (!$target.length) {
				return;
			}

			var $tabButton = $link.closest('.tab-button');

			tabClick($tabButton, target);
		});

		$('.tabs .tab-buttons .tab-button.active').click();

		$('.video-post-product-tab-content').on('click', function(e) {
			e.preventDefault();

			let linkUrl = $(this).data('linkUrl');
			if (linkUrl !== undefined && linkUrl !== null) {
				window.open(linkUrl);
			}
		});

		//About Page
		function scrollToAnchor(target, offset) {
			var $target = $(target);
			var anchor = '#' + $target.prop('name');

			var urlParts = window.location.href.split(/\?/);
			var newUrl = urlParts[0].split(/#/)[0] + anchor + (urlParts.length > 1? urlParts[1] : '');

			var top = $target.offset().top - parseInt(window.getComputedStyle($target[0]).scrollMarginTop, 10);

			window.history.pushState('', '', newUrl);
			$('html, body').animate({
				scrollTop: top + offset
			});
		}

		//About Page - header main menu
		$('.about-tab-link').on('click', function(evt) {
			var $elem = $(evt.target);
			var $navExpand;
			var href = $elem.prop('href');
			var hrefIdIndex = href.indexOf('#');
			var anchor = href.slice(hrefIdIndex + 1).replace(/\?.+$/, '');
			var $anchor = $('.about-anchor[name="' + anchor + '"]');

			if (!$anchor.length) {
				return;
			}

			evt.preventDefault();

			$navExpand = $elem.closest('.nav-expand-section');
			scrollToAnchor($anchor, -$navExpand.outerHeight());
			mobileMenuToggle(false);
		});

		//Search autocomplete
		var tags = [];

		$('.search-tags span').each(function () {
			tags.push($(this).text());
		});

		$('.autocomplete-field').autocomplete({
			source: tags
		});

		//Remove Filter Tag
		$('.filter-tag').on('click', function () {
			var $separator = $(this).prev('.filter-tag-separator');

			if ( $(this).is(':first-of-type')) {
				$separator = $(this).next('.filter-tag-separator');
			}

			$(this).remove();
			$separator.remove();
		});

		//Clear Filter Tags
		$('.filter-clear').on('click', function (e) {
			e.preventDefault()

			$('.filter-tag').remove();
		});

		function mobileMenuToggle(flag) {
			var $target = $('.btn-menu');
			var $wrapper = $('.wrapper');
			var $menu = $('.menu');
			var $html = $('html');
			var height;

			$wrapper.toggleClass('expanded', flag);
			$target.toggleClass('active', flag);
			$html.toggleClass('no-scroll', flag);

			if (flag) {
				$menu.css('height', $menu.data('height') + 'px');
				setTimeout(function() {
					$menu.css('height', '');
					$menu.toggleClass('visible', flag);
				}, 250);
			} else {
				height = $menu.outerHeight();
				$menu.data('height', height).css('height', height + 'px');
				setTimeout(function() {
					$menu.css('height', '');
					$menu.toggleClass('visible', flag);
				}, 250);
			}
		}

		$('.btn-menu').on('click', function(e) {
			var $target = $(this);
			var visible = $target.hasClass('active');

			e.preventDefault();

			mobileMenuToggle(!visible);
		});

		//Select Placeholder
		$('.form-contact select').on('change', function () {
			$(this).parent().addClass('changed');
		});

		removeForeignCountryContent();

		//Home Slider
		var $sliderHome = $('.slider-home .slides').owlCarousel({
			items: 1,
			mouseDrag: false,
			smartSpeed: 1000,
			controls: false,
			loop: true,
			dots: true,
			dotsContainer: '.slider-paging .slider-thumbs',
			responsive: {
				0: {
					autoplay: true,
					animateOut: 'slideOutLeft',
					animateIn: 'slideInRight'
				},
				1025: {
					autoplay: false,
					animateOut: 'fadeOut',
					animateIn: 'fadeIn',
				}
			},
			onChanged: function(e) {
				//Adjust any video in the slider to conform to the slider's width
				//Get initial slide width
				//var $vidWidth = $('video').parents('.owl-item').width();
				//Initialize video width
				//$('video').css('width', $vidWidth);
				//Resize video when window resizes
				//$win.on('resize', function(){
				//	$vidWidth = $('video').parents('.owl-item').width();
				//	$('video').css('width', $vidWidth);
				//})
			},
			onInitialized: function(e) {
				$('.slider-home .slider-thumb a.slider-thumb-link').click(function(e) {
					// Allows the thumb images to link out
					e.preventDefault();
					location.href = $(this).attr('href');
				});

        $(document).on('click', '.owl-item.active .bgvid', function(){
          // Big gotcha, the homepage slider clones the video, we have to play the active video
          // in order for it to work on chrome
          $('.owl-item.active .bgvid').get(0).play();
        });
			}
		});

		// check if there's a video that needs to be played when the slider fades in to a new slide
		$('.owl-item').bind('oanimationend animationend webkitAnimationEnd', function() {
			if(typeof $('.owl-item.active .bgvid').get(0) !== 'undefined' ) {
				// Big gotcha, the homepage slider clones the video, we have to play the active video
				// in order for it to work on chrome
				$('.owl-item.active .bgvid').get(0).play();
			}
		});

		var mouseIsOver = null;

		if($win.width() > 1024) {
			$('.slider-home .slider-thumb').on('mouseenter', function () {
				var $this = $(this);
				currentSlide = $this.index();
				$sliderHome.trigger('to.owl.carousel', [currentSlide]);

				setTimeout(function(){
          if(typeof $('.owl-item.active .bgvid').get(0) !== 'undefined' ) {
            //simulate user interaction on video
            $('.owl-item.active .bgvid')[0].play();
          }
        },500);

				/*if(mouseIsOver !== null) {
					clearTimeout(mouseIsOver);
				}

				mouseIsOver = setTimeout(function () {
				}, 200);*/
			});
		}

		$('.nav .has-dropdown > .dropdown-button').on('click', function (e) {
			var $elem = $(this);
			var isOpen = $elem.hasClass('clicked');
			
			if ($win.width() >= 1024 || (isOpen && !$(e.target).is('.ico-arrow-down') && $elem.is('a'))) {
				return;
			}

			e.preventDefault();

			var $menu = $('.menu');

			$menu.css('height', $menu.outerHeight() + 'px');

			if (isOpen) {
				$elem
					.removeClass('clicked')
					.next()
					.slideUp();
			} else {
				$elem
					.addClass('clicked')
					.next()
					.slideDown()
					.parent()
					.siblings()
					.children('.dropdown-button')
					.removeClass('clicked')
					.next()
					.slideUp();

				$menu.css('height', $menu.outerHeight() + 'px');

				setTimeout(function () {
					$menu.css('height', '');
				}, 250);
			}
		}).append('<span class="icon ico-arrow-down"></span>');

		$('#craftsmanship-filter').on('change', function (e) {
			var $field = $(e.currentTarget);
			var $items = $('.list-craftsmanship-item');
			var $activeItems;
			var value = $field.val();

			if (value === '0') {
				$activeItems = $items;
			} else {
				$activeItems = $items.filter(function (i, item) {
					var $item = $(item);
					var filters = $item.data('filters-' + js_site_var['userLanguage'].toLowerCase()).split(',');

					return filters.includes(value);
				});
			}

			$items.hide();
			$activeItems.show();
		});

		var $videoPostSlider = $('.slider-video-post .slides');
		if ($videoPostSlider.find('.slide').length > 1) {
			$videoPostSlider.owlCarousel({
				items: 1,
				margin: 0,
				loop: true,
				nav: false,
				dots: true
			});

			$('.slider-video-post .slider-prev').on('click', function (e) {
				e.preventDefault();

				$videoPostSlider.trigger('prev.owl.carousel');
			});

			$('.slider-video-post .slider-next').on('click', function (e) {
				e.preventDefault();

				$videoPostSlider.trigger('next.owl.carousel');
			});

			function videoPostSlideChangeHandler(owlSlideIndex) {
				var $infoHead = $('.video-post-info-head');
				var $infoBody = $('.video-post-info-text');
				var $slide = $videoPostSlider
					.find('.owl-item .slide').eq(owlSlideIndex);
				var $headText = $slide.find('.slide-head-text');
				var $bodyText = $slide.find('.slide-body-text');


				$infoHead.html($headText.html());
				$infoBody.html($bodyText.html());
			}

			$videoPostSlider.on('changed.owl.carousel', function(e) {
				videoPostSlideChangeHandler(e.item.index);
			});

			if ($('.slider-video-post').length) {
				videoPostSlideChangeHandler(
					$videoPostSlider.find('.owl-item').index(
						$videoPostSlider
							.find('.owl-item:not(.cloned)').eq(0)
					)
				);
			}
		}

		$('.list-crafts-item--video .craft-asset')
			.on('mouseenter', function(e) {
				var videoElem = e.currentTarget;
				var $video = $(videoElem);
				var $container = $video.closest('.craft');

				$container.addClass('play');
				videoElem.play();
			})
			.on('mouseleave', function(e) {
				var videoElem = e.currentTarget;
				var $video = $(videoElem);
				var $container = $video.closest('.craft');

				videoElem.pause();
				videoElem.currentTime = 0;
				$container.removeClass('play');
			});

		$('.list-craftsmanship-item--video .craftsmanship-asset')
			.on('mouseenter', function(e) {
				var videoElem = e.currentTarget;
				var $video = $(videoElem);
				var $container = $video.closest('.craftsmanship');

				$container.addClass('play');
				videoElem.play();
			})
			.on('mouseleave', function(e) {
				var videoElem = e.currentTarget;
				var $video = $(videoElem);
				var $container = $video.closest('.craftsmanship');

				videoElem.pause();
				videoElem.currentTime = 0;
				$container.removeClass('play');
			});

		// Replace Password Dots with Asterisks
		$('.field-password').each(function() {
			var $this = $(this);
			var field = document.getElementById($this.attr('id'));
			var label = "";

			function replaceText(){
				if(field.value.length > label.length){
				   label += field.value.substr(label.length, field.value.length);
				}

				if(field.value.length > 0){
					field.value = Array(field.value.length).join("*") + field.value.substr(field.value.length - 1, field.value.length);
				}

				to = setTimeout(replaceText,10);
			}

			var to = setTimeout(replaceText,10);
		});

		var breakpoint = 1024;
		var winWidth = $win.width() < breakpoint? breakpoint : breakpoint - 1;

		$win.on('resize', function() {
			var width = $win.width();

			if ((width < breakpoint && winWidth < breakpoint) || (width >= breakpoint && winWidth >= breakpoint)) {
				return;
			}

			if (width >= breakpoint) {
				winWidth = width;
				return;
			}

			var $filterNav = $('.section-filter');

			$filterNav.css('top', '');
			winWidth = width;
		});

		$win.on('scroll', function() {
			var width = $win.width();

			if (width < breakpoint) {
				return;
			}

			var $filterNav = $('.section-filter:visible').eq(0);

			if (!$filterNav.length) {
				return;
			}

			var $headerSticky = $('.header.header-sticky');
			var scrollY = $win.scrollTop();
			var navOffset;

			$filterNav.css('position', 'static');
			navOffset = $filterNav.offset().top;
			$filterNav.css('position', '');
			$filterNav.toggleClass('fixed', scrollY > navOffset);

			if ($headerSticky.length) {
				$filterNav.css('top', $headerSticky.hasClass('fixed')? $headerSticky.outerHeight() + 'px' : $filterNav.hasClass('fixed')? 0 : '');
			} else {
				$filterNav.css('top', $filterNav.hasClass('fixed')? 0 : '');
			}
		});

		if ( $win.width() < 768 ) {
			$('#field-personalize-label, #field-personalize-engraving, #field-personalize-box').on('blur', function() {
			    $('html, body').animate({
			        scrollTop: $('.product-image').offset().top
			    }, 300);
			});
		}

	    $win.on('load', function() {
			if ($('.form-checkout').length > 0) {
				var $target = $('.form-checkout .form-row.required').first();
				if ($target.length) {
					$('html, body').animate({
						'scrollTop' : $target.offset().top - 40
					}, 200);
				}
			}
	    });
	});

	$.fn.equalizeHeight = function() {
		var maxHeight = 0, itemHeight;
	 
		for (var i = 0; i < this.length; i++) {
			itemHeight = $(this[i]).height('auto').height();
			if (maxHeight < itemHeight) {
				maxHeight = itemHeight;
			}
		}
	 
		return this.height(maxHeight);
	}
})(jQuery, window, document);

var ScrollSpy = function(options) {
		var _spy = this;
		
		_spy.linksContainerSelector = options.linksContainerSelector;
		_spy.sectionSelector = options.sectionSelector;
		
		_spy.$linksContainer = $(_spy.linksContainerSelector);
		_spy.$links = _spy.$linksContainer.find('a');
		_spy.$sections = $(_spy.sectionSelector);
		_spy.headerOffset = options.headerOffset;
		
		_spy.currentIdx = 0;
		_spy.data = {
			offsets: [],
			ids: []
		};
	};
	
	ScrollSpy.prototype.getPositions = function() {
		var _spy = this;
		var data = _spy.data;
		
		for(var i = 0; i < _spy.$sections.length; i++) {
			var $section = _spy.$sections.eq(i);
			
			data.ids.push($section.attr('id'));
			data.offsets.push($section.offset().top);
		}
	};
	
	ScrollSpy.prototype.refreshPositions = function() {
		var _spy = this;
		var data = _spy.data.offsets;
		
		for(var i = 0; i < _spy.$sections.length; i++) {
			var $section = _spy.$sections.eq(i);
			
			data[i] = $section.offset().top;
		}
	};
	
	ScrollSpy.prototype.getCurrentSection = function() {
		var _spy = this;
		var data = _spy.data;
		var scrollTop = $(window).scrollTop();
		
		if(_spy.headerOffset === true) {
			scrollTop += _spy.$linksContainer.outerHeight();
		}
		
		for(var i = 0; i < data.offsets.length; i++) {
			var currentOffset = data.offsets[i];
			var nextOffset = data.offsets[i+1];
			
			if(scrollTop >= currentOffset && scrollTop < nextOffset || 
			   scrollTop >= currentOffset && typeof nextOffset === 'undefined') {
				_spy.currentIdx = i;
				break;
			}
		}
		
		_spy.setCurrent();
	};
	
	ScrollSpy.prototype.setCurrent = function() {
		var _spy = this;
		
		 _spy.$links.eq(_spy.currentIdx)
			 .parent()
				 .addClass('current')
			 .siblings()
				 .removeClass('current')
			 .parent()
			 .closest('li')
			 .siblings()
				.find('.current')
				.removeClass('current')

		 _spy.$links.eq(_spy.currentIdx)
			 .closest('.locations-nav-section')
			 .siblings()
				.find('.current')
				.removeClass('current');

	};
	
	ScrollSpy.prototype.scrollToCurrentSection = function() {
		var _spy = this;
		
		var newTop = _spy.data.offsets[_spy.currentIdx];
		
		if(_spy.headerOffset === true) {
			newTop -= _spy.$linksContainer.outerHeight();
		}
		
		$('html, body').animate({
			scrollTop: newTop
		}, {
			duration: 500,
			queue: false
		});
	};
	
	ScrollSpy.prototype.bindEvents = function() {
		var _spy = this;
		var $win = $(window);
		
		_spy.$links
			.on('click.scrollSpy', function(e) {
				// ACADACA commenting this out
				// e.preventDefault();
				
				_spy.currentIdx = $(this).parent().index();
				// _spy.scrollToCurrentSection();
			});
		
		$win.on('scroll.scrollSpy', function() {
			_spy.getCurrentSection();
		});
	};
	
	ScrollSpy.prototype.init = function() {
		var _spy = this;
		
		_spy.getPositions();
		_spy.getCurrentSection();
		_spy.setCurrent();
		_spy.bindEvents();
	};

function initRegionSelection(options) {
	if (!options) {
		options = {};
	}

	function dataRenderer(className) {
		return function(region, escape) {
			var country = escape(region.country);
			var language = region.language && escape(region.language);

			return (
				'<div class="' + className + '">' +
					'<span class="country">' + country + '</span>' +
					(language? ' - <span class="language">' + language + '</span>' : '') +
				'</div>'
			);
		}
	}

	/* Pre-populate the country based on query param */
	var parsableURI = new URI(location.href);
	var dataMap = parsableURI.search(true);

	var defaultRegion = dataMap['defaultRegion'];
	var selectedRegion = getCookieWithHelper(false, 'acdc_region');
	var selectedLanguage = js_site_var['userLanguage'];
	var emptySelectionLabel = (
		selectedLanguage === 'FR'?
			'Sélectionnez Expédition Pays' :
			'Select Shipping Location'
	);

	var regions = [
		{ id: 'US', country: 'United States' },
		{ id: 'CA', country: 'Canada', language: 'English' },
		{ id: 'CA[FR]', country: 'Canada', language: 'Français' },
		{ id: 'AU', country: 'Australia' },
		{ id: 'GB', country: 'United Kingdom' },
		{ id: 'FR', country: 'France', language: 'English' },
		{ id: 'FR[FR]', country: 'France', language: 'Français' },
		{ id: 'MX', country: 'Mexico', language: 'Español' },
		{ id: 'DE', country: 'Germany' },
		{ id: 'TW', country: 'Taiwan, China', language: '繁體中文' },
		{ id: 'JP', country: 'Japan', language: '日本語' },
		{ id: 'IT', country: 'Italy' },
		{ id: 'CN', country: 'China Mainland' },
		{ id: 'HK', country: 'Hong Kong, SAR of China' },
		{ id: 'AL', country: 'Albania' },
		{ id: 'AD', country: 'Andorra' },
		{ id: 'AR', country: 'Argentina' },
		{ id: 'AU', country: 'Australia' },
		{ id: 'AT', country: 'Austria' },
		{ id: 'BH', country: 'Bahrain' },
		{ id: 'BE', country: 'Belgium', language: 'English' },
		{ id: 'BE[FR]', country: 'Belgium', language: 'Français' },
		{ id: 'BR', country: 'Brazil' },
		{ id: 'BG', country: 'Bulgaria' },
		{ id: 'CA', country: 'Canada', language: 'English' },
		{ id: 'CA[FR]', country: 'Canada', language: 'Français' },
		{ id: 'CL', country: 'Chile' },
		{ id: 'CN', country: 'China Mainland' },
		{ id: 'HR', country: 'Croatia' },
		{ id: 'CY', country: 'Cyprus' },
		{ id: 'CZ', country: 'Czech Republic' },
		{ id: 'DK', country: 'Denmark' },
		{ id: 'EG', country: 'Egypt' },
		{ id: 'EE', country: 'Estonia' },
		{ id: 'FI', country: 'Finland' },
		{ id: 'FR', country: 'France', language: 'English' },
		{ id: 'FR[FR]', country: 'France', language: 'Français' },
		{ id: 'DE', country: 'Germany' },
		{ id: 'GR', country: 'Greece' },
		{ id: 'GG', country: 'The Channel Islands (Guernsey)' },
		{ id: 'HU', country: 'Hungary' },
		{ id: 'IS', country: 'Iceland' },
		{ id: 'ID', country: 'Indonesia' },
		{ id: 'IN', country: 'India' },
		{ id: 'IE', country: 'Ireland' },
		{ id: 'IM', country: 'Isle of Man' },
		{ id: 'IL', country: 'Israel' },
		{ id: 'IT', country: 'Italy' },
		{ id: 'JP', country: 'Japan', language: '日本語' },
		{ id: 'JE', country: 'The Channel Islands (Jersey)' },
		{ id: 'KE', country: 'Kenya' },
		{ id: 'KW', country: 'Kuwait' },
		{ id: 'KR', country: 'Korea', language: '한국어'  },
		{ id: 'LT', country: 'Lithuania' },
		{ id: 'LV', country: 'Latvia' },
		{ id: 'LU', country: 'Luxembourg', language: 'English' },
		{ id: 'LU[FR]', country: 'Luxembourg', language: 'Français' },
		{ id: 'MY', country: 'Malaysia' },
		{ id: 'MT', country: 'Malta' },
		{ id: 'ME', country: 'Montenegro' },
		{ id: 'MC', country: 'Monaco', language: 'English' },
		{ id: 'MC[FR]', country: 'Monaco', language: 'Français' },
		{ id: 'NL', country: 'The Netherlands' },
		{ id: 'NZ', country: 'New Zealand' },
		{ id: 'NO', country: 'Norway' },
		{ id: 'PH', country: 'Philippines' },
		{ id: 'PL', country: 'Poland' },
		{ id: 'PT', country: 'Portugal' },
		{ id: 'PR', country: 'Puerto Rico' },
		{ id: 'QA', country: 'Qatar' },
		{ id: 'RO', country: 'Romania' },
		{ id: 'RU', country: 'Russia'},
		{ id: 'SG', country: 'Singapore' },
		{ id: 'SK', country: 'Slovakia' },
		{ id: 'SI', country: 'Slovenia' },
		{ id: 'ES', country: 'Spain' },
		{ id: 'CH', country: 'Switzerland', language: 'English' },
		{ id: 'CH[FR]', country: 'Switzerland', language: 'Français' },
		{ id: 'ZA', country: 'South Africa' },
		{ id: 'SE', country: 'Sweden' },
		{ id: 'TH', country: 'Thailand' },
		{ id: 'TR', country: 'Turkey' },
		{ id: 'AE', country: 'United Arab Emirates' },
		{ id: 'VA', country: 'Vatican' },
		{ id: 'VN', country: 'Vietnam' },
	];

	function compareCountry( a, b ) {
		if ( a.country < b.country ){
			return -1;
		}
		if ( a.country > b.country ){
			return 1;
		}
		return 0;
	}

	regions.sort(compareCountry);
	regions.unshift({ id: '', country: emptySelectionLabel });

	var selectizeSettings = {
		valueField: 'id',
		searchField: 'country',
		options: regions,
		render: {
			option: dataRenderer('option'),
			item: dataRenderer('item')
		},
		onInitialize: function() {
			var source = this.$input;
			if(!$.isEmptyObject(source.data())) {
				this.$wrapper.data('category', source.data('category'));
				this.$wrapper.data('label', source.data('label'));
				this.$wrapper.addClass('gatracking');
			}
		}
	};
	var selectize = $('#userSettingRegion').selectize(selectizeSettings)[0].selectize;
	var value;

	if (selectedRegion) {
		value = selectedRegion;
	} else {
		switch (defaultRegion) {
			case 'CA':
			case 'AU':
				value = defaultRegion;
				break;
			default:
				value = getCookieWithHelper(false, 'DEFAULT_ACDC_REGION') || '';
		}
	}

	selectize.setValue(value);

	selectize.showInput = (function() {
		var $controlInputItem = this.$control.find('.item');
		var innerSpace = this.$control.innerWidth() - this.$control.width();
		var inputItemWidth = $controlInputItem.outerWidth();
		var calculatedSpace = inputItemWidth + innerSpace;

		this.$control_input.css({
			opacity: 1,
			position: 'relative',
			left: Math.ceil(inputItemWidth) + 'px',
			maxWidth: 'calc(100% - ' + Math.ceil(calculatedSpace)  + 'px) !important'
		});
		$controlInputItem.css('max-width', 'calc(100% - ' + Math.ceil(innerSpace) + 'px)');

		this.isInputHidden = false;
	}).bind(selectize);

	selectize.hideInput = (function() {
		var self = this;
		var $controlInputItem = this.$control.find('.item');

		self.setTextboxValue('');
		self.$control_input.css({
			opacity: 0,
			position: 'absolute',
			left: self.rtl ? 10000 : -10000,
			maxWidth: ''
		});
		$controlInputItem.css('max-width', '');

		self.isInputHidden = true;
	}).bind(selectize);

	selectize.on('item_remove', function() {
		selectize.$control_input.css('left', '0px');
	});

	$('#userSettingRegion').change(function(event){
		var selectedUserRegion = $('#userSetting #userSettingRegion').val();

		setCookieWithHelper(false, 'acdc_region', selectedUserRegion, {
			expires: 30,
			path: '/',
			domain: js_site_var['cookie_domain']
		});
	});

	$('#submit-link').click(function(event) {
		event.preventDefault();

		var parsableURI = new URI(location.href);
		var dataMap = parsableURI.search(true);
		var redirectPath;
		var redirectURI;
		var selectedUserRegion = $('#userSetting #userSettingRegion').val();
		var selectedUserCountry;
		var selectedUserLanguage;

		function addSearchParams() {
			// redirect to the desired page with the cookie set
			for (var key in dataMap) {
				if (dataMap.hasOwnProperty(key)) {
					if (key != 'path') {
						redirectURI.addSearch(key, dataMap[key]);
					}
				}
			}
		}

		if (dataMap['path'] != undefined && "" != dataMap['path']) {
			// remove domain if it's there to make sure path is always relative
			var cleanedPath = dataMap['path'].replace(internationalURI, '');
			redirectPath = cleanedPath;
		} else {
			redirectPath =  options.redirectPath || window.location.pathname;
		}

		redirectURI = new URI (redirectPath);

		if (selectedUserRegion.includes("[FR]") ) {
			selectedUserLanguage = 'FR';
			selectedUserRegion = selectedUserRegion.replace("[FR]", "");
		} else {
			selectedUserLanguage = 'EN';
		}

		selectedUserCountry = selectedUserRegion;

		$.removeCookie('OptanonAlertBoxClosed', { path: '/' });

		switch (selectedUserRegion) {
			case '':
				$('.country-required').show();
				return false;
			case 'JP':
				window.location.href = "http://www.lelabofragrances.jp/";
				return false;
			case 'CA':
				addSearchParams();

				redirectURI.addSearch('region', 'CA').addSearch('locale', selectedUserLanguage);

				window.location.replace(canadaURI + redirectURI);
				return false;
			case 'AU':
				addSearchParams();

				window.location.replace(australiaURI + redirectURI);
				return false;
			case 'KR':
				addSearchParams();

				window.location.replace(koreaURI + redirectURI);
				return false;
			case 'MX':
				addSearchParams();

				window.location.replace(mexicoURI + redirectURI);
				return false;
			case 'TW':
				addSearchParams();

				window.location.replace(taiwanURI + redirectURI);
				return false;
			case 'WA':
			case 'ND':
			case 'SS':
				selectedUserRegion = 'GB';
				break;
			default:
		}

		setCookieWithHelper(false, 'ACDC_LOCALE', selectedUserLanguage, { expires: 30, path: '/', domain: js_site_var['cookie_domain'] });
		setCookieWithHelper(false, 'acdc_country_code', selectedUserCountry, { expires: 30, path: '/', domain: js_site_var['cookie_domain'] });
		let selectedUserCountryName = countryMap[selectedUserCountry];
		setCookieWithHelper(false, 'acdc_country', selectedUserCountryName, { expires: 30, path: '/', domain: js_site_var['cookie_domain'] });
		setCookieWithHelper(false, 'acdc_region', selectedUserRegion, { expires: 30, path: '/', domain: js_site_var['cookie_domain'] });
		setCookieWithHelper(false, 'acdc_int_region', selectedUserRegion, { expires: 30, path: '/',	domain: js_site_var['cookie_domain']  });

		setCurrencyBasedOnRegion(selectedUserRegion);
		setVATBasedOnRegion(selectedUserRegion);

		addSearchParams();
		
		// For dynamic app pages, we must reload for the server side code to pickup the newly created cookies
		var uri = new URI(window.location.href);
		if(uri.path().startsWith("/front")) {
			window.location = redirectURI;
			return false;
		}
	
		js_site_var['userCountry'] = getCookieWithHelper(false, 'acdc_country');
		js_site_var['userCurrency'] = getCookieWithHelper(false, 'acdc_currency');
		js_site_var['userVAT'] = getCookieWithHelper(false, 'acdc_vat');
		js_site_var['userRegion'] = getCookieWithHelper(false, 'acdc_region');
		$('.footer .showcountry').html(js_site_var['userCountry']);

		// Instead of reloading the page, for SEO purposes, we will just remove the overlay and initialize any code that needs the newly created cookies above for rendering
		if (typeof initPDP != 'undefined') {
			initPDP();
		} 
		if (typeof initCatPage != 'undefined') {
			initCatPage();
		}
		if (typeof initCmsPage != 'undefined') {
			initCmsPage();
		}
		if (typeof initSamplesCatPage != 'undefined') {
			initSamplesCatPage();
		}
		
		$('#popup-landing').remove();

		let gateObject = {
			event: 'Country Gate Submit'
		};
		window.dataLayer.push(gateObject);
		console.log(JSON.stringify(gateObject));

		if(redirectURI == "/"){
			if(getCookieWithHelper(false,'ACDC_LOCALE') == 'FR' && !redirectURI._parts.path.includes ('/fr')){
				window.location = redirectURI + "fr/";
				return false;
			}else{
				window.location = redirectURI;
			}
		}
		
		return false;
	});
}

function AboutUsPage() {
	//Slider Lab Images
	function sliderNavUpdateText(e) {
		var $target = $(e.target);
		var $slider = $target.closest('.slider');
		var $text = $slider.find('.slider-nav-text');
		var label = $slider.find('.owl-item .slide').eq(e.item.index).data('label');

		$text.text(label);
	}

	//Slider labs
	var $sliderLabsDesktop = $('.slider-labs-desktop .slides');
	if ($sliderLabsDesktop.find('.slide').length > 1) {
		$sliderLabsDesktop.owlCarousel({
			items: 1,
			loop: true,
			nav: false,
			dots: false,
			autoplay: true,
			autoplayTimeout: 10000,
			autoplaySpeed: 1000,
			autoplayHoverPause: true
		});
	} else {
		$sliderLabsDesktop.addClass('owl-loaded');
	}

	var $sliderLabsMobile = $('.slider-labs-mobile .slides');
	if ($sliderLabsMobile.find('.slide').length > 1) {
		$sliderLabsMobile.owlCarousel({
			items: 1,
			loop: true,
			nav: false,
			dots: false,
			onInitialized: function(e) {
				sliderNavUpdateText(e);
			},
			onChanged: sliderNavUpdateText
		});
	} else {
		$sliderLabsMobile.addClass('owl-loaded');
		$('.slider-labs-mobile .slider-prev, .slider-labs-mobile .slider-next').hide();
	}

	$('.slider-labs-mobile .slider-prev').on('click', function (e) {
		e.preventDefault();

		$sliderLabsMobile.trigger('prev.owl.carousel');
	});

	$('.slider-labs-mobile .slider-next').on('click', function (e) {
		e.preventDefault();

		$sliderLabsMobile.trigger('next.owl.carousel');
	});

	$sliderLabsMobile.on('changed.owl.carousel', function(e) {
		var $text = $sliderLabsMobile.closest('.slider-labs-mobile').find('.slider-nav-text');
		var label = $sliderLabsMobile.find('.owl-item .slide').eq(e.item.index - 1).data('label');

		$text.text(label);
	});

	//Slider Souls
	var $sliderSoulsDesktop = $('.slider-souls-desktop .slides');
	if ($sliderSoulsDesktop.find('.slide').length > 1) {
		$sliderSoulsDesktop.owlCarousel({
			items: 1,
			loop: true,
			nav: false,
			dots: false,
			autoplay: true,
			autoplayTimeout: 10000,
			autoplaySpeed: 1000,
			autoplayHoverPause: true
		});
	} else {
		$sliderSoulsDesktop.addClass('owl-loaded');
	}

	var $sliderSoulsMobile = $('.slider-souls-mobile .slides');
	if($sliderSoulsMobile.find('.slide').length > 1) {
		$sliderSoulsMobile.owlCarousel({
			items: 1,
			loop: true,
			nav: false,
			dots: false,
			onInitialized: function(e) {
				sliderNavUpdateText(e);
			},
			onChanged: sliderNavUpdateText
		});
	} else {
		$sliderSoulsMobile.addClass('owl-loaded');
		$('.slider-souls-mobile .slider-prev, .slider-souls-mobile .slider-next').hide();
	}

	$('.slider-souls-mobile .slider-prev').on('click', function (e) {
		e.preventDefault();

		$sliderSoulsMobile.trigger('prev.owl.carousel');
	});

	$('.slider-souls-mobile .slider-next').on('click', function (e) {
		e.preventDefault();

		$sliderSoulsMobile.trigger('next.owl.carousel');
	});

	$sliderSoulsMobile.on('changed.owl.carousel', function(e) {
		var $text = $sliderSoulsMobile.closest('.slider-souls-mobile').find('.slider-nav-text');
		var label = $sliderSoulsMobile.find('.owl-item .slide').eq(e.item.index - 1).data('label');

		$text.text(label);
	});

	//Slider Collections
	var $sliderCollections = $('.slider-collections .slides');
	$sliderCollections.owlCarousel({
		items: 2,
		loop: true,
		nav: false,
		dots: true,
		margin: 10
	});

	//Slider Collections
	var $sliderCrafts = $('.slider-crafts .slides');
	$sliderCrafts.owlCarousel({
		items: 2,
		loop: true,
		nav: false,
		dots: true,
		margin: 10
	});
}

function checkInquiry (excludeCountries, holder) {
	if(checkExcludeCountries(excludeCountries)) {
		$(holder).find('.sku-add-to-cart').remove();
	} else {
		$(holder).find('.sku-inquire').remove();
	}
}

function checkExcludeCountries (excludeCountries) {
	var cookieCountry = js_site_var['userRegion'];
	for (var i = 0; i < excludeCountries.length; i++ ) {
		if(excludeCountries[i].trim() == cookieCountry) {
			return true;
		}
	}

	return false;
}

function mobileMenuAdjust() {
	var $header = $('.header:not(.header-alt)');
	var $topBanner = $('.top-banner');
	var $mobileMenu = $('.menu');
	var offset;

	offset = $header.add($topBanner).get()
		.reduce(function(acc, elem) {
			return acc + $(elem).outerHeight();
		}, 0);
	$mobileMenu.css('top', offset + 'px');
}