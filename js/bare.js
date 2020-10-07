$(function() {
	// dom selectors
	var $svgShell   = $("#map1a");
		
		// Grab data from JSON  
	function init(){
		$.get( "data/svg-map-full.txt" )
		.done(function( data ) {
			$svgShell.append(data);
			addSmoothZoom();
			bindSeatsEvents();
		})
		.fail(function(data) {
			alert("error" + String.data);
		}); 
	}
	
	init();


	// svg-specific methods
	$.fn.svgAddClass = function(className) {    
		var selector = this,
				updatedClasses = $(selector).attr('class') + " " + className;
		
		$(selector).attr('class', updatedClasses);
	};
	
	$.fn.svgRemoveClass = function(className) {    
		var selector = this,
			updatedClasses = $(selector).attr('class').replace(className, '').replace('  ', ''); // the second 'replace' is to prevent space buildup

		$(selector).attr('class', updatedClasses);
	};
	
	$.fn.svgToggleClass = function(className) { 
		var selector = this,
				hasClass = $(selector).attr('class').indexOf(className) > -1;

		if( hasClass )
			$(selector).svgRemoveClass( className ); 
		else
			$(selector).svgAddClass( className );
	};


	/* SMOOTH ZOOM */
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

	function addSmoothZoom(){
		var maxZoom = 2000,
				midZoom = 150,
				showAtZoom = 100,
				minZoom = 10;
				

		// smooth zoom initiation
		$('#map1a').smoothZoom({
			width: '100%',
			height: '100%',
			pan_BUTTONS_SHOW: false,
			zoom_BUTTONS_SHOW: false,
			border_SIZE: 0,
			mouse_WHEEL: false,
			zoom_MAX: maxZoom,
			container: 'zoom_container',
			mouse_DOUBLE_CLICK: true,
			use_3D_Transform: false,
			reset_TO_ZOOM_MIN: true,
	
			on_ZOOM_PAN_UPDATE: onPanning,   
			on_ZOOM_PAN_COMPLETE: onPanComplete
	});

	// controls functionality
	$(".reset").on("vmousedown",function(e) {
		e.preventDefault();
		$('#map1a').smoothZoom('Reset');
	});
	$(".zoom-in").on("vmousedown",function(e) {
		e.preventDefault();
		$('#map1a').smoothZoom('zoomIn');
	});
	$(".zoom-out").on("vmousedown",function(e) {
		e.preventDefault();
		$('#map1a').smoothZoom('zoomOut');
	});

}



	var is_seatsShown  = false;
	var prevZoom = "";
	var animFrame = 0;
	var $mapFinder = $(".map-finder"),
			$mapSpot    = $(".spot", $mapFinder);
	function updateSpotLocation(zoomData){
		var centerDiff = 7
				adjX = zoomData.centerX/100 - centerDiff,
				adjY = zoomData.centerY/100 - centerDiff
		
		$mapSpot.css({
			left: adjX,
			top: adjY
		});
	}

	function onPanning(zoomData){
		if( zoomData.ratio > .8 && !is_seatsShown ){
				toggleCovers(true);  
		}      
		else  if( zoomData.ratio <= .8 && is_seatsShown ){
				toggleCovers();  
		}
		 // map view finder spot      
		if (is_seatsShown && (prevZoom == zoomData.ratio)) {
			updateSpotLocation(zoomData);
		}
		
		// grab very first frame zoom ratio
		animFrame++;
		if (animFrame == 1)  prevZoom = zoomData.ratio;   
	}

	function onPanComplete(zoomData){
		animFrame = 0;
		updateSpotLocation(zoomData);
	}


//* end - SMOOTH ZOOM  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

	function toggleCovers(showSeats){
		var $svgMap   = $("#svg-map"),
				$svgSeats = $("#svg-seats"),
				$svgSects = $(".svg-sect"),
				$sectAvail = $(".svg-sect-avail"),
				$sectUnavail = $(".svg-sect-unavail");        
	
		is_seatsShown = +!is_seatsShown; 
	
		$svgMap.svgToggleClass("covers-on");
		$mapFinder.toggle(is_seatsShown); 
	}

	function bindSeatsEvents(){
				 
		// temp binds
		$(".seat").not(".seat-unavail").on("vclick", function(e){
			e.preventDefault();
			
			var $self = $(this),
					$nextG  = $self.next("g"),
					$iconCheck = $(".seat-icon-check", $nextG),
					$iconResale = $(".seat-icon-resale", $nextG),
					is_selected =  ($iconCheck.css('display') != 'none') ? true : false, // hack for svg specific 
					thisData =  $self.data(),
					stringData  = JSON.stringify(thisData);
	
			$self.svgToggleClass("seat-selected");
			$iconCheck.add($iconResale).toggle();
			
		});
	}



});