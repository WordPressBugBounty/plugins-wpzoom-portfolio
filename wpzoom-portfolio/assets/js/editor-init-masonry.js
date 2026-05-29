/**
 * Apply Masonry to portfolio blocks inside the block editor.
 *
 * In WP 6.3+ (and always for block themes), the editor canvas runs inside
 * an <iframe>. This script is enqueued via `enqueue_block_assets` with an
 * `is_admin()` gate so it loads inside the iframe — meaning `document`
 * refers to the canvas document and selectors actually find the blocks.
 *
 * `wp.data` lives in the parent editor window (inside the iframe, only a
 * stub `window.wp` exists without `.data`). We poll for it because the
 * parent's data stores may not be initialized yet when this script first
 * executes inside the iframe.
 */
( function () {
	if ( typeof Masonry === 'undefined' ) {
		return;
	}

	function findWpData() {
		if ( window.wp && window.wp.data && typeof window.wp.data.subscribe === 'function' ) {
			return window.wp.data;
		}
		try {
			var p = window.parent;
			if ( p && p !== window && p.wp && p.wp.data && typeof p.wp.data.subscribe === 'function' ) {
				return p.wp.data;
			}
		} catch ( e ) {
			// Cross-origin parent (shouldn't happen in the editor, but bail safely).
		}
		return null;
	}

	function applyMasonry() {
		var containers = document.getElementsByClassName( 'wpzoom-blocks_portfolio-block' );

		[].forEach.call( containers, function ( el ) {
			if ( ! el.classList.contains( 'layout-masonry' ) ) {
				return;
			}

			var list = el.querySelector( '.wpzoom-blocks_portfolio-block_items-list' );
			if ( ! list ) {
				return;
			}

			// wp.data.subscribe fires on every store change (many times per
			// second). Stash the Masonry instance on the element so we only
			// create one per list and just re-layout on subsequent ticks.
			if ( list._wpzMasonry ) {
				list._wpzMasonry.layout();
				return;
			}

			list._wpzMasonry = new Masonry( list, {
				itemSelector: '.wpzoom-blocks_portfolio-block_item',
			} );

			if ( typeof imagesLoaded === 'function' ) {
				imagesLoaded( el ).on( 'progress', function () {
					if ( list._wpzMasonry ) {
						list._wpzMasonry.layout();
					}
				} );
			}
		} );
	}

	function start( wpData ) {
		applyMasonry();

		var debounceTimer = null;
		wpData.subscribe( function () {
			// Debounce: only re-run after the editor settles for ~150ms.
			clearTimeout( debounceTimer );
			debounceTimer = setTimeout( applyMasonry, 150 );
		} );
	}

	// Try immediately, then poll for up to ~10 seconds while the parent's
	// wp.data is being set up. Once we find it, subscribe and stop polling.
	var wpData = findWpData();
	if ( wpData ) {
		start( wpData );
		return;
	}

	var attempts = 0;
	var maxAttempts = 100; // 100 × 100ms = 10s
	var pollTimer = setInterval( function () {
		attempts++;
		var data = findWpData();
		if ( data ) {
			clearInterval( pollTimer );
			start( data );
		} else if ( attempts >= maxAttempts ) {
			clearInterval( pollTimer );
			// Last-ditch: still try to apply Masonry once even without subscribe.
			applyMasonry();
		}
	}, 100 );
} )();
