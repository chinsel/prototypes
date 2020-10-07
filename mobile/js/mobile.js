 $(function() {

  // cache selectors
  var $fakeLinks      = $('a[href="#"]'),
      $pageWrappers   = $('.page-wrapper'),
      $listPage       = $('.list-page'),
      $listArea       = $('.listing-area'),
      $ismArea        = $('.ism-area'),
      $togViewButns   = $('.toggle-view button'),
      $aboutPicksPage = $('.about-picks-page'),
      $filtersPage    = $('.filters-page'),
      $cartPage       = $('.cart-page'),
      $pollingPage    = $('.polling-page'),
      $resetFilters   = $('#resetFilters'),
      $reviewPage     = $('.review-page'),
      $gotoLinks      = $('.gotoLink'),
      $tixQty         = $('#tixQty'),
      $btnQty         = $('.btn-qty'),
      $qtyDec         = $('#qtyDec'),
      $qtyInc         = $('#qtyInc'),
      $filterItems    = $('.filter-item'),
      $picksList      = $('.picks-list', $listPage),
      $picksItems     = $('.picks-item'),
      $addBtn         = $('.add-btn'),
      $dotNav         = $('.dot-nav'),
      $viewDot        = $('.view-dot'),
      $mapDot         = $('.map-dot'),
      $seatViews      = $('.seat-views'),
      $reviewImg      = $('#reviewImg'),
      x               = 1;      


  // filter values
  is_topPicksOn = true,
  is_resaleOn = true,
  is_filterChange = false,
  is_qtyChange = false,
  sort_val =  "lowest",
  filter_tixQty = 2,
  filter_priceMin = 0,
  filter_priceMax = 1000;

 
  // testing 
  var is_testing    = ( getUrlVar('t') ) ? true : false;


  // hide these pages on load 
  if (!is_testing) $aboutPicksPage.add($filtersPage).add($reviewPage).add($cartPage).hide(); //.add($pollingPage).hide();

  if (is_testing) $(".review-action").removeClass("fixed");



  // stop fake links from jumping the browser page location
  $('body').on("click", 'a[href="#"]', function(e) {
    e.preventDefault();
  });


  
  // increase/decrease ticket quantity
  $btnQty.click(function(e){
    var qty = parseInt($tixQty.val());
    var action = $(this).attr('id');

    if (action == 'qtyDec' && qty != 1) {
      qty--;
    }
    else if (action == 'qtyInc') {
      qty++;
    }

    $tixQty.val(qty);
    is_qtyChange = true;
    return false; // prevent form submission
  });


  // submit form
  // $("#tix-filter .cancel-btn").click(function(e){     e.preventDefault();    });

  $("#tix-filter .apply-btn").click(function(e){
     e.preventDefault();
     $("#tix-filter").submit(); // goto ism.js for filter value submission

  });



  // hide and then show the requested page
  function goToLink(link){
       if (is_testing) return;

      var dLink =  $(link).data('link'),
          page  = '.' + dLink;


      if( dLink == "ism-area"){
          $listArea.hide();
          $ismArea.show();
         $togViewButns.removeClass("btn-active");
         $(link).addClass("btn-active");
         console.log("clicked map");
      }
      else if ( dLink == "listing-area"){
          $ismArea.hide();
          $listArea.show();
         $togViewButns.removeClass("btn-active");
         $(link).addClass("btn-active");        
          console.log("clicked list");
      }
      else {
        $pageWrappers.hide();
        $(page).show();
        $(window).scrollTop(0);
      }
  }



  // $gotoLinks.click(function(e){
  $('body').on("click", ".gotoLink", function(e){  //
      e.stopPropagation();
      e.preventDefault();
      goToLink(this);   
  });

  // Top Picks List 
  $picksList.on("click", ".picks-item",function(e){
          var $self = $(this);       
          resetTransClasses();
          $reviewPage.addClass("from-listing");
          transmitSeatData( $self,  $reviewPage );          
  });

  // Pre-Cart List
  $(".pre-cart").on("click", ".cart-item",function(e){
          var $self = $(this);           
         resetTransClasses();
          $reviewPage.addClass("from-pre-cart");
          transmitSeatData( $self,  $reviewPage );          
  });

   // seat hover
  $(".seat-hover").on("click", function(e){
          var $self = $(this);           
         resetTransClasses();
         if ( $self.hasClass("not-selected") )
            $reviewPage.addClass("from-ism");
          else
            $reviewPage.addClass("from-pre-cart");

          transmitSeatData( $self,  $reviewPage );          
  });

   // seat hover - select
  $(".btn-select").on("click", function(e){
         //
          var $self = $(this),
              $seat = $(".ism-area circle.seat-hover-on"),
              is_gotoLink = $self.hasClass("gotoLink");   

          if (!is_gotoLink) e.stopPropagation();     
          
          console.log("select btn clicked...");
          selectSeat( $seat );      
  });

  // "Remove"
  $("body").on("click", ".remove-link",function(e){
           e.stopPropagation();
          var $self = $(this);           
          removeSelectedSeat($self);     
  });

  function resetTransClasses(){
    $reviewPage.removeClass("from-listing from-ism from-pre-cart");

  }


  transmitSeatData = function( from, to ){
      var $from       = $(from), // from page
          $to         = $(to);  // to page

        var selectorArr = [".seat-view", ".seat-type", ".seat-sec", ".seat-row", ".seat-num", ".item-price", ".seat-dist"]; // common selectors per 


          if ( $from.is('circle') ) {
          var     dataArr = ["section", "row", "seat","price","distance","section-name","label"];

                $(".seat-view", $to).attr('src', 'img/seatview/'+ $from.data('section') +'_SeatViews_640x427.jpg');
                $(".seat-type", $to).text( $from.data('label') );
                $(".seat-sec", $to).text( $from.data('section-name') );
                $(".seat-row", $to).text( $from.data('row') );
                $(".seat-num", $to).text( 'Seat ' + $from.data('seat') );
                $(".item-price", $to).text( $from.data('price') );
                $(".seat-dist", $to).text( $from.data('distance') );
                $(".remove-link", $to).attr('data-pc-id', $from.attr('data-pc-id'));                
                
                console.log("transmit from circle seat pc-id :"+  $from.attr('data-pc-id') );

          }
          else{
              // to hover OR pre-cart list OR review page
            

               console.log("transmitSeatData");

                $.each(selectorArr, function( index, value ) {
                        // console.log(value); // ".seat-view", ".seat-type"

                        if (value == ".seat-view") { // only first array for photo data
                              var itsData = $(value, $from).attr('src');

                              $(value, $to).attr('src', itsData);  
                        }
                        else {
                              var itsData = $(value, $from).text();

                             
                               // if from listing to review
                               if ( $reviewPage.hasClass("from-listing") && value == ".item-price" ){
                                   $(".each-item-price", $to).text( itsData );
                                   $(value, $to).text( (itsData * filter_tixQty).toFixed(2) );
                                   console.log("from list");
                               }
                               else {
                                  $(value, $to).text(itsData);
                               }
                        }

                });
                $(".remove-link", $to).attr('data-pc-id',  $(".remove-link", $from).attr('data-pc-id'));
        }

  };


  // prevent the Add to Cart button from triggering the seat details action of parent container
  // $addBtn.click(function(e){    e.stopPropagation();  })



  // check/uncheck filter options when clicking anywhere in the row
  $filterItems.click(function(e){
    var chk = $(this).find('input[type="checkbox"]');
    if (chk.is(':checked')) {
      chk.prop('checked',false);
    }
    else {
      chk.prop('checked',true);
    }
  });



  // reset filters
  $resetFilters.click(function(e){
    $tixQty.val(filter_tixQty); console.log("reset filters");
    $('.filters-page input[type="checkbox"]').prop('checked',false);
    $('.filter-price .price-min').val(pricemin).trigger("change");
    $('.filter-price .price-max').val(pricemax).trigger("change");
  });



  // dot nav for review page
  $dotNav.click(function(e){
    swapView();
  });

  // swipe functionality for review images
  $seatViews.swipe({
    swipe:function(event, direction, distance, duration, fingerCount) {
      swapView();
    }
  });

  function swapView() {
    $dotNav.removeClass('active-dot');
    if (x%2 == 0) {
      $reviewImg.prop('src','img/v2/review-view.jpg');
      $viewDot.addClass('active-dot');
    }
    else {
      $reviewImg.prop('src','img/v2/review-map.jpg');
      $mapDot.addClass('active-dot');
    }
    x++;
  }



  // price slider
  var pricemin = 0,
      pricemax = 400,
      $plus    = $(".plus-sign");
  $("#slider").slider({
    range: true,
    values: [pricemin,pricemax],
    min: pricemin,
    max: pricemax,
    create: function(event,ui) {
      $(".filter-price .price-min").val(pricemin);
      $(".filter-price .price-max").val(pricemax);
    },
    slide: function(event,ui) {
      $(".filter-price .price-min").val(ui.values[0]);
      $(".filter-price .price-max").val(ui.values[1]);
      if (ui.values[1] == pricemax) {  $(".filter-price .price-max").val(pricemax);  $plus.show(); }
      else { $plus.hide(); }
      is_filterChange = true;
      console.log("slide max: " + is_filterChange);      
    },
    stop: function(event,ui) {
      console.log("stop slide");
      preFilterAreas();
    }
  });

  $(".filter-price .price-min").on("change",function() {
    if ($(this).val() <= pricemin) { $("#slider").slider("values",0,pricemin); $(this).val(pricemin); }
    else if ($(this).val() >= pricemax) { $("#slider").slider("values",0,pricemax); $(this).val(pricemax); }
    else { $("#slider").slider("values",0,$(this).val()); }
    is_filterChange = true;
    console.log("input min: " + is_filterChange);
  });
  $(".filter-price .price-max").on("change",function() {
    if ($(this).val() >= pricemax) { $("#slider").slider("values",1,pricemax); $(this).val(pricemax);  $plus.show(); }
    else if ($(this).val() <= pricemin) { $("#slider").slider("values",1,pricemin); $(this).val(pricemin); }
    else { $("#slider").slider("values",1,$(this).val()); $plus.hide(); }
    is_filterChange = true;
    console.log("input max: " + is_filterChange);
  });


  function preFilterAreas(){
    console.log("preFilterAreas...");
    var minPrice = parseInt( $(".filter-price .price-min").val() ),
        maxPrice  = parseInt( $(".filter-price .price-max").val() );

    $filterItems.each(function(){
        var $self = $(this),
            minP  = $self.data('price-min'),
            maxP  = $self.data('price-max'),
            $chk =  $('input[type="checkbox"]', $self);

          if ( minP >= minPrice && maxP <= maxPrice){ 
             $self.removeClass("outside-filter");
             $chk.prop('checked', true);
          }
          else {
           
             // outside
            $self.addClass("outside-filter");
            $chk.prop('checked',false);
          }
    }); 


  }



  // get URL Param
  function getUrlVar(key){
    var result = new RegExp(key + "=([^&]*)", "i").exec(window.location.search);  
    return result && result[1] || ""; 
  }


});