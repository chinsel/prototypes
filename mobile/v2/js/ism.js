$(function() {

	// device detection
	var is_iPhone = isiPhone();


	// quick toggle :  
	var animats			= 	false,
			is_priceBubbsOn = false,
			is_parseData = false; //parseData(true) vs SVG Full Map(false)

	is_priceBubbsOn		=	( getUrlVar('pb') ) ? true : false;
	is_parseData = ( getUrlVar('pd') ) ? true : is_parseData;
	is_testing		=	( getUrlVar('t') ) ? true : false;
	animats		=	( getUrlVar('anim') ) ? true : animats;


	// testing
	if (is_testing) $('body').addClass('testing');




	// dom selectors
	var $svgShell   = $("#map1a"),
			$zoomContainer = $("#zoom-container"),
			svgW 				= "",
			svgH 				= "",
			$svgMap,
			$svgSeats,
			$sectionAvail,
			$ticketList = $(".picks-list"), // $(".ticket-list") || 
			$listPoll   = $(".listing-poll", $ticketList),
			$noListing  = $(".no-listing", $ticketList),
			$listTray   = $(".listing-tray"),
			$tixSortCount = $(".tix-sort-count", $listTray),
			$tixTotal     = $(".tix-total", $listTray),
			$ticketLIs,
			$listLIs,
			$topPickLIs,
			$groupLeads,
			$countContainer = $(".count-container"),
			$landmarks 	= $(".landmarks"),
			$seatHover 	= $(".seat-hover");



			console.log("$zoomContainer:" + $zoomContainer);

	// stage
	var $stage      = $("#stage-center"), 
			stageTop    = $stage.position().top,
			stageLeft   = $stage.position().left;    


  
	// Data storage  
	var data_geo,     
			data_avail,
			svgMapString,
			storedSeats = "",
			storedList = ""; 


	var $groupLeadsFiltered,
			$sortedGroupLeads;

// Zoom Data Global Variables
	var centerX = 0,
			centerY = 0,
			normX,
			normY,
			zoomRatio;
			
	// global var flags
	var is_FirstPass 	= true
			awaitingSH		= false,
		 	is_seatsShown  = false;

	// pre-cart functions
	var is_pcActive		= false,
			$preCart 	= $(".pre-cart"),
			$pcFace		= $(".face", $preCart),
			$pcTracy	= $(".tray", $preCart),
			$pcList 	= $(".cart-list", $preCart),
			$pcLI 		= $(".clone-li", $pcList),
			pcIds 		= 0;


var 	$captureMap = $("#capture-map"),
			captureScale = 0.115,
			captureStyle = '<defs><style type="text/css">\n.svg-sect{fill:#fff; stroke:#ddd;}\n.seat{fill:#ddd;}\n.seat-selected{fill:#414141;}\n.seat-icon-resale{fill:#fff;}\n.stage{fill:#414141;}\n</style></defs>';
	
  init();

    /* Functions */
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
  
	function init(){
		 								 // console = { "log" : function(arg){ $("#console").append(arg + "<br / >"); } };
		 if (is_iPhone)  console = { "log" : function(){ } };

		 if (is_parseData)
		    fetchData(); 
		 else
		    fetchSVGfull();     
	}

    
	// Grab data from JSON  
	function fetchData(){
		console.log("fetching geometry");  
		$.getJSON( "data/22004B66E96893C4-201401151851.geometry.json" )
		.done(function( json ) {
			data_geo = json;  

			fetchAvail();
		}); 
		

		function fetchAvail() {
			console.log("fetching available");  
			$.getJSON( "data/available.json" )
		 // $.getJSON( "js/available_og-works.json" )
			.done(function( json ) {
				data_avail = json;
			
				fetchSVG();
			}); 
		}

	
		function fetchSVG(){
			console.log("fetching SVG");  
			$.get( "data/svg-map.txt" )
			.done(function( data ) {
				console.log("fetching SVG - complete");  
				svgMapString = data; 
				parseData();   
			})
			.fail(function(data) {
				alert("error" + String.data);
			}); 
		}
	} 


	function fetchSVGfull(){
			console.log("fetching SVG");  
			$.get( "data/svg-map-full.txt" )
			.done(function( data ) {
				console.log("fetching SVG FULL - complete");  
				svgMapString = data; 
				//parseData(); 
				onParseDataComplete();  
			})
			.fail(function(data) {
				alert("error" + String.data);
			}); 
	}

   
    
	function parseData() {              
		
						console.log("parseData");                
						
						var shapes = data_geo.shapes; // for image maps

						// from geo
						var sectName,
								sectId,
								rowId,
								seatId,
								groupId,
								seatX,
								seatY,
								seatPrice,
								sortDefault,
								sortSpecial,
								sortDeals;    

											
						// begin loop thru
						// SHAPES
						$.each(shapes, function ( key, shape ) {                
									
							// SECTIONS
							$.each(shape.sections, function ( key, section ) {

									sectId = this.id;
									
									
									// # inspection for availability
									// since cvs -> json file is split per array (vs obj), each array needs a check
									var isSectAvail = false;
									var ibmAvailSect = 0;
									for (var i=0; i<data_avail.length; i++){ 
										var thisSect = data_avail[i]["SectionId"]; 
										if (data_avail[i]["SectionId"] == sectId){ // if sect is available
											
											sectName = data_avail[i]["SectionName"];

											ibmAvailSect = i;
											isSectAvail = true;   

											break;
										}
										else if ( sectId == "101" || sectId == "102" || sectId == "118" || sectId == "201" || sectId == "202" || sectId == "203" || sectId == "204" || sectId == "205" || sectId == "229" || sectId == "230" || sectId == "231" || sectId == "232" ){ // if sect is available
											// these sections have now been ommitted based on new design for Phase-B																				 
											return false;
										}
										else {

												
										}
									}
					
							
								// ROWS
								$.each(section.rows, function ( key, row ) {
									
									rowId = this.id;
								
									// # inspection for availability
									var isRowAvail = false;
									if (isSectAvail){
										var ibmAvailRow = 0;
										for (var i=ibmAvailSect; i<data_avail.length; i++){ 
											var sect = data_avail[i]["SectionId"];
											// $(".console").append("section: "+ sect +"  index: "+i);
											if (data_avail[i]["SectionId"] == sectId && data_avail[i]["RowId"] == rowId){                                       

												ibmAvailRow = i;
												isRowAvail = true;  

												break;
											}
										} 
									}


										// SEATS
										var ibmAvailSeat  = ibmAvailRow,
												hasSeatData   = true;

										//	if (sectId == "F7" && rowId == "P"){
																var firstSeatInRow = this.seats[0].id,
																		secondSeatInRow = this.seats[1].id;

																if ( firstSeatInRow > secondSeatInRow)	{
																	this.seats.reverse();
																	// console.log("line 224: reversed seats in Sect: "+ sectId + ", Row: " + rowId);
																}		
															
										//	}		

										$.each(row.seats, function ( key, seat ) {
												
											seatId  = this.id;                                 
											seatX   = this.x;
											seatY   = this.y;

											// # inspection for availability                              
											if (isSectAvail && isRowAvail && hasSeatData){      

												// >>> COMPARISON HERE <<< //           
												for (var i=ibmAvailSeat; i<data_avail.length; ++i){ 

													// 'avail' data
													var thisArr   = data_avail[i],
															availSect = thisArr["SectionId"],
															availRow  = thisArr["RowId"], 
															availSeat = thisArr["SeatId"]; 

															seatPrice = thisArr["PriceUpdate"] || thisArr["TicketFaceValue"]; // temp! unsure how pricing will work. awaiting to hear back from gary
															sortDefault = thisArr["Default Sort"];
															sortSpecial = thisArr["Special Offer Sort"];
															sortDeals   = thisArr["Deals Sort"];


										
													if (availSect == sectId && availRow == rowId){                                                                
																					

																		if (availSeat > seatId){ 
																								
																					
																				// if available seat number surpasses current geo number, skip! (avoid loop and wait for geo num to catch-up) 
																				storeSeat("seat-unavail");
																				return true;

																		} // if (availSeat > seatId)																	
																		else if (availSeat == seatId){   																						                                                     

																			// seat class and label
																			var thisClass = "seat-standard", 
																					thisLabel = "";

																			// label check
																			if (thisArr["Standard Admission"])
																						 thisClass = "seat-standard";   
									
																			else if (thisArr["Best Seats"]) 
																						 thisLabel = "Best Seats";
									
																			else if (thisArr["Meet & Greet Package"])                                                                            
																						 thisLabel = "Meet &amp; Greet Package";
									
																			else if (thisArr["Ballroom Package"])
																						 thisLabel = "Ballroom Package";
									
																			else if (thisArr["Fan Package"]) 
																						 thisLabel = "Fan Package";
									
																			else if (thisArr["Great Deals"])                                                                           
																						 thisLabel =  "Great Deals";
																			
																			else if (thisArr["Good Deals"])                                                                           
																						 thisLabel = "Good Deals"; 
									
																			else if (thisArr["Obstructed View"])                                                                             
																							thisLabel = "Obstructed View";
																		
																			
																			if (!thisLabel)
																							thisLabel = thisArr["Label"];


																			// resale check
																			thisClass = (thisArr["Resale"]) ? "seat-resale" : thisClass;

																			// top pick                                                                 
																			thisClass += (thisArr["Top Pick"]) ? " top-pick" : "";
																			// store it!
																			storeSeat( thisClass, thisLabel);
																	

																			ibmAvailSeat = i + 1; // will resume to next 'available' array, not restart 
																			return true; // continue iteration for each() : geo seats

																		} // 	else if (availSeat == seatId){   
									

														} // IF (availSect == sectId && availRow == rowId)
														else { 
															
															// if next array for 'available' data doesn't match this geo section/row    
															// store this last seat before going into 'else' (right below), unavailable conditional                                       
															storeSeat("seat-unavail");
															hasSeatData = false;
															return true;
														}
													} // for
											}  // if (isSectAvail && isRowAvail)                                
											else {
												// default, unavailable seat
												storeSeat("seat-unavail");
											}
											
										
									}); // each - seats
								
								}); // each - rows
							
							
							}); // each - sections
								
						}); // each - shapes  
									 

						function storeSeat( seatClass, seatSpecial ){  
							if ( seatClass == "seat-unavail" ) { // immediately quit if unavailable seat!                
								//storedSeats += '<circle class="seat '+ seatClass +'"  data-section="'+ sectId +'"  data-row="'+ rowId +'"  data-seat="'+ seatId +'" cx="'+ seatX +'" cy="'+ seatY +'" r="13"/>';
								storedSeats += '<circle class="seat '+ seatClass +'" cx="'+ seatX +'" cy="'+ seatY +'" r="13"/>';
								return;
							}   



							seatSpecial = seatSpecial || "";
							var is_resale = seatClass.indexOf("seat-resale") > -1,
									is_topPick = seatClass.indexOf("top-pick") > -1;
							// calc distance
							var dx = stageLeft - seatX,
									dy = stageTop - seatY,
									distance = Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2)),
									dist = Math.abs( Math.ceil( distance / 20 )  ); // adjust to more practical number
							// price decimal
							seatPrice = seatPrice.toFixed(2);

						 
							/* SVG - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */                      

							storedSeats += '<circle class="seat seat-avail '+ seatClass +'" data-section="'+ sectId +'"  data-row="'+ rowId +'"  data-seat="'+ seatId +'" data-price="'+ seatPrice +'" data-distance="'+ dist +'" data-section-name="'+ sectName +'" ';

							storedSeats += (seatSpecial) ? 'data-label="'+ seatSpecial +'" ' : '';

							storedSeats += 'cx="'+ seatX +'" cy="'+ seatY +'" r="13" />'; 
							
							// sibling <g>
							// storedSeats += '<g class="g-seat-icons" transform="translate('+ seatX +','+ seatY +')"> ';

							/* seat icons */

							// "check-mark" - selected seat
							// storedSeats += '<path class="seat-icon-check" d="M7.209-6.81C6.824-7.206,6.201-7.203,5.818-6.805l-8.445,8.817l-2.899-2.474C-5.928-0.804-6.516-0.85-6.969-0.532c-0.552,0.386-0.697,1.163-0.324,1.735l3.305,5.068c0.115,0.175,0.264,0.34,0.438,0.471C-2.735,7.358-1.594,7.172-1,6.328l0.075-0.107L7.311-5.487C7.593-5.887,7.56-6.45,7.209-6.81"/>';
							
							// resale icon
							if ( is_resale ){
								// storedSeats += '<g class="seat-icon-resale"><path d="M3.965-3.178L2.493-2.744l1.785,1.417l1.795,1.428l0.725-2.186L7.5-4.26L5.827-3.747C4.589-5.666,2.459-6.959,0.017-6.959l0,0c-3.167,0-5.811,2.142-6.669,5.019h1.963c0.77-1.829,2.576-3.134,4.707-3.134C1.601-5.074,3.017-4.327,3.965-3.178z"/><path d="M-3.954,3.19l1.472-0.435l-1.785-1.417l-1.806-1.428l-0.714,2.187L-7.5,4.261l1.684-0.513c1.238,1.93,3.368,3.201,5.811,3.212V6.948c3.167,0,5.821-2.119,6.658-5.007H4.701c-0.77,1.84-2.587,3.133-4.707,3.133C-1.601,5.074-3.017,4.339-3.954,3.19z"/></g>';
							storedSeats += '<g transform="translate('+ seatX +','+ seatY +')" class="seat-icons seat-icon-resale"><path d="M3.965-3.178L2.493-2.744l1.785,1.417l1.795,1.428l0.725-2.186L7.5-4.26L5.827-3.747C4.589-5.666,2.459-6.959,0.017-6.959l0,0c-3.167,0-5.811,2.142-6.669,5.019h1.963c0.77-1.829,2.576-3.134,4.707-3.134C1.601-5.074,3.017-4.327,3.965-3.178z"/><path d="M-3.954,3.19l1.472-0.435l-1.785-1.417l-1.806-1.428l-0.714,2.187L-7.5,4.261l1.684-0.513c1.238,1.93,3.368,3.201,5.811,3.212V6.948c3.167,0,5.821-2.119,6.658-5.007H4.701c-0.77,1.84-2.587,3.133-4.707,3.133C-1.601,5.074-3.017,4.339-3.954,3.19z"/></g>';
						  }	

							// sibling <g> close
							// storedSeats += '</g>';                    
						 
							/* SVG - end  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
						} // storeSeat()

						onParseDataComplete();
		
	} // parseData


  


	function onParseDataComplete(){  
		console.log("onParseDataComplete");  
		injectSvg(); 
		//setTimeout(filterSeats, 500);
		setTimeout(filterSeats, 500);
		//addSmoothZoom();
		//addListeners();
	}



	function onFirstPassComplete(){
		console.log("onFirstPassComplete");
		addPicksPins();
		if ( is_priceBubbsOn ) addSectionBubbles();
		if ( !is_testing ) $(".ism-area").hide();
		
		stopPolling();
		displayListing();
		// clone svg obj
		svgForReview();
		// fires from onPanComplete()
		is_FirstPass = false; 
	}

	$reviewIsm = $("#review-ism");
	//$svgReview;
	var svgRevScale = .25; //.75

	function svgForReview(){
			// clone it
			$svgReview = $svgMap.clone();

			// clean-up
			$svgReview.attr('id','svg-review').css({'position':'absolute'}).find("#Section_Names, #top-pick-rows").remove();	
			$svgReview.find('.svg-rev-scale').attr('transform','scale('+ svgRevScale +')');
			$svgReview.find('#Section_Outlines, #svg-seats').removeAttr('id');
			
			// $svgReview.find('circle').removeClass('seat-avail seat-standard top-pick seat-resale');
			$svgReview.find('circle').attr('class','seat');//.svgAddClass('seat');

			// inject
			$reviewIsm.append($svgReview);

			positionSvgRev( 2500, 880);

	}

	positionSvgRev = function( cx, cy ){
			console.log("positionSvgRev");
			var $seat = $svgReview.find('circle[cx="'+ cx +'"][cy="'+ cy +'"]'),
					thisL = (cx * svgRevScale) - 160, //(2494 * .75) - 10,
					thisT = (cy * svgRevScale) - 30; //80; // 875 * .75;

			// color seat			
			$seat.svgAddClass('rev-select');

			// if quick pick listing, color seats in row
			//if ( $seat.parents('.from-listing') ) {
			if ( $('.review-page').hasClass("from-listing") ) {
						var sect = $seat.data('section'),
								row =  $seat.data('row');
						//$seat.next().svgAddClass('rev-select');
						$svgReview.find('circle[data-section="'+ sect +'"][data-row="'+ row +'"]').each( function(){
							$(this).svgAddClass('rev-select');
						});
							console.log("FROM LISTING + svg position rev");
			
						console.log("cx: " + cx + "  cy: " + cy);
			}

			// position spot in finder
			var	thisX			=  Math.floor( (cx / svgW ) * 100 ) + "%",
					thisY			=  Math.floor( (cy / svgH ) * 100 ) + "%";
			$(".seat-view-wrapper .minimap-indicator").css({'left': thisX, 'top': thisY});


			// position svg
			$svgReview.css({'left':'-'+ thisL +'px','top':'-'+ thisT +'px'});		

			// color circle for "selection"


	}
    

	function injectSvg(){  
		console.log("injectSvg");

		var storedSvg = "";
		
		if (is_parseData){
		  storedSvg = svgMapString + '<g id="svg-seats">' + storedSeats + '</g></svg>';             
    }
    else {
    	storedSvg = svgMapString;
    }

		// dom placement
		$svgShell.append(storedSvg);

		// selector update
		$svgMap   = $("#svg-map");
		$svgSeats = $("#svg-seats", $svgMap);
		$sectionAvail = $(".svg-sect-avail"); // will need to be moved and updated inside filterSeats()
		svgW			= $svgShell.width();
		svgH 			= $svgShell.height(),

		// clear vars
		svgMapString = null; 
		storedSeats = null;  
		storedSeats = "";           
	}

	function updateIsmNList(){
		// fired from: 'see all' or filter form
		console.log("updateIsmNList");
		// list
		// startPolling();
	
		// bs, but timeout is needed
		// setTimeout(getFilterValues, 500);
		getFilterValues();
	}



	function getFilterValues(){
		// may be fired from:  filter submit, resfreshList 
		// the following selectors and vars are for testing
		// and will be updated once filter pane has been implemented
		console.log("getFilterValues");
	  //if (is_iPhone) alert("about to filter seats...");
		// was there a change?
		if ( is_filterChange ) {
		

			setTimeout(startPolling, 225);
		
			var max_num = parseInt( $("#price-max").val() ); // cheat for filter_priceMax
			sort_val    = $("#dd-sort").val();
			filter_tixQty =  2; //$("#tixQty").val();
			filter_priceMin = parseInt( $("#price-min").val() );
			filter_priceMax = ( max_num  == 400 ) ? 2000 : max_num;
			is_resaleOn = $("#resale-checkbox").is(":checked");
			//is_topPicksOn = $("#toppicks-checkbox").is(":checked");

			console.log(filter_priceMax);

			setTimeout(filterSeats, 425);
			//genListing();

			//sortGroups(); // temp func name

			is_filterChange = false;
			/*
			console.log("is_resaleOn: " + is_resaleOn);
			console.log("qty: " + filter_tixQty);
			console.log("price: " + filter_priceMin + " to " + filter_priceMax);
			*/
		}
	}

    

	function filterSeats(){
					
						// for ISM ONLY, used to update seats on map for grouping or in/out filter criteria
						console.log("filterSeats");

						var prevSeatNum = 0,
								prevRow = 0,
								prevSect = 0,
								prevPrice = 0,
								is_prevResale = false,
								prevGroupId = 0,
								sig = 0; // seat in group


						var $seats;

						/*
								TODO: optimize performance, still attempting to default to group leads vs individual seats if quantity is same
						*/

						if (is_qtyChange || is_FirstPass){
							console.log("all seats!....");
							$seats = $(".seat-avail", $svgSeats);   


									$seats.each(function(index){
										var $self = $(this),
												thisSeat = $self.data('seat'),
												thisRow = $self.data('row'),
												thisSect =  $self.data('section'),
												thisPrice = $self.data('price'),
												is_resale = $self.svgHasClass("seat-resale"),
												is_topPick = $self.svgHasClass("top-pick"),
												groupId = "";
										
										
										// comparisons  
										var is_sameType = (is_resale == is_prevResale) ? true : false,
												is_sameRow = (thisRow == prevRow) ? true : false,
												is_rightSeat =  (thisSeat == (prevSeatNum+1)) ? true : false;



										// resets
										if ($self.attr('data-group-lead')) $self.removeAttr('data-group-lead');
										$self.svgRemoveClass("outside-filter");    
								
									

										// grouping set-up
										if (is_sameType && is_sameRow && is_rightSeat && sig < filter_tixQty && index > 0 ){
											// resume group
											sig++;                             
											$self.attr('data-group', prevGroupId);   
										}
										else {
													
											//  if prev group does NOT match filter quantity AND/OR any other criteria
											// if( (sig < filter_tixQty || !is_resaleOn) && index > 0){
											if( index > 0 ){  
												var $prevGroupedSeats = $('.seat-avail[data-group="'+ prevGroupId +'"]', $svgSeats);
													 

												 // FILTER CONDITIONALS
												 if(  sig < filter_tixQty || 
														(is_prevResale && !is_resaleOn)  || 
														(prevPrice <= filter_priceMin || prevPrice >= filter_priceMax) ) {                                        

														$prevGroupedSeats.svgAddClass("outside-filter");   

														// section covers set-up (determin if blue or gray)
													}
													else {
														$prevGroupedSeats.svgRemoveClass("outside-filter");
													}                                                          
											}
										 
									 

											// start new group on this current seat
											sig = 1;
											groupId = thisSect +"-"+ thisRow  +"-"+ thisSeat;                            
											$self.attr('data-group', groupId);
											$self.attr('data-group-lead', 'true');              
										}
									
										// now establish as 'previous' seat                    
										prevSeatNum = thisSeat;
										prevRow = thisRow;
										prevSect = thisSect;
										prevPrice = thisPrice;
										is_prevResale = is_resale;
										prevGroupId = groupId || prevGroupId;

										});
								
										// store group leads  
										$groupLeads = $('.seat-avail[data-group-lead]', $svgSeats);                        
										// console.log("groupleads count: " + $groupLeads.length);
										// is_qtyChange = false; 
						
						} // if
						
						else { // go by groupLeads
										console.log("group leads!....");
										$groupLeads.each(function(index){
											var $self = $(this),
													thisSeat = $self.data('seat'),
													thisRow = $self.data('row'),
													thisSect =  $self.data('section'),
													thisPrice = $self.data('price'),
													is_resale = $self.svgHasClass("seat-resale"),
													is_topPick = $self.svgHasClass("top-pick"),
													groupId = $self.data('group'),
													$group = $('.seat-avail[data-group="'+ groupId +'"]', $svgSeats),
													groupCount = $group.length;
														 

											// FILTER CONDITIONALS
										 if(groupCount != filter_tixQty || 
												(is_resale && !is_resaleOn)  || 
												(thisPrice <= filter_priceMin || thisPrice >= filter_priceMax) ) {  //  these conditionals need to match the above 'FILTER CONDITIONALS'                                  

												$group.svgAddClass("outside-filter");   
													// section covers set-up (determin if blue or gray)
											}
											else {
												$group.svgRemoveClass("outside-filter");
											}
										});
						} // else



						// continue
						filterGroupLeads();
						filterSections();           
						genListing();
					
						if (is_FirstPass){
							// filterGroupLeads();
						//	genListing();
							addSmoothZoom();
							addListeners();
						}
						else{
						 //	seatsInView(); // gather seats for listing. secondary in conditional since 'zoomData' isn't ready    		

						//	filterGroupLeads();						 
							// genListing();
						}		     
	}

   
  var $groupLeadsOutside;
  

  function filterGroupLeads(){
  	// preparation for listings
		console.log("filterGroupLeads");
		var adjClass = (is_topPicksOn) ? ".top-pick" : "";  
 
		$groupLeadsFiltered = $('.seat-avail'+adjClass+'[data-group-lead]', $svgSeats).not(".outside-filter");
	
  }



  function filterSections(){
  					// this will only give sect covers "outside-filter" class, since sect-avail is default	

						$sectionAvail.each(function(){
											var $self = $(this),
			  									thisId 	= $self.attr('id').replace("s-",""),
			  									hasAvail = $(".seat-avail[data-section="+ thisId +"]").not(".outside-filter").length > 0,
			  									hasOutside = $(".seat-avail.outside-filter[data-section="+ thisId +"]").length > 0;
			  								
			  						
			  							if (hasOutside && !hasAvail){
			  									$self.svgAddClass("outside-filter");
			  							}
			  							else{
			  									$self.svgRemoveClass("outside-filter");			  									
			  							}
			  		});					
  }



  function genListing(){  
		console.log("genListing");
		if ( is_FirstPass || is_qtyChange )
			sortGroups();
		else 
			filterListing();
  }


  
  // attach sort func 
  function sortLowHighPrice(a,b){ return $(a).data('price') - $(b).data('price');  }
  function sortHighLowPrice(a,b){ return $(b).data('price') - $(a).data('price');  }
  function sortNearFarDistance(a,b){ return $(a).data('distance') - $(b).data('distance');  }
 // function sortFarNearDistance(a,b){ return $(b).data('distance') - $(a).data('distance'); }
 // function sortBest(a,b){ return $(a).data('best') - $(b).data('best');  }


  function sortGroups(){
		console.log("sortGroups");

		// var $gls = (is_FirstPass) ? $groupLeadsFiltered : $groupLeadsFiltered.filter(".is-inview");
		var $gls = $groupLeadsFiltered;

		// first grab groupLeads and sort it according to sort dd  
		switch(sort_val)
		{
		case "lowest":        
					$sortedGroupLeads = $gls.sort(sortLowHighPrice);
					break;
		case "highest":       
					$sortedGroupLeads = $gls.sort(sortHighLowPrice);
					break;       
		case "closest":
					$sortedGroupLeads = $gls.sort(sortNearFarDistance);
					break;   
		default:
			//code to be executed if n is different from case 1 and 2
		}

		storeListing();        
  }


 	// expand array for min and max
	Array.max = function(array) {
		return Math.max.apply(Math,array);
	};
	Array.min = function(array) {
		return Math.min.apply(Math,array);
	};
  


  function storeListing(){
						// fired by: onParseDataComplete(),  getFilterValues()
						console.log("storeListing");
						// sortGroups();           
						// $groupLeads.each(function(index){
						$sortedGroupLeads.each(function(index){  
							// data retrieval
						
							var $self = $(this),
									thisGroup = $self.data('group'),
									thisSeat = $self.data('seat'),
									thisRow = $self.data('row'),
									thisSect =  $self.data('section'),
									thisSectName = $self.data('section-name'),
									thisPrice = $self.data('price'),
									thisDist = $self.data('distance')
									/*
									thisX			=  Math.floor( ($self.attr('cx') / svgW ) * 100 ) + "%",
									thisY			=  Math.floor( ($self.attr('cy') / svgH ) * 100 ) + "%",
									*/
									thisX			=  $self.attr('cx'),
									thisY			=  $self.attr('cy'),
									thisLabel = $self.data('label') || "",
									thisLastSeat = $self.siblings('[data-group="'+ thisGroup +'"]').last().data('seat'),
									is_resale = $self.svgHasClass("seat-resale"),
									is_topPick = $self.svgHasClass("top-pick"),
									thisClass = "";

									if (is_resaleOn && is_resale) thisClass = "seat-resale";
									if (is_topPick) thisClass += " top-pick";


								// cheat: been asked to divide initial list in half
								var is_indexEven = (index%2)==0;
								if ( filter_tixQty == 2 &&  is_indexEven )
								    storeListItem(thisClass, thisSect, thisRow, thisSeat, thisPrice, thisDist, thisLabel, thisSectName, thisSeat, thisLastSeat, thisGroup, thisX, thisY);
								else if ( filter_tixQty != 2)
										storeListItem(thisClass, thisSect, thisRow, thisSeat, thisPrice, thisDist, thisLabel, thisSectName, thisSeat, thisLastSeat, thisGroup, thisX, thisY);

							//	if ( index > 25 ) return false;
						});

					 
						injectListing();
    }



	function storeListItem(seatClass, sectId, rowId, seatId, seatPrice, dist, seatSpecial, sectName, startSeat, endSeat, groupId, cx, cy){

	var	thisX			=  Math.floor( (cx / svgW ) * 100 ) + "%",
			thisY			=  Math.floor( (cy / svgH ) * 100 ) + "%";

		// storedList += '<li class="picks-item gotoLink" data-link="review-page" data-section="'+ sectId +'"  data-row="'+ rowId +'" data-price="'+ seatPrice +'" data-distance="'+ dist +'" data-section-name="' + sectName + '" data-label="' + seatSpecial + '" data-group="'+ groupId +'">'
		storedList += '<li class="picks-item gotoLink" data-link="review-page" data-price="'+ seatPrice +'" data-seatstart="'+ startSeat+'" data-seatend="'+ endSeat+'" data-cx="'+ cx+'" data-cx="'+ cy +'" '
		storedList += ( seatSpecial ) ? 'data-label="'+ seatSpecial +'"' : '';
		storedList += '>';	
		storedList += '<div class="pick-view-wrapper">';
		storedList += '<img src="img/seatview/'+ sectId +'_SeatViews_640x427.jpg" class="seat-view">';
		storedList += '<div class="mini-map-frame">';
		storedList += '<img src="img/v2/mini-map.png" class="mini-map">';
		storedList += '<img src="img/v2/mini-map-indicator.png" class="minimap-indicator" style="left:'+ thisX + '; top:'+ thisY +';">';    
		storedList += '</div>';      
		storedList += '</div>';
		storedList += '<div class="pick-info-wrapper">';
		storedList += '<div class="seat-info">';
	//	storedList += 'X: ' + cx + '  Y: ' + cy;
    storedList += ( seatSpecial ) ? '<h2 class="seat-type">'+ seatSpecial +'</h2>' : '<h2 class="seat-type">Top Pick (Needs Label)</h2>';
    storedList += '<div class="seat-loc"><span class="seat-sec">'+ sectName + '</span> <span class="seat-row">' + rowId + '</span> <span class="seat-num">' + filter_tixQty +' Seats</span></div>';
    storedList += '<div class="hide">';
    storedList += '<span class="seat-dist">'+ dist +'</span>';
    storedList += '<span class="seat-cx">'+ cx +'</span><span class="seat-cy">'+ cy +'</span>';
    storedList += '</div>';
    storedList += '<div class="seat-note">';
    storedList += ( seatClass.indexOf("seat-resale") > -1 ) ? '<span class="seat-resale">Resale</span>' : ''; 
    storedList += '<a href="#">Details</a>';
    storedList += '</div></div>';
    storedList += '<div class="price-info gotoLink" data-link="cart-page">';
    storedList += '<div class="seat-price">&#36;<span class="item-price">'+ seatPrice + '</span> ea</div>';
    storedList += '<button class="btn btn-action btn-add">Add to Cart</button>';
    storedList += '</div></div></li>';


	}

    

    
	function injectListing(){
		console.log("injectListing");
		// toggle polling, inject listing, update jSelectors and dom text           
		// stopPolling();
		if ($ticketLIs) $ticketLIs.remove();
		console.log("inject list...");
		$ticketList.append( storedList );

		console.log("bindListing...");
		 
		updateListCount();

		// clear vars
		storedList = null; 
		storedList = "";

		is_qtyChange = false;

		if (!is_FirstPass) stopPolling();	

	}

	function displayListing() {

			if ( animats ){
						var i = 0,
						timing = 300;
						var listingInterval = setInterval(function() {
					  		$ticketLIs.eq(i).toggleClass("fade-in");
					  		i++;
					  		if ($ticketLIs.length === i) { clearInterval(listingInterval); }
			  		},timing);
			 }
			 else {
			 			$ticketLIs.css('opacity','1');
			 }

	}	




	function updateListCount(){
		console.log("updateListCount");
		$listLIs = $("> li", $ticketList);
		// $ticketLIs = $(".seat-ticket", $ticketList);
		$ticketLIs = $(".picks-item", $ticketList);
		$topPickLIs = $(".top-pick", $ticketList);
	
	
		var seatCount = $ticketLIs.filter(":visible").length * filter_tixQty,
				allAvailSeatCount = $(".seat-avail", $svgSeats).length;
				
		$tixSortCount.text( seatCount ); // "25 of.."
		$tixTotal.text( allAvailSeatCount );  // ".. of 5000"
	}

	function sortListing(){
		console.log("sortListing");
		// first grab groupLeads and sort it according to sort dd  
		switch(sort_val)
		{
		case "lowest":        
			$ticketLIs.sort(sortLowHighPrice).appendTo($ticketList);
			break;
		case "highest":       
			$ticketLIs.sort(sortHighLowPrice).appendTo($ticketList);
			break;       
		case "closest":
		 $ticketLIs.sort(sortNearFarDistance).appendTo($ticketList);
			break;   
		default:
			//code to be executed if n is different from case 1 and 2
		}            
	}


	function filterListing(){

			console.log("filter listing...");

			$ticketLIs = $(".picks-item", $ticketList);

			$ticketLIs.each(function(index){
											var $self = $(this),
													thisSeat = $self.data('seat'),
													thisRow = $self.data('row'),
													thisSect =  $self.data('section'),
													thisPrice = $self.data('price'),
													groupId = $self.data('group'),
													$group = $('.seat-avail[data-group="'+ groupId +'"]', $svgSeats),
													groupCount = $group.length;
														 

										/*

										groupCount != filter_tixQty || 
												(is_resale && !is_resaleOn)  || 

										*/

											// FILTER CONDITIONALS
										 if ( (thisPrice < filter_priceMin || thisPrice > filter_priceMax) ) {  //  these conditionals need to match the above 'FILTER CONDITIONALS'                                  
										 		// outside filter, hide from listing
												 $self.hide();
												// console.log("hide :" + groupId);
											}
											else {
												// this ticket is okay, do nothing.
												// $self.show();
												//console.log("resume :" + groupId);
											}
			});// each

			stopPolling();
			//setTimeout(stopPolling, 500);
	}

	var $poller = $(".polling-page");

	function startPolling(){
		console.log("startPolling");
		$poller.show();
	}

	function stopPolling(){
		console.log("stopPolling");
		//if (is_FirstPass) 
			$poller.hide();
	}



 
	function seatsInView(){
		console.log("seatsInView");
		return; // this has been taken out of scope!


		var startPt = [normX,normY],
				endPt = [centerX + (centerX-normX), centerY + (centerY-normY)],
				has_listing = false;
	 
	
		$groupLeadsFiltered.svgRemoveClass("is-inview");   

		$groupLeadsFiltered.each(function(index) {   
			var $thisGL = $(this),
						group = $thisGL.data('group');

			if (  (startPt[0] < $thisGL.attr("cx")) && 
						(startPt[1] < $thisGL.attr("cy")) && 
						(endPt[0] >= $thisGL.attr("cx")) && 
						(endPt[1] >= $thisGL.attr("cy")) ){

						$thisGL.svgAddClass("is-inview");
						has_listing = true;
						
				 //   console.log("group: " + group);
					 
			}
			else {
					// outside view port
			}
		 
		}); // each

		// filterGroupLeads();           

		if (!has_listing){
				console.log("no listing...");				
				updateListCount();
				stopPolling();
				$noListing.show();
		}
		else if (has_listing){
				filterGroupLeads();
				// fire sort               
				genListing();
		}
	}




  /* svg-specific methods */
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
  $.fn.svgHasClass = function(className) {    
		var className =  className.split(","); 

		var selector = this,
				hasClass = $(selector).attr('class').indexOf(className) > -1;
			
				return hasClass;	
  };

  $.fn.svgAddClass = function(className) {    
		var selector = this,
				hasClass = $(selector).attr('class').indexOf(className) > -1,
				updatedClasses = $(selector).attr('class') + " " + className;
				
		if ( !hasClass )
				$(selector).attr('class', updatedClasses);
  };

  $.fn.svgRemoveClass = function(className) {    
		var selector = this,
				hasClass = $(selector).attr('class').indexOf(className) > -1,
				updatedClasses = $(selector).attr('class').replace(className, '').replace('  ', ' '); // the second 'replace' is to prevent space buildup
           
		if ( hasClass )
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
		var maxZoom = 169, // @ 169, circles have width of 44px (88px on retina) //2000,
				midZoom = 150,
				showAtZoom = 100,
				minZoom = 10;

	function addSmoothZoom(){
		console.log("addSmoothZoom");

		
            

	 // smooth zoom initiation
	 $svgShell.smoothZoom('destroy').smoothZoom({
		width: '100%',
		height: '100%',
		pan_BUTTONS_SHOW: false,
		zoom_BUTTONS_SHOW: false,
		border_SIZE: 0,
		mouse_WHEEL: false,
		zoom_MAX: maxZoom,
		container: 'zoom-container',
		mouse_DOUBLE_CLICK: false,
		use_3D_Transform: false,
		reset_TO_ZOOM_MIN: true,

		on_ZOOM_PAN_UPDATE: onPanning,   
		on_ZOOM_PAN_COMPLETE: onPanComplete
	});

	// controls functionality
	var $zoomIn = $(".zoom-in"),
			$zoomOut = $(".zoom-out");

	$zoomIn.on("vmousedown",function(e) {
		console.log("zoom in");
		e.preventDefault();
		$svgShell.smoothZoom('zoomIn');
	});
	$zoomOut.on("vmousedown",function(e) {
			console.log("zoom out");
		e.preventDefault();
		$svgShell.smoothZoom('zoomOut');
	});

 }


  function onPanning(zoomData){
  	//console.log("# - onPannninnnnng");
  
	 	setZoomData(zoomData);

		if (is_FirstPass) return;

		// section cover toggle
		if( zoomRatio > coversThreshold && !is_seatsShown ){
				toggleCovers(true);  				
		}      
		else  if( zoomRatio < coversThreshold && is_seatsShown ){
				toggleCovers();  
		}

		 // map view finder spot      
		if (is_seatsShown && (prevZoom == zoomRatio)) {
			updateSpotLocation();
		}
		
		// grab very first frame zoom ratio
		animFrame++;
		//console.log("animFrame: " + animFrame);
		if (animFrame == 1) { 
			$("#console").html("");			
			prevZoom = zoomRatio; 
		} 
		else if (animFrame == 5 && !awaitingSH){
				closeFlyOuts();			
				console.log("hide SEAT HOVWER");
		}

		
		if (animFrame == 15){
			//	startPolling();  
		}  
  }



  function onPanComplete(zoomData){  	
		//console.log("# - onPanComplete");
		setZoomData(zoomData);
		if (!is_FirstPass){

						// reset animation frame
						animFrame = 0;
						if (is_seatsShown) {
							updateSpotLocation();               
						}   

						// wait til panComplete to reveal hover
						if (awaitingSH){
								showSeatHover();				
						}  
			
		}
		else {
						onFirstPassComplete(); 
		}

		
  }

	function setZoomData(zoomData) {
		normX = parseInt(zoomData.normX);
		normY = parseInt(zoomData.normY);
		centerX = zoomData.centerX;
		centerY = zoomData.centerY;
		zoomRatio = zoomData.ratio * 100;
		// console.log("zoomRatio: " + zoomRatio +"-----------------------");		
	}

  //* end - SMOOTH ZOOM  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
  
  // selectors
  var $mapFinder = $(".map-finder"),
      $mapSpot    = $(".spot", $mapFinder);

  // gen vars
  var coversThreshold = 10,
      prevZoom = "",
      animFrame = 0;

 
  function toggleCovers(showSeats){
		console.log("toggleCovers");

		is_seatsShown = +!is_seatsShown; 

		//$svgMap.svgToggleClass("covers-on");
		$zoomContainer.toggleClass("covers-on");
		$mapFinder.toggle(is_seatsShown); 
  }

  function updateSpotLocation(){
		var centerDiff = 5,
				adjX = centerX/128 - centerDiff,
				adjY = centerY/128 - centerDiff;
		
		$mapSpot.css({
			left: adjX,
			top: adjY
		});
  }





	function addListeners(){
		console.log("addListeners");
		// temp binds
		//$(".seat-avail", $svgShell).on("click tap", function(e){
			$(".seat-avail", $svgShell).on("vclick", function(e){
		// $("circle.seat").on("vclick", function(e){	
			e.preventDefault();
			e.stopPropagation();
			
			/*
			var $self = $(this),
					$nextG  = $self.next("g"),
					$iconCheck = $(".seat-icon-check", $nextG),
					$iconResale = $(".seat-icon-resale", $nextG),
					is_selected =  ($iconCheck.css('display') != 'none') ? true : false, // hack for svg specific 
					thisData =  $self.data(),
					stringData  = JSON.stringify(thisData);
			*/
		
					// should activate hover
				  onSeatClick(this);
				  /*
					// for testing
					$self.attr('id','eddie');
					$iconCheck.attr('id','eddie2');		
					*/
		});
		
		

		$("#tix-filter").on("submit", function(e){
			e.preventDefault();
		
		//	$("#console").html("");
			//if (is_iPhone) alert('hit submit');

			if ( is_filterChange ){ 
				console.log("on submit...");
				//startPolling();
				updateIsmNList();
				//stopPolling();
			}
		
			return false;
			
		});
		/*
		.on("change", function(e){
			is_filterChange = true;
			console.log("is_filterChange: " + is_filterChange);
			//alert();
		});
		*/

    // sort : highest - lowest
		$("#dd-sort").on("change", function(e){
		 	console.log("sorting listin....");
			sort_val = $(this).val();
			sortListing();
		});


		 addSectionClicks();



  } // addListeners



		function onSeatClick ( seat ){			
				console.log("seat clicked...");		
				if ( $(seat).svgHasClass("seat-hover-on") ){
					hideSeatHover();
				}
				else {
					centerSeat(seat);		
				}
		}

		function getSeatState ( seat ) {

					if ( $(seat).svgHasClass("seat-selected") )
							return "selected";
					else if ( $(seat).svgHasClass("seat-hover-on") )
							return "hover-on";
		}

		function centerSeat( seat ){

							console.log("center seat...");

					  	if ( !animFrame ) {


					  		$(seat).attr('id','eddie');
							
					  		// zoom into section clicked
					  		var desZoom = maxZoom, // @ 169, circles have width of 44px
					  				thisID 	= $(seat).attr("id"),
					  				bbox 		= document.getElementById(thisID).getBBox(),
					  				zoomX 	= bbox.x + (bbox.width / 2),	  			
					  				zoomY			= bbox.y - (84/desZoom * 100);// 62  //95 (oldest) 


					  		    updateSeatHover(seat);

							  		// return;
							  		$svgShell.smoothZoom("focusTo",{
											x: zoomX,
											y: zoomY,							
											zoom: desZoom, // remove if zoom doesn't change
											speed: 10
										});

							 	$(seat).removeAttr('id'); // important! needs to be removed so next seat can center

								// 

					  	} // if ( !animFrame ) 
		} // centerSeat



		function updateSeatHover( seat ){

							hideSeatHover();
							awaitingSH = true;

							var is_seatSelected =	$(seat).svgHasClass("seat-selected"),
									is_seatResale   = $(seat).svgHasClass("seat-resale");
							// toggle classes
							if ( is_seatSelected ){
									//$seatHover.addClass("is-selected");
								changeHoverState("select");
								$(seat).svgAddClass("seat-hover-on");
							}
							else{
									//$seatHover.addClass("not-selected");
									changeHoverState("unselect");
									$(seat).svgAddClass("seat-hover-on");
							}

							// resale check
							if (is_seatResale) changeHoverState("resale");


							transmitSeatData( seat, $seatHover );
							// note: hover will display onPanComplete (from centerSeat())
								console.log("seat hover...");
		}

		function changeHoverState( action ){
							// this will toggle hover's state
							if ( action == "select" ){
								$seatHover.removeClass("not-selected").addClass("is-selected");
								$(".btn-remove", $seatHover).attr('data-pc-id', pcIds );
							}
							else if ( action == "unselect" ){
									$seatHover.removeClass("is-selected").addClass("not-selected");
							}

							if ( action == "resale" ){
								$seatHover.addClass("is-resale");
								
							}
							else {
									$seatHover.removeClass("is-resale");
							}
		}

		function hideSeatHover(){	
							// hide it
							if ( animats )
								$seatHover.fadeOut(50);
							else{ 
								//$seatHover.css('visibility','hidden');
								//setTimeout(function(){ $seatHover.hide() }, 500);
								$seatHover.hide();
							}

							var $prevHoverSeat = $("circle.seat-hover-on", $svgShell);

							if ( $prevHoverSeat.length > 0) {

										// clear out previously hovered seat
										$prevHoverSeat.svgRemoveClass("seat-hover-on");
							}
		}

		function showSeatHover(){
							// display it							
							if ( animats )
								$seatHover.fadeIn("slow");
							else{
								//$seatHover.css('visibility','visible').show();
								$seatHover.show();
							}
							 awaitingSH = false;
		}







		selectSeat = function ( seat ) {
							var $self 			= $(seat),
									is_selected = $self.svgHasClass("seat-selected"),
									is_resale 	= $self.svgHasClass("seat-resale");
							console.log("selectSeat() fired...");
						 	// CHECK MARK
				  		if ( !is_selected ) {
				  			
					  			console.log("NOT selected");
					  		var cx 	= $self.attr("cx"),
					  				cy 	= $self.attr("cy");
						  			
						  	// create svg checkmark
						  	var check = document.createElementNS("http://www.w3.org/2000/svg","path");
						  	check.setAttribute("class","seat-icons seat-icon-check");
						  	check.setAttribute("d","M7.209-6.81C6.824-7.206,6.201-7.203,5.818-6.805l-8.445,8.817l-2.899-2.474C-5.928-0.804-6.516-0.85-6.969-0.532c-0.552,0.386-0.697,1.163-0.324,1.735l3.305,5.068c0.115,0.175,0.264,0.34,0.438,0.471C-2.735,7.358-1.594,7.172-1,6.328l0.075-0.107L7.311-5.487C7.593-5.887,7.56-6.45,7.209-6.81");
					  		check.setAttribute("transform","translate("+cx+","+cy+")");
							 
							  if ( is_resale ) $self.next(".seat-icon-resale").hide();
					  		// insert checkmark
					  		$self.after(check).svgAddClass("seat-selected");

					  		// add pcId's
					  		$self.attr('data-pc-id', pcIds );
					  		changeHoverState("select");
					 
					 			// addToPreCart(seat)
					   		console.log("seat's new pc ID" + pcIds);

					   			// pre-cart
							  	// if ( !is_preCartShown ) $preCart.show();							  	
							  	addToPreCart( seat );
							
							  	// update pcids
							  	 pcIds++;

							  	 // add selected pin
							  	 selectedPin( $self, true );
					  	}
					  	else {
					  		//removeFromBag($(this));
					  		var pcId = $self.data('pc-id');
					  				console.log("already selected");

					  				$self.svgRemoveClass("seat-selected");
					  				$self.next(".seat-icon-check").remove();
					  				if ( is_resale )	
					  						$self.next(".seat-icon-resale").show();
					  			
					  				//changeHoverState("unselect");
					  				hideSeatHover();

					  				// remove selected pin
					  				selectedPin( $self );

					   	} 
		}

		function unSelectSeat( seat ) {			
							selectSeat(seat);						
		}

	


		function addToPreCart( seat ){
							var $seat 	= $(seat),
									is_seatResale   = $(seat).svgHasClass("seat-resale");

							// creat item mark-up
							var newLi = '<li class="cart-item gotoLink" data-link="review-page" data-group="'+ $seat.data('group') +'">';
									newLi +='<div class="item-img"><img class="seat-view" src="img/seatview/208_SeatViews_640x427.jpg"></div>';
									newLi += '<div class="item-info"><span class="seat-resale">Resale</span><span class="seat-sec">Promenade 208</span><span class="seat-row">3</span> <span class="seat-num">2</span><div class="hide"><span class="seat-dist">160</span><span class="seat-cx"></span><span class="seat-cy"></span></div><span class="pc-id hide">200</span> <a href="#" class="details-link">Details</a> </div>';
                	newLi += '<div class="item-price-edit"><div class="remove-link-wrap remove-link"><span class="item-price">226.00</span><a href="#">Remove</a></div></div></li>';

              $pcList.append(newLi);

							var $thisLI = $(">li:last", $pcList);
							transmitSeatData( $seat, $thisLI);

							// resale check
							if ( is_seatResale )	$thisLI.addClass("is-resale");


							// update cart
							calcPcTotal();

							if (!is_pcActive){
								$preCart.show();
								is_pcActive = true;
							}

							// lastly, to prevent another seat (behind hover) from selection
							hideSeatHover();
		}

		// jQuery(".findTix a").filter(function(){ return this.innerHTML === "More Info";})
		function addToCart(pickItem){


							if ( pickItem ) {
											var $self = pickItem;

											// retrieve data
							 				var imgSrc 	= $(".seat-view", $self).attr('src'),
							 						sect 		= $(".seat-sec", $self).text(),
							 						row 		= $(".seat-row", $self).text(),
							 						startSeat	= $self.data('seatstart') || 1,
							 						endSeat	= $self.data('seatend') || 2,
							 						price 	=  $(".item-price", $self).text() * filter_tixQty;


							 				injectToCart (imgSrc, sect, row, startSeat, endSeat, price);
							 						
							} //if ( pickItem )
							else { // kenny's bag

										

									 		// first fetch all bag items
									 		var $bagItems = $(".cart-item", $preCart),
									 				skipIndex = [];
						 					
						 					// if ($bagItems.length > 0) {
												 		$bagItems.each(function(index){
												 						console.log("bag index:" + index);

												 						if( index > 0 && skipIndex.indexOf( index ) > -1 ){ //skipIndex.length > 0 ){
												 							console.log("skipped!");
												 							 // if( skipIndex.indexOf( index ) > -1 ) 
												 							 	return true;
												 						}

												 						// about this item
														 				var $self = $(this),
														 						is_resale = $self.hasClass("is-resale");
														 				// retrieve data
														 				var imgSrc 	= $(".seat-view", $self).attr('src'),
														 						sect 		= $(".seat-sec", $self).text(),
														 						row 		= $(".seat-row", $self).text(),
														 						startSeat	= $(".seat-num", $self).text(),
														 						endSeat = null,
														 						price 	= parseInt( $(".item-price", $self).text() ),
														 						groupId = $self.data('group'),
														 						$group  =	$("[data-group="+ groupId +"]", $preCart);



														 				if ( $group.length > 1){
														 						console.log("multiple in group endIndex:" + endIndex);
														 						var $endSeat = $('[data-group="'+ groupId +'"]', $preCart).last(),
														 								endIndex	= $endSeat.index();
														 								endSeat = $endSeat.find('.seat-num').text().replace("Seat ", "");
														 								price = price * $group.length;

														 					
														 						skipIndex.push(endIndex);

														 				}
														 				else {

														 						console.log("only one in group");
														 				}
														 				
														 				injectToCart (imgSrc, sect, row, startSeat, endSeat, price);					

												 		});
											// }
							}// else


							function injectToCart (imgSrc, sect, row, startSeat, endSeat, price) {

							          // cart mark-up
							          var newLi = '<li class="cart-item">';
							              newLi += '<div class="item-img"><img src="'+ imgSrc +'"></div>';
							              newLi += '<div class="item-info">';
							              newLi += '<span class="item-title">';
							              newLi += (endSeat) ? filter_tixQty +' Tickets ' : '1 Ticket';
							              newLi += '<a href="#" class="details-link">Details</a></span>';
							              newLi += '<span class="item-details"> '+ sect +'<br>Row '+ row +', ';
							              newLi	+= (endSeat) ? 'Seats '+ startSeat +'-'+ endSeat : 'Seat ' +startSeat;
							              newLi	+= '</span></div>';
							              newLi += '<div class="item-price-edit">';
							              newLi += '<span class="item-price">'+ price.toFixed(2) +'</span>';
							              newLi += '<span class="item-edit"><a href="#" class="edit-link">Edit</a></span></div></li>';
							        

							          // inject
							          $(".cart-page .cart-list").append(newLi);

							          // tally subtotal
							          var $itemPrices = $(".cart-page .cart-list .item-price"), 
							          		subtotal 		= 0;

							          $itemPrices.each(function(){
							                var thisPrice = parseInt( $(this).text() );
							                subtotal += thisPrice;
							          });

							          $(".cart-subtotal-num").text( subtotal.toFixed(2) );

							          // update cart items amount
							          $(".cart-count").text($itemPrices.length);
							}

		} // addToCart()

		$("body").on("vclick", ".btn-add", function(e){
			console.log("clicked add");
			var $fromList =	$(this).parents(".picks-item"),
					$fromRev	=	$(this).parents(".review-page"),
					$pickItem = ($fromList.length > 0) ? $fromList : ($fromRev.length > 0) ? $fromRev : false;

				//	if ($pickItem.length == 0)  ;
			//console.log("is_fromListing: " + is_fromListing);

			addToCart( $pickItem );

		});


		removeSelectedSeat = function( link ){

						var pcId 	= $(link).attr('data-pc-id'),
								$seat 	=  getPcSeat(pcId);
								console.log("BEFORE unselected" + pcId );
								// un-checkmark
								unSelectSeat( $seat );
								console.log("after unselected" + pcId );
								// remove precart item
						 		$('[data-pc-id='+pcId+']', $pcList).parents('.cart-item').remove();
						 		//setTimeout(function(){ $('[data-pc-id='+pcId+']', $pcList).parents('.cart-item').remove() }, 500);	

						 		//update precart total
						 		calcPcTotal();
		}


		function calcPcTotal(){
							// total of items
							var $items =  $("> li", $pcList).not(".clone-li"),
									itemCount = $items.length,
									subtotal = 0;
							$(".pre-cart-qty").text( itemCount );

							// total cost					
							$items.find(".item-price").each(function(){
									subtotal += parseInt( $(this).text() );
							});

							// update
							$(".pre-cart-total").text(subtotal.toFixed(2));

							// hide pre-cart if empty
							if ( itemCount == 0 ) {
									$preCart.hide();
									closeBagTray();
									is_pcActive = false;						
							}

		}

		function getPcSeat( pcId ) {
					var thisPcId = pcId;

					return $('circle.seat-avail[data-pc-id='+thisPcId+']');

		}





		// pre-cart
		$pcFace.on("click", function(e){
					$preCart.toggleClass("open");
		});

		function closeBagTray(){
					$preCart.removeClass("open");
		}

		function closeFlyOuts(){
				hideSeatHover();
				closeBagTray();
				hidePickPinsHover();
		}


	 function addSectionClicks() {


	 // $sectionAvail.bind("vclick tap",function(e) {	 // zoom section to seet level		  	
 	$sectionAvail.bind("vclick",function(e) {	 // zoom section to seet level		  	
			  	var is_coversOn = $zoomContainer.hasClass("covers-on"), //$svgMap.svgHasClass("covers-on"),
			  			thisID = $(this).attr("id"),
			  				bbox = document.getElementById(thisID).getBBox();

			  	if ( is_coversOn  && !animFrame ) {
				  		// zoom into section clicked	
				  		 	console.log("section clicks...");

					  		var	zoomX = bbox.x * 10 + bbox.width * 10 / 2,
					  				zoomY = bbox.y * 10 + bbox.height * 10 / 2;
									

					  		$svgShell.smoothZoom("focusTo",{
									x: zoomX,
									y: zoomY,
								  zoom: coversThreshold + 20,
									//zoom: 100, //temp for testing
									speed: 10
								});
			  	}

	  });


		 $svgShell.bind("vclick",function(e) { // missed tap, zoom in closer for seat
	  	 			

	  				var is_coversOn = $zoomContainer.hasClass("covers-on"); //$svgMap.svgHasClass("covers-on");

	  				console.log("maxZoom:" + maxZoom );
	  				console.log("zoomRatio:" + zoomRatio );
	  	
					 	if (!is_coversOn && !animFrame) {

					 					closeFlyOuts();

					 					if ( zoomRatio == maxZoom ) return;

					  				console.log("MAP DIV CLICKED /////////////////////////");
							  		console.log("without covers...");
							  		// at seat level, zoom in when seat target is missed
							  		// focus to the area

										var $self 	= $(this),
												adjZoom	= zoomRatio + 60,
												desZoom = zoomRatio, // ( adjZoom < maxZoom) ? adjZoom : maxZoom,
												posX = $self.offset().left,
						            posY = $self.offset().top,
						            clickX = e.clientX - posX,
						            clickY = e.clientY - posY,				       
						         		adjX = (clickX / desZoom) * 100, // conversion for zoomRatio
						         		adjY = (clickY / desZoom) * 100;

						       
										addZoomAmount = desZoom + 60;

									

							  		$svgShell.smoothZoom("focusTo",{
											x: adjX, //centerX,
											y: adjY, //clickY, //centerY,
											//zoom: desZoom, // + 60,
											speed: 10
										});


										//goZoom = setTimeout(function(){ startAutoZoom() }, 500);	
										setTimeout(function(){ startAutoZoom() }, 500);	

										function startAutoZoom(){
			 									$svgShell.smoothZoom("focusTo",{
													x: centerX,
													y: centerY,
													zoom: zoomRatio + 60,
													speed: 10
												});							
										}		
					  	}
	  });

	}
var $pickPinHovers;

	function addPicksPins() {
		console.log("addPicksPins");
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
  				bboxRatio = bbox.width / bbox.height,
  				bboxX = (bboxRatio > 1 || bbox.width > 50) ? bbox.x + bbox.width / 2 : bbox.x,
  				bboxY = (bboxRatio < 1 || bbox.height > 50) ? bbox.y+ bbox.height / 2 : bbox.y,
  				label = $(this).data("label"),
  				$topItem = $(".picks-item[data-label='"+label+"']"),
  				price = $topItem.data('price');
  		if (bboxRatio < 1) { bboxX += 40; }
  		allY.push(bboxY);
  		pinsArray.push('<div class="item mark pin-top-pick" data-label="'+label+'" data-position="'+bboxX+','+bboxY+'" data-show-at-zoom="0" data-allow-scale="false"><div><img src="img/icon-top-pick.png" class="pin" /></div></div>');
  		hoverDataStr += '<div class="item mark hover-top-pick" data-label="'+label+'" data-position="'+bboxX+','+bboxY+'" data-show-at-zoom="0" data-allow-scale="false"><div><div class="panel"><span class="title">'+label+'</span><br /> $<span class="price">'+price+'</span><span class="ea">ea</span><b class="caret down"></b></div></div></div>';
  	});
		for (i=0;i<pinsArray.length;i++) {
	  	highestY = Array.min(allY);
	  	place = allY.indexOf(highestY);
	  	allY[place] = Array.max(allY) + 1;
	  	pinsStr += pinsArray[place];
	  }

		$landmarks.prepend(hoverDataStr).prepend(pinsStr);
  	$svgShell.smoothZoom("refreshAllLandmarks");
  	var i = 0,
  			timing = 50;
  	var pinsInterval = setInterval(function() {
  		$(".pin-top-pick").eq(i).toggleClass("on");
  		i++;
  		if ($(".pin-top-pick").length === i) { clearInterval(pinsInterval); }
  	},timing);
  	// display click-top-pick on click at section level, hover at seat level
  	//
  	$pickPinHovers = $(".hover-top-pick[data-label] .panel");

  
  	$(".pin-top-pick").on("vclick",function() {
  		var $self = $(this),
		  		label = $self.data('label'),
		  		$pinHover = $(".hover-top-pick[data-label='"+label+"'] .panel")
		  		is_visible = ($pinHover.css('visibility') == 'visible') ? 'hidden' : 'visible';

		  // reset - hide all other hovers, but this this one
	 		$pickPinHovers.not($pinHover).css('visibility', 'hidden');
	 		// now just this one
  		$pinHover.css('visibility', is_visible);  		
		});  
	}

	function hidePickPinsHover(){
		$pickPinHovers.css('visibility', 'hidden');
	}


	function addSectionBubbles() {
	//	return;
  	var bubblesStr = "",
  			allY = [],
  			highestY,
  			place,
				bubbleArray = [];
		//$sectionAvail = $(".svg-sect-avail");		
  	$sectionAvail.each(function() {
  		var thisID = $(this).attr("id"),
  				section = thisID.replace("s-",""),
  				bbox = document.getElementById(thisID).getBBox(),
  				zoomX = bbox.x * 10 + bbox.width * 10 / 2,
  				zoomY = bbox.y * 10 + bbox.height * 10 / 2, // / 2,
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
	  	// addSectionHovers(thisID,sectionName,lowestPrice,highestPrice,bbox.width,bbox.height);
  	});
		for (i=0;i<bubbleArray.length;i++) {
	  	highestY = Array.min(allY);
	  	place = allY.indexOf(highestY);
	  	allY[place] = Array.max(allY) + 1;
	  	bubblesStr += bubbleArray[place];
	  }
		$landmarks.prepend(bubblesStr);
  	$svgShell.smoothZoom("refreshAllLandmarks");
  }


   function selectedPin($el,add) {
  	// $el is seat object
  	var seatId = $el.data('pc-id'), //$self.data('pc-id')
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
		$landmarks.append('<div class="'+newClasses+'" data-position="'+newX+','+(newY-40)+'" data-show-at-zoom="0" data-allow-scale="false"><div><div class="panel dark"><div class="total">'+total+'</div><b class="caret down"></b></div></div></div>');
  	$svgShell.smoothZoom("refreshAllLandmarks");
  }





	function isiPhone(){
		return (
				(navigator.platform.indexOf("iPhone") != -1) ||
				(navigator.platform.indexOf("iPod") != -1)
		);
	}


	// get URL Param
	function getUrlVar(key){
		var result = new RegExp(key + "=([^&]*)", "i").exec(window.location.search); 	
		return result && result[1] || ""; 
	}

	  

/* TEMPORARY functions */


}); // end closure