/** 
	This script is for GUI behavior when limiting quantity of cart items.
 */
var cartdata;

// Only acdc-cart.js should call this with the proper AJAX cart data provided.
function initCartLimit(_cartdata) {
	console.log(_cartdata);
	cartdata = _cartdata;
	updateCartLimit();
}

// Call this to begin updating the webpage with qty limiting GUI behavior
function updateCartLimit() {
	console.log("update cart limit");

	if ( $('.acdc-cart-limit').length == 0 ) {
		// nothing needs limitation
		console.log("nothing to limit");
		return;
	}
	
	// Aggregate what's already in the cart by itemId and qty
	var qtyMap = {};
	for (var i = 0; i < cartdata.cart.cartItems.length; i++) {
		var itemId = cartdata.cart.cartItems[i].itemId;
		if ( typeof qtyMap[cartdata.cart.cartItems[i].itemId] == 'undefined') {
			qtyMap[itemId] = 1;
		} else {
			qtyMap[itemId] = qtyMap[itemId] + 1;
		}
	}
	
	// Run through all elements that need GUI limitation
	$('.acdc-cart-limit').each(function(index) {
		var itemId = $(this).data('sku-id');
		
		// Only perform GUI updates IFF the cart qty limit is reached
		if (typeof qtyMap[itemId] != 'undefined') {
			console.log('capping itemId::' + itemId + ' with limit::' + $(this).data('qty-limit') + ' and cartQty::' + qtyMap[itemId]);
			renderCartLimit( $(this), $(this).data('qty-limit'), qtyMap[itemId] );
		} else {
			// assuming the item was removed from minicart
			renderCartLimit( $(this), $(this).data('qty-limit'), 0 );
		}
	});
}

// Performs the actual GUI behavior changes
function renderCartLimit ( target, _limit, _current ) {
	limit = parseInt(_limit);
	current = parseInt(_current);
	var remaining = limit - current;
	
	// qty dropdown - pdp, samples page
	if (target.is('select')) {		
		target.dropdown("destroy");
		target.html('');
		var start = 0;
		if ($(target).hasClass('qty-cartlimit-alt')){
			start = 1;
		}
		if (start > remaining) {
			var $option = $(document.createElement('option'));
			$option.val(0);
			$option.html(0);
			target.append($option);
		} else {
			for (var x = start; x <= remaining; x++) {
				var $option = $(document.createElement('option'));
				$option.val(x);
				$option.html(x);
				target.append($option);
			}
		}

		if ($(target).hasClass('acdc-cart-limit')){
			$(target).data("remaining-limit", remaining);
		}

		target.dropdown();
	// plus and minus signs - view cart, mini cart
	} else if (target.is('div')) {
		if (remaining <= 0 ) {
			target.children('.quantity-increase').hide();
		}
	// atc link - quickview atc 
	} else if (target.is('a')) {
		if (remaining <= 0 ) {
			target.hide();
		} else {
			target.show();
		}
	}
		
}