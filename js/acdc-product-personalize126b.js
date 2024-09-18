var labelFontSizes = [];
var isLabelAndBoxScenario = false;

/* Account for the 4 possible personalization scenarios based on sku_attributes: 
* - LABEL (yes or no)
* - BOX (yes or no)
* - ENGRAVING (yes or no)
* - Special scenario, if LABEL and BOX are there, we merged them as one field by showing only
*		the LABEL field (updated to LABEL&BOX field) and hiding the BOX field (but still maintain 
*		it in the background for thumbnail effects)
*/
function initPersonalization(size, productOptions) {
	isLabelAndBoxScenario = false;
	var $targetBig = $('.product-image #main-images');
	var $targetThumb = $('.product-image #thumb-images');
	var sku_info = productOptions.getOneAndOnlySku();
	$('.personalize').hide();
	$('.personalize input').val('');

	// Check for the special isLabelAndBoxScenario first
	if ((sku_info != null && sku_info.attributes != null && sku_info.attributes.LABEL_X > 0) && (sku_info.attributes.BOX_X > 0)) {
		isLabelAndBoxScenario = true;
	}

	if (sku_info != null && sku_info.attributes != null && sku_info.attributes.LABEL_X > 0) {
		if (typeof size_images[size] != 'undefined' && typeof size_images[size]['PRODUCT_07'] != 'undefined'
				&& typeof size_images[size]['PRODUCT_07']['IMG_1200'] != 'undefined') {
			var image_url = js_site_var['sku_image_path'] + size_images[size]['PRODUCT_07']['IMG_1200'];
		} else {
			var image_url = js_site_var['context_path'] + '/images/placeHolder_IMG_1200.png';
		}

		var li_tag = $(document.createElement('li'));
		li_tag.addClass('slide');
		li_tag.attr('id', 'tab7');
		var img_tag = $(document.createElement('img'));
		img_tag.attr('src', image_url);
		li_tag.append(img_tag);
		var span_tag = $(document.createElement('span'));
		span_tag.addClass('label-bottle');
		span_tag.css('left', sku_info.attributes.LABEL_X + "%");
		span_tag.css('top', sku_info.attributes.LABEL_Y + "%");
		span_tag.css('font-size', sku_info.attributes.LABEL_FONT_SIZE + "px");
		li_tag.append(span_tag);
		li_tag.addClass('custom-label');
		$targetBig.append(li_tag);

		if (typeof size_images[size] != 'undefined' && typeof size_images[size]['PRODUCT_07'] != 'undefined' && typeof size_images[size]['PRODUCT_07']['IMG_140'] != 'undefined') {
			var thumb_url = js_site_var['sku_image_path'] + size_images[size]['PRODUCT_07']['IMG_140'];
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
		thumb_a_tag.attr('href', '#tab7');
		thumb_a_tag.attr('id', 'thumb7');
		thumb_li_tag.append(thumb_a_tag);
		thumb_li_tag.addClass('product-thumb');
		$targetThumb.append(thumb_li_tag);

		if (isLabelAndBoxScenario) {
			$('.section-product .personalize-label').show();
			$('.section-product .personalize-label label').html(js_site_var['userLanguage'] === 'FR' ?  'Pour:' : 'For:');

			$('.section-product .personalize-link.label').show();
			$('.section-product .personalize-link.box').show();
		} else {
			$('.section-product .personalize-label').show();
			$('.section-product .personalize-link.label').show();
		}
	}

	if (sku_info != null && sku_info.attributes != null && sku_info.attributes.ENGRAVING_X > 0) {
		if (typeof size_images[size]['PRODUCT_09']['IMG_1200'] != 'undefined') {
			var image_url = js_site_var['sku_image_path'] + size_images[size]['PRODUCT_09']['IMG_1200'];
		} else {
			var image_url = js_site_var['context_path'] + '/images/placeHolder_IMG_1200.png';
		}

		var li_tag = $(document.createElement('li'));
		li_tag.addClass('slide');
		li_tag.attr('id', 'tab9');
		var img_tag = $(document.createElement('img'));
		img_tag.attr('src', image_url);
		li_tag.append(img_tag);
		var span_tag = $(document.createElement('span'));
		span_tag.addClass('label-engraving');
		span_tag.css('left', sku_info.attributes.ENGRAVING_X + "%");
		span_tag.css('top', sku_info.attributes.ENGRAVING_Y + "%");
		span_tag.css('font-size', sku_info.attributes.ENGRAVING_FONT_SIZE + "px");
		li_tag.append(span_tag);
		li_tag.addClass('custom-label');
		$targetBig.append(li_tag);

		if (typeof size_images[size]['PRODUCT_09']['IMG_140'] != 'undefined') {
			var thumb_url = js_site_var['sku_image_path'] + size_images[size]['PRODUCT_09']['IMG_140'];
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
		thumb_a_tag.attr('href', '#tab9');
		thumb_a_tag.attr('id', 'thumb9');
		thumb_li_tag.append(thumb_a_tag);
		thumb_li_tag.addClass('product-thumb');
		$targetThumb.append(thumb_li_tag);

		$('.section-product .personalize-engraving').show();
		$('.section-product .personalize-link.engraving').show();
	}
	if (sku_info != null && sku_info.attributes != null && sku_info.attributes.BOX_X > 0) {
		if (typeof size_images[size]['PRODUCT_08']['IMG_1200'] != 'undefined') {
			var image_url = js_site_var['sku_image_path'] + size_images[size]['PRODUCT_08']['IMG_1200'];
		} else {
			var image_url = js_site_var['context_path'] + '/images/placeHolder_IMG_1200.png';
		}

		var li_tag = $(document.createElement('li'));
		li_tag.addClass('slide');
		li_tag.attr('id', 'tab8');
		var img_tag = $(document.createElement('img'));
		img_tag.attr('src', image_url);
		li_tag.append(img_tag);
		$targetBig.append(li_tag);

		var span_tag = $(document.createElement('span'));
		span_tag.addClass('label-box');
		span_tag.css('left', sku_info.attributes.BOX_X + "%");
		span_tag.css('top', sku_info.attributes.BOX_Y + "%");
		span_tag.css('font-size', sku_info.attributes.BOX_FONT_SIZE + "px");
		li_tag.append(span_tag);
		li_tag.addClass('custom-label');
		$targetBig.append(li_tag);

		if (typeof size_images[size]['PRODUCT_08']['IMG_140'] != 'undefined') {
			var thumb_url = js_site_var['sku_image_path'] + size_images[size]['PRODUCT_08']['IMG_140'];
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
		thumb_a_tag.attr('href', '#tab8');
		thumb_a_tag.attr('id', 'thumb8');
		thumb_li_tag.append(thumb_a_tag);
		thumb_li_tag.addClass('product-thumb');
		$targetThumb.append(thumb_li_tag);

		if (!isLabelAndBoxScenario) {
			$('.section-product .personalize-box').show();
			$('.section-product .personalize-link.box').show();
		}
	}

	$('.section-product .personalize-link:visible').siblings('.personalize.intro').show();
	$('.section-product .personalize-link.label:visible').siblings('.personalize-link.box:visible').siblings('.personalize.and1').show();
	$('.section-product .personalize-link.box:visible').siblings('.personalize-link.engraving:visible').siblings('.personalize.and2').show();

	$('.custom-label > span').each(function() {
		labelFontSizes.push({
			font: parseInt($(this).css('font-size')),
			data: $(this).parent('li').attr('id')
		});
	});

}

/* Behavior functions of personalization */
function personalizationListeners() {
	$('.personalize input, .personalize-popup input').on('input', function() {
		var key = $(this).data('key');
		$('#tab' + key + ' span').text(this.value);

		// Engraving scenario is not part of the special scenario
		if (isLabelAndBoxScenario && key != 9) {
			$('#tab8 span').text(this.value);
			$('#field-personalize-box').val(this.value);

			// No need to update the thumb image if they are already on either box or label already
			if ($('#thumb7').parent().hasClass("current") || $('#thumb8').parent().hasClass("current")) {
				// Do nothing
			} else {
				$('#thumb' + key).click();
			}
		} else {
			$('#thumb' + key).click();
		}

		var $counterElement = $(this).parent().siblings('.input-count');
		if($counterElement.length == 0)
			$counterElement = $(this).parents('.form-bar').find('.input-count');
		var maxChars = parseInt($counterElement.data('maxlength'));
		$counterElement.html(maxChars - this.value.length);
	});

	$('.personalize input').on('focus', function() {
		labelFontResize(labelFontSizes);
		var key = $(this).data('key');

		// Engraving scenario is not part of the special scenario
		if (isLabelAndBoxScenario && key != 9) {
			// No need to update the thumb image if they are already on either box or label already
			if ($('#thumb7').parent().hasClass("current") || $('#thumb8').parent().hasClass("current")) {
				// Do nothing
			} else {
				$('#thumb' + key).click();
			}
		} else {
			$('#thumb' + key).click();
		}
	});

	$(window).on('resize', function() {
		labelFontResize(labelFontSizes);
	});
}

/* For managing the various font size based on the window width */
function labelFontResize(fontSize) {
	$('.custom-label > span').each(function() {
		for (i = 0; i < fontSize.length; i++) {
			if (fontSize[i].data === $(this).parent().attr('id')) {

				var slideHeight = $('.slider-product-images > .slider-clip').outerHeight();
				slideHeight = slideHeight / 614;
				var labelSize = fontSize[i].font * slideHeight;

				$(this).css('font-size', labelSize + 'px');
			}
		}
	});
};

function setCount() {
	$('.personalize input, .personalize-popup input').each(function(index) {
		var $counterElement = $(this).parent().siblings('.input-count');
		if($counterElement.length == 0)
			$counterElement = $(this).parents('.form-bar').find('.input-count');
		var maxChars = parseInt($counterElement.data('maxlength'));
		$counterElement.html(maxChars - this.value.length);
	});
}