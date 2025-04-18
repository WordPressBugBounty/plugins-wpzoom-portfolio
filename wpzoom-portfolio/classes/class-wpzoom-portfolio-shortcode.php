<?php
/**
 * WPZOOM Portfolio Shortcode
 *
 * @since   1.0.5
 * @package WPZOOM_Blocks_Portfolio
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'WPZOOM_Blocks_Portfolio_Shortcode' ) ) {
	/**
	 * Main WPZOOM_Blocks_Portfolio Class.
	 *
	 * @since 1.0.5
	 */
	class WPZOOM_Blocks_Portfolio_Shortcode {

		/**
		 * This class instance.
		 *
		 * @var WPZOOM_Blocks_Portfolio_Shortcode
		 * @since 1.0.5
		 */
		private static $instance;

		/**
		 * Provides singleton instance.
		 *
		 * @since 1.0.5
		 * @return self instance
		 */
		public static function instance() {			

			if ( null === self::$instance ) {
				self::$instance = new WPZOOM_Blocks_Portfolio_Shortcode();
			}

			return self::$instance;
		}

		/**
		 * The Constructor.
		 */
		public function __construct() {		
			add_shortcode( 'wpzoom_block_portfolio', array( __CLASS__, 'render_shortcode' ) );
			add_shortcode( 'wpzoom_portfolio_layout', array( __CLASS__, 'render_portfolio_layout_shortcode' ) );

		}

		/**
		 * Render Shortcode.
		 */
		public static function render_shortcode( $atts, $content = '' ) {

			if( !empty( $atts ) && is_array( $atts ) ) {
				foreach( $atts as $key => $att ) {
					$atts[ $key ] = esc_attr( $att );
				}
			}

			// Defining Shortcode's Attributes
			$shortcode_args = shortcode_atts(
				array(
					'align'                     => '',
					'amount'                    => 6,
					'alwaysPlayBackgroundVideo' => false,
					'categories'                => '',
					'columnsAmount'             => 3,
					'layout'                    => 'grid',
					'lightbox'                  => true,
					'lightboxCaption'           => false,
					'order'                     => 'desc',
					'orderBy'                   => 'date',
					'readMoreLabel'             => 'Read More',
					'showAuthor'                => true,
					'showBackgroundVideo'       => true,
					'showCategoryFilter'        => true,
					'showDate'                  => true,
					'showExcerpt'               => true,
					'showReadMore'              => true,
					'showThumbnail'             => true,
					'showViewAll'               => false,
					'source'                    => 'portfolio_item',
					'thumbnailSize'             => 'portfolio_item-thumbnail',
					'viewAllLabel'              => 'View All',
					'viewAllLink'               => '',
					'primaryColor'              => '#0BB4AA',
					'secondaryColor'            => '#000'
				), 
				$atts 
			);

			$block_portfolio = new WPZOOM_Blocks_Portfolio;
			$block_portfolio_render = $block_portfolio->render( $shortcode_args, $content );

			wp_enqueue_script( 'masonry' );

			wp_enqueue_script( 'wpzoom-blocks-js-script-main' ); 
			wp_enqueue_style( 'wpzoom-blocks-css-style-main' );

			return sprintf( 
				'<div class="wpzoom-block-portfolio-shortcode">%1$s</div>',
				$block_portfolio_render	
			);
		}

		/**
		 * Render Portoflio Layout Shortcode.
		 */
		public static function render_portfolio_layout_shortcode( $atts ) {

			global $post;
			static $i;
			$blocks = array();

			// Defining Shortcode's Attributes
			$shortcode_args = shortcode_atts(
				array(
					'id' => '',
				), $atts );

			$post_id = isset( $shortcode_args['id'] ) ? $shortcode_args['id'] : null;

			if( !$post_id ) {
				return '';	
			}

			$layout = get_post( intval( $post_id ) );

			if ( has_blocks( $layout->post_content ) ) {
				$blocks = parse_blocks( $layout->post_content );
			}
			
			$output = '';
			foreach( $blocks as $block ) {
				$output .= render_block( $block );
			}

			wp_enqueue_script( 'masonry' );
			wp_enqueue_script('imagesloaded');

			wp_enqueue_script( 'wpzoom-blocks-js-script-main' ); 
			wp_enqueue_style( 'wpzoom-blocks-css-style-main' );

			return sprintf( 
				'<div class="wpzoom-portfolio-layout-shortcode-content">%1$s</div>',
				$output
			);

		}

	}
}