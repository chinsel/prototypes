$(function() {
  

// this version is for CIRCLE seats

  var $pageStatus = $("#page-status"); // for testing only


  // dom selectors
  var $svgShell   = $("#map1a"),
      $seatShell  = $("#svg-seats"),
      $ticketList = $(".ticket-list");

  // stage
  var $stage      = $("#stage-center"), 
      stageTop    = $stage.position().top,
      stageLeft   = $stage.position().left;    


  
  // Data storage  
  var data_geo,     
      data_avail,
      svgMapString;

    function init(){
      fetchData();      
    }

    init();

    // Grab data from JSON  
    function fetchData(){
        fetchSeats();
        
        function fetchSeats(){
          $.get( "data/svg-map.txt" )
          .done(function( data ) {
            svgMapString = data;  
            fetchGeometry();
          })
          .fail(function(data) {
            alert("error" + String.data);
          }); 
        }
        
        function fetchGeometry(){  
          $.getJSON( "data/22004B66E96893C4-201401151851.geometry.json" )
          .done(function( json ) {
            data_geo = json;  
            //init();   
            //parseData();
            //$pageStatus.text("Generating Seats...");  
            fetchAvail();
          }); 
        }

        function fetchAvail() {
            $.getJSON( "data/available.json" )
            .done(function( json ) {
              data_avail = json;
              parseData();  
              
            }); 
        }

      
      
    } 

    
    // stored data   
    var storedSeats = "",
        storedList = "";
    

   
    
    function parseData() {
              
              

              var scaleAt = 1;
             
              var mapW = data_geo.width,
                  mapH = data_geo.height;


              // container width & height
              // $seatShell.css({'width': mapW, 'height': mapH}); 
              
              
              
              var shapes = data_geo.shapes; // for image maps

              // from geo
              var sectName,
                  sectId,
                  rowId,
                  seatId,
                  seatX,
                  seatY,
                  seatPrice,
                  sortDefault,
                  sortSpecial,
                  sortDeals,
                  startSeat,
                  endSeat;    

             
              function storeSeat( seatClass, seatSpecial ){  

                      if (seatClass == "seat-unavail") { // immediately quit if unavailable seat!                
                        storedSeats += '<circle class="seat '+ seatClass +'"  cx="'+ seatX +'" cy="'+ seatY +'" r="13"/>';
                        return;
                      }   



                      seatSpecial = seatSpecial || "";

                      // calc distance
                      var dx = stageLeft - seatX,
                          dy = stageTop - seatY,
                          distance = Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2)),
                          dist = Math.abs( Math.ceil( distance / 20 )  ); // adjust to more practical number
                      

                      /* SVG - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
                      storedSeats += '<circle class="seat '+ seatClass +'" data-section="'+ sectId +'"  data-row="'+ rowId +'"  data-seat="'+ seatId +'" data-distance="'+ dist +'" cx="'+ seatX +'" cy="'+ seatY +'" r="13"/>'; // fill="#DDDDDD"
                      
                      // sibling <g>
                      storedSeats += '<g class="g-seat-icons" transform="translate('+ seatX +','+ seatY +')"> ';

                            /* seat icons */

                            // "check-mark" - selected seat
                            storedSeats += '<path class="seat-icon-check" d="M7.209-6.81C6.824-7.206,6.201-7.203,5.818-6.805l-8.445,8.817l-2.899-2.474C-5.928-0.804-6.516-0.85-6.969-0.532c-0.552,0.386-0.697,1.163-0.324,1.735l3.305,5.068c0.115,0.175,0.264,0.34,0.438,0.471C-2.735,7.358-1.594,7.172-1,6.328l0.075-0.107L7.311-5.487C7.593-5.887,7.56-6.45,7.209-6.81"/>';
                            
                            // resale icon
                            if ( seatClass == "seat-resale")
                              storedSeats += '<g class="seat-icon-resale"><path d="M3.965-3.178L2.493-2.744l1.785,1.417l1.795,1.428l0.725-2.186L7.5-4.26L5.827-3.747C4.589-5.666,2.459-6.959,0.017-6.959l0,0c-3.167,0-5.811,2.142-6.669,5.019h1.963c0.77-1.829,2.576-3.134,4.707-3.134C1.601-5.074,3.017-4.327,3.965-3.178z"/><path d="M-3.954,3.19l1.472-0.435l-1.785-1.417l-1.806-1.428l-0.714,2.187L-7.5,4.261l1.684-0.513c1.238,1.93,3.368,3.201,5.811,3.212V6.948c3.167,0,5.821-2.119,6.658-5.007H4.701c-0.77,1.84-2.587,3.133-4.707,3.133C-1.601,5.074-3.017,4.339-3.954,3.19z"/></g>';
                            

                      // sibling <g> close
                      storedSeats += '</g>';
                      /* SVG - end  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */




                      /* LISTING  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
                      if (endSeat){
                          // calc pin position
                          var thumbW  = 143,
                              thumbH  = 116,
                              pinX    = ((seatX) / mapW) * 100,
                              pinY    = ((seatY) / mapH) * 100;     
                              
                              /*
                              pinX    = (seatX - 9) / thumbW,
                              pinY    = (seatY - 25) / thumbH;        
                              */
                          // for testing only!!! <br>'s' and markup will need to be edited
                          storedList += '<li class="'+ seatClass +'" data-section="'+ sectId +'"  data-row="'+ rowId +'"  data-seat="'+ seatId +'" data-distance="'+ dist +'" data-price="'+ seatPrice +'" data-sort-default="'+ sortDefault +'" data-sort-special="'+ sortSpecial +'" data-sort-deals="'+ sortDeals +'">';
                         // storedList += seatSpecial + '<img src="img/seatview/'+ sectId +'_SeatViews_640x427.jpg" />';
                          storedList += "<br />";
                          storedList += sectName;
                          storedList += "<br />";
                          storedList +=  "Row " + rowId +", Seats " + startSeat +" - "+ endSeat;
                          storedList += "<br />";
                          storedList += seatPrice + " ea";
                          storedList += "<br />";
                          storedList += '<div class="map-thumb">';
                          storedList += '<span class="map-pin" style="left:'+ pinX +'%; top:'+ pinY +'%"></span>';
                          storedList += '</div>';
                          // map thumb+pin here
                          storedList += dist + " ft from stage";
                          storedList += '</li>';


                          startSeat = endSeat = null;
                      }
                       /* LISTING - end  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
              }

            

                
              // begin loop thru
              // SHAPES
              $.each(shapes, function ( key, shape ) {
                  //console.log(key);
                  //console.log(shape.sections);
                  
                  // TODO later - image maps here
                  
                  
                  
                    
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
                                  startSeat = endSeat = null;
                                  sectName = data_avail[i]["SectionName"];

                                  ibmAvailSect = i;
                                  isSectAvail = true;   
      
                                  break;
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

                                        startSeat = endSeat = null;

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

                                                                      startSeat = endSeat = null;

                                                                      // if available seat number surpasses current geo number, skip! (avoid loop and wait for geo num to catch-up) 
                                                                      storeSeat("seat-unavail");
                                                                      return true;

                                                              } // if (availSeat > seatId)
                                                              else if (availSeat == seatId){                                                          

                                                                      // seat class and label
                                                                      var thisClass = "seat-avail", 
                                                                          thisLabel = "";


                                                                      // seat range - group
                                                                      if (!startSeat) startSeat = availSeat;
                                                                      else if (startSeat && !endSeat) endSeat = availSeat;


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

                                                                      else if (thisArr["Wheelchair Accessible"])
                                                                              storeSeat("seat-avail");
                                                                       

                                                                      // resale check
                                                                      thisClass = (thisArr["Resale"]) ? "seat-resale" : thisClass;


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
             
              atParseDataComplete();
            
    } // parseData


  

    function atParseDataComplete(){      
        injectSvg();

        //$ticketList.html( storedList );

        bindSeatsEvents();          
    }

   function injectSvg(){         
						var storedSvg = svgMapString + '<g id="svg-seats">' + storedSeats + '</g></svg>';

            $svgShell.append(storedSvg);
            addSmoothZoom();
   }



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

	function visibleSeats(zoomData){
		var normX = parseInt(zoomData.normX);
		var normY = parseInt(zoomData.normY);
		var centerX = parseInt(zoomData.centerX);
		var centerY = parseInt(zoomData.centerY);
		var startPt = [normX,normY];
		var endPt = [centerX + (centerX-normX), centerY + (centerY-normY)];
		
		$("#svg-seats > .seat").each(function(index) {
			var $thisC = $(this);
			if ( (startPt[0] < $thisC.attr("cx")) && 
						(startPt[1] < $thisC.attr("cy")) && 
						(endPt[0] >= $thisC.attr("cx")) && 
						(endPt[1] >= $thisC.attr("cy")) ){
				$thisC.show();
			}
			else $thisC.hide();
		});
		
		//console.log("startPt: [" + startPt[0] + ", " + startPt[1] + "]");
		//console.log("endPt: [" + endPt[0] + ", " + endPt[1] + "]");
	}

  function onPanning(zoomData){

          // console.log("panning");
          // section cover toggle
          if( zoomData.ratio > .2 && !is_seatsShown ){
              toggleCovers(true);  
          }      
          else  if( zoomData.ratio <= .2 && is_seatsShown ){
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
						//visibleSeats(zoomData);
//          console.log("pan complete");
//          console.dir(zoomData);
					//miniMap();

           // calc distance
           /*
            var dx = stageLeft - seatX,
                dy = stageTop - seatY,
                distance = Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2)),
                dist = Math.abs( Math.ceil( distance / 20 )  ); // adjust to more practical number
            */
					
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
            // console.dir( $(this).data() );

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
            //$self.attr('id','eddie');
            //$iconCheck.attr('id','eddie2');
            //alert( stringData );

          });
  }



});