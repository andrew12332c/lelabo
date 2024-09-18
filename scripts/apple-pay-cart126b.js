/**
 * Object that holds Apple Pay JS specific configuration
 * @param options
 * @returns
 */
function ApplePay(options){
	
	var obj = this;
	
	this.settings = jQuery.extend({
		merchantId : null,
		request: null,
		grandTotalCalculator: function(){return 0;},
		paymentAvailableCallback: function(){
			$('.apple-pay-button, .apple-pay-label').show();
		},
		callback: null,
		errorCallback:null,
		shippingContactSelectedCallback:null,
		paymentAuthorizedErrorCallback: null
		
	} , options || {});
	
	this.start = function(){
		if (window.ApplePaySession) {
			
		    var promise = ApplePaySession.canMakePaymentsWithActiveCard(obj.settings.merchantId);
		    promise.then( function (canMakePayments) {
		        if (canMakePayments){
		        	obj.settings.paymentAvailableCallback();
		            console.log("Apple Pay Payment Available");
		        }
		    });
		  
		} else {
			if(obj.settings.callback != null) {
				obj.settings.callback();
			}
			console.log('no apple pay session exists');
		}
	}
}

function getCsrfToken(){
	return getCookieWithHelper(false, 'csrfToken');
}

function applePayCartClicked(applePay){

	var settings = applePay.settings;

    if (!window.ApplePaySession) {
        console.log("Apple Pay is not available in this browser");
    }

    var request = jQuery.extend(true, {}, settings.request);
    request.total.amount = settings.grandTotalCalculator();

    var session;
    if(ApplePaySession.supportsVersion(3)) {
    	session = new ApplePaySession(3, request);
    } else {
    	session = new ApplePaySession(1, request);
    }

    // Merchant Validation
    session.onvalidatemerchant = function (event) {
        var promise = performValidation(event.validationURL);
        promise.then(function (merchantSession) {
        	var merchSession = JSON.parse(merchantSession);
        	session.completeMerchantValidation(merchSession);
        }).catch(function(){
        	console.log('Error')
        });
    }

    function performValidation(valURL) {
        return new Promise(function(resolve, reject) {
        
        	console.log('Getting session');
            var xhr = new XMLHttpRequest();	            
            xhr.onload = function() {
            	resolve(this.response);	                
            };
            xhr.onerror = reject;
            xhr.open('POST', js_site_var['context_path'] + "/app/applepay/merchantValidation.json", true);
            xhr.setRequestHeader('csrfToken', getCsrfToken());
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xhr.send('valUrl=' + valURL);
            
        });
    }

    session.onpaymentmethodselected = function(event) {
        jQuery.ajax({
            type: 'get',
            url: js_site_var['context_path'] + "/app/applepay/lineTotals.json", 
            timeout: 5000,
            headers: {'csrfToken': getCsrfToken() },
            dataType: 'json',

            success: function (data) {
            	if(ApplePaySession.supportsVersion(3)) {
	            	var update = {};
	                
	            	update.newTotal = data.grandtotal;
	                update.newLineItems = data.line;
	                
	                session.completePaymentMethodSelection(update);
            	} else {
            		var newTotal = data.grandtotal;
                    var newLineItems = data.line;
                    
                    session.completePaymentMethodSelection(newTotal, newLineItems);
            	}
            	
                console.log('completePaymentMethodSelection')
            },
            error: function(xhr){
            	var json = xhr.responseJSON;
            	console.log(json);
            	session.abort();
            }
        });
    }

    session.onshippingcontactselected = function(event) {
    	console.log('onshippingcontactselected called');
    	jQuery.ajax({
    	    type: 'post',
    	    url: js_site_var['context_path'] + "/app/applepay/shippingMethods.json",
    	    headers: {'csrfToken': getCsrfToken() },
    	    data: JSON.stringify({	    	    	
    	    	city:  event.shippingContact.locality,
    	    	province:  event.shippingContact.administrativeArea,
    			postalCode: event.shippingContact.postalCode,
    			country:  event.shippingContact.countryCode
    		}),
    	    timeout: 5000,
    	    contentType: 'application/json',
    	    dataType: 'json',
    	    
    	    success: function (data) {
    	    	for(i = 0; i < data.shipping.length; i++) {
    	    		let shippingInfo = data.shipping[i];
    	    		let label = shippingInfo.label;
					shippingInfo.label = htmlDecode(label);
				}

    	    	if(ApplePaySession.supportsVersion(3)) {
	    	    	var update = {};
	    	        
	    	        update.newLineItems = data.line;
	    	        update.newShippingMethods = data.shipping;
	    	        update.newTotal = data.grandTotal;

					if(typeof settings.onShippingContactValidation === 'function'){
						settings.onShippingContactValidation(event, update);
					}else if(event.shippingContact.countryCode.toLowerCase() != 'us') {
						var error = new ApplePayError("addressUnserviceable", "country", "Apple Pay can only be used for domestic orders in the United States. Please select a US address.")
						update.errors = [error];
					}
	    	        
	    	        session.completeShippingContactSelection(update);
    	    	} else {
    	    		var status = ApplePaySession.STATUS_SUCCESS;

					/**
					 * if onShippingContactStatus is overriden and the result is true...
					 *     meaning the contact country code didn't match the event.shippingContact.countryCode
					 *
					 */
					if((typeof settings.onShippingContactStatus === 'function' && settings.onShippingContactStatus(event)) || event.shippingContact.countryCode.toLowerCase() != 'us') {
						status = ApplePaySession.STATUS_INVALID_SHIPPING_POSTAL_ADDRESS;
					}
        	        
        	        var shipping = data.shipping;
        	        var grandTotal = data.grandTotal;
        	        var lines = data.line;
        	        
        	        session.completeShippingContactSelection(status, shipping, grandTotal, lines);
    	    	}

				if(settings.shippingContactSelectedCallback == 'function'){
					settings.shippingContactSelectedCallback(event,data);
				}

    	        console.log('after completeShippingContactSelection')
    	    },
				error: function(xhr){
					if(typeof settings.errorCallback === 'function'){
						settings.errorCallback(event,xhr,session);
					} else{
						var json = xhr.responseJSON;
						console.log(json);
						session.abort();
					}
				}
    	});
    }

    session.onshippingmethodselected = function(event) {
        jQuery.ajax({
            type: 'post',
            url: js_site_var['context_path'] + "/app/applepay/selectShippingMethod.json",
            data: JSON.stringify({ shippingMethod: event.shippingMethod.identifier }),
            headers: {'csrfToken': getCsrfToken() },
            timeout: 5000,
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
            	if(ApplePaySession.supportsVersion(3)) {
	            	var update = {};
	                
	                update.newTotal = data.grandtotal;
	                update.newLineItems = data.line;
	                
	                session.completeShippingMethodSelection(update);
            	} else {
            		var status = ApplePaySession.STATUS_SUCCESS;
                    var newTotal = data.grandtotal;
                    var newLineItems = data.line;
                    
                    session.completeShippingMethodSelection(status, newTotal, newLineItems);
            	}
            	
            	console.log('completeShippingMethodSelection')
            },
            error: function(xhr){
            	var json = xhr.responseJSON;
            	console.log(json);
            	session.abort();
            }
        });

    }

    session.onpaymentauthorized = function (event) {
    	var billingContact = event.payment.billingContact;
    	var billingAddress1 = billingContact.addressLines[0];
    	
    	var billingAddress2;
    	if (typeof billingContact.addressLines[1] === 'undefined'){
    		billingAddress2 = '';
    	}
    	else{
    		billingAddress2 = billingContact.addressLines[1]
    	}
    	
    	var shippingContact = event.payment.shippingContact;
    	
    	var shippingAddress1 = shippingContact.addressLines[0];
    	var shippingAddress2;
    	if(typeof shippingContact.addressLines[1] === 'undefined'){
    		shippingAddress2 = '';
    	}else{
    		shippingAddress2 = shippingContact.addressLines[1];
    	} 
    	
        jQuery.ajax({
            type: 'post',
            url: js_site_var['context_path'] + "/app/applepay/setBilling.json",
            headers: {'csrfToken': getCsrfToken() },
            data: JSON.stringify({
            	shippingFirstName: shippingContact.givenName,
            	shippingLastName: shippingContact.familyName,
            	shippingAddress1: shippingAddress1, 
            	shippingAddress2: shippingAddress2,
            	shippingPhoneNumber: shippingContact.phoneNumber,  
            	shippingCity:  shippingContact.locality,
            	shippingProvince:  shippingContact.administrativeArea,
            	shippingPostalCode: shippingContact.postalCode,
            	shippingCountry:  shippingContact.countryCode,
            	shippingPhoneNumber:  shippingContact.phoneNumber,
            	shippingEmail:  shippingContact.emailAddress.trim(),
            	
    	    	billingFirstName :billingContact.givenName ,
    	    	billingLastName : billingContact.familyName ,
    	    	billingAddress1: billingAddress1, 
    	    	billingAddress2: billingAddress2,
    	    	billingPhoneNumber: billingContact.phoneNumber,  
    	    	billingCity:  billingContact.locality,
    	    	billingProvince:  billingContact.administrativeArea,
    	    	billingPostalCode: billingContact.postalCode,
    	    	billingCountry:  billingContact.countryCode
    		}),
    		contentType: 'application/json',  
            timeout: 5000,
            dataType: 'json',

            success: function (data) {
                var promise = sendPaymentToken(event.payment.token);
                promise.then(function (success) {
                	if(ApplePaySession.supportsVersion(3)) {
	                	result = {};
	                	
	                	result.status = "STATUS_SUCCESS";
	                	
	                	session.completePayment(result);
                	} else {
                		status = ApplePaySession.STATUS_SUCCESS;
                		
                		session.completePayment(status);
                	}
                }, 
                
                function(errors) {
                	if(ApplePaySession.supportsVersion(3)) {
	                	result = {};
	                	
	                	result.status = "STATUS_FAILURE";
	        			result.errors = [];
	            		
	            		for(var i = 0; i < errors.length; i++) {
	            			var error = new ApplePayError("billingContactInvalid");
	                        error.message = errors[i];
	                        error.contactField = "name";
	
	            			result.errors.push(error);
	            		}
	            		
	            		session.completePayment(result);
                	} else {
                		status = ApplePaySession.STATUS_INVALID_BILLING_POSTAL_ADDRESS;
                		
                		session.completePayment(status);
                	}
                });
            },
            error: function(xhr){
            	if(settings.paymentAuthorizedErrorCallback !== null) {
					settings.paymentAuthorizedErrorCallback(event,xhr,session);
				} else {
					var json = xhr.responseJSON;
					var status = xhr.status;
					console.log(json);
					session.abort();
				}
            }
        })

    }

    function sendPaymentToken(paymentToken) {
        return new Promise(function(resolve, reject) {

            returnFromGateway = createTransaction(paymentToken);

            if ( returnFromGateway == undefined )
                resolve(true);
            else
                reject(returnFromGateway);
        });
    }
    
    function createTransaction(dataObj) {

	    console.log('starting createTransaction');
	    console.log(dataObj);

	    var objJsonStr = JSON.stringify(dataObj.paymentData);
	    console.log(objJsonStr);
	    var objJsonB64 = window.btoa(objJsonStr);
	    console.log(objJsonB64);

	    var result;
	    
	    jQuery.ajax({
	        async: false,
	    	url: js_site_var['context_path'] + "/app/applepay/setAuthToken.json", 
	        data: JSON.stringify({token: objJsonB64, data: dataObj}),
	        headers: {'csrfToken': getCsrfToken() },
	        method: 'POST',
	        contentType: 'application/json', 
	        timeout: 5000,
	        success: function(data){
	        	result = checkout();
	        },
	        error: function(xhr){
	        	var json = xhr.responseJSON;
	        	console.log(json);
	        	session.abort();
	        }

	    });

	    return result;
	}

    function checkout() {
    	console.log('starting checkout');
    	var result; 
    	var xhrObj = new XMLHttpRequest();
    	
		jQuery.ajax({
	            async: false,
			 	type: 'get',
	            url: js_site_var['context_path'] + "/app/cart/checkout",
	            headers: {'csrfToken': getCsrfToken() },
	            timeout: 5000,
	            xhr: function() {
		        	return xhrObj;
		        },
	            success: function (data, status, xhr) {
	            	if(data.errors) {
	            		result = data.errors;
	            	} else {
	            		result = this.xhr().responseURL;
	            	}
	            }
		 });
	    
		if(Array.isArray(result)) {
			return result;
		} else {
			window.location = result;
		}
    }

    session.oncancel = function(event) {
    	var url = js_site_var['context_path'] + "/app/applepay/clear"
    	 jQuery.ajax({
             type: 'get',
             url: url ,
             dataType: 'json',
             success: function (data) {
            	 console.log('apple pay session cleared')
             }
    	 });
    	
        console.log('starting session.cancel');
        console.log(event);
    }

    session.begin();

}

function htmlDecode(input) {
	var doc = new DOMParser().parseFromString(input, "text/html");
	return doc.documentElement.textContent;
}