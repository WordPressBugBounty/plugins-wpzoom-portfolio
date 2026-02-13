/**
 * Plugin functions file
 */
(function ($) {
    'use strict';

	// Array to store loaded post IDs
    window.loadedPosts = [];

	$.fn.magnificPopupCallbackforPortfolioBlock = function(){

        this.magnificPopup({
            disableOn: function() { if( $(window).width() < 0) { return false; } return true; },
            type: 'image',
            gallery: {
                enabled: true,
            },
            image: {
                titleSrc: function (item) {

                    let $el = this.currItem.el,
                    	$popover_content = $el.closest('.portfolio-block-entry-thumbnail-popover-content'),
                    	$link = $popover_content.find('.portfolio_item-title a'),
                    	$title = $link.html(),
                    	$href = $link.attr('href'),
                    	show_caption = $popover_content.data('show-caption');

                    if ( show_caption ) {
                        return '<a href="' + $href + '">' + $title + '</a>';
                    }
                }
            },
            iframe: {
                markup: '<div class="mfp-iframe-scaler">'+
                '<div class="mfp-close"></div>'+
                '<iframe class="mfp-iframe" frameborder="0" allow="autoplay" allowfullscreen></iframe>'+
                '<div class="mfp-bottom-bar"><div class="mfp-title"></div></div>'+
                '</div>',
                callbacks: {

                },
                patterns: {
                    vimeo: {
                        index: 'vimeo.com/',
                        id: function(url) {
                            var m = url.match(/(?:https?:\/\/)?(?:www\.)?(?:player\.)?vimeo\.com\/(?:[a-z]*\/)*([0-9]{6,11})(?:\/([a-zA-Z0-9]+))?/);
                            if (!m || !m[1]) return null; // If no match, return null
                            var videoId = m[1];
                            var hash = m[2] ? 'h=' + m[2] : '';
                            var params = hash ? '' : '?autoplay=' + 1;
                            return hash ? videoId + '?' + hash + params : videoId + params;
                        },
                        src: '//player.vimeo.com/video/%id%'
                    },
                    youtu: {
                        index: 'youtu.be',
                        id: function( url ) {
                            // Capture everything after the hostname, excluding possible querystrings.
                            var m = url.match( /^.+youtu.be\/([^?]+)/ );

                            if ( null !== m ) {
                                return m[1];
                            }

                            return null;
                        },
                        // Use the captured video ID in an embed URL.
                        // Add/remove querystrings as desired.
                        src: '//www.youtube.com/embed/%id%?autoplay=1&rel=0'
                    }
                }
            },
            mainClass: 'mfp-fade',
            removalDelay: 160,
            preloader: false,
            fixedContentPos: false,
            callbacks: {
                change: function() {
                    if(this.currItem.type === 'inline'){
                        $(this.content).find('video')[0].play();
                    }
                },
                beforeClose: function () {
                    if (this.currItem.type === 'inline') {
                        var $video = $(this.content).find('video');

                        if ($video.length) {
                            var videoElement = $video[0];

                            var currentSrc = videoElement.currentSrc;
                            videoElement.pause();
                            videoElement.currentTime = 0;
                            videoElement.src = '';
                            videoElement.src = currentSrc;
                        }
                    }
                },
                markupParse: function (template, values, item) {

                    if ( item.type === 'iframe' ) {

                        let $el = item.el,
							$popover_content = $el.closest('.portfolio-block-entry-thumbnail-popover-content'),
							$link = $el.closest('.portfolio-block-entry-thumbnail-popover-content').find('.portfolio_item-title a'),
							$title = $link.html(),
							$href = $link.attr('href'),
							show_caption = $popover_content.data('show-caption');

                        if ( show_caption ) {
                            values.title = '<a href="' + $href + '">' + $title + '</a>';
                        }
                    }

                }
            }
        });
    };

    var $document = $(document);
    var $window = $(window);

    /**
     * Document ready (jQuery)
     */
	$(function () {

        $('.entry-cover').find('.portfolio-block-popup-video').magnificPopupCallbackforPortfolioBlock();
		$('.wpzoom-blocks_portfolio-block').each(function(){
            $(this).find('.portfolio_item .portfolio-block-popup-video').magnificPopupCallbackforPortfolioBlock();
        });

		/**
		 * Portfolio Block Filter click.
		 */
		$('.wpzoom-blocks_portfolio-block_filter ul').portfolioBlockFilter();

		//Apply Masonry
		let container = document.getElementsByClassName('wpzoom-blocks_portfolio-block');
		[].forEach.call(container, function(el) {					
			if( el.classList.contains( 'layout-masonry' ) ) {
				var elem = el.querySelector('.wpzoom-blocks_portfolio-block_items-list');
				var msnry = new Masonry( elem, {
					// options
					itemSelector: '.wpzoom-blocks_portfolio-block_item',
				});
	
				// element
				imagesLoaded( el ).on( 'progress', function() {
					msnry.layout();
				});
			}
		});

		initPortfolio();

		/**
		 * Load more stuff.
		 */
		var portfolioBlocks = $('.wpzoom-blocks_portfolio-block');
		portfolioBlocks.each(function () {

			let $this = $(this),
				$portfolioList    = $this.children('.wpzoom-blocks_portfolio-block_items-list'),
				portfolioData     = $this.data( 'load-more' ),
				totalPosts        = portfolioData.total,
				
				loadMoreContainer = $this.find( '.wpzoom-blocks_portfolio-block_show-more' ),
				btnLoadMore       = loadMoreContainer.children( '.wpz-portfolio-button__link' ),
				btnLoadMoreText   = btnLoadMore.html();

				var post_filter_regex = /wpzoom-blocks_portfolio-block_item-([0-9]+)/gi;
				var tax_filter_regex = /cat-item-([0-9]+)/gi;

				var $newItems = $portfolioList.find('.wpzoom-blocks_portfolio-block_item');

				//exclude new items from the next query
				if( $newItems ) {
					var newPosts = [];
					$newItems.each(function() {
						var postID = post_filter_regex.exec( $(this).attr( 'class' ) );
						post_filter_regex.lastIndex = 0;
						newPosts.push( postID[1] );
						loadedPosts.push( parseInt( postID[1] ) );
					}); 

				};

				btnLoadMore.on( 'click', function(e) {

					e.preventDefault();
					var $currentCat = $this.find('.wpzoom-blocks_portfolio-block_filter .current-cat');
					var category_id = 'all';

					// Only override categories if a specific (non-All) filter tab is selected
					if ( $currentCat.length && !$currentCat.hasClass('cat-item-all') ) {
						var catID = tax_filter_regex.exec( $currentCat.attr('class') );
						tax_filter_regex.lastIndex = 0;

						category_id = ( null == catID ) ? 'all' : catID[1];

						if( undefined !== category_id && 'all' !== category_id ) {
							portfolioData.categories = [ category_id ];
						}
					}

					btnLoadMore.html( WPZoomPortfolioBlock.loadingString );

					$.post(
						WPZoomPortfolioBlock.ajaxURL,
						{
							action: 'wpzoom_load_more_items',
							posts_data: JSON.stringify( portfolioData ),
							exclude: loadedPosts,
						},
						function( data, status, code ) {
							
							if ( status == 'success' ) {

								var $newItems = $(data).find('.wpzoom-blocks_portfolio-block_item');
								$newItems.find('article').removeClass('hentry').addClass('portfolio_item');
								$portfolioList.append( $newItems );

								//exclude new items from the next query
								if( $newItems ) {
									var newPosts = [];
									var exPosts = $this.attr( 'data-exclude-posts' );
									
									$newItems.each(function() {
										var postID = post_filter_regex.exec( $(this).attr( 'class' ) );
										post_filter_regex.lastIndex = 0;
										newPosts.push( postID[1] );
										loadedPosts.push( parseInt( postID[1] ) );
									}); 

								};

 								let filterTrigger = $this.find( '.wpzoom-blocks_portfolio-block_filter .current-cat a' );
								if( !$this.hasClass( 'layout-masonry' ) && typeof( filterTrigger ) != 'undefined' && filterTrigger != null ) {
									filterTrigger.click();
								};
	
								let container = document.getElementsByClassName('wpzoom-blocks_portfolio-block');
								[].forEach.call(container, function(el) {					
									if( el.classList.contains( 'layout-masonry' ) ) {
										var elem = el.querySelector('.wpzoom-blocks_portfolio-block_items-list');
										var msnry = new Masonry( elem, {
											// options
											itemSelector: '.wpzoom-blocks_portfolio-block_item',
										});
							
										// element
										imagesLoaded( el ).on( 'progress', function() {
											msnry.layout();
										});
									}
								});

								//trigger jetpack lazy images event
								$( 'body' ).trigger( 'jetpack-lazy-images-load');
								$portfolioList.find('.portfolio_item .portfolio-block-popup-video').magnificPopupCallbackforPortfolioBlock();
								

								var show = 'all' == category_id ? $this.find( '[data-category]' ) : $this.find( '.wpzoom-blocks_portfolio-block_category-' + category_id + '' );

								if( show.length >= totalPosts ) {
									btnLoadMore.animate({height: 'hide', opacity: 'hide'}, 'slow', function () {
										btnLoadMore.remove();
									});
								}
	
								btnLoadMore.html( btnLoadMoreText );
	
							}
						}
					);
				
				});
		});

	});

	/**
	 * Portfolio Block Filter click function.
	 */
	$.fn.portfolioBlockFilter = function () {

		return this.each(function () {
			let $this = $(this),
				$taxs = $this.find('li'),
				$portfolioWrapper = $(this).closest('.wpzoom-blocks_portfolio-block'),
				$portfolio = $portfolioWrapper.find('.wpzoom-blocks_portfolio-block_items-list'),
				perPage = $portfolioWrapper.data('load-more').per_page,

				loadMoreContainer = $portfolioWrapper.find( '.wpzoom-blocks_portfolio-block_show-more' ),
				btnLoadMorePro    = $portfolioWrapper.find( '.wpzoom-blocks_portfolio-block-pro_show-more' ).children( '.wpz-portfolio-button__link' ),
				btnLoadMore       = loadMoreContainer.children( '.wpz-portfolio-button__link' ),
				btnLoadMoreText   = btnLoadMore.html();

			var tax_filter_regex = /cat-item-([0-9]+)/gi;
			var tax_total_regex = /cat-posts-total-([0-9]+)/gi;

			//Filtering of the portfolio items
			$taxs.on( 'click', function ( event ) {
				event.preventDefault();
				
				btnLoadMorePro.removeClass( 'disabled' );
				btnLoadMore.removeClass( 'disabled' );

				$this = $(this);

				$taxs.removeClass( 'current-cat' );
				$this.addClass( 'current-cat' );

				var catID = tax_filter_regex.exec($this.attr('class'));
				tax_filter_regex.lastIndex = 0;

				var taxTotalPosts = tax_total_regex.exec($this.attr('class'));
				tax_total_regex.lastIndex = 0;

				var filter;

				if ( catID === null ) {
					filter = '.wpzoom-blocks_portfolio-block_item';
				} else {
					filter = '.wpzoom-blocks_portfolio-block_category-' + catID[1];
				}

				var category_id = ( null == catID ) ? 'all' : catID[1];

				if ( category_id == 'all' && $portfolio.attr('data-subcategory') ) {
					category_id = $portfolio.attr('data-subcategory');
				}

				//get total posts for category
				var category_total = ( null == taxTotalPosts ) ? 'all' : taxTotalPosts[1];

				let show = 'all' == category_id ? $portfolio.find( '[data-category]' ) : $portfolio.find( '.wpzoom-blocks_portfolio-block_category-' + category_id + '' ),
			    	hide = 'all' == category_id ? null : $portfolio.find( '[data-category]:not(.wpzoom-blocks_portfolio-block_category-' + category_id + ')' );

				var items_number = $taxs.siblings( '.current-cat' ).attr( 'data-counter' );
				var filteredItems = $( filter );

				let toLoad = 0;

				var items_left = category_total - show.length;

				//Check if we need to load more items
				if( show.length < perPage ) {
					toLoad = perPage - show.length;
					if( toLoad > items_left ) {
						toLoad = items_left;
					}
				}

				if(  $portfolioWrapper.hasClass( 'ajax-load-items' ) ) {
					if( 0 == show.length ) {
						$this.getPortfolioFilteredItems( perPage );
					} 
					else if( toLoad > 0 ) {
						$this.getPortfolioFilteredItems( toLoad );
					}
				}

				show.find('.portfolio-block-popup-video').magnificPopupCallbackforPortfolioBlock();
				show.find('.portfolio-pro-popup-video').magnificPopupCallbackforPortfolioBlock();

				//Show items
				show.each(function () {

					var item = $(this);
					
					if( item.hasClass( 'fade-out' ) )  {
						item.removeClass( 'fade-out' );
					}

					if( !item.hasClass( 'fade-in' ) )  {
						item.addClass( 'fade-in' );
					}
				
				});				

				//Hide items
				if ( null !== hide ) {
					hide.each(function () {

						var item = $(this);
						
						if( item.hasClass( 'fade-in' ) )  {
							item.removeClass( 'fade-id' );
						}
	
						if( !item.hasClass( 'fade-out' ) )  {
							item.addClass( 'fade-out' );
						}
					
					});
				}

				btnLoadMore.attr( 'data-category', category_id );

				if( 'all' !== category_total && show.length == category_total ) {
					btnLoadMore.addClass( 'disabled' );
					btnLoadMorePro.addClass( 'disabled' );
					btnLoadMorePro.attr( 'data-category', 'all' );
					btnLoadMore.attr( 'data-category', 'all' );
				}

			});

		});
	};

	function initPortfolio() {

		let container = document.getElementsByClassName('wpzoom-blocks_portfolio-block');
	
		[].forEach.call(container, function(el) {
	
			
			let itemsContainer = el.querySelector('.wpzoom-blocks_portfolio-block_items-list');
	
			let minHeight = itemsContainer.firstChild.offsetHeight;
			if( undefined !== minHeight ) {
				itemsContainer.style.minHeight = minHeight + 'px';
			}
	
			if( ! el.classList.contains( 'layout-masonry' ) ) {
				for (var i = 0; i < itemsContainer.children.length; i++ ) {
					var child = itemsContainer.children[i];
					if ( child.tagName == 'LI' ) {
						child.classList.add('fade-in');
					}
				}
			}
	
		});
	
	}

	/**
	 * Get Portfolio Filtered Items.
	 */
	$.fn.getPortfolioFilteredItems = function ( toLoad = 0 ) {
		
		let $this = $(this),
			$portfolioWrapper = $(this).closest('.wpzoom-blocks_portfolio-block'),
			$portfolio = $portfolioWrapper.find('.wpzoom-blocks_portfolio-block_items-list'),
			$preloader = $portfolio.find('.wpzoom-preloader-container'),
			exclude = $portfolioWrapper.data( 'exclude-posts' ),

			//Load More Button
			loadMoreContainer = $portfolioWrapper.find( '.wpzoom-blocks_portfolio-block_show-more' ),
			btnLoadMorePro    = $portfolioWrapper.find( '.wpzoom-blocks_portfolio-block-pro_show-more' ).children( '.wpz-portfolio-button__link' ),
			btnLoadMore       = loadMoreContainer.children( '.wpz-portfolio-button__link' ),
			btnLoadMoreText   = btnLoadMore.html();
			
			$preloader.css({ display: 'flex' });

		let portfolioData     = $portfolioWrapper.data( 'load-more' ),
			revertCats        = portfolioData.categories,
			revertPerPage     = portfolioData.per_page;
		
		var tax_filter_regex  = /cat-item-([0-9]+)/gi;
		var post_filter_regex = /wpzoom-blocks_portfolio-block_item-([0-9]+)/gi;
		var tax_total_regex = /cat-posts-total-([0-9]+)/gi;

		var catID = tax_filter_regex.exec( $this.attr( 'class' ) );
		tax_filter_regex.lastIndex = 0;

		var filter;

		var taxTotalPosts = tax_total_regex.exec($this.attr('class'));
		tax_total_regex.lastIndex = 0;

		if ( catID === null ) {
			filter = '.wpzoom-blocks_portfolio-block_item';
		} else {
			filter = '.wpzoom-blocks_portfolio-block_category-' + catID[1];
		}

		var category_id = ( null == catID ) ? 'all' : catID[1];
		
		//get total posts for category
		var category_total = ( null == taxTotalPosts ) ? 'all' : taxTotalPosts[1];

		if ( category_id == 'all' && $portfolio.attr('data-subcategory') ) {
			category_id = $portfolio.attr('data-subcategory');
		}
		
		portfolioData.categories = [category_id];
		
		if( toLoad && undefined !== toLoad && toLoad > 0 ) {
			portfolioData.per_page = toLoad;
		}
		
		$.post(
			WPZoomPortfolioBlock.ajaxURL,
			{
				action: 'wpzoom_load_more_items',
				posts_data: JSON.stringify( portfolioData ),
				exclude: loadedPosts,
				offset: 0,
			},
			function( data, status, code ) {
				
				if ( status == 'success' ) {
					
					//append new items
					var $newItems = $( data).find('.wpzoom-blocks_portfolio-block_item' );
					$newItems.addClass( 'fade-in' );
					$newItems.find('article').removeClass('hentry').addClass('portfolio_item');
					$preloader.hide();
					$portfolio.append( $newItems );
					
					$newItems.find('.portfolio_item .portfolio-block-popup-video').magnificPopupCallbackforPortfolioBlock();
					$newItems.find('.portfolio_item .portfolio-pro-popup-video').magnificPopupCallbackforPortfolioBlock();
					

					//exclude new items from the next query
					if( $newItems ) {
						var newPosts = [];
						var exPosts = $portfolioWrapper.attr( 'data-exclude-posts' );
						
						$newItems.each(function() {
							var postID = post_filter_regex.exec( $(this).attr( 'class' ) );
							post_filter_regex.lastIndex = 0;
							newPosts.push( postID[1] );
							loadedPosts.push( parseInt( postID[1] ) );
						}); 

					};

					let show = 'all' == category_id ? $portfolio.find( '[data-category]' ) : $portfolio.find( '.wpzoom-blocks_portfolio-block_category-' + category_id + '' );
					
					
					if( 'all' !== category_total && show.length == category_total ) {
						btnLoadMorePro.addClass( 'disabled' );
						btnLoadMore.addClass( 'disabled' );
					}

					let container = document.getElementsByClassName('wpzoom-blocks_portfolio-block');
					[].forEach.call(container, function(el) {					
						if( el.classList.contains( 'layout-masonry' ) ) {
							var elem = el.querySelector('.wpzoom-blocks_portfolio-block_items-list');
							var msnry = new Masonry( elem, {
								// options
								itemSelector: '.wpzoom-blocks_portfolio-block_item',
							});
				
							// element
							imagesLoaded( el ).on( 'progress', function() {
								msnry.layout();
							});
						}
					});

					//trigger jetpack lazy images event
					$( 'body' ).trigger( 'jetpack-lazy-images-load');

				}
			}
		);

		portfolioData.categories = revertCats;
		portfolioData.per_page = revertPerPage;

	};

})(jQuery);