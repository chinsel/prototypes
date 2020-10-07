$(function() {

	if (window.location.href.indexOf("#") != -1) {
		window.location.href = window.location.href.split("#")[0];
	}

  var maxZoom = 29,
      bubbles = 12,
      minZoom;

  var $zoomInButton = $(".zoom-in"),
      $zoomOutButton = $(".zoom-out"),
      $legend = $(".legend");

  var zoomData,
	    normX,
	    normY,
	    viewableX,
	    viewableY,
	    normWidth,
	    normHeight,
	    scaledX,
	    scaledY,
	    centerX,
	    centerY,
	    zoomRatio;

	var $map = $("#map"),
			$zoomContainer = $("#zoom-container"),
			$landmarks = $(".zoom-container .landmarks"),
			$svgMap,
			$svgSeats,
			$seatStandard,
			$sectionAvail,
			inventory,
			$miniMap = $("#mini"),
			$beacon = $("#mini .beacon"),
			$slider = $("#slider"),
			$captureMap = $("#capture-map"),
			$overlay = $(".overlay"),
			$countdown = $(".countdown"),
			mapLoaded = 0,
			zooming = 0,
			panning = 0,
			bubblesOn = 0,
			cartViewed = 0,
			seatsToggled = 0,
			pinching = 0,
			searched = 0,
			dontShowPrompt = 0,
			fromPrompt = 0,
			fromSection = null;

	var filtersWt = $(".filters").width(),
			windowWt = $(".frame-ba").width(),
			windowHt = $(".frame-ba").height(),
			subhdrHt = $(".subheader").height(),
			barHt = 40,
			mapWt = 10240,
			mapHt = 7680,
			beaconMid = $beacon.outerWidth() / 2,
			miniRatio = $miniMap.width() / mapWt;

	var captureScale = 0.115,
			captureStyle = '<defs><style type="text/css">\n.svg-sect{fill:#fff; stroke:#ddd;}\n.seat{fill:#ddd;}\n.seat-selected{fill:#414141;}\n.seat-icon-resale{fill:#fff;}\n.stage{fill:#414141;}\n</style></defs>';

	var bagItems = 0,
			bagId = 0,
			bagPrice = "0.00",
			cartTime = "08:00",
			baTime = "01:30",
			baTimerVar,
			presaleTime = 60,
			presaleTimerVar;

	var $quantity = $(".filter-quantity .quantity"),
			qty = parseInt($quantity.val());

	var iPad = 0,
			iPhone = 0,
			portrait = (windowWt < windowHt);

	var clickTimer,
			hoverTimer;

	var alt = window.location.search.split("&")[0].split("alt=")[1];

	if (typeof alt !== "undefined") { $("html").addClass("alt-"+alt); }

	// ios landscape fix
	if (navigator.userAgent.match(/iPad;.*CPU.*OS 7_\d/i)) {
		iPad = 1;
    $("html").addClass("ipad ios7 touch").removeClass("no-touch");
    if (portrait) { $("html").addClass("portrait"); }
	}
	if (navigator.userAgent.match(/iPhone;.*CPU.*OS 7_\d/i)) {
		iPhone = 1;
    $("html").addClass("iphone ios7 touch").removeClass("no-touch");
	}
	
	if (iPad && !portrait) { windowHt = 672 - subhdrHt - barHt; }

	// begin test button
	$(".begin").position({
		"my": "center",
		"at": "center",
		"of": $(window),
		"collision": "none"
	}).bind("click",function() {
  	$overlay.trigger("click");
	  presaleTimer();
	});

	// account actions
	$(".account a").bind("click",function(e) {
		e.preventDefault();
	});
	$(".account .close").bind("click",function() {
  	$overlay.trigger("click");
	});
	$(".account .account-link").bind("click",function() {
		$(".sign-in, .create").toggle().position({
			"my": "center",
			"at": "center",
			"of": $(window),
			"collision": "none"
		});
	});
	$(".waiting .sign-in-link").bind("click",function(e) {
		e.preventDefault();
		$(".overlay, .sign-in").show().position({
			"my": "center",
			"at": "center",
			"of": $(window),
			"collision": "none"
		});
	});
	$(".account #create4").bind("keyup",function() {
		if ($(this).val() != "") { $(".account #create5").removeClass("disable").removeAttr("readonly").prev().removeClass("disable"); }
		else { $(".account #create5").addClass("disable").attr("readonly","readonly").prev().addClass("disable"); }
	});

	// temporary link to skip presale
	$(".presale-bar a").bind("click",function(e) {
		e.preventDefault();
		onSale();
	});

	$(".presale-bar .timer").text(presaleTime);
  function presaleTimer() {
  	var $presaleTimer = $(".presale-bar .timer, .countdown .timer");
  	$presaleTimer.text((presaleTime <= 9) ? "0" + presaleTime : presaleTime);
  	if (presaleTime <= 9 ) { toggleCountdown(presaleTime); }
  	//if (presaleTime <= 9 ) { toggleToaster("Get ready! Only <span class='timer'>"+presaleTime+"</span> seconds till tickets go on sale!"); }
  	presaleTime--;
  	if (presaleTime >= 0) { presaleTimerVar = setTimeout(presaleTimer,1000); }
  	else { onSale(); }
  }

	function toggleCountdown(content) {
		if (content === 0) { content = "GO!" }
		$countdown.html(content).position({
			"my": "center",
			"at": "center",
			"of": $zoomContainer,
			"collision": "none"
		}).addClass("on");
		setTimeout(function() { $countdown.removeClass("on"); },800);
	}

  function onSale() {
  	clearTimeout(presaleTimerVar);
		$(".presale-bar .close").trigger("click");
		$(".frame-ba").removeClass("presale");
		$(".waiting:not('.also')").hide();
		$(".also").show();
  	$(".frame-ba").css("top","80px");
  	barHt = 40;
		setTimeout(function() { $(".high-bar").show().css("height","40px"); $(window).trigger("resize"); /*$map.smoothZoom("zoomOut");*/ },500);
		if (alt != "3") {
			setTimeout(autoPolling,autoInterval);
		}
  }

  var autoInterval = 30000, //(iPad) ? 30000 : 15000, // auto update in milliseconds
  		autoSell = (alt === "1") ? 0.30 : 0.10; // % of tickets sell
  function autoPolling() {
  	//$(".auto-polling").addClass("on");
  	if ($seatStandard.length > 0) {
			$seatStandard.sort(sortLowHighDist).slice(0,autoSell*inventory).remove(":not('.seat-selected')");
			$seatStandard = $(".seat-standard:not('.seat-selected,.seat-carted')",$svgMap);
			$(".frame > .polling-text").text("Updating inventory...").css("margin-left","-85px");
			togglePolling(1);
			setTimeout(applyToMap,10);
			setTimeout(togglePolling,1000);
		}
  	if ($seatStandard.length === 0) {
			$(".filters .find").addClass("sold-out");
			dontShowPrompt = 1;
			return;
		}
  	//setTimeout(function() { $(".auto-polling").removeClass("on") },10);
  	setTimeout(autoPolling,autoInterval);
  }

  // close presale bar
  $(".presale-bar .close").bind("click",function() {
  	$(this).parent().css("height","0px");
  	$(".frame-ba").css("top","40px");
  	barHt = 0;
		setTimeout(function() { $(".presale-bar").hide(); $(window).trigger("resize"); },500);
  });

  // close high demand bar
  $(".high-bar .close").bind("click",function() {
  	$(this).parent().css("height","0px");
  	$(".frame-ba").css("top","40px");
  	barHt = 0;
		setTimeout(function() { $(".high-bar").hide(); $(window).trigger("resize"); },500);
  });

  // close waiting panel
  $(".waiting .close, .also .close").bind("click",function() {
  	$(".waiting").hide();
  });

	$("input[type='text'],input[type='tel']").on("click",function() {
	  $(this).select();
	});

	// change quantity
	$(".filter-quantity").on("click","button:not('.disable')",function() {
		if ($(this).hasClass("decrease")) {
			if (qty > 1) { qty--; }
			if (qty === 1) { $(this).addClass("disable"); }
		}
		if ($(this).hasClass("increase")) {
			if (qty < 8) { qty++; }
			if (qty === 8) { $(this).addClass("disable"); }
		}
		$quantity.val(qty);
		if (qty > 1 && qty < 8) { $(".filter-quantity button").removeClass("disable"); }
		setTimeout(applyFilters,10);
	});
	$(".filter-quantity input[type='tel']").on("change",function() {
		if ($quantity.val() >= 8) {
			qty = 8;
			$quantity.val(qty);
			$(".filter-quantity .increase").addClass("disable");
			$(".filter-quantity .decrease").removeClass("disable");
		} else if ($quantity.val() <= 1) {
			qty = 1;
			$quantity.val(qty);
			$(".filter-quantity .decrease").addClass("disable");
			$(".filter-quantity .increase").removeClass("disable");
		} else { $(".filter-quantity button").removeClass("disable"); }
		setTimeout(applyFilters,10);
	});

  // price slider
  var pricemin = 50,
      pricemax = 400,
      userpricemin = 50,
      userpricemax = 10000;
  $slider.slider({
    range: true,
    values: [pricemin,pricemax],
    min: pricemin,
    max: pricemax,
    create: function(event,ui) {
      $(".filter-price .price-min").val(pricemin);
      $(".filter-price .price-max").val(pricemax+"+");
    },
    slide: function(event,ui) {
      $(".filter-price .price-min").val(ui.values[0]);
      $(".filter-price .price-max").val(ui.values[1]);
      if (ui.values[1] == pricemax) { $(".filter-price .price-max").val(pricemax+"+"); }
    },
    stop: function(event,ui) {
    	userpricemin = parseInt(ui.values[0]);
    	userpricemax = (ui.values[1] == pricemax) ? 10000 : parseInt(ui.values[1]);
			setTimeout(applyFilters,10);
    }
  });
  $(".filter-price .price-min").on("change",function() {
    if ($(this).val() <= pricemin) { $slider.slider("values",0,pricemin); $(this).val(pricemin); }
    else if ($(this).val() >= pricemax) { $slider.slider("values",0,pricemax); $(this).val(pricemax); }
    else { $slider.slider("values",0,$(this).val()); }
    userpricemin = parseInt($slider.slider("values",0));
		setTimeout(applyFilters,10);
  });
  $(".filter-price .price-max").on("change",function() {
    if ($(this).val() >= pricemax) { $slider.slider("values",1,pricemax); $(this).val(pricemax+"+"); }
    else if ($(this).val() <= pricemin) { $slider.slider("values",1,pricemin); $(this).val(pricemin); }
    else { $slider.slider("values",1,$(this).val()); }
    userpricemax = parseInt($slider.slider("values",1));
		setTimeout(applyFilters,10);
  });

  // checkboxes
  $(".prompt input[type='checkbox']:not('.locked, .disabled') + label").bind("click",function() {
    $(this).prev().toggleClass("checked");
    dontShowPrompt = !dontShowPrompt;
  });
  $(".prompt input[type='checkbox']").prop("checked",false);
  $(".prompt input[type='checkbox'].checked").prop("checked",true);

  // click find tickets
  $(".filters .find").bind("click",function() {
  	if ($(".frame-ba").hasClass("presale")) { toggleToaster("Only "+presaleTime+" second"+((presaleTime > 1) ? "s" : "")+" till tickets go on sale!"); }
  	else if (searched && !dontShowPrompt && !fromPrompt) { displayPrompt(); }
  	else if ($(this).hasClass("sold-out")) { toggleToaster("Sorry. All seats are sold."); }
  	else  {
			$(".frame > .polling-text").text("Finding tickets...").css("margin-left","-60px");
			$(".result").remove();
			togglePolling(1);
			setTimeout(findBestAvailable,2000);
			setTimeout(togglePolling,2000);
  	}
  });

	// toggle misc buttons
	$(".misc button").bind("click",function() {
		if ($(this).hasClass("bubbles") && $(".covers-on").length) { toggleBubbles(); $(this).toggleClass("on"); }
		if ($(this).hasClass("info")) { $(this).toggleClass("on"); }
	});

	// close details
	$(".details .close, .overlay").bind("click",function() {
  	$(".overlay, .details, .account, .begin, .prompt").hide();
  });

  // cart link actions
	$(".upsell-list, .cart-list").on("click","a",function(e) {
		e.preventDefault();
	});
	$(".frame-cart .back > *").on("click",function(e) {
		e.preventDefault();
		history.back();
	});

	// inject SVG
	$.get( "data/svg-map-full.txt" )
		.done(function( data ) {
			onParseDataComplete(data);
		});

	// inject mini-map SVG
	$.get( "data/svg-map-mini.txt" )
		.done(function( data ) {
			$miniMap.prepend(data);
		});

	// inject capture-map SVG
	$.get( "data/svg-map-capture.txt" )
		.done(function( data ) {
			$captureMap.prepend(data);
			$("svg",$captureMap).prepend(captureStyle);
			$(".seat-icon-resale",$captureMap).remove();
		});

	function onParseDataComplete(data) {
		$map.prepend(data);
		$svgMap = $("#svg-map");
		$svgSeats = $("#svg-seats",$svgMap);
		$(".seat-resale, .seat-icon-resale",$svgMap).remove();
		$seatStandard = $(".seat-standard",$svgMap);
		inventory = $seatStandard.length;
		$sectionAvail = $(".svg-sect-avail",$svgMap);
		addSmoothZoom();
	}

	// smoothZoom
	function addSmoothZoom(){
		// smooth zoom initiation
		$map.smoothZoom({
			width: windowWt,
			height: windowHt,
			pan_BUTTONS_SHOW: false,
			zoom_BUTTONS_SHOW: false,
			border_SIZE: 0,
			mouse_WHEEL: true,
			//initial_ZOOM: 40,
			//zoom_MIN: minZoom,
			zoom_MAX: maxZoom,
			container: "zoom-container",
			mouse_DOUBLE_CLICK: false,
			use_3D_Transform: false,
			reset_TO_ZOOM_MIN: true,
			background_COLOR: "transparent",
			//responsive: true,
			//responsive_maintain_ratio: false,
			//initial_POSITION: initPos,

			//on_IMAGE_LOAD: onMapLoad,
			on_ZOOM_PAN_UPDATE: onPanning,   
			on_ZOOM_PAN_COMPLETE: onPanComplete
		});
	}
  
  function zoomInfo(zoomData) {
    //normX = parseInt(zoomData.normX),
    //normY = parseInt(zoomData.normY),
    //viewableX = mapWt / zoomData.ratio,
    //viewableY = mapHt / zoomData.ratio,
    normWidth = parseInt(zoomData.normWidth),
    normHeight = parseInt(zoomData.normHeight),
    scaledX = parseInt(zoomData.scaledX),
    scaledY = parseInt(zoomData.scaledY),
    centerX = parseInt(zoomData.centerX),
    centerY = parseInt(zoomData.centerY),
    zoomRatio = zoomData.ratio * 100;
  }

	function onPanning(zoomData) {
		panning = 1;
		zoomInfo(zoomData);
		changeBubbles();
		panMapControls();
	}

	function onPanComplete(zoomData) {
		zoomInfo(zoomData);
		// first load of smoothZoom
		if (!mapLoaded) {
			minZoom = zoomRatio;
			panMapControls();
			addSectionClicks();
			addSectionBubbles();
			applyToMap();
			$(".frame > .polling").hide();
			$(".frame > .polling-text").hide();
			mapLoaded = 1;
		}
		panning = 0;
	}

  function panMapControls(){
    if (Math.round(zoomRatio) == maxZoom) {
      $zoomInButton.addClass("disable");
      $zoomOutButton.removeClass("disable");
    } else if (scaledX <= 0 && scaledY <= 0) {
      $zoomInButton.removeClass("disable");
      $zoomOutButton.addClass("disable");
    } else if ($zoomInButton.hasClass("disable") || $zoomOutButton.hasClass("disable")) {
      $zoomInButton.removeClass("disable");
      $zoomOutButton.removeClass("disable");
    }
  }

  function toggleLegend(level) {
  	if (level) {
			$legend.removeClass("sections");
			$(".legend-avail",$legend).text("Available");
			$(".legend-unavail",$legend).text("Not Available");
  	} else {
			$legend.addClass("sections");
			$(".legend-avail",$legend).text("Tickets Available");
			$(".legend-unavail",$legend).text("No Tickets");
  	}
  }

  function toggleBubbles() {
  	if (iPad) {
  		$(".bubble").toggleClass("on");
  	} else {
	  	var i = 0;
	  	var bubbleInterval = setInterval(function() {
	  		$(".bubble").eq(i).toggleClass("on");
	  		i++;
	  		if ($(".bubble").length === i) { clearInterval(bubbleInterval); }
	  	},25);
	  }
	  bubblesOn = !bubblesOn;
  }

  function changeBubbles() {
		if (zoomRatio >= bubbles) {
			$(".bubble .price.lowest").hide();
			$(".bubble .price.range").show();
		} else {
			$(".bubble .price.lowest").show();
			$(".bubble .price.range").hide();
		}
  }

  var toasterTimer;
	function toggleToaster(content) {
		clearTimeout(toasterTimer);
		var $toaster = $(".toaster");
		$toaster.html(content).showInline();
		$toaster.position({
			"my": "center",
			"at": "center",
			"of": $zoomContainer,
			"collision": "none"
		});
		toasterTimer = setTimeout(function() { $toaster.fadeOut(500); },2000);
	}

  $zoomInButton.on("vmousedown",function() { zooming = 1; $map.smoothZoom('zoomIn'); });
  $zoomOutButton.on("vmousedown",function() { zooming = 1; $map.smoothZoom('zoomOut'); });

  // use + and - keys to zoom
  $(window).keydown(function(e) {
  	if (e.which == 107 && !zooming) { zooming = 1; $map.smoothZoom('focusTo',{x:centerX, y:centerY, zoom:(zoomRatio * 2), speed:20}); }
  	if (e.which == 109 && !zooming) { zooming = 1; $map.smoothZoom('focusTo',{x:centerX, y:centerY, zoom:(zoomRatio / 2), speed:20}); }
  });

	function applyFilters() {
		if (alt != "3") {
			$(".frame > .polling-text").text("Updating map...").css("margin-left","-60px");;
			$(".result .more-info").addClass("collapsed").removeClass("expanded");
			togglePolling(1);
			setTimeout(applyToMap,10);
			setTimeout(togglePolling,10);
		}
	}

	function togglePolling(show) {
		if (show) {
			$zoomContainer.addClass("loading");
			$(".frame > .polling, .frame > .polling-text").show();
		} else {
			$zoomContainer.removeClass("loading");
			$(".frame > .polling, .frame > .polling-text").hide();
		}
	}

	function applyToMap() {
		var availSections = [],
				standardSections = [];
		for (i=0;i<$seatStandard.length;i++) {
			var $thisSeat = $seatStandard.eq(i),
					row = $thisSeat.data("row"),
					section = $thisSeat.data("section") + "",
					price = parseFloat($thisSeat.data("price")),
					$siblings = $thisSeat.nextUntil(".seat:not('.seat-standard'),.seat-selected",".seat-standard[data-section='"+section+"'][data-row='"+row+"']").addBack();
			i += $siblings.length - 1;
			if ($siblings.length >= qty && price >= userpricemin && price <= userpricemax) {
				$siblings.each(function() {
					$(this).svgRemoveClass("outside");
				});
				if (availSections.indexOf(section) == -1) { availSections.push(section); }
			} else {
				$siblings.each(function() {
					$(this).svgAddClass("outside");
				});
			}
			standardSections.push(section);
		}
		for (i=0;i<$sectionAvail.length;i++) {
			var section = $sectionAvail.eq(i).attr("id").replace("s-","");
			if (availSections.indexOf(section) == -1) { $sectionAvail.eq(i).svgAddClass("outside"); }
			else { $sectionAvail.eq(i).svgRemoveClass("outside"); }
			// remove resale and sold-out sections
			if (standardSections.indexOf(section) == -1) { $sectionAvail.eq(i).unbind().svgRemoveClass("svg-sect-avail"); $("#bubble-"+section).remove(); }
		}
	}

	function findBestAvailable() {
		$(".seat-selected").each(function() { $(this).remove();/*.svgRemoveClass("seat-selected");*/ });
		var $inRange = (!fromSection) ? $seatStandard.not(".outside") : $seatStandard.not(".outside").filter("[data-section='"+fromSection+"']"),
				$closest = $inRange.sort(sortLowHighDist),
				section = $closest.eq(0).data("section"),
				row = $closest.eq(0).data("row"),
				$bestGroup = $closest.filter("[data-section='"+section+"'][data-row='"+row+"']").sort(sortLowHighSeat);
		if ($bestGroup.first().data("distance") > $bestGroup.last().data("distance")) { $bestGroup = $bestGroup.slice(qty*(-1)); }
		else { $bestGroup = $bestGroup.slice(0,qty); }
		$bestGroup.each(function() {
			$(this).svgAddClass("seat-selected");
			$(this).attr("id","selected-"+cartId);
			cartId++;
		});
		fromSection = null;
		displayInfo($bestGroup);
	}

  function baTimer() {
  	var baMinute = parseInt(baTime.split(":")[0]),
  			baSecond = parseInt(baTime.split(":")[1]),
  			$baTimer = $(".more-info .timer b, .details .timer b");
  	$baTimer.text(baTime);
  	if (baTime == "00:00") {
  		$overlay.trigger("click");
			$(".result").remove();
			$(".seat-selected").each(function() { $(this).svgRemoveClass("seat-selected"); });
			searched = 0;
			return;
  	}
  	if (baSecond == 0) {
  		baMinute--;
  		baSecond = 59;
  	} else {
  		baSecond--;
  	}
  	baTime = ((baMinute <= 9) ? "0" + baMinute : baMinute) + ":" + ((baSecond <= 9) ? "0" + baSecond : baSecond);
  	baTimerVar = setTimeout(baTimer,1000);
  }

	function displayInfo($el) {
		var $firstEl = $el.eq(0),
				elTop = (parseInt($el.filter(":first").attr("cy")) + parseInt($el.filter(":last").attr("cy"))) / qty,
  			elLeft = (parseInt($el.filter(":first").attr("cx")) + parseInt($el.filter(":last").attr("cx"))) / qty,
  			elRad = parseInt($firstEl.attr("r"));
  	// create and append info panel
  	var moreInfoStr = '<div class="item mark result on" data-position="'+(elLeft+elRad)+','+(elTop+elRad)+'" data-show-at-zoom="0" data-allow-scale="false"><div><div class="panel more-info expanded on"><img src="../../mobile/img/seatview/'+$firstEl.data("section")+'_SeatViews_640x427.jpg" class="vfs" /><p class="timer"><button type="button" class="toggle"></button><span>Reserved for:</span><b>'+baTime+'</b></p><p class="info"><span class="sec-row"><span class="section">'+$firstEl.data("section-name")+'</span>, <span class="row">Row '+$firstEl.data("row")+'</span></span><br /><span class="seat-dist"><span class="seat">Seat'+((qty === 1) ? " " : "s ")+$firstEl.data("seat")+((qty === 1) ? "" : "-"+$el.filter(":last").data("seat"))+'</span>&bull;<span class="dist">'+$firstEl.data("distance")+' ft from stage</span></span><br /><a href="#" class="details-link">Details</a></p><p class="price">$'+$firstEl.data("price")+'<span class="ea">ea</span></p><a href="#cart" class="add">Buy Now</a><b class="caret"></b></div></div></div>';
		$landmarks.append(moreInfoStr);
		var $click = $(".result .more-info").filter(":last");
  	if (elTop < mapHt / 2) {
  		// place info below seat(s)
  		$click.removeClass("above");
  		$(".caret",$click).addClass("up").removeClass("down");
  	} else {
  		// place info above seat(s)
  		$click.addClass("above");
  		$(".caret",$click).removeClass("up").addClass("down");
  	}
  	$map.smoothZoom("refreshAllLandmarks");
  	// hide show info panel
  	$click.bind("click",function(e) {
  		e.stopPropagation();
  	});
  	$(".add:contains('Buy Now')",$click).unbind().bind("click",function() {
	  	addToCart();
  	});
  	$(".info",$click).bind("click",function(e) {
  		e.preventDefault();
  		displayDetails($el);
  	});
		// toggle seat selection
		$(".toggle",$click).bind("click",function() {
			$(this).parents(".more-info").toggleClass("expanded collapsed");
		});
		$(".ipad .toggle",$click).bind("tap",function() {
			$(this).parents(".more-info").toggleClass("expanded collapsed");
		});
		if (!searched) { searched = 1; }
		baTime = "01:30";
		baTimer();
  }

  $zoomContainer.bind("click",function() {
  	// defocus seat selection
  	if (!panning) { $(".result .more-info").addClass("collapsed").removeClass("expanded"); }
  });

  function displayPrompt() {
  	var $prompt = $(".prompt"),
  			$resultClone = $(".result .more-info").clone();
  	$(".toggle, .details-link, .add, .caret",$resultClone).remove();
  	$resultClone.addClass("expanded").removeClass("collapsed");
  	$(".result .more-info").addClass("collapsed").removeClass("expanded");
  	$(".selection",$prompt).empty().append($resultClone);
  	$prompt.show().position({
  		"my": "center",
  		"at": "center",
  		"of": $(document),
  		"collision": "none"
  	});
  	$overlay.show();
  	fromPrompt = 1;
  }

  // bind actions to prompt buttons
  $(".prompt .close, .prompt .cancel").bind("click",function() {
  	fromPrompt = 0;
  	$(".prompt, .overlay").hide();
  });
  $(".prompt .yes").bind("click",function() {
  	// search again
  	clearTimeout(baTimerVar);
  	baTime = "01:30";
  	$(".filters .find").trigger("click");
  	$(".prompt .close").trigger("click");
  });

  var detailWt;
  function displayDetails($el) {
		var items = $el.length,
				$firstEl = $el.eq(0),
	  		detailsStr = "";
  	var section = $firstEl.data("section"),
  			sectionName = $firstEl.data("section-name"),
  			row = $firstEl.data("row"),
  			seats = $firstEl.data("seat")+((items === 1) ? "" : "-"+$el.filter(":last").data("seat"))
  			distance = $firstEl.data("distance"),
  			price = parseFloat($firstEl.data("price")).toFixed(2),
  			total = (parseFloat(price) * qty).toFixed(2);
  	detailsStr += '<li class="details-item current"><div class="images"><img src="../../mobile/img/seatview/'+section+'_SeatViews_640x427.jpg" class="main-img" /><ul class="img-list"><li class="current"><img src="../../mobile/img/seatview/'+section+'_SeatViews_640x427.jpg" /></li><li><!--<b class="polling"></b>--><img src="" width="640" height="427" /></li></ul><img src="" class="seat-level-view" width="640" height="427" /></div><div class="desc"><div><p class="info"><span class="timer">Reserved for:<b>'+baTime+'</b></span><span class="section">'+sectionName+'</span><br /><span class="row-seat"><span class="row">Row '+row+'</span>, <span class="seat">'+((items === 1) ? 'Seat ' : 'Seats ')+seats+'</span></span><br /><span class="hdr">Details</span><span class="dist">&bull; About '+distance+' ft from stage</span></p><p class="price"><span class="each">$'+price+' x '+items+'<br /></span><span class="total">$'+total+'</span></p></div><div class="mobile">Available for <span>FREE</span> mobile delivery!</div><a href="#cart" class="add">Buy Now</a></div></li>';
  	$(".details-list").empty().append(detailsStr);
  	$miniMap.clone().attr("id","").appendTo(".details-item .images").show().find(".mini-map").attr("id","");
		var elRad = parseInt($firstEl.attr("r")),
				cx = (parseInt($el.filter(":first").attr("cx")) + parseInt($el.filter(":last").attr("cx"))) / items + elRad,
				cy = (parseInt($el.filter(":first").attr("cy")) + parseInt($el.filter(":last").attr("cy"))) / items + elRad,
  			section = $firstEl.data("section"),
  			row = $firstEl.data("row"),
  			seat = $firstEl.data("seat");
  	$(".details-item .beacon").css({
  		"left": cx * miniRatio - beaconMid,
  		"top": cy * miniRatio - beaconMid
  	});
  	createSeatImage(section,row,seat,cx,cy,items);
  	detailWt = $(".details-item.current").innerWidth();
  	var listLeft = (windowWt - detailWt - 10) / 2;// - current * (detailWt + 10);
  	$(".details-list").css({
  		"width": (detailWt + 10) * items,
  		"margin-left": listLeft,
  		"margin-right": listLeft
  	});
  	$overlay.show();
  	var detailsTop = ($(window).height() < $(".details").height()) ? 10 : ($(window).height() - $(".details").height()) / 2;
  	$(".details").css("top",detailsTop).show();
  	var mainImgWt = $(".details .main-img").width();
  	$(".details .img-list li").bind("click",function() {
  		$(this).siblings(".current").removeClass("current");
  		$(this).addClass("current");
  		if ($("img",this).attr("src").indexOf("data") != -1) { $(this).parent().prev().attr("src",$(".seat-level-view").attr("src")).css("width",mainImgWt); }
  		else { $(this).parent().prev().attr("src",$("img",this).attr("src")).css("width",mainImgWt); }
  	});
  }

  function addSectionBubbles() {
  	var bubblesStr = "",
  			allY = [],
  			highestY,
  			place,
				bubbleArray = [];
  	$sectionAvail.each(function() {
  		var thisID = $(this).attr("id"),
  				section = thisID.replace("s-",""),
  				bbox = document.getElementById(thisID).getBBox(),
  				zoomX = bbox.x * 10 + bbox.width * 10 / 2,
  				zoomY = bbox.y * 10 + bbox.height * 10 / 2,
  				allPrices = [],
  				lowestPrice,
  				highestPrice,
  				sectionName = $(".seat-standard[data-section='"+section+"']").eq(0).data("section-name");
  		allY.push(zoomY);
  		$(".seat-standard[data-section='"+section+"']").each(function() {
  			allPrices.push(parseFloat($(this).data("price")));
  		});
  		lowestPrice = Array.min(allPrices);
  		highestPrice = Array.max(allPrices);
  		bubbleArray.push('<div class="item mark bubble" id="bubble-'+section+'" data-position="'+zoomX+','+(zoomY-100)+'" data-show-at-zoom="0" data-allow-scale="false"><div><div class="panel price lowest">$'+Math.floor(lowestPrice)+'+<b class="caret down"></b></div><div class="panel price range">$'+Math.floor(lowestPrice)+' - $'+Math.ceil(highestPrice)+'</div></div></div>');
	  	addSectionHovers(thisID,sectionName,lowestPrice,highestPrice,bbox.width,bbox.height);
  	});
		for (i=0;i<bubbleArray.length;i++) {
	  	highestY = Array.min(allY);
	  	place = allY.indexOf(highestY);
	  	allY[place] = Array.max(allY) + 1;
	  	bubblesStr += bubbleArray[place];
	  }
		$landmarks.prepend(bubblesStr);
  	$map.smoothZoom("refreshAllLandmarks");
  }

	function addSectionHovers(thisID,sectionName,lowestPrice,highestPrice,sectionWt,sectionHt) {
		var $sectionHover = $(".section-info");
		$("#"+thisID).mouseenter(function() {
			if (!panning) {
				var sectionHoverWt = $sectionHover.width(),
  					sectionLeft = $(this).offset().left + sectionWt * zoomRatio / 100 / 2 * 10,
						sectionTop = $(this).offset().top - subhdrHt + sectionHt * zoomRatio / 100 / 2 * 10,
		  			containerHt = windowHt,
		  			barHt = $(".frame-ba").position().top - subhdrHt;
		  	$(".vfs",$sectionHover).attr("src","../../mobile/img/seatview/"+thisID.replace("s-","")+"_SeatViews_640x427.jpg");
				$(".section",$sectionHover).text(sectionName);
				$(".price-range",$sectionHover).text("$"+Math.floor(lowestPrice)+" - $"+Math.ceil(highestPrice));
		  	if (sectionTop < containerHt / 2) {
		  		// place info below section center
		  		$sectionHover.removeClass("above").css({"top":sectionTop - barHt + 9 + "px","left":sectionLeft - sectionHoverWt / 2 + "px","bottom":""});
		  		$(".caret",$sectionHover).addClass("up").removeClass("down");
		  	} else {
		  		// place info above section center
		  		$sectionHover.addClass("above").css({"bottom":containerHt + barHt - sectionTop + 9 + "px","left":sectionLeft - sectionHoverWt / 2 + "px","top":""});
		  		$(".caret",$sectionHover).removeClass("up").addClass("down");
		  	}
		  	if ($(this).svgHasClass("outside")) { $(".no-matches",$sectionHover).show(); }
		  	else { $(".no-matches",$sectionHover).hide(); }
		  	$sectionHover.addClass("on");
			}
		}).mouseleave(function() {
			$sectionHover.removeClass("on");
		});
	}

  function addSectionClicks() {
	  $sectionAvail.bind("vclick",function() {
	  	if (!panning) {
		  	if ($(".frame-ba").hasClass("presale")) { toggleToaster("Only "+presaleTime+" second"+((presaleTime > 1) ? "s" : "")+" till tickets go on sale!"); }
		  	else if (!$(this).svgHasClass("outside")) {
		  		fromSection = $(this).attr("id").replace("s-","");
		  		$(".section-info").removeClass("on");
		  		$(".filters .find").trigger("click");
		  	}
	  	}
	  });
	}

  // add to cart buttons
  $(".details, .landmarks").on("click",".add:contains('Buy Now')",function() {
  	addToCart();
		$overlay.trigger("click");
  });

  // disable cart button if cart is empty
  $(".subheader").on("click",".cart-link.empty",function(e) {
  	e.preventDefault();
  });

	// remove item from cart with in-cart remove link
  $(".cart-list").on("click",".remove",function(e) {
  	e.preventDefault();
  	removeFromCart($(this).parents(".cart-item"));
  });

  var cartSubTotal = 0,
			cartTotal = 0,
			cartTaxes = 0,
			cartFee = parseFloat($(".total-fee").text().split("$")[1]),
			taxRate = 0.1,
			cartTickets = 0,
			cartId = 0;

  function addToCart() {
  	searched = 0;
  	clearTimeout(baTimerVar);
  	baTime = "01:30";
  	var $itemGroup = $(".seat-selected",$svgMap),
  			quantity = $itemGroup.length,
  			cartStr = "",
				cartSubStr = "",
				cartQtyStr = "";
  	cartTickets += quantity;
  	// set number of items in cart header and subheader
  	$(".frame-cart .items").text((cartTickets > 1) ? cartTickets + " items" : cartTickets + " item");
  	$(".subheader .cart-link").text(cartTickets).removeClass("empty");
  	// build or add to cart list
		var $item = $itemGroup.eq(0),
				classes = "cart-item",
				row = $item.data("row"),
				price = $item.data("price"),
				groupTotal = parseFloat($item.data("price")) * quantity;
		for (j=0;j<quantity;j++) {
			classes += " " + $itemGroup.eq(j).attr("id");
		}
		cartStr += '<li class="'+classes+'"><img src="../../mobile/img/seatview/'+$item.data("section")+'_SeatViews_640x427.jpg" class="image" /><div class="desc"><p class="info"><span class="quantity">'+quantity+' Ticket'+((quantity > 1) ? 's' : '')+'<br /></span><span class="section">'+$item.data("section-name")+'</span><br /><span class="row-seat"><span class="row">Row '+row+'</span>, <span class="seat">Seat'+((quantity > 1) ? 's' : '')+' '+((quantity > 1) ? $item.data("seat")+"-"+$itemGroup.last().data("seat") : $item.data("seat"))+'</span></span></p><p class="price"><span class="total">$'+groupTotal.toFixed(2)+'<br /></span><a href="#" class="remove">Remove</a></p><div class="mobile">Available for <span>FREE</span> mobile delivery!</div></div></li>';
		cartQtyStr += '<div class="'+classes.replace('cart-item ','dark ')+'"><p><span class="tickets">'+quantity+' Ticket'+((quantity > 1) ? 's' : '')+' ($'+parseFloat($item.data("price")).toFixed(2)+' ea)</span></p><p class="total-tickets">$'+groupTotal.toFixed(2)+'</p></div>';
		cartSubStr += '<span class="'+classes.replace('cart-item ','')+'">'+$item.data("section-name")+', Row '+row+', Seat'+((quantity > 1) ? 's' : '')+' '+((quantity > 1) ? $item.data("seat")+"-"+$itemGroup.last().data("seat") : $item.data("seat"))+'<br /></span>';
		cartSubTotal += groupTotal;
		$(".cart-list").append(cartStr);
  	// set values in cart
		cartTaxes = cartSubTotal * taxRate;
		cartTotal = cartSubTotal + cartFee + cartTaxes;
  	$(".cart .total").text("$"+cartTotal.toFixed(2));
  	$(".cart .total-taxes").text("$"+cartTaxes.toFixed(2));
  	$(".cart .total-fee").parent().before(cartQtyStr);
  	$(".cart-listing").append(cartSubStr);
  	// remove items from ISM
  	setTimeout(function() {
  		$(".results").remove();
	  	$itemGroup.each(function() {
	  		$(this).svgRemoveClass("seat-selected");
	  		$(this).svgAddClass("seat-carted");
	  	});
	  },1000);
  }

  function removeFromCart($el) {
  	var price = parseFloat($el.find(".total").text().replace("$","")),
  			quantity = parseInt($el.find(".quantity").text().split(" ")[0]),
  			label,
  			ids;
  	// change number of items in cart header and subheader
  	cartTickets -= quantity;
  	$(".frame-cart .items").text((cartTickets > 1 || cartTickets === 0) ? cartTickets + " items" : cartTickets + " item");
  	$(".subheader .cart-link").text(cartTickets);
  	// send user back to ISM if cart is empty
  	if (cartTickets === 0) {
  		$(".subheader .cart-link").text("").addClass("empty");
  		history.back();
  	}
		ids = $el.attr("class").replace("cart-item ","#").replace(" ",",#");
		$(ids).each(function() { $(this).svgRemoveClass("seat-carted"); }).attr("id","");
  	setTimeout(function() {
	  	// remove ticket data from cart
  		$(ids.replace("#",".")).remove();
	  	// change values in cart
	  	cartSubTotal -= price;
			cartTaxes = cartSubTotal * taxRate;
			cartTotal = cartSubTotal + cartFee + cartTaxes;
	  	$(".cart .total").text("$"+cartTotal.toFixed(2));
	  	$(".cart .total-taxes").text("$"+cartTaxes.toFixed(2));
  	
	  	$el.remove();
	  },1000);
  }

  function cartTimer() {
  	var cartMinute = parseInt(cartTime.split(":")[0]),
  			cartSecond = parseInt(cartTime.split(":")[1]),
  			$cartTimer = $(".frame-cart .timer b");
  	$cartTimer.text(cartTime);
  	if (cartSecond == 0) {
  		cartMinute--;
  		cartSecond = 59;
  	} else {
  		cartSecond--;
  	}
  	cartTime = ((cartMinute <= 9) ? "0" + cartMinute : cartMinute) + ":" + ((cartSecond <= 9) ? "0" + cartSecond : cartSecond);
  	if (cartTime != "00:00") { setTimeout(cartTimer,1000); }
  	else { $cartTimer.text(cartTime); }
  }

  // on window resize
	$(window).on("resize",function() {
		windowWt = $(".frame-ba").width();
		windowHt = $(".frame-ba").height();
		portrait = (windowWt < windowHt);
		if (iPad && !portrait) { windowHt = 672 - subhdrHt - barHt; }
		$map.smoothZoom('resize', {width: windowWt, height: windowHt});
		$(".details-list").css({
			"margin-left": (windowWt - detailWt - 10) / 2,
			"margin-right": (windowWt - detailWt - 10) / 2
		});
	}).on("orientationchange",function() {
    if (portrait) { $("html").addClass("portrait"); }
    else { $("html").removeClass("portrait"); }
	}).hashchange(function() {
		var hash = location.hash;
		if (hash == "#cart") {
			if (!cartViewed) { cartViewed = 1; cartTimer(); }
			$(".frame-ba").hide();
			$(".frame-cart").show();
			$(".more-info").removeClass("on");
		} else {
			$(".frame-ba").show();
			$(".frame-cart").hide();
		}
	}).bind("touchstart",function(e) {
		if (e.originalEvent.touches.length > 1) { pinching = 1; }
	});

	// sort avail by price
  function sortLowHighPrice(a,b){ return parseInt($(a).data("price")) - parseInt($(b).data("price")); }
	// sort avail by distance
  function sortLowHighDist(a,b){ return parseInt($(a).data("distance")) - parseInt($(b).data("distance")); }
	// sort avail by distance
  function sortLowHighSeat(a,b){ return parseInt($(a).data("seat")) - parseInt($(b).data("seat")); }

	// expand array for min and max
	Array.max = function(array) {
		return Math.max.apply(Math,array);
	};
	Array.min = function(array) {
		return Math.min.apply(Math,array);
	};


	function createSeatImage(section,row,seat,cx,cy,items) {
		if ($(".seat-selected",$captureMap).length >= 1) { $(".seat-selected",$captureMap).each(function() { $(this).svgRemoveClass("seat-selected"); }); }
		for (i=0;i<items;i++) {
			$(".seat[data-section='"+section+"'][data-row='"+row+"'][data-seat='"+(seat+i)+"']",$captureMap).svgAddClass("seat-selected");
		}
		var cropLeft = cx - (mapWt * captureScale / 2),
				cropTop = cy - (mapHt * captureScale / 2);
		document.getElementById("svg-capture-map").setAttribute("viewBox",cropLeft+" "+cropTop+" "+mapWt*captureScale+" "+mapHt*captureScale);
		document.getElementById("svg-grad").setAttribute("cx",cx);
		document.getElementById("svg-grad").setAttribute("cy",cy);
		var doctype = '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
				thisSVG = doctype + $captureMap.html(),
				thisSrc = "data:image/svg+xml;base64," + window.btoa(unescape(encodeURIComponent(thisSVG)));
		$(".details-item .seat-level-view").attr("src",thisSrc);
		$(".details-item").find(".img-list li:last-of-type img").attr("src",$(".details-item .seat-level-view").attr("src"));
	}


	// ------------------------------------------------------------------------------------
	// svg functions
	$.fn.svgHasClass = function(className) {
		var selector = this,
				hasClass = $(selector).attr("class").indexOf(className) > -1;
				return hasClass;
  };

  $.fn.svgAddClass = function(className) {
		var selector = this,
				hasClass = $(selector).svgHasClass(className),//attr("class").indexOf(className) > -1,
				updatedClasses = $(selector).attr("class") + " " + className;
		if ( !hasClass ) { $(selector).attr("class", updatedClasses); }
  };

  $.fn.svgRemoveClass = function(className) {
		var selector = this,
				hasClass = $(selector).svgHasClass(className),//.attr("class").indexOf(className) > -1,
				updatedClasses = $(selector).attr("class").replace(className, "").replace("  ", " "); // the second "replace" is to prevent space buildup
		if ( hasClass ) { $(selector).attr("class", updatedClasses); }
  };

  $.fn.svgToggleClass = function(className) {
		var selector = this,
				hasClass = $(selector).attr("class").indexOf(className) > -1;
		if ( hasClass ) { $(selector).svgRemoveClass( className ); }
		else { $(selector).svgAddClass( className ); }
  };

  $.fn.showInline = function() {
  	var selector = this;
  	$(selector).css("display","inline-block");
  };

});