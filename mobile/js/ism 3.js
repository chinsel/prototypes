$(function() {

	// quick toggle :  parseData(true) vs SVG Full Map(false)
	var is_parseData = false;

	is_parseData = ( getUrlVar('pd') ) ? true : is_parseData;



	// dom selectors
	var $svgShell   = $("#map1a"),
			$svgMap,
			$svgSeats,
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
			$countContainer = $(".count-container");

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


	// filter values
	var is_topPicksOn = true,
			is_resaleOn = true,
			is_filterChange = false,
			is_qtyChange = false,
			sort_val =  "lowest",
			filter_tixQty = 2,
			filter_priceMin = 0,
			filter_priceMax = 1000;

	var $groupLeadsFiltered,
			$sortedGroupLeads;

// Zoom Data Global Variables
	var centerX = 0,
			centerY = 0,
			normX,
			normY,
			zoomRatio;
			
	// global var flags
	var isMapExpanded = false,
			is_FirstPass = true;
	
  init();

    /* Functions */
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
  
	function init(){
		 console = { "log" : function(arg){ $("#console").append(arg + "<br / >"); } };
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
			$.get( "data/svg-map-min.txt" )
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

														} // if (data_avail[i]["SeatId"] == seatId)
									

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
								storedSeats += '<circle class="seat '+ seatClass +'"  data-section="'+ sectId +'"  data-row="'+ rowId +'"  data-seat="'+ seatId +' cx="'+ seatX +'" cy="'+ seatY +'" r="13"/>';
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
		// fires from onPanComplete()
		is_FirstPass = false; 
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
		$svgSeats = $("#svg-seats");

		// clear vars
		svgMapString = null; 
		storedSeats = null;  
		storedSeats = "";           
	}

	function updateIsmNList(){
		// fired from: 'see all' or filter form
		console.log("updateIsmNList");
		// list
		startListPolling();
		// bs, but timeout is needed
		setTimeout(getFilterValues, 500);
	}



	function getFilterValues(){
		// may be fired from:  filter submit, resfreshList 
		// the following selectors and vars are for testing
		// and will be updated once filter pane has been implemented
		console.log("getFilterValues");

		// was there a change?
		if ( is_filterChange ) {
			sort_val    = $("#dd-sort").val();
			filter_tixQty =  $("#dd-qty").val();
			filter_priceMin = $("#dd-price-start").val();
			filter_priceMax = $("#dd-price-end").val();
			is_resaleOn = $("#resale-checkbox").is(":checked");
			is_topPicksOn = $("#toppicks-checkbox").is(":checked");

			
			setTimeout(filterSeats, 500);
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
						// fired by: onParseDataComplete(),  getFilterValues()
						// used to update seats on map for grouping or in/out filter criteria
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
										is_qtyChange = false; 
						
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
					
						if (is_FirstPass){
							filterGroupLeads();
							genListing();
							addSmoothZoom();
							addListeners();
						}
						else
							seatsInView(); // gather seats for listing. secondary in conditional since 'zoomData' isn't ready    				     
	}

   

  

  function filterGroupLeads(){
		console.log("filterGroupLeads");
		var adjClass = (is_topPicksOn) ? ".top-pick" : "";  
 
		$groupLeadsFiltered = $('.seat-avail'+adjClass+'[data-group-lead]', $svgSeats).not(".outside-filter");
  }

  function genListing(){  
		console.log("genListing");
		sortGroups();
  }


  
  // attach sort func 
  function sortLowHighPrice(a,b){ return $(a).data('price') - $(b).data('price');  }
  function sortHighLowPrice(a,b){ return $(b).data('price') - $(a).data('price');  }
  function sortNearFarDistance(a,b){ return $(a).data('distance') - $(b).data('distance');  }
 // function sortFarNearDistance(a,b){ return $(b).data('distance') - $(a).data('distance'); }
 // function sortBest(a,b){ return $(a).data('best') - $(b).data('best');  }


  function sortGroups(){
		console.log("sortGroups");

		var $gls = (is_FirstPass) ? $groupLeadsFiltered : $groupLeadsFiltered.filter(".is-inview");

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
									thisDist = $self.data('distance'),
									thisLabel = $self.data('label') || "",
									thisLastSeat = $self.siblings('[data-group="'+ thisGroup +'"]').last().data('seat'),
									is_resale = $self.svgHasClass("seat-resale"),
									is_topPick = $self.svgHasClass("top-pick"),
									thisClass = "";

									if (is_resaleOn && is_resale) thisClass = "seat-resale";
									if (is_topPick) thisClass += " top-pick";


								storeListItem(thisClass, thisSect, thisRow, thisSeat, thisPrice, thisDist, thisLabel, thisSectName, thisSeat, thisLastSeat, thisGroup);

								if ( index > 25 ) return false;
						});

					 
						injectListing();
    }



	function storeListItem(seatClass, sectId, rowId, seatId, seatPrice, dist, seatSpecial, sectName, startSeat, endSeat, groupId){
		// for testing only!!! <br>'s' and markup will need to be edited
		/*
		// storedList += seatSpecial + '<img src="img/seatview/'+ sectId +'_SeatViews_640x427.jpg" />';
		storedList += '<li style="background-image: url(img/seatview/'+ sectId +'_SeatViews_640x427.jpg);" class="seat-ticket '+ seatClass +'" data-section="'+ sectId +'"  data-row="'+ rowId +'"  data-start="'+ seatId +'" data-end="'+ endSeat +'" data-price="'+ seatPrice +'" data-distance="'+ dist +'" data-group="'+ groupId +'">'; //data-sort-default="'+ sortDefault +'" data-sort-special="'+ sortSpecial +'" data-sort-deals="'+ sortDeals +'">';
		storedList += '<div class="seat-info">';
		// storedList += ( seatSpecial ) ? '<span class="seat-special">'+ seatSpecial +'</span>' : "";
		storedList += ( seatSpecial ) ? '<span class="seat-special">'+ seatSpecial +'</span>' : '<span class="seat-special">Top Pick (Needs Label)</span>';
	
		// storedList += '<span class="seat-location">'+ sectName + " Row " + rowId +", Seats " + startSeat +" - "+ endSeat +'</span>';
		storedList += '<span class="seat-location">'+ sectName + " Row " + rowId +", "+ filter_tixQty +' Seats </span>';
		storedList += '<a class="seat-details" href="#">Seat details</a>';
		storedList += '<span class="seat-price">&#36;'+ seatPrice + " ea" +'</span>';
	                
		// storedList += dist + " ft from stage";
		storedList += '</div>'; // .seat-info
		storedList += '</li>';
		// startSeat = endSeat = null;
		*/

		storedList += '<li class="picks-item " data-section="'+ sectId +'"  data-row="'+ rowId +'" data-price="'+ seatPrice +'" data-distance="'+ dist +'" data-group="'+ groupId +'">'; //data-sort-default="'+ sortDefault +'" data-sort-special="'+ sortSpecial +'" data-sort-deals="'+ sortDeals +'">';
    storedList += '<div class="pick-view-wrapper">';
    storedList += '<img src="img/seatview/'+ sectId +'_SeatViews_640x427.jpg" class="seat-view">';
    storedList += '<img src="img/v2/mini-map.png" class="mini-map">';
    storedList += '<img src="img/v2/mini-map-indicator.png" class="minimap-indicator">';          
    storedList += '</div>';
    storedList += '<div class="pick-info-wrapper">';
    storedList += '<a href="#"><div class="seat-info">';
    storedList += ( seatSpecial ) ? '<h2 class="seat-type">'+ seatSpecial +'</h2>' : '<h2 class="seat-type">Top Pick (Needs Label)</h2>';
    storedList += '<div class="seat-loc">'+ sectName + ', Row ' + rowId + ', ' + filter_tixQty +' Seats</div>';
    storedList += '<div class="more-seat-info">';
    storedList += ( seatClass.indexOf("seat-resale") > -1 ) ? '<span class="seat-resale">Resale</span>' : ''; 
    storedList += 'Seat details';
    storedList += '</div>';
    storedList += '</div></a>';
    storedList += '<div class="price-info">';
    storedList += '<div class="seat-price">&#36;'+ seatPrice + ' ea</div>';
    storedList += '<button class="btn btn-action">Add to Cart</button>';
    storedList += '</div></div></li>';
	}

    

    
	function injectListing(){
		console.log("injectListing");
		// toggle polling, inject listing, update jSelectors and dom text           
		endListPolling();
		if ($ticketLIs) $ticketLIs.remove();
		console.log("inject list...");
		$ticketList.append( storedList );
	 
		updateListCount();

		// clear vars
		storedList = null; 
		storedList = "";
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

	 function startListPolling(){
		console.log("startListPolling");
		$listLIs.hide();
		$countContainer.hide();
		//  $listPoll.show();
	}

	function endListPolling(){
		console.log("endListPolling");
		//$listPoll.add($noListing).hide();
		$noListing.hide();
		$countContainer.show();
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
				endListPolling();
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
				// console.log ("HAS CLASS //////////// " + hasClass);
				return hasClass;
		/*
		if ( hasClass )
				return true;
		else
				return false;
		*/
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
				updatedClasses = $(selector).attr('class').replace(className, '').replace('  ', ''); // the second 'replace' is to prevent space buildup
           
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

	function addSmoothZoom(){
		console.log("addSmoothZoom");

		var maxZoom = 2000,
				midZoom = 150,
				showAtZoom = 100,
				minZoom = 10;
            

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
	$(".zoom-in").on("vmousedown",function(e) {
		console.log("zoom in");
		e.preventDefault();
		$svgShell.smoothZoom('zoomIn');
	});
	$(".zoom-out").on("vmousedown",function(e) {
			console.log("zoom out");
		e.preventDefault();
		$svgShell.smoothZoom('zoomOut');
	});

 }


  function onPanning(zoomData){
	 setZoomData(zoomData);
		if (is_FirstPass) return;

		// section cover toggle
		if( zoomRatio > coversThreshold && !is_seatsShown ){
				toggleCovers(true);  
				if (!isMapExpanded) {
					//expand map on seat level and disable trigger on list.
					expandMap();
				}
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
		if (animFrame == 1) { 
			$("#console").html("");
			console.log("onPanning");
			prevZoom = zoomRatio; 
		} 
		
		if (animFrame == 15){
			//	startListPolling();  
		}  
  }

  function onPanComplete(zoomData){
		console.log("onPanComplete");
		setZoomData(zoomData)
		if (!is_FirstPass){

				// reset animation frame
				animFrame = 0;
				if (is_seatsShown) {
					updateSpotLocation();               
				}         
				// seatsInView();
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
	}

  //* end - SMOOTH ZOOM  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
  
  // selectors
  var $mapFinder = $(".map-finder"),
      $mapSpot    = $(".spot", $mapFinder);

  // gen vars
  var coversThreshold = 10,
      prevZoom = "",
      animFrame = 0;

  // flags
  var is_seatsShown  = false;

  function toggleCovers(showSeats){
		console.log("toggleCovers");
		var $svgSects = $(".svg-sect"),
				$sectAvail = $(".svg-sect-avail"),
				$sectUnavail = $(".svg-sect-unavail");        

		is_seatsShown = +!is_seatsShown; 

		$svgMap.svgToggleClass("covers-on");
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
		// $(".seat-avail").on("vclick", function(e){
		$("circle.seat").on("vclick", function(e){	
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
			
			// for testing
			$self.attr('id','eddie');
			$iconCheck.attr('id','eddie2');
			alert( stringData );

		});


		 // up/down listing tray
		$(".listing-toggler").on("vclick", function(e){
			toggleMap();
		});


		// "see all seats"
		$(".see-all-trig").on("vclick", function(e){
			// $ticketList.removeClass("top-picks-on");
			 $(this).hide();
			 is_topPicksOn = false;
			 updateIsmNList();
		});


		// temp using these form dropdowns til filter page is built
		// testing only: selectors may change
		$("#ism-filter-form").on("submit", function(e){
			e.preventDefault();
			$("#console").html("");
			if (is_filterChange) updateIsmNList();
			$(".map-filter").css({
				right: -157
			});
			return false;
			
		})
		.on("change", function(e){
			is_filterChange = true;
			console.log("is_filterChange: " + is_filterChange);
			//alert();
		});

		$("#dd-qty").on("change", function(e){
			is_qtyChange = true;
			console.log("is_qtyChange: " + is_qtyChange);
		});

		 $("#dd-sort").on("change", function(e){
			sort_val = $(this).val();
			sortListing();
		});


		// this disables body elastic scroll
		// todo: revist, for this may be effecting smoothZoom's performance
		/*
		$("body").on("touchmove", function(e){ e.preventDefault();   });
		$(".ticket-list").on('touchmove', function(e){  e.stopPropagation(); });
		*/
  }

		function toggleMap(){
			console.log("toggleMap");
			$(".listing-tray").toggleClass("listing-tray-close");
				
				if($(".listing-tray").hasClass("listing-tray-close")){
					resizeMap(430);
					isMapExpanded = true;
					
				}
				else { 
					resizeMap(210);
					isMapExpanded = false;
					if(is_seatsShown) {
						//$svgShell.smoothZoom('Reset');
						$svgShell.smoothZoom('focusTo', {
							x: centerX,
							y: centerY,
							zoom: 9
						});
					}
					if(zoomRatio <= 4){
						$svgShell.smoothZoom('Reset');
					}
				}
		}
		
		function expandMap(){
			console.log("expandMap");
			$(".listing-tray").addClass("listing-tray-close");
			resizeMap(430);
			isMapExpanded = true;
		}
		
		function resizeMap(newHeight){
			console.log("resizeMap");
			$svgShell.smoothZoom('resize', {
				width: 320, 
				height: newHeight
			});
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

	$(".dummy-filter").on("vclick", function(e){
		e.stopPropagation();
		$(".map-filter").css({
			right: 0
		});
	});
	
	$(".burger-link").on("vclick", function(e){
		e.preventDefault();
		$("#console").toggleClass("show");
	});


}); // end closure