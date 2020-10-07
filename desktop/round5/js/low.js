$(function() {

	if (window.location.href.indexOf("#") != -1) {
		window.location.href = window.location.href.split("#")[0];
	}

  var maxZoom = 200,
      showSeats = 30,
      bubbles = 12,
      minZoom;

  var $zoomInButton = $(".zoom-in"),
      $zoomOutButton = $(".zoom-out"),
      $legend = $(".legend"),
      $bag = $(".bag");

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
	    zoomRatio,
	    lastX,
	    lastY;

	var $map = $("#map"),
			$zoomContainer = $("#zoom-container"),
			$landmarks = $(".zoom-container .landmarks"),
			$svgMap,
			$svgSeats,
			$seatAvail,
			$sectionAvail,
			$miniMap = $("#mini"),
			$beacon = $("#mini .beacon"),
			$slider = $("#slider"),
			$captureMap = $("#capture-map"),
			mapLoaded = 0,
			focusing = 0,
			zooming = 0,
			minidragging = 0,
			panning = 0,
			seatLevel = 0,
			bubblesOn = 0,
			cartViewed = 0,
			seatsToggled = 0,
			pinching = 0;

	var filtersWt = $(".filters").width(),
			topPicksHt,
			windowWt = $(window).width(),
			windowHt = $(window).height(),
			subhdrHt = $(".subheader").height(),
			mapWt = 10240,
			mapHt = 7680,
			beaconMid = $beacon.outerWidth() / 2,
			miniRatio = $miniMap.width() / mapWt;

	var captureWt = $captureMap.width(),
			captureHt = $captureMap.height(),
			captureScale = 0.50,
			captureStyle = '<defs><style type="text/css">\n.svg-sect{fill:#fff; stroke:#ddd;}\n.seat{fill:#ddd;}\n.seat-selected{fill:#414141;}\n.seat-icon-resale{fill:#fff;}\n.stage{fill:#414141;}\n</style></defs>',
			seatImageWt = mapWt * captureScale,
			seatImageHt = mapHt * captureScale;

	var bagItems = 0,
			bagId = 0,
			bagPrice = "0.00",
			cartTime = "08:00";

	var $quantity = $(".filter-quantity .quantity"),
			qty = parseInt($quantity.val());

	var iPad = 0,
			iPhone = 0,
			portrait = (windowWt < windowHt);

	var clickTimer,
			hoverTimer,
			picksTotal;

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
	windowHt = (iPad && !portrait) ? 672 : $(window).height();

	// toggle filter and bag panels
	$(".filters .hdr, .bag .hdr").bind("click",function() {
		$(this).parent().toggleClass("collapsed")
			.toggleClass("expanded")
			.next().slideToggle(200,"swing");
	});

	// change quantity
	$(".filter-quantity button:not('.disable')").bind("click",function() {
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
		applyFilters();
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
    	applyFilters();
    }
  });
  $(".filter-price .price-min").on("change",function() {
    if ($(this).val() <= pricemin) { $slider.slider("values",0,pricemin); $(this).val(pricemin); }
    else if ($(this).val() >= pricemax) { $slider.slider("values",0,pricemax); $(this).val(pricemax); }
    else { $slider.slider("values",0,$(this).val()); }
    userpricemin = parseInt($slider.slider("values",0));
    applyFilters();
  });
  $(".filter-price .price-max").on("change",function() {
    if ($(this).val() >= pricemax) { $slider.slider("values",1,pricemax); $(this).val(pricemax+"+"); }
    else if ($(this).val() <= pricemin) { $slider.slider("values",1,pricemin); $(this).val(pricemin); }
    else { $slider.slider("values",1,$(this).val()); }
    userpricemax = parseInt($slider.slider("values",1));
    applyFilters();
  });

  // checkboxes
  $(".filters input[type='checkbox']:not('.locked, .disabled') + label").bind("click",function() {
    $(this).prev().toggleClass("checked");
  }).prev().bind("change",function() {
    applyFilters();
  });
  $(".filters input[type='checkbox']").prop("checked",false);
  $(".filters input[type='checkbox'].checked").prop("checked",true);

  // set/change filters text
  function filtersText() {
  	$(".filters-additional").each(function() {
  		var text,
  				legend = $("legend",this).text();
	  	$("input[type='checkbox']:checked + label",this).each(function() {
	  		if (!!text) { text += ", "; }
	  		else { text = "";}
	  		text += $(this).text();
	  	});
	  	if (!text) { text = "None"; }
	  	$(".filters-main legend:contains('"+legend+"')").next().html("<span>"+text);
  	});
  }
  filtersText();

	// toggle additional filters
	$(".filters .additional").bind("click",function() {
		var thisFilter = $(this).prev().text().toLowerCase().replace(" ","-");
		$(".filters .container").toggleClass("more");
		if (!$(".filters .container").hasClass("more")) {
			setTimeout(function(){$(".filters-"+thisFilter).toggle();},200);
		  filtersText();
		} else {
			$(".filters-"+thisFilter).toggle();
		}
	});

	// reset filters
	$(".filters .reset").bind("click",function(e) {
		e.preventDefault();
		$(".filters").get(0).reset();
		// quantity
		qty = parseInt($quantity.val());
		if (qty > 1 && qty < 8) { $(".filter-quantity button").removeClass("disable"); }
		// price
		$(".filter-price .price-min").val(pricemin).trigger("change");
		$(".filter-price .price-max").val(pricemax).trigger("change");
		// checkboxes
		$(".filters input[type='checkbox']").each(function() {
			$(this).attr("checked",$(this).defaultChecked);
		});
	  $(".filters input[type='checkbox']:checked").addClass("checked");
	  $(".filters input[type='checkbox']:not(:checked)").removeClass("checked");
	  filtersText();
	});

	// filters more info hovers
	$(".filters-offers .has-lock label").mouseenter(function() {
		var $filter = $(this);
		if ($filter.is(":contains('Meet')")) { $(".offers-tooltip p").text('The Maroon 5 Meet & Greet Package includes: One reserved ticket in the front row, Individual Photo Op with the band, Pre-show drinks and snacks in the Marron 5 Ballroom, Exclusive Maroon 5 gift bag, VIP laminate and commemorative ticket, Crowd-free merchandise shopping, On-site VIP host and Parking (where available).'); }
		else if ($filter.is(":contains('Ballroom')")) { $(".offers-tooltip p").text('Maroon 5 Ballroom Package includes: One reserved ticket in rows 2 through 20 on the floor, Pre-show drinks and snacks in the Maroon 5 Ballroom, Exclusive Maroon 5 gift bag, VIP laminate and commemorative ticket, Crowd-free merchandise shopping, On-site VIP host.'); }
		else if ($filter.is(":contains('Fan')")) { $(".offers-tooltip p").text('Maroon 5 Fan Package includes: One reserved ticket in rows 21 through 29 on the floor, Exclusive Maroon 5 gift bag, VIP commemorative ticket and an On-site VIP host.'); }
		$(".offers-tooltip").show().position({
			my: "left+20 center",
			at: "right center",
			of: $filter,
			collision: "none"
		});
	}).mouseleave(function() {
		$(".offers-tooltip").hide();
	});

	// toggle top picks
	$(".top-picks .hdr").bind("click",function() {
		$(this).parent().toggleClass("collapsed")
			.toggleClass("expanded")
			.next().slideToggle(200,"swing",function() {
				if ($(this).prev().hasClass("expanded")) { addScrollToPicks(); }
				else { topPicksHt = $(".top-picks").innerHeight(); }
				$map.smoothZoom('resize', {width: windowWt, height: (windowHt - topPicksHt - subhdrHt)});
			});
	});

	// toggle misc buttons
	$(".misc button").bind("click",function() {
		if ($(this).hasClass("bubbles") && $(".covers-on").length) { toggleBubbles(); $(this).toggleClass("on"); }
		if ($(this).hasClass("info")) { $(this).toggleClass("on"); }
	});

	// close details
	$(".details .close, .overlay").bind("click",function() {
  	$(".overlay, .details").hide();
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
		});

	function onParseDataComplete(data) {
		$map.prepend(data);
		$svgMap = $("#svg-map");
		$svgSeats = $("#svg-seats");
		$seatAvail = $(".seat-avail");
		$sectionAvail = $(".svg-sect-avail");
		addTopPicks();
		addSmoothZoom();
	}

	// smoothZoom
	function addSmoothZoom(){
		// smooth zoom initiation
		$map.smoothZoom({
			width: windowWt,
			height: windowHt - topPicksHt - subhdrHt,
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
		toggleSeats();
		changeBubbles();
		panMapControls();
		if (!zooming && !minidragging && !pinching) { moveBeacon(); }
	}

	function onPanComplete(zoomData) {
		zoomInfo(zoomData);
		// first load of smoothZoom
		if (!mapLoaded) {
			mapLoaded = 1;
			minZoom = zoomRatio;
			panMapControls();
			addSectionClicks();
			addSeatHovers();
			addSeatClicks();
	  	addPicksPins();
			addSectionBubbles();
			applyToMap();
			$(".frame > .polling").hide();
			$(".frame > .polling-text").hide().text("Updating map...");
		}
		if (focusing) {
			focusing = 0;
		}
		if (zooming) {
			moveBeacon();
			zooming = 0;
		}
		if (pinching) {
			pinching = 0;
		}
		// hide top picks on first zoom to seat level
		if (!seatLevel && zoomRatio >= showSeats && $(".top-picks .toggle").hasClass("expanded")) { seatLevel = 1; setTimeout(function() { $(".top-picks .hdr").trigger("click"); },100); }
		// recenter beacon on full zoom out
		if (scaledX <= 0 && scaledY <= 0) { moveBeacon(); }
		panning = 0;
		lastX = centerX;
		lastY = centerY;
	}

  function panMapControls(){
    if (zoomRatio == maxZoom) {
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

  function toggleSeats() {
		if (zoomRatio >= showSeats && !seatsToggled) {
			seatsToggled = 1;
			$svgMap.svgRemoveClass("covers-on");
			toggleLegend(1);
			$miniMap.show();
			if ($(".misc .bubbles").hasClass("on")) { $(".misc .bubbles, .bubble").removeClass("on"); }
			if (bagItems > 0) { $(".selected").removeClass("on"); }
		} else if (zoomRatio < showSeats && seatsToggled) {
			seatsToggled = 0;
			$svgMap.svgAddClass("covers-on");
			toggleLegend(0);
			$miniMap.hide();
			if (!$(".misc .bubbles").hasClass("on") && bubblesOn) { $(".misc .bubbles, .bubble").addClass("on"); }
			if (bagItems > 0) { $(".selected").addClass("on"); }
		}
		if (lastX != centerX && lastY != centerY) { $(".more-info, .section-info").removeClass("on"); }
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
		if (zoomRatio >= bubbles && zoomRatio < showSeats) {
			$(".bubble .price.lowest").hide();
			$(".bubble .price.range").show();
		} else if (zoomRatio < showSeats) {
			$(".bubble .price.lowest").show();
			$(".bubble .price.range").hide();
		}
  }

  function moveBeacon() {
  	$beacon.css({
  		"left": centerX * miniRatio - beaconMid,
  		"top": centerY * miniRatio - beaconMid
  	});
  }

  $miniMap.click(function(e) {
  	var zoomX = e.offsetX / miniRatio,
  			zoomY = e.offsetY / miniRatio;
		$map.smoothZoom("focusTo",{
			x: zoomX,
			y: zoomY
		});
  });

  $beacon.draggable({
  	containment: "parent",
  	drag: function(e) {
  		minidragging = 1;
  		var zoomX = ($(this).position().left + beaconMid) / miniRatio,
  				zoomY = ($(this).position().top + beaconMid) / miniRatio;
  		$map.smoothZoom("focusTo",{
				x: zoomX,
				y: zoomY
			});
  	},
  	stop: function(e) {
  		minidragging = 0;
  	}
  });

  $zoomInButton.on("vmousedown",function() { zooming = 1; $map.smoothZoom('zoomIn'); });
  $zoomOutButton.on("vmousedown",function() { zooming = 1; $map.smoothZoom('zoomOut'); });

  // use + and - keys to zoom
  $(window).keydown(function(e) {
  	if (e.which == 107 && !zooming) { zooming = 1; $map.smoothZoom('focusTo',{x:centerX, y:centerY, zoom:(zoomRatio * 2), speed:20}); }
  	if (e.which == 109 && !zooming) { zooming = 1; $map.smoothZoom('focusTo',{x:centerX, y:centerY, zoom:(zoomRatio / 2), speed:20}); }
  });

	function applyFilters() {
		togglePolling(1);
		setTimeout(applyToMap,10);
		setTimeout(togglePolling,10);
	}

	function togglePolling(show) {
		if (show) {
			$zoomContainer.addClass("loading");
			$(".frame > .polling, .frame > .polling-text").show();
			$(".top-list").addClass("hide");
			$(".top-picks .polling").show();
			$(".top-picks .jspHorizontalBar").hide();
		} else {
			$zoomContainer.removeClass("loading");
			$(".frame > .polling, .frame > .polling-text").hide();
			$(".top-picks .polling").hide();
			$(".top-list").removeClass("hide");
		}
	}

	function applyToMap() {
		var availSections = [];
		for (i=0;i<$seatAvail.length;i++) {
			var $thisSeat = $seatAvail.eq(i),
					row = $thisSeat.data("row") + "",
					section = $thisSeat.data("section") + "",
					type = ($thisSeat.svgHasClass("seat-standard")) ? ".seat-standard" : ".seat-resale",
					price = parseFloat($thisSeat.data("price")),
					label = $thisSeat.data("label"),
					$siblings = (type == ".seat-standard") ? $thisSeat.nextUntil(".seat:not('.seat-standard')",".seat-avail[data-section='"+section+"'][data-row='"+row+"']").addBack() : $thisSeat.nextUntil(".seat:not('.seat-resale')",".seat-avail[data-price='"+price+"']").addBack(),
					isTopPick = 0;
			var include = ($("label:contains('Standard')").prev().is(":checked") && type == ".seat-standard" && !$("label:contains('"+label+"')").length);
			if (!include) { include = ($("label:contains('Resale Seats')").prev().is(":checked") && type == ".seat-resale"); }
			if (!include)	{ include = (!!$("label:contains('"+label+"')").prev().is(":checked")); }
			i += $siblings.length - 1;
			if ($siblings.length >= qty && price >= userpricemin && price <= userpricemax && include) {
				$siblings.each(function() {
					$(this).svgRemoveClass("outside");
					if (!isTopPick && qty <= 4 && !!label) { isTopPick = $(this).svgHasClass("top-pick"); }
				});
				if (availSections.indexOf(section) == -1) { availSections.push(section); }
				if (isTopPick) {
					$(".top-item[data-label='"+label+"']").addClass("on");
					$(".pin-top-pick[data-label='"+label+"']").addClass("on");
					$(".top-pick[data-label='"+label+"']").filter(":first").svgAddClass("on");
					$(".top-pick-row[data-label='"+label+"']").show();
				}
			} else {
				$siblings.each(function() {
					$(this).svgAddClass("outside");
					if (!isTopPick && qty <= 4 && !!label) { isTopPick = $(this).svgHasClass("top-pick"); }
				});
				if (isTopPick) {
					$(".top-item[data-label='"+label+"']").removeClass("on");
					$(".pin-top-pick[data-label='"+label+"']").removeClass("on");
					$(".top-pick[data-label='"+label+"']").filter(":first").svgRemoveClass("on");
					$(".top-pick-row[data-label='"+label+"']").hide();
				}
			}
		}
		for (i=0;i<$sectionAvail.length;i++) {
			var section = $sectionAvail.eq(i).attr("id").replace("s-","");
			if (availSections.indexOf(section) == -1) { $sectionAvail.eq(i).svgAddClass("outside"); }
			else { $sectionAvail.eq(i).svgRemoveClass("outside"); }
		}
  	if (qty > 4) {
			if ($(".top-picks .toggle").hasClass("expanded")) { $(".top-picks .hdr").trigger("click"); }
			$(".pin-top-pick").removeClass("on");
			$("#top-pick-rows").hide();
  	} else {
			$("#top-pick-rows").show();
			$(".top-item .seats").text(qty+" seat"+((qty === 1) ? "" : "s"));
			addScrollToPicks();
		}
	}

  function addTopPicks() {
		var lowestPrice,
				place,
				$topPicks = $(".top-pick.on").sort(sortLowHighPrice),
				topPicksStr = "",
 			 	allPrices = [];
 		$topPicks.each(function() {
	  	topPicksStr += '<li class="top-item on" data-label="'+$(this).data("label")+'"><img src="../../mobile/img/seatview/'+$(this).data("section")+'_SeatViews_640x427.jpg" class="vfs" /><p class="info"><span class="title">'+$(this).data("label")+'</span>'+(($(this).svgHasClass("seat-resale")) ? '&bull;<span class="label-resale">Resale</span>' : '')+'<br /><span class="section">'+$(this).data("section-name")+'</span>, Row <span class="row">'+$(this).data("row")+'</span>, <span class="seats">'+qty+' seat'+((qty === 1) ? '' : 's')+'</span><br /><b class="price">$'+$(this).data("price")+' ea</b></p><button type="button" class="fullsize"></button><a href="#cart" class="add">Add to Cart</a></li>';
 		});
	  $(".top-list").append(topPicksStr);

  	// interaction with map pins
		if (!iPad) {
	  	$(".top-item").hover(function() {
	  		var label = $(this).data("label"),
	  				$pin = $(".pin-top-pick[data-label='"+label+"'] .pin"),
	  				$hover = $(".hover-top-pick[data-label='"+label+"']");
	  		if (zoomRatio < showSeats) {
		  		$pin.toggleClass("hover");
		  		$hover.toggleClass("on");
		  	}
	  	});
  	}

  	// display details on click
  	$(".top-item .fullsize").bind("click",function() {
  		var label = $(this).parent().data("label"),
  				$el = $(".top-pick[data-label='"+label+"']").filter(":first");
  		displayDetails($el,1,1,0);
  	});

		// fancy scrollbar for top picks
  	addScrollToPicks();
  }

	function addScrollToPicks() {
		var picksWt = $(".top-item").width();
		picksTotal = $(".top-item.on").length;
		$(".top-list").css("width",(picksWt * picksTotal) + picksTotal + "px");
		if (!$(".no-touch .top-picks .jspContainer").length) { $(".no-touch .top-picks .container").jScrollPane(); }
		else { $(".no-touch .top-picks .container").data("jsp").reinitialise(); }
		$(".no-touch .top-picks .jspDrag").css("width",$(".top-picks .jspDrag").width() - 20);
		topPicksHt = $(".top-picks").innerHeight();
	}

	function addPicksPins() {
  	var pinsStr = "",
  			hoverDataStr = "",
  			clickDataStr = "",
  			allY = [],
  			highestY,
  			place,
				pinsArray = [];
  	$(".top-pick-row").each(function() {
  		var thisID = $(this).attr("id"),
  				bbox = document.getElementById(thisID).getBBox(),
  				bboxRatio = bbox.width / bbox.height;
  				bboxX = (bboxRatio > 1 || bbox.width > 50) ? bbox.x + bbox.width / 2 : bbox.x,
  				bboxY = (bboxRatio < 1 || bbox.height > 50) ? bbox.y+ bbox.height / 2 : bbox.y,
  				label = $(this).data("label"),
  				$topItem = $(".top-item[data-label='"+label+"']"),
  				price = $(".price",$topItem).text().replace(" ea","");
  		if (bboxRatio < 1) { bboxX += 40; }
  		allY.push(bboxY);
  		pinsArray.push('<div class="item mark pin-top-pick" data-label="'+label+'" data-position="'+bboxX+','+bboxY+'" data-show-at-zoom="0" data-allow-scale="false"><div><img src="img/icon-top-pick.png" class="pin" /></div></div>');
  		hoverDataStr += '<div class="item mark hover-top-pick" data-label="'+label+'" data-position="'+bboxX+','+bboxY+'" data-show-at-zoom="0" data-allow-scale="false"><div><div class="panel"><p class="title">'+label+'</p><p class="price">'+price+'<span class="ea">ea</span></p><b class="caret up"></b></div></div></div>';
  	});
		for (i=0;i<pinsArray.length;i++) {
	  	highestY = Array.min(allY);
	  	place = allY.indexOf(highestY);
	  	allY[place] = Array.max(allY) + 1;
	  	pinsStr += pinsArray[place];
	  }
		$landmarks.prepend(hoverDataStr).prepend(pinsStr);
  	$map.smoothZoom("refreshAllLandmarks");
  	/*var i = 0,
  			timing = 50;
  	var pinsInterval = setInterval(function() {
  		$(".pin-top-pick").eq(i).toggleClass("on");
  		i++;
  		if ($(".pin-top-pick").length === i) { clearInterval(pinsInterval); }
  	},timing);*/
  	// display click-top-pick on click at section level, hover at seat level
  	$(".pin-top-pick").bind("click tap",function() {
			if (zoomRatio < showSeats || iPad) { displayInfo($(this),0,"pin"); }
  	}).bind("mouseenter",function() {
			if (zoomRatio >= showSeats) { displayInfo($(this),1,"pin"); }
  	});
	}

	function displayInfo($el,hover,type) {
		var label = $el.data("label"),
				$click = $(".more-info"),
				pin = (type == "pin");
  	if (pin) { $el = $(".top-pick[data-label='"+label+"']"); }
  	// set image
  	$(".vfs",$click).attr("src","../../mobile/img/seatview/"+$el.data("section")+"_SeatViews_640x427.jpg");
  	// set label if it has one
  	(!!$el.data("label")) ? $click.attr("data-label",$el.data("label")) : $click.attr("data-label","");
  	(!!$el.data("label")) ? $(".title",$click).text($el.data("label")).show() : $(".title",$click).hide();
  	// show resale label if resale
  	($el.svgHasClass("seat-resale")) ? $(".label-resale",$click).show() : $(".label-resale",$click).hide();
  	// show bullet if has label and resale
  	(!!$el.data("label") && $el.svgHasClass("seat-resale")) ? $(".bullet",$click).show() : $(".bullet",$click).hide();
  	// set section name
  	$(".section",$click).text($el.data("section-name"));
  	// set row number
  	$(".row",$click).text("Row "+$el.data("row"));
  	// set seat number or quantity
  	(pin) ? $(".seat",$click).text(qty+" seat"+((qty === 1) ? "" : "s")) : $(".seat",$click).text("Seat "+$el.data("seat"));
  	// set distance
  	$(".dist",$click).text($el.data("distance")+" ft from stage");
  	// set price
  	$(".price",$click).html("$"+$el.data("price")+"<span class='ea'>ea</span>");
  	// set add button text
  	(pin) ? $(".add",$click).removeClass("select").text("Add to Cart") : $(".add",$click).addClass("select").text("Select Seat");
  	// place info panel
  	if (pin) { $el = $(".pin-top-pick[data-label='"+label+"'] .pin"); }
  	var elTop = $el.offset().top - subhdrHt,
  			elLeft = $el.offset().left,
  			elHt = (pin) ? $el.height() : parseInt($el.attr("r")) * 2 * zoomRatio / 100,
  			elWt = (pin) ? $el.width() : parseInt($el.attr("r")) * 2 * zoomRatio / 100,
  			clickWt = $click.width(),
  			containerHt = windowHt - topPicksHt - subhdrHt;
  	if (elTop < containerHt / 2) {
  		// place info below pin/seat
  		$click.removeClass("above").css({"top":elTop + elHt + 9 + "px","left":elLeft + elWt / 2 - clickWt / 2 + "px","bottom":""});
  		$(".caret",$click).addClass("up").removeClass("down");
  	} else {
  		// place info above pin/seat
  		$click.addClass("above").css({"bottom":topPicksHt + containerHt - elTop + 9 - ((iPad && !portrait) ? 0 : 0) + "px","left":elLeft + elWt / 2 - clickWt / 2 + "px","top":""});
  		$(".caret",$click).removeClass("up").addClass("down");
  	}
  	// hide show info panel
		clearTimeout(clickTimer);
		clearTimeout(hoverTimer);
  	$click.unbind("mouseenter mouseleave")
  		.addClass("on")
  		.mouseenter(function() { clearTimeout(clickTimer); clearTimeout(hoverTimer); });
  	$el.unbind("mouseleave");
  	if (hover) { 
  		$el.mouseleave(function() { hoverTimer = setTimeout(function() { $click.removeClass("on"); },100); });
  		$click.mouseleave(function() { $click.removeClass("on"); });
  	} else if (!iPad) {
	  	clickTimer = setTimeout(function() { $click.removeClass("on"); },2000);
	  	$click.mouseleave(function() { clickTimer = setTimeout(function() { $click.removeClass("on"); },2000); });
  	}
  	$(".add:contains('Add to Cart')",$click).unbind().bind("click",function(e) {
	  	addToCart(0,label);
  	});
  	$(".add:contains('Select Seat')",$click).unbind().bind("click",function(e) {
  		e.preventDefault();
  		$el.trigger("click");
  		$click.removeClass("on");
  	});
  	$(".details-link",$click).unbind().bind("click",function(e) {
  		e.preventDefault();
  		if (pin) { $el = $(".top-pick[data-label='"+label+"']"); }
  		displayDetails($el,!!$el.data("label"),pin,0);
  	});
  }

  function displayDetails($el,topPick,pin,inbag) {
  	var items = (pin) ? $(".top-item.on").length : 1,
  			label = (pin) ? $el.data("label") : "",
		  	current = (pin) ? $(".top-item.on").index($(".top-item.on[data-label='"+label+"']")) : 0,
	  		detailsStr = "",
  			detailsPag = "",
  			pinLabels = [];
  	if (pin) {
  		$el = $(".top-pick.on").sort(sortLowHighPrice);
  	}
  	for (i=0;i<items;i++) {
	  	var thisID = $el.eq(i).attr("id"),
	  			section = $el.eq(i).data("section"),
	  			sectionName = $el.eq(i).data("section-name"),
	  			row = $el.eq(i).data("row"),
	  			seat = (pin) ? qty : $el.eq(i).data("seat"),
	  			distance = $el.eq(i).data("distance"),
	  			price = parseFloat($el.eq(i).data("price")).toFixed(2),
	  			total = (pin) ? (parseFloat(price) * qty).toFixed(2) : price,
	  			label = (topPick) ? $el.eq(i).data("label") : "",
	  			resale = $el.eq(i).svgHasClass("seat-resale");
			pinLabels.push(label);
	  	detailsStr += '<li class="details-item'+((i === current) ? ' current' : '')+'"'+((pin) ? 'data-label="'+label+'"' : '')+'><div class="images"><img src="../../mobile/img/seatview/'+section+'_SeatViews_640x427.jpg" class="main-img" /><ul class="img-list"><li class="current"><img src="../../mobile/img/seatview/'+section+'_SeatViews_640x427.jpg" /></li><li><!--<b class="polling"></b>--><img src="" /></li></ul></div><div class="desc"><div><p class="info">'+((topPick) ? '<span class="title">'+label+'<br /></span>' : '')+((resale) ? '<span class="label-resale">Resale<br /></span>' : '')+'<span class="section">'+sectionName+'</span><br /><span class="row-seat"><span class="row">Row '+row+'</span>, <span class="seat">'+((pin) ? seat+' seats in this row' : 'Seat '+seat)+'</span></span><br />'+((pin) ? '<span class="add-note">Add to cart to see seats<br /></span>' : '')+'<span class="hdr">Details</span><span class="dist">&bull; About '+distance+' ft from stage</span></p><p class="price">'+((pin) ? '<span class="each">$'+price+' x '+qty+'<br /></span>' : '')+'<span class="total">$'+total+'</span></p></div><div class="mobile">Available for <span>FREE</span> mobile delivery!</div>'+((pin) ? '<a href="#cart" class="add">Add to Cart</a>' : '<a href="#" class="add select">Select Seat</a>')+'</div><canvas><canvas></li>';
	  	detailsPag += '<li'+((i === current) ? ' class="current"' : '')+'></li>';
  	}
  	$(".details-list").empty().append(detailsStr);
  	$miniMap.clone().attr("id","").appendTo(".details-item .images").show().find(".mini-map").attr("id","");
  	for (i=0;i<items;i++) {
  		var seatPos = (pin) ? $(".pin-top-pick[data-label='"+pinLabels[i]+"']").data("position").split(",") : "",
  				cx = (pin) ? parseInt(seatPos[0]) : parseInt($el.eq(i).attr("cx")),
  				cy = (pin) ? parseInt(seatPos[1]) : parseInt($el.eq(i).attr("cy")),
	  			section = $el.eq(i).data("section"),
	  			row = $el.eq(i).data("row"),
	  			seat = $el.eq(i).data("seat");
	  	$(".details-item .beacon").eq(i).css({
	  		"left": cx * miniRatio - beaconMid,
	  		"top": cy * miniRatio - beaconMid
	  	});
	  	createSeatImage(section,row,seat,cx,cy,i,pin);
  	}
  	if (inbag) { $(".details-item .add").remove(); }
  	var detailWt = $(".details-item.current").innerWidth(),
  			listLeft = (windowWt - detailWt + 36) / 2 - current * (detailWt - 36);
  	$(".details-list").css({
  		"width": (detailWt - 36) * items,
  		"left": listLeft
  	});
  	(items > 1) ? $(".details .pagination").empty().append(detailsPag).parent().show() : $(".details .pagination-container").hide();
  	$(".overlay").show();
  	var detailsTop = (windowHt < $(".details").height()) ? 10 : (windowHt - $(".details").height()) / 2;
  	$(".details").css("top",detailsTop).show();
  	$(".details-item").bind("click",function() {
  		if (!$(this).hasClass("current")) {
				$(this).addClass("current");
  			if ($(this).prev().hasClass("current")) { // next
  				listLeft -= (detailWt - 36);
  				$(".details-list").css("left",listLeft);
  				$(this).prev().removeClass("current");
  				current++;
  			} else if ($(this).next().hasClass("current")) { // prev
  				listLeft += (detailWt - 36);
  				$(".details-list").css("left",listLeft);
  				$(this).next().removeClass("current");
  				current--;
  			}
  			$(".details .pagination li").removeClass("current");
				$(".details .pagination li").eq(current).addClass("current");
  		}
  	});
  	$(".details .pagination li").unbind().bind("click",function() {
  		var thisIndex = $(this).index(),
  				diff = Math.abs(thisIndex - current);
			listLeft = (thisIndex > current) ? listLeft - (detailWt - 36) * diff : listLeft + (detailWt - 36) * diff;
			$(".details-item.current").removeClass("current");
			$(".details-item").eq(thisIndex).addClass("current");
			$(".details .pagination li").eq(current).removeClass("current");
			$(this).addClass("current");
			$(".details-list").css("left",listLeft);
			current = thisIndex;
  	});
  	$(".details .add.select").unbind().bind("click",function(e) {
  		e.preventDefault();
  		if ($(this).parents(".details-item").hasClass("current")) {
	  		(pin) ? $el.eq(current).trigger("click") : $el.trigger("click");
	  		$(".overlay").trigger("click");
	  	}
  	});
  	$(".details .img-list li").bind("click",function() {
  		if ($(this).parents(".details-item").hasClass("current")) {
	  		$(this).siblings(".current").removeClass("current");
	  		$(this).addClass("current");
	  		$(this).parent().prev().attr("src",$("img",this).attr("src"));
	  	}
  	});
  	if (items > 1 && iPad) {
		  $(".details-list").unbind().bind("swipeleft",function() {
		  	if (listLeft > (windowWt - detailWt + 36) / 2 - (items - 1) * (detailWt - 36)) {
					listLeft -= (detailWt - 36);
	  			$(".details-list").css("left",listLeft);
					$(".details-item.current").removeClass("current");
  				current++;
  				$(".details-item").eq(current).addClass("current");
	  			$(".details .pagination li").removeClass("current");
					$(".details .pagination li").eq(current).addClass("current");
	  		}
		  }).bind("swiperight",function() {
		  	if (listLeft < (windowWt - detailWt + 36) / 2) {
					listLeft += (detailWt - 36);
	  			$(".details-list").css("left",listLeft);
					$(".details-item.current").removeClass("current");
  				current--;
  				$(".details-item").eq(current).addClass("current");
	  			$(".details .pagination li").removeClass("current");
					$(".details .pagination li").eq(current).addClass("current");
	  		}
		  });
		  $.event.special.swipe.horizontalDistanceThreshold = 100;
  	}
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
  				sectionName = $(".seat-avail[data-section='"+section+"']").eq(0).data("section-name");
  		allY.push(zoomY);
  		$(".seat-avail[data-section='"+section+"']").each(function() {
  			allPrices.push($(this).data("price"));
  		});
  		lowestPrice = Array.min(allPrices);
  		highestPrice = Array.max(allPrices);
  		bubbleArray.push('<div class="item mark bubble" data-position="'+zoomX+','+(zoomY-100)+'" data-show-at-zoom="0" data-allow-scale="false"><div><div class="panel price lowest">$'+Math.floor(lowestPrice)+'+<b class="caret down"></b></div><div class="panel price range">$'+Math.floor(lowestPrice)+' - $'+Math.ceil(highestPrice)+'</div></div></div>');
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
		var $sectionHover = $(".section-info"),
				$click = $(".more-info");
		$("#"+thisID).mouseenter(function() {
			if (!panning && !focusing && $svgMap.svgHasClass("covers-on") && !$click.hasClass("on")) {
				var sectionHoverWt = $sectionHover.width(),
  					sectionLeft = $(this).offset().left + sectionWt * zoomRatio / 100 / 2 * 10,
						sectionTop = $(this).offset().top - subhdrHt + sectionHt * zoomRatio / 100 / 2 * 10,
		  			containerHt = windowHt - topPicksHt - subhdrHt;
		  	$(".vfs",$sectionHover).attr("src","../../mobile/img/seatview/"+thisID.replace("s-","")+"_SeatViews_640x427.jpg");
				$(".section",$sectionHover).text(sectionName);
				$(".price-range",$sectionHover).text("$"+Math.floor(lowestPrice)+" - $"+Math.ceil(highestPrice));
		  	if (sectionTop < containerHt / 2) {
		  		// place info below pin/seat
		  		$sectionHover.removeClass("above").css({"top":sectionTop + 9 + "px","left":sectionLeft - sectionHoverWt / 2 + "px","bottom":""});
		  		$(".caret",$sectionHover).addClass("up").removeClass("down");
		  	} else {
		  		// place info above pin/seat
		  		$sectionHover.addClass("above").css({"bottom":topPicksHt + containerHt - sectionTop + 9 + "px","left":sectionLeft - sectionHoverWt / 2 + "px","top":""});
		  		$(".caret",$sectionHover).removeClass("up").addClass("down");
		  	}
		  	$sectionHover.addClass("on");
			}
		}).mouseleave(function() {
			$sectionHover.removeClass("on");
		});
	}

  function addSectionClicks() {
	  $sectionAvail.bind("click tap",function() {
	  	if ($svgMap.svgHasClass("covers-on") && !panning) {
	  		// zoom into section clicked
	  		var thisID = $(this).attr("id"),
	  				bbox = document.getElementById(thisID).getBBox(),
	  				zoomX = bbox.x * 10 + bbox.width * 10 / 2,
	  				zoomY = bbox.y * 10 + bbox.height * 10 / 2;
	  		focusing = 1;
	  		$map.smoothZoom("focusTo",{
					x: zoomX,
					y: zoomY,
					zoom: showSeats + ((iPad) ? 50 : 20),
					speed: 10
				});
	  	}
	  });
	}

	function addSeatHovers() {
		$seatAvail.bind("mouseenter tap",function() {
			if (!$(this).svgHasClass("seat-selected") && !$(this).svgHasClass("seat-carted") && !panning && !focusing) { displayInfo($(this),1,"seat"); }
			if ($(this).svgHasClass("seat-selected") && iPad) { removeFromBag($(this)); }
		});
	}

  function addSeatClicks() {
  	$seatAvail.bind("click",function() {
  		if ($(this).svgHasClass("seat-selected")) {
	  		removeFromBag($(this));
	  	} else if (!$(this).svgHasClass("seat-carted")) {
	  		var cx = $(this).attr("cx"),
	  				cy = $(this).attr("cy"),
		  			check = document.createElementNS("http://www.w3.org/2000/svg","path");
		  	check.setAttribute("class","seat-icons seat-icon-check");
		  	check.setAttribute("d","M7.209-6.81C6.824-7.206,6.201-7.203,5.818-6.805l-8.445,8.817l-2.899-2.474C-5.928-0.804-6.516-0.85-6.969-0.532c-0.552,0.386-0.697,1.163-0.324,1.735l3.305,5.068c0.115,0.175,0.264,0.34,0.438,0.471C-2.735,7.358-1.594,7.172-1,6.328l0.075-0.107L7.311-5.487C7.593-5.887,7.56-6.45,7.209-6.81");
	  		check.setAttribute("transform","translate("+cx+","+cy+")");
	  		$(this).next(".seat-icon-resale").hide();
	  		$(this).after(check).svgAddClass("seat-selected");
	  		addToBag($(this));
	  		$(".more-info").removeClass("on");
	  	}
  	});
  }

  function addToBag($el) {
  	if (bagItems === 0) {
  		$bag.show();
  	}
  	bagItems++;
  	bagId++;
  	$el.attr("id","selected-"+bagId);
  	var section = $el.data("section-name"),
  			row = $el.data("row"),
  			seat = $el.data("seat"),
  			distance = $el.data("distance"),
  			resale = ($el.svgHasClass("seat-resale")) ? '<span class="label-resale">Resale</span><br />' : '',
  			price = parseFloat($el.data("price")).toFixed(2);
  	bagPrice = (parseFloat(bagPrice) + parseFloat(price)).toFixed(2);
  	$(".bag-list").append('<li class="bag-item" id="item-'+bagId+'" data-price="'+price+'"><p class="info">'+resale+'<span class="sec-row"><span class="section">'+section+'</span>, Row '+row+'</span><br /><span class="seat-dist"><span class="seat">Seat '+seat+'</span>&bull;<span class="dist">'+distance+' ft from stage</span></span><br /><a href="#" class="details-link">Details</a></p><p class="price">$'+price+'<br /><a href="#" class="remove">Remove</a></p></li>');
  	$(".bag-item:last .details-link").bind("click",function() {
  		displayDetails($el,0,0,1);
  	});
  	$(".bag .toggle .price").text("$" + bagPrice);
  	$(".bag .toggle .hdr").text(bagItems + " Selected Seat" + (bagItems === 1 ? "" : "s"));
		if (bagId === 1) {
			$(".bag .container").jScrollPane();
		} else {
			if ($(".bag .toggle").hasClass("collapsed")) {
				quickReinit();
				$(".bag .toggle .hdr").trigger("click");
			} else {
	  		$(".bag .jspContainer").css("height",$(".bag-list").height());
				$(".bag .container").data("jsp").reinitialise();
			}
  	}
		selectedPin($el,1);
  }

  function removeFromBag($el) {
  	bagItems--;
  	var itemId = $el.attr("id").replace("selected-","").replace("item-",""),
  			price = $el.data("price");
  	bagPrice = (parseFloat(bagPrice) - parseFloat(price)).toFixed(2);
  	// remove check
		$("#selected-"+itemId).svgRemoveClass("seat-selected");
		$("#selected-"+itemId).next().remove();
		$("#selected-"+itemId).next(".seat-icon-resale").show();
		// remove item from bag
  	$("#item-"+itemId).remove();
  	// adjust text in header of bag
  	$(".bag .toggle .price").text("$" + bagPrice);
  	$(".bag .toggle .hdr").text(bagItems + " Selected Seats");
		selectedPin($("#selected-"+itemId),0);
  	// hide bag if no items
  	if (bagItems === 0) {
  		if ($(".bag .toggle").hasClass("collapsed")) { $(".bag .toggle .hdr").trigger("click"); }
  		$bag.hide();
  		return;
  	}
		if ($(".bag .toggle").hasClass("collapsed")) {
			quickReinit();
		} else {
  		$(".bag .jspContainer").css("height",$(".bag-list").height());
			$(".bag .container").data("jsp").reinitialise();
		}
  }

  // quickly reinitialize bag jscroll if bag is collapsed
	function quickReinit() {
		$bagContainer = $(".bag .container");
		$bagContainer.show();
		$(".bag .jspContainer").css("height",$(".bag-list").height());
		$bagContainer.data("jsp").reinitialise();
		$bagContainer.hide();
	}

	// remove item from bag with in-bag remove link
  $(".bag").on("click",".remove",function(e) {
  	e.preventDefault();
  	removeFromBag($(this).parents(".bag-item"));
  });

  function selectedPin($el,add) {
  	// $el is seat object
  	var seatId = $el.attr("id"),
  			newClasses,
  			newX = cx = $el.attr("cx"),
  			newY = cy = $el.attr("cy"),
  			prox = 300,
  			total = 1;

  	if (add) {
  		// item has been added
  		newClasses = "item mark selected " + seatId;
  		for (i=0;i<$(".selected").length;i++) {
				var selectedX = parseFloat($(".selected").eq(i).data("position").split(",")[0]),
						selectedY = parseFloat($(".selected").eq(i).data("position").split(",")[1]);
				if (cx < selectedX + prox && cx > selectedX - prox && cy < selectedY + prox && cy > selectedY - prox) {
					total = parseInt($(".selected .total").eq(i).text()) + 1;
					newX = selectedX - (selectedX - cx) / total;
					newY = selectedY - (selectedY - cy) / total + 40;
					newClasses = $(".selected").eq(i).attr("class") + " " + seatId;
					$(".selected").eq(i).remove();
					break;
				}
			}
  	} else {
  		// item has been removed
  		total = parseInt($(".selected."+seatId+" .total").text()) - 1;
  		if (total !== 0) {
				var selectedX = parseFloat($(".selected."+seatId).data("position").split(",")[0]),
						selectedY = parseFloat($(".selected."+seatId).data("position").split(",")[1]);
				newX = selectedX + (selectedX - cx) / total;
				newY = selectedY + (selectedY - cy) / total + 40;
  			newClasses = $(".selected."+seatId).attr("class").replace(" "+seatId,"");
  		}
  		$(".selected."+seatId).remove();
  		if (total === 0) { return; }
  	}
		$landmarks.append('<div class="'+newClasses+'" data-position="'+newX+','+(newY-40)+'" data-show-at-zoom="0" data-allow-scale="false"><div><div class="panel dark"><p class="total">'+total+'</p><b class="caret down"></b></div></div></div>');
  	$map.smoothZoom("refreshAllLandmarks");
  }

  // add to cart buttons
  $(".top-list").on("click",".add:contains('Add to Cart')",function() {
  	addToCart(0,$(this).parent().data("label"));
  });
  $(".details").on("click",".add:contains('Add to Cart')",function() {
  	addToCart(0,$(this).parents(".details-item").data("label"));
		$(".overlay").trigger("click");
  });
  $(".bag").on("click",".add",function() {
  	addToCart(1,"");
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
			cartTickets = 0;

  function addToCart(bag,label) {
  	var cartItems = (bag) ? bagItems : ((qty > 4) ? 4 : qty),
  			$items = (bag) ? $(".seat-selected") : $(".top-pick[data-label='"+label+"']").slice(0,qty),
  			cartStr = "",
				cartSubStr = "",
				cartQtyStr = "";
  	cartTickets += cartItems;
  	// set number of items in cart header and subheader
  	$(".frame-cart .items").text((cartTickets > 1) ? cartTickets + " items" : cartTickets + " item");
  	$(".subheader .cart-link").text(cartTickets).removeClass("empty");
  	// build or add to cart list
		for (i=0;i<cartItems;i++) {
			var $item = $items.eq(i),
					classes = "cart-item",
					row = $item.data("row"),
					price = $item.data("price"),
					type = ($item.svgHasClass("seat-standard")) ? ".seat-standard" : ".seat-resale",
					$itemGroup = (bag) ? $item.nextUntil(".seat:not('.seat-selected')",type+"[data-row='"+row+"'][data-price='"+price+"']").addBack() : $items,
					//$itemGroup = (type == ".seat-standard") ? $item.nextUntil(".seat:not('.seat-selected')",".seat-standard[data-row='"+row+"']").addBack() : $item.nextUntil(".seat:not('.seat-selected')",".seat-resale[data-price='"+price+"']").addBack(),
					quantity = $itemGroup.length,
					groupTotal = parseFloat($item.data("price")) * quantity;
			for (j=0;j<quantity;j++) {
				if (bag) { classes += " " + $itemGroup.eq(j).attr("id"); }
			}
			cartStr += '<li class="'+classes+'" '+((bag) ? '' : 'data-label="'+label+'"')+'><img src="../../mobile/img/seatview/'+$item.data("section")+'_SeatViews_640x427.jpg" class="image" /><div class="desc"><p class="info">'+((type == ".seat-resale") ? '<span class="label-resale">Resale<br /></span>' : '')+'<span class="quantity">'+quantity+' Adult Ticket'+((quantity > 1) ? 's' : '')+'<br /></span><span class="section">'+$item.data("section-name")+'</span><br /><span class="row-seat"><span class="row">Row '+row+'</span>, <span class="seat">Seat'+((quantity > 1) ? 's' : '')+' '+((quantity > 1) ? $item.data("seat")+"-"+$itemGroup.last().data("seat") : $item.data("seat"))+'</span></span></p><p class="price"><span class="total">$'+groupTotal.toFixed(2)+'<br /></span><a href="#" class="remove">Remove</a></p><div class="mobile">Available for <span>FREE</span> mobile delivery!</div></div></li>';
			cartQtyStr += '<div '+((bag) ? 'class="'+classes.replace('cart-item ','dark ')+'"' : 'class="dark" data-label="'+label+'"')+'><p><span class="tickets">'+quantity+' Ticket'+((quantity > 1) ? 's' : '')+' ($'+parseFloat($item.data("price")).toFixed(2)+' ea)</span></p><p class="total-tickets">$'+groupTotal.toFixed(2)+'</p></div>';
			cartSubStr += '<span '+((bag) ? 'class="'+classes.replace('cart-item ','')+'"' : 'data-label="'+label+'"')+'>'+$item.data("section-name")+', Row '+row+', Seat'+((quantity > 1) ? 's' : '')+' '+((quantity > 1) ? $item.data("seat")+"-"+$itemGroup.last().data("seat") : $item.data("seat"))+'<br /></span>';
			cartSubTotal += groupTotal;
			i += quantity - 1;
		}
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
	  	if (bag) {
	  		bagItems = 0;
	  		if ($(".bag .toggle").hasClass("collapsed")) { $(".bag .toggle .hdr").trigger("click"); }
	  		$bag.hide();
	  		$(".bag-item, .item.selected, .seat-icon-check").remove();
		  	$map.smoothZoom("refreshAllLandmarks");
	  	} else {
	  		$(".top-item[data-label='"+label+"'], .pin-top-pick[data-label='"+label+"'], .hover-top-pick[data-label='"+label+"']").addClass("carted");
	  		$(".top-pick-row[data-label='"+label+"']").svgAddClass("carted");
	  	}
	  	$items.each(function() {
	  		$(this).svgRemoveClass("seat-selected");
	  		$(this).svgAddClass("seat-carted");
	  		$(this).next(".seat-icon-resale").hide();
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
  	// if removed items are a top-pick
  	if (typeof $el.data("label") !== "undefined") {
  		label = $el.data("label");
  		// add items back to ISM
  		$(".top-item[data-label='"+label+"'], .pin-top-pick[data-label='"+label+"'], .hover-top-pick[data-label='"+label+"']").removeClass("carted");
  		$(".top-pick[data-label='"+label+"']").each(function() { $(this).svgRemoveClass("seat-carted"); }).next(".seat-icon-resale").show();
  		$(".top-pick-row[data-label='"+label+"']").svgRemoveClass("carted");
  	} else {
  		ids = $el.attr("class").replace("cart-item ","#").replace(/\s/g,",#");
  		console.log(ids);
  		$(ids).each(function() { $(this).svgRemoveClass("seat-carted"); }).attr("id","").next(".seat-icon-resale").show();
  	}
  	setTimeout(function() {
	  	// remove ticket data from cart
	  	if (typeof $el.data("label") !== "undefined") {
		  	$(".cart-listing span[data-label='"+label+"'], .cart .dark[data-label='"+label+"']").remove();
	  	} else {
	  		$(ids.replace("#",".")).remove();
	  	}
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
  	if (cartTime != "0:00") { setTimeout(cartTimer,1000); }
  	else { $cartTimer.text(cartTime); }
  }

  // on window resize
	$(window).on("resize",function() {
		addScrollToPicks();
		windowWt = $(window).width();
		windowHt = $(window).height();
		portrait = (windowWt < windowHt);
		if (iPad && !portrait) { windowHt = 672; }
		$map.smoothZoom('resize', {width: windowWt, height: (windowHt - topPicksHt - subhdrHt)});
	}).on("orientationchange",function() {
		$(".more-info").removeClass("on");
    if (portrait) { $("html").addClass("portrait"); }
    else { $("html").removeClass("portrait"); }
	}).hashchange(function() {
		var hash = location.hash;
		if (hash == "#cart") {
			if (!cartViewed) { cartViewed = 1; cartTimer(); }
			$(".frame-ism").hide();
			$(".frame-cart").show();
			$(".more-info").removeClass("on");
		} else {
			$(".frame-ism").show();
			$(".frame-cart").hide();
			if ($(".top-picks .toggle").hasClass("expanded")) { addScrollToPicks(); }
		}
	}).bind("touchstart",function(e) {
		if (e.originalEvent.touches.length > 1) { pinching = 1; }
	});

	// sort function for list
  function sortLowHighPrice(a,b){ return $(a).data("price") - $(b).data("price"); }

	// expand array for min and max
	Array.max = function(array) {
		return Math.max.apply(Math,array);
	};
	Array.min = function(array) {
		return Math.min.apply(Math,array);
	};


	function createSeatImage(section,row,seat,cx,cy,i,pin) {
		//var timer = 200 * i;
		//setTimeout(function() {
			if ($(".seat-selected",$captureMap).length >= 1) { $(".seat-selected",$captureMap).each(function() { $(this).svgRemoveClass("seat-selected"); }); }
			if (pin) {
				/*var $siblings = $(".seat[data-section='"+section+"'][data-row='"+row+"'][data-seat='"+seat+"']",$captureMap).nextUntil(".seat[data-seat='"+(seat + qty)+"']",".seat[data-row='"+row+"']").addBack();
				$siblings.each(function() { $(this).svgAddClass("seat-selected"); });
				cx = (parseInt($siblings.filter(":first").attr("cx")) + parseInt($siblings.filter(":last").attr("cx"))) / 2;
				cy = (parseInt($siblings.filter(":first").attr("cy")) + parseInt($siblings.filter(":last").attr("cy"))) / 2;*/
				var label = $(".seat[data-section='"+section+"'][data-row='"+row+"'][data-seat='"+seat+"']").data("label").replace("Best ","");
				if (label.indexOf("Under") != -1) { label = label.split(" ")[0].toLowerCase() + label.split(" ")[1].replace("$",""); }
				else { label = label.split(" ")[0].toLowerCase(); }
				$(".details-item").eq(i).find(".img-list li:last-of-type img").attr("src","temp/seatlevel/details-"+label+"-"+qty+".png");
			} else {
				$(".seat[data-section='"+section+"'][data-row='"+row+"'][data-seat='"+seat+"']",$captureMap).svgAddClass("seat-selected");
			//}
				var doctype = '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
						thisSVG = doctype + $captureMap.html(),
						thisSrc = "data:image/svg+xml;base64," + window.btoa(unescape(encodeURIComponent(thisSVG))),
						seatImage = new Image(),
						cropLeft = (cx * captureScale - captureWt / 2) * (-1),
						cropTop = (cy * captureScale - captureHt / 2) * (-1);
				seatImage.src = thisSrc;
				seatImage.onload = function() {
					var c = document.getElementById("canvas-map"),
							ctx = c.getContext("2d"),
							grad = ctx.createRadialGradient(captureWt/2,captureHt/2,captureHt/2,captureWt/2+20,captureHt/2+20,captureHt);
					ctx.drawImage(seatImage,cropLeft,cropTop,seatImageWt,seatImageHt);
					grad.addColorStop(0,"rgba(0,0,0,0)");
					grad.addColorStop(1,"rgba(0,0,0,0.2)");
					ctx.fillStyle = grad;
					ctx.fillRect(0,0,captureWt,captureHt);
					var seatImageUrl = c.toDataURL('image/png');
					$(".details-item").eq(i).find(".img-list li:last-of-type img").attr("src",seatImageUrl);
				}
			}
		//},timer);
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

});